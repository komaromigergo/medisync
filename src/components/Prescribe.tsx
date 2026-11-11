"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Dosing, Patient, Prescription, Product, RxItem } from "@/lib/types";
import type { Catalog } from "@/lib/catalog";
import { analyze, type ContextDrug } from "@/lib/engine";
import { huName, SEVERITY_LABEL } from "@/lib/knowledge";
import { atcLabelSentence } from "@/lib/atc";
import { dosingText, emptyDosing, newId, unitFor } from "@/lib/util";
import { useStore } from "@/lib/store";
import { DOCTOR } from "@/lib/demo";
import { AlertCard, Pill, SEV_STYLE, SeverityBadge } from "./ui";
import { DrugPicker } from "./DrugPicker";

function Stepper({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <div className="text-center">
      <div className="label mb-1">{label}</div>
      <div className="inline-flex items-center rounded-xl border-[1.5px] border-line bg-white overflow-hidden">
        <button type="button" className="w-11 h-12 text-xl font-bold text-teal hover:bg-pale" onClick={() => onChange(Math.max(0, value - 1))} aria-label={`${label} csökkentés`}>−</button>
        <span className="w-8 text-center font-bold text-lg tabular-nums">{value}</span>
        <button type="button" className="w-11 h-12 text-xl font-bold text-teal hover:bg-pale" onClick={() => onChange(Math.min(6, value + 1))} aria-label={`${label} növelés`}>+</button>
      </div>
    </div>
  );
}

