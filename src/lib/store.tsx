"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { AuditEntry, Dispense, Notice, Patient, Prescription, RxItem } from "./types";
import { loadCatalog, type Catalog } from "./catalog";
import { buildSeed, DOCTOR, PHARMACY, type AppState } from "./demo";
import { newId, rxCode } from "./util";
import { mergeStates } from "./merge";

const KEY = "medisync-demo-v1";

interface Store {
  ready: boolean;
  cat: Catalog | null;
  state: AppState | null;
  patient: (id: string) => Patient | undefined;
  prescriptionsOf: (patientId: string) => Prescription[];
  auditOf: (patientId: string) => AuditEntry[];
  noticesOf: (patientId: string) => Notice[];
  log: (e: Omit<AuditEntry, "id" | "ts">) => void;
  issuePrescription: (patientId: string, items: RxItem[]) => Prescription;
  dispense: (rxId: string, itemId: string, d: Omit<Dispense, "at" | "by">) => void;
  assignCard: (patientId: string, uid: string) => void;
  markNotice: (id: string) => void;
  reset: () => void;
  /** Közös adatbázis állapota: "online" (több eszköz között szinkron), "local" (csak ez a böngésző), "off" (még tölt). */
  sync: "off" | "online" | "local";
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [cat, setCat] = useState<Catalog | null>(null);
  const [state, setState] = useState<AppState | null>(null);
  const loaded = useRef(false);
  const [sync, setSync] = useState<"off" | "online" | "local">("off");
  const stateRef = useRef<AppState | null>(null);
  const dirty = useRef(false);
  const lastVer = useRef(0);
  const pushTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const same = (a: AppState | null, b: AppState | null) => JSON.stringify(a) === JSON.stringify(b);

  /** Helyi módosítás: állapotváltás + jelölés, hogy feltöltendő a közös adatbázisba. */
  const commit = useCallback((fn: (s: AppState | null) => AppState | null) => {
    dirty.current = true;
    setState(fn);
  }, []);

