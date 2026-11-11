// Szabálymotor: kölcsönhatás-, allergia- és duplikációellenőrzés, alternatívakeresés.
// Magyarázható, szabályalapú működés: minden figyelmeztetésnek van oka és javaslata.

import type { Alert, AltSuggestion, AnalysisResult, DrugLike, Patient, Product, Severity } from "./types";
import type { Catalog } from "./catalog";
import {
  ALLERGENS, ALT_BY_CLASS, CLASSES, PREF_STRENGTH, RULES, classesOfSubstances, huName, isTopical, routeGroup,
} from "./knowledge";

export interface ContextDrug {
  label: string;
  drug: DrugLike;
}

const GENERIC_SKIP = new Set(["vakcina", "water for injections", "sodium chloride"]);

function sharedSubstances(a: string[], b: string[]): string[] {
  return a.filter((x) => b.includes(x) && !GENERIC_SKIP.has(x));
}

let uid = 0;
const nextId = () => `a${++uid}`;

export function analyze(
  neu: DrugLike,
  patient: Pick<Patient, "allergies">,
  context: ContextDrug[],
  catalog: Catalog | null,
  opts: { noAlternatives?: boolean } = {},
): AnalysisResult {
  const alerts: Alert[] = [];
  const newClasses = classesOfSubstances(neu.h);
  const newTopical = isTopical(neu.f);

  // 1) allergia
  for (const al of patient.allergies) {
    const def = ALLERGENS[al.key];
    if (!def) continue;
    const direct = classesOfSubstances(neu.h).has(def.classId);
    if (direct) {
      alerts.push({
        id: nextId(), type: "allergia", severity: 4, title: `${def.hu}`, with: def.hu,
        effect: `A beteg dokumentált allergiája: ${def.hu.toLowerCase()}${al.reaction ? ` (${al.reaction})` : ""}. A felírandó készítmény ebbe a csoportba tartozik (${neu.h.map(huName).join(", ")}).`,
        advice: "Ne írja fel. Válasszon másik hatóanyagcsoportot.",
        altKey: def.classId,
      });
      continue;
    }
    for (const c of def.cross ?? []) {
      if (classesOfSubstances(neu.h).has(c.classId)) {
        alerts.push({
          id: nextId(), type: "allergia", severity: c.sev, title: `Keresztallergia lehetősége (${def.hu.toLowerCase()})`, with: def.hu,
          effect: c.note, advice: c.sev >= 3 ? "Kerülje, vagy szoros megfigyelés mellett alkalmazza." : "Alkalmazható, de a beteget figyelmeztetni kell az allergiás tünetekre.",
          altKey: c.classId,
        });
      }
    }
  }

  // 2) duplikáció
  for (const ctx of context) {
    const shared = sharedSubstances(neu.h, ctx.drug.h);
    if (shared.length) {
      alerts.push({
        id: nextId(), type: "duplikáció", severity: 3, title: "Hatóanyag-duplikáció", with: ctx.label,
        effect: `Ugyanaz a hatóanyag (${shared.map(huName).join(", ")}) már szerepel: ${ctx.label}. Dupla adagolás túladagolást okozhat.`,
        advice: "Ellenőrizze, hogy valóban szükséges-e a két készítmény; általában az egyik elhagyandó.",
      });
      continue;
    }
    const cc = classesOfSubstances(ctx.drug.h);
    for (const c of CLASSES) {
      if (!c.dup) continue;
      if (newClasses.has(c.id) && cc.has(c.id)) {
        alerts.push({
          id: nextId(), type: "duplikáció", severity: c.dup, title: `Terápiás duplikáció: ${c.hu}`, with: ctx.label,
          effect: `Két azonos csoportba tartozó gyógyszer (${neu.name} és ${ctx.label}) együtt nem javasolt; a mellékhatások kockázata nő, a hatás nem erősödik arányosan.`,
          advice: "Egy csoportból általában egy készítmény elegendő.",
          altKey: c.id,
        });
      }
    }
  }

  // 3) kölcsönhatások (csak rendszerhatású készítményeknél)
  if (!newTopical) {
    for (const ctx of context) {
      if (isTopical(ctx.drug.f)) continue;
      if (sharedSubstances(neu.h, ctx.drug.h).length) continue; // már duplikációként jelezve
      const oc = classesOfSubstances(ctx.drug.h);
      for (const r of RULES) {
        let side: "a" | "b" | null = null;
        if (newClasses.has(r.a) && oc.has(r.b)) side = "a";
        else if (newClasses.has(r.b) && oc.has(r.a)) side = "b";
        if (!side) continue;
        // azonos osztály mindkét oldalon: csak különböző hatóanyagok esetén
        alerts.push({
          id: nextId(), type: "interakció", severity: r.sev, title: r.title, with: ctx.label,
          effect: `${neu.name} + ${ctx.label}: ${r.effect}`,
          advice: r.advice,
          altKey: side === "a" ? r.a : r.b,
        });
      }
    }
  }

  // dedup: ugyanaz a (cím, másik gyógyszer) csak egyszer, a legsúlyosabb marad
  const best = new Map<string, Alert>();
  for (const a of alerts) {
    const k = `${a.type}|${a.with}|${a.title.includes("QT") ? "QT" : a.title}`;
    const prev = best.get(k);
    if (!prev || prev.severity < a.severity) best.set(k, a);
  }
  const list = [...best.values()].sort((x, y) => y.severity - x.severity);
  const max = (list[0]?.severity ?? 0) as Severity | 0;

  let alternatives: AltSuggestion[] = [];
  if (!opts.noAlternatives && catalog && max >= 3) {
    alternatives = findAlternatives(neu, patient, context, catalog, list);
  }
  return { alerts: list, max, alternatives };
}