export function Prescribe({ patient, cat }: { patient: Patient; cat: Catalog }) {
  const { issuePrescription, log } = useStore();
  const [selected, setSelected] = useState<Product | null>(null);
  const [dosing, setDosing] = useState<Dosing>(emptyDosing());
  const [indication, setIndication] = useState("");
  const [qty, setQty] = useState(1);
  const [reason, setReason] = useState("");
  const [ack, setAck] = useState(false);
  const [draft, setDraft] = useState<RxItem[]>([]);
  const [issued, setIssued] = useState<Prescription | null>(null);

  const ctx = useMemo<ContextDrug[]>(() => {
    const base = patient.meds.filter((m) => m.active).map((m) => ({ label: m.name, drug: { name: m.name, h: m.h, f: m.f, s: m.s } }));
    const drafts = draft.map((d) => ({ label: `${d.name} (a mostani recepten)`, drug: { name: d.name, h: d.h, f: d.f, s: d.s } }));
    return [...base, ...drafts];
  }, [patient, draft]);

  const result = useMemo(
    () => (selected ? analyze({ name: selected.n, h: selected.h, f: selected.f, s: selected.s }, patient, ctx, cat) : null),
    [selected, patient, ctx, cat],
  );

  function pick(p: Product) {
    setSelected(p);
    setDosing(emptyDosing(unitFor(p.f)));
    setIndication(atcLabelSentence(p.a));
    setQty(1);
    setReason("");
    setAck(false);
    setIssued(null);
  }

  const max = result?.max ?? 0;
  const needOverride = max >= 3;
  const minReason = max === 4 ? 15 : 8;
  const canAdd = !!selected && (!needOverride || (ack && reason.trim().length >= minReason)) && dosing.morning + dosing.noon + dosing.evening + dosing.night > 0;

  function add() {
    if (!selected || !result) return;
    const overrides = result.alerts.filter((a) => a.severity >= 3).map((a) => ({ alertId: a.id, severity: a.severity, reason: reason.trim() }));
    const item: RxItem = {
      id: newId("ri"), productId: selected.id, name: selected.n, h: selected.h, s: selected.s, f: selected.f, ff: selected.ff,
      dosing, indication: indication.trim() || "–", quantity: qty, overrides: overrides.length ? overrides : undefined,
    };
    if (overrides.length) {
      log({
        patientId: patient.id, actorRole: "orvos", actorName: DOCTOR.name, action: "Figyelmeztetés felülbírálása",
        detail: `${selected.n}: ${result.alerts.filter((a) => a.severity >= 3).map((a) => `${SEVERITY_LABEL[a.severity]} – ${a.title}`).join("; ")}. Indoklás: ${reason.trim()}`,
      });
    }
    setDraft((d) => [...d, item]);
    setSelected(null);
  }

  function issue() {
    const rx = issuePrescription(patient.id, draft);
    setIssued(rx);
    setDraft([]);
    setSelected(null);
  }

  if (issued) {
    return (
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-11 w-11 rounded-full bg-teal text-white grid place-items-center text-2xl font-bold">✓</div>
          <div>
            <div className="text-xl font-extrabold">A recept kiállítva</div>
            <div className="text-muted text-sm">Receptazonosító: <b className="text-ink tabular-nums">{issued.id}</b></div>
          </div>
        </div>
        <ul className="list-disc pl-6 space-y-1 mb-5">
          {issued.items.map((i) => <li key={i.id}><b>{i.name}</b> – {dosingText(i.dosing)}</li>)}
        </ul>
        <div className="flex flex-wrap gap-3">
          <Link className="btn btn-primary" href={`/beteg/${patient.id}`}>Betegnézet megnyitása</Link>
          <Link className="btn btn-teal" href={`/patika?rx=${issued.id}`}>Kiváltás a patikában</Link>
          <button className="btn btn-ghost" onClick={() => setIssued(null)}>Új felírás</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="card p-5">
        <h2 className="text-xl font-extrabold mb-3">Új felírás</h2>
        <DrugPicker cat={cat} onPick={pick} />
      </div>

      {selected && result && (
        <div className="card p-5 space-y-5">
          <div>
            <div className="h-caps">Kiválasztott készítmény</div>
            <div className="text-2xl font-extrabold leading-tight mt-0.5">{selected.n}</div>
            <div className="flex flex-wrap gap-2 mt-2">
              {selected.h.map((h) => <Pill key={h} tone="teal">{huName(h)}</Pill>)}
              {atcLabelSentence(selected.a) && <Pill>{atcLabelSentence(selected.a)}</Pill>}
              {selected.a.map((a) => <Pill key={a}>ATC {a}</Pill>)}
              {selected.x === 1 && <Pill tone="warn">terméshiányos jelzés (OGYÉI lista)</Pill>}
            </div>
            <div className="text-sm text-muted mt-1">Forgalomba hozó: {selected.m}</div>
          </div>

          {/* ellenőrzés eredménye */}
          <div>
            <div className="h-caps mb-2">Automatikus ellenőrzés</div>
            {result.alerts.length === 0 ? (
              <div className="rounded-2xl border-2 border-[#b7dccb] bg-[#eefaf3] p-4 flex gap-3 items-start">
                <div className="h-8 w-8 rounded-full bg-[#2f8f5b] text-white grid place-items-center font-bold shrink-0">✓</div>
                <div>
                  <div className="font-bold text-[#1f6b43]">Nincs ismert ütközés</div>
                  <div className="text-sm text-ink/80">A beteg allergiáival, szedett gyógyszereivel és a mostani recepttel az ellenőrzés nem talált kölcsönhatást vagy duplikációt.</div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {result.alerts.map((a) => <AlertCard key={a.id} a={a} />)}
              </div>
            )}
          </div>

          {/* alternatívák */}
          {result.alternatives.length > 0 && (
            <div>
              <div className="h-caps mb-1">Javasolt alternatívák</div>
              <p className="text-sm text-muted mb-2">A teljes betegprofil (allergiák, szedett gyógyszerek, mostani recept) figyelembevételével. A döntést az orvos hozza.</p>
              <div className="grid gap-3 md:grid-cols-2">
                {result.alternatives.map((alt) => (
                  <div key={alt.substance} className="rounded-2xl border-2 border-line bg-pale p-4">
                    <div className="font-extrabold text-lg">{alt.hu}</div>
                    {alt.residual.length === 0 ? (
                      <div className="text-sm text-[#1f6b43] font-semibold">Ütközés nélkül a beteg profiljával</div>
                    ) : (
                      <div className="mt-1 space-y-1">
                        {alt.residual.map((r) => (
                          <div key={r.id} className="text-sm flex items-start gap-2"><SeverityBadge sev={r.severity} /><span>{r.title} – {r.with}</span></div>
                        ))}
                      </div>
                    )}
                    <div className="mt-3 flex flex-col gap-2">
                      {alt.products.map((p) => (
                        <button key={p.id} className="btn btn-ghost !justify-start text-left !py-2" onClick={() => pick(p)}>
                          <span className="text-teal font-bold">Csere:</span> {p.n}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {max >= 3 && result.alternatives.length === 0 && (
            <div className="text-sm text-muted">Ehhez a gyógyszerhez a profilnak megfelelő automatikus alternatívát nem találtunk. Kérjük, mérlegelje másik hatóanyag választását.</div>
          )}

          {/* adagolás */}
          <div>
            <div className="h-caps mb-2">Adagolás</div>
            <div className="flex flex-wrap items-end gap-4">
              <Stepper label="Reggel" value={dosing.morning} onChange={(n) => setDosing({ ...dosing, morning: n })} />
              <Stepper label="Délben" value={dosing.noon} onChange={(n) => setDosing({ ...dosing, noon: n })} />
              <Stepper label="Este" value={dosing.evening} onChange={(n) => setDosing({ ...dosing, evening: n })} />
              <Stepper label="Lefekvéskor" value={dosing.night} onChange={(n) => setDosing({ ...dosing, night: n })} />
              <div>
                <label className="label" htmlFor="unit">Egység</label>
                <input id="unit" className="input w-32 mt-1" value={dosing.unit} onChange={(e) => setDosing({ ...dosing, unit: e.target.value })} />
              </div>
              <div>
                <label className="label" htmlFor="days">Napok száma</label>
                <input id="days" type="number" min={1} className="input w-28 mt-1" value={dosing.days ?? ""} onChange={(e) => setDosing({ ...dosing, days: e.target.value ? Number(e.target.value) : undefined })} placeholder="folyamatos" />
              </div>
              <div>
                <label className="label" htmlFor="qty">Dobozok</label>
                <input id="qty" type="number" min={1} max={12} className="input w-24 mt-1" value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))} />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="label" htmlFor="ind">Mire szedi a beteg? (a betegnézetben is látszik)</label>
                <input id="ind" className="input mt-1" value={indication} onChange={(e) => setIndication(e.target.value)} placeholder="pl. fájdalom- és lázcsillapítás" />
              </div>
              <div>
                <label className="label" htmlFor="dnote">Megjegyzés a betegnek (nem kötelező)</label>
                <input id="dnote" className="input mt-1" value={dosing.note ?? ""} onChange={(e) => setDosing({ ...dosing, note: e.target.value || undefined })} placeholder="pl. étkezés után, bő vízzel" />
              </div>
            </div>
          </div>

          {/* felülbírálás */}
          {needOverride && (
            <div className={`rounded-2xl border-2 p-4 ${SEV_STYLE[max as 3 | 4].bg} ${SEV_STYLE[max as 3 | 4].border}`}>
              <div className="font-extrabold mb-1">A felírás megállt: {SEVERITY_LABEL[max as 3 | 4].toLowerCase()} figyelmeztetés</div>
              <p className="text-sm mb-3">Ha az orvosi mérlegelés alapján mégis indokolt, a felülbírálást indokolni kell. Az indoklás naplózásra kerül, a beteg is látja a hozzáférési naplóban.</p>
              <label className="label" htmlFor="reason">Indoklás ({minReason}+ karakter)</label>
              <textarea id="reason" className="input mt-1 min-h-[84px]" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="pl. szakorvosi javaslat, nincs alternatíva, a beteget tájékoztattam…" />
              <label className="flex items-center gap-3 mt-3 font-semibold cursor-pointer">
                <input type="checkbox" className="h-6 w-6 accent-[#14284b]" checked={ack} onChange={(e) => setAck(e.target.checked)} />
                Tudomásul veszem a figyelmeztetést, és vállalom a felelősséget.
              </label>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button className="btn btn-primary" disabled={!canAdd} onClick={add}>
              {needOverride ? "Felülbírálom, hozzáadás a recepthez" : "Hozzáadás a recepthez"}
            </button>
            <button className="btn btn-ghost" onClick={() => setSelected(null)}>Mégsem</button>
          </div>
        </div>
      )}

      {draft.length > 0 && (
        <div className="card p-5">
          <div className="h-caps mb-2">Mostani recept</div>
          <ul className="divide-y divide-line">
            {draft.map((d) => (
              <li key={d.id} className="py-3 flex flex-wrap items-start gap-3">
                <div className="flex-1 min-w-[240px]">
                  <div className="font-bold">{d.name}</div>
                  <div className="text-sm text-muted">{dosingText(d.dosing)} · {d.quantity} doboz · {d.indication}</div>
                  {d.overrides && <div className="mt-1"><SeverityBadge sev={Math.max(...d.overrides.map((o) => o.severity)) as 3 | 4} /> <span className="text-sm">felülbírálva: {d.overrides[0].reason}</span></div>}
                </div>
                <button className="btn btn-ghost !min-h-10 !py-1.5" onClick={() => setDraft((x) => x.filter((y) => y.id !== d.id))}>Eltávolítás</button>
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <button className="btn btn-teal" onClick={issue}>Recept kiállítása ({draft.length} tétel)</button>
          </div>
        </div>
      )}
    </div>
  );
}