  const push = useCallback(async (reset = false) => {
    const s = stateRef.current;
    if (!s) return;
    try {
      const r = await fetch("/api/state", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ state: s, reset }) });
      if (!r.ok) { setSync("local"); return; }
      const j = (await r.json()) as { version: number; state: AppState };
      lastVer.current = j.version;
      dirty.current = false;
      setSync("online");
      setState((prev) => { const m = prev ? mergeStates(prev, j.state) : j.state; return same(prev, m) ? prev : m; });
    } catch { setSync("local"); }
  }, []);

  const pull = useCallback(async () => {
    try {
      const r = await fetch(`/api/state?since=${lastVer.current}`, { cache: "no-store" });
      if (!r.ok) { setSync("local"); return; }
      const j = (await r.json()) as { version: number; unchanged?: boolean; state?: AppState | null };
      setSync("online");
      if (j.unchanged) return;
      lastVer.current = j.version;
      if (!j.state) { dirty.current = true; void push(); return; } // üres adatbázis: feltöltjük a helyi állapotot
      setState((prev) => { const m = prev ? mergeStates(prev, j.state as AppState) : (j.state as AppState); return same(prev, m) ? prev : m; });
    } catch { setSync("local"); }
  }, [push]);

  useEffect(() => {
    let alive = true;
    loadCatalog().then((c) => {
      if (!alive) return;
      setCat(c);
      let s: AppState | null = null;
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as AppState;
          if (parsed.v === 1) s = parsed;
        }
      } catch {
        /* nincs tárolt állapot */
      }
      setState(s ?? buildSeed(c));
      loaded.current = true;
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => { stateRef.current = state; }, [state]);

  // helyi módosítás után feltöltés a közös adatbázisba (kis késleltetéssel)
  useEffect(() => {
    if (!state || !loaded.current || !dirty.current) return;
    clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => void push(), 350);
    return () => clearTimeout(pushTimer.current);
  }, [state, push]);

  // induláskor és időnként lekérdezés (csak látható lapnál)
  useEffect(() => {
    if (!state || !loaded.current) return;
    void pull();
    const id = setInterval(() => { if (document.visibilityState === "visible") void pull(); }, 4000);
    const vis = () => { if (document.visibilityState === "visible") void pull(); };
    document.addEventListener("visibilitychange", vis);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", vis); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!state, pull]);

  useEffect(() => {
    if (!state || !loaded.current) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* a tároló nem elérhető */
    }
  }, [state]);

  const log = useCallback<Store["log"]>((e) => {
    commit((s) => (s ? { ...s, audit: [{ ...e, id: newId("au"), ts: new Date().toISOString() }, ...s.audit] } : s));
  }, []);

  const issuePrescription = useCallback<Store["issuePrescription"]>(
    (patientId, items) => {
      const rx: Prescription = {
        id: rxCode(), patientId, createdAt: new Date().toISOString(), doctor: DOCTOR.name, items, status: "kiadva", dispenses: {},
      };
      commit((s) => {
        if (!s) return s;
        const notice: Notice = {
          id: newId("n"), ts: rx.createdAt, patientId, read: false,
          title: "Új recept az EESZT-n",
          body: `${DOCTOR.name} új receptet állított ki: ${items.map((i) => i.name).join(", ")}. Receptazonosító: ${rx.id}.`,
        };
        const au: AuditEntry = {
          id: newId("au"), ts: rx.createdAt, patientId, actorRole: "orvos", actorName: DOCTOR.name,
          action: "Recept kiállítása", detail: items.map((i) => i.name).join(", "),
        };
        return { ...s, prescriptions: [rx, ...s.prescriptions], notices: [notice, ...s.notices], audit: [au, ...s.audit] };
      });
      return rx;
    },
    [],
  );

  const dispense = useCallback<Store["dispense"]>((rxId, itemId, d) => {
    commit((s) => {
      if (!s) return s;
      const at = new Date().toISOString();
      const rx = s.prescriptions.find((r) => r.id === rxId);
      if (!rx) return s;
      const item = rx.items.find((i) => i.id === itemId);
      const full: Dispense = { ...d, by: PHARMACY.name, at };
      const prescriptions = s.prescriptions.map((r) => {
        if (r.id !== rxId) return r;
        const dispenses = { ...r.dispenses, [itemId]: full };
        const all = r.items.every((i) => dispenses[i.id]);
        return { ...r, dispenses, status: all ? ("kiváltva" as const) : r.status };
      });
      const notices = [...s.notices];
      if (item) {
        notices.unshift({
          id: newId("n"), ts: at, patientId: rx.patientId, read: false,
          title: d.substituted ? "A patikában másik készítményt adtak ki" : "Recept kiváltva",
          body: d.substituted
            ? `Felírva: ${item.name}. Kiadva: ${d.name}. Ugyanaz a hatóanyag (${item.h.join(", ")}), azonos erősség és gyógyszerforma, így a hatása ugyanaz. Nyugodtan szedheti.`
            : `${d.name} kiváltva a(z) ${PHARMACY.name} patikában.`,
        });
      }
      const audit: AuditEntry[] = [
        {
          id: newId("au"), ts: at, patientId: rx.patientId, actorRole: "gyógyszerész", actorName: PHARMACY.name,
          action: d.substituted ? "Recept kiváltása (patikai csere)" : "Recept kiváltása",
          detail: d.substituted ? `${item?.name} → ${d.name}` : d.name,
        },
        ...s.audit,
      ];
      return { ...s, prescriptions, notices, audit };
    });
  }, []);

  const assignCard = useCallback<Store["assignCard"]>((patientId, uid) => {
    setState((s) => (s ? { ...s, patients: s.patients.map((p) => (p.id === patientId ? { ...p, cardUid: uid } : p)) } : s));
  }, []);

  const markNotice = useCallback((id: string) => {
    commit((s) => (s ? { ...s, notices: s.notices.map((n) => (n.id === id ? { ...n, read: true } : n)) } : s));
  }, []);

  const reset = useCallback(() => {
    if (!cat) return;
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* semmi */
    }
    dirty.current = true;
    setState({ ...buildSeed(cat), epoch: Date.now() });
    setTimeout(() => void push(true), 100);
  }, [cat, push]);

  const value = useMemo<Store>(
    () => ({
      ready: !!state && !!cat,
      cat,
      state,
      patient: (id) => state?.patients.find((p) => p.id === id),
      prescriptionsOf: (id) => (state?.prescriptions ?? []).filter((r) => r.patientId === id),
      auditOf: (id) => (state?.audit ?? []).filter((a) => a.patientId === id),
      noticesOf: (id) => (state?.notices ?? []).filter((n) => n.patientId === id),
      log, issuePrescription, dispense, assignCard, markNotice, reset, sync,
    }),
    [state, cat, log, issuePrescription, dispense, assignCard, markNotice, reset, sync],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const v = useContext(Ctx);
  if (!v) throw new Error("StoreProvider hiányzik");
  return v;
}