// ---------------------------------------------------------------- alternatívák
function mode<T>(arr: T[]): T | undefined {
  const m = new Map<T, number>();
  for (const x of arr) m.set(x, (m.get(x) ?? 0) + 1);
  let best: T | undefined;
  let n = 0;
  for (const [k, v] of m) if (v > n) { best = k; n = v; }
  return best;
}

function findAlternatives(
  neu: DrugLike,
  patient: Pick<Patient, "allergies">,
  context: ContextDrug[],
  catalog: Catalog,
  alerts: Alert[],
): AltSuggestion[] {
  const subs: string[] = [];
  for (const a of alerts) {
    if (a.severity < 3 || !a.altKey) continue;
    for (const s of ALT_BY_CLASS[a.altKey] ?? []) if (!subs.includes(s) && !neu.h.includes(s)) subs.push(s);
  }
  const wantRoute = routeGroup(neu.f);
  const out: AltSuggestion[] = [];
  for (const sub of subs) {
    const prods = (catalog.bySub.get(sub) ?? []).filter(
      (p) => p.h.length === 1 && p.x === 0 && (wantRoute === "egyéb" || routeGroup(p.f) === wantRoute),
    );
    if (!prods.length) continue;
    // az ellenőrzést egy reprezentatív készítményen végezzük (a hatóanyag számít)
    const rep = prods[0];
    const res = analyze({ name: rep.n, h: rep.h, f: rep.f, s: rep.s }, patient, context, null, { noAlternatives: true });
    if (res.max >= 3) continue;
    // legjellemzőbb erősség, azon belül néhány készítmény
    const pref = (PREF_STRENGTH[sub] ?? []).find((st) => prods.some((p) => p.s === st));
    const topStrength = pref ?? mode(prods.map((p) => p.s));
    const sel = prods.filter((p) => p.s === topStrength).slice(0, 3);
    out.push({
      substance: sub, hu: huName(sub), products: sel,
      residual: res.alerts.filter((a) => a.severity >= 1),
      note: res.max === 0 ? "A beteg profiljával nincs ismert ütközés." : undefined,
    });
    if (out.length >= 3) break;
  }
  return out;
}

export function equivalentProducts(catalog: Catalog, p: Product): { available: Product[]; unavailable: Product[] } {
  const eq = catalog.equivalents(p);
  return { available: eq.filter((q) => q.x === 0), unavailable: eq.filter((q) => q.x !== 0) };
}

export function maxSeverity(alerts: Alert[]): Severity | 0 {
  return alerts.reduce((m, a) => (a.severity > m ? a.severity : m), 0 as Severity | 0);
}

/** A beteg jelenlegi gyógyszereinek páronkénti ellenőrzése (profil-áttekintés). */
export function reviewMeds(meds: { label: string; drug: DrugLike }[], patient: Pick<Patient, "allergies">): { a: string; b: string; alert: Alert }[] {
  const out: { a: string; b: string; alert: Alert }[] = [];
  for (let i = 0; i < meds.length; i++) {
    const others = meds.filter((_, j) => j > i);
    if (!others.length) continue;
    const r = analyze(meds[i].drug, { allergies: [] }, others, null, { noAlternatives: true });
    for (const al of r.alerts) out.push({ a: meds[i].label, b: al.with, alert: al });
  }
  void patient;
  return out.sort((x, y) => y.alert.severity - x.alert.severity);
}
