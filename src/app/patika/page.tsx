"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { equivalentProducts } from "@/lib/engine";
import { huName } from "@/lib/knowledge";
import { dosingText, fmtDateTime, fmtTaj } from "@/lib/util";
import { PHARMACY } from "@/lib/demo";
import { Gate, Pill } from "@/components/ui";
import { QrScanner } from "@/components/QrScanner";
import { findPatientByCode, parseRxCode } from "@/lib/cards";
import { useWedge } from "@/lib/useWedge";
import type { Product, Prescription, RxItem } from "@/lib/types";

function Item({ rx, item }: { rx: Prescription; item: RxItem }) {
  const { cat, dispense } = useStore();
  const [open, setOpen] = useState(false);
  const prod = cat!.byId.get(item.productId);
  const eq = prod ? equivalentProducts(cat!, prod) : { available: [], unavailable: [] };
  const disp = rx.dispenses[item.id];
  const short = prod?.x === 1;

  if (disp) {
    return (
      <div className="rounded-2xl border-2 border-[#b7dccb] bg-[#eefaf3] p-4">
        <div className="font-bold text-[#1f6b43]">✓ Kiadva: {disp.name}</div>
        {disp.substituted && <div className="text-sm">Patikai csere (felírva: {item.name}). {disp.reason}</div>}
        <div className="text-xs text-muted mt-1">{fmtDateTime(disp.at)} · {disp.by}</div>
      </div>
    );
  }
  const give = (p: Product, substituted: boolean, reason?: string) =>
    dispense(rx.id, item.id, { productId: p.id, name: p.n, s: p.s, substituted, reason });

  return (
    <div className="rounded-2xl border-2 border-line p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-lg font-extrabold">{item.name}</span>
        {short && <Pill tone="warn">terméshiányos jelzés (OGYÉI)</Pill>}
      </div>
      <div className="text-sm text-muted">Hatóanyag: {item.h.map(huName).join(", ")} · {item.quantity} doboz · {dosingText(item.dosing)}</div>
      {short && (
        <div className="mt-3 rounded-xl bg-[#fdf6e7] border border-[#ecd29a] p-3 text-sm">
          Az OGYÉI lista szerint ez a készítmény terméshiánnyal érintett. Azonos hatóanyagú, erősségű és formájú, kapható készítmények:
        </div>
      )}
      <div className="flex flex-wrap gap-3 mt-3">
        {!short && prod && <button className="btn btn-primary" onClick={() => give(prod, false)}>Kiadás: {item.name}</button>}
        {eq.available.length > 0 && <button className="btn btn-teal" onClick={() => setOpen((o) => !o)}>{open ? "Csere bezárása" : `Patikai csere (${eq.available.length})`}</button>}
        {short && eq.available.length === 0 && <span className="text-sm text-[#7f1d1d] font-semibold">Nincs kapható egyenértékű készítmény, visszaküldés az orvoshoz.</span>}
      </div>
      {open && (
        <ul className="mt-3 divide-y divide-line card overflow-hidden">
          {eq.available.slice(0, 8).map((q) => (
            <li key={q.id} className="px-4 py-3 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[220px]"><b>{q.n}</b><div className="text-xs text-muted">{q.m.replace(/[,\s]+$/, "")}</div></div>
              <button className="btn btn-primary !min-h-10 !py-1.5" onClick={() => give(q, true, `Az eredeti készítmény nem kapható; azonos hatóanyag (${q.h.map(huName).join(", ")}), erősség és forma.`)}>Kiadás cserével</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Inner() {
  const { state, patient, log } = useStore();
  const sp = useSearchParams();
  const [focus, setFocus] = useState<string | null>(sp.get("rx"));
  const [who, setWho] = useState<string | null>(null);
  const [scanMsg, setScanMsg] = useState("");
  const [cam, setCam] = useState(false);

  function onScan(code: string) {
    const rxDigits = parseRxCode(code);
    if (rxDigits) {
      const rx = state!.prescriptions.find((r) => r.id.replace(/\D/g, "") === rxDigits);
      if (!rx) return setScanMsg("Ismeretlen recept-QR.");
      setFocus(rx.id); setWho(rx.patientId); setScanMsg("");
      log({ patientId: rx.patientId, actorRole: "gyógyszerész", actorName: PHARMACY.name, action: "Recept azonosítása (QR)", detail: rx.id });
      return;
    }
    const p = findPatientByCode(state!.patients, code);
    if (!p) return setScanMsg(`Ismeretlen QR-kód: ${code}`);
    setWho(p.id); setFocus(null); setScanMsg("");
    log({ patientId: p.id, actorRole: "gyógyszerész", actorName: PHARMACY.name, action: "Beteg azonosítása a patikában (QR)" });
  }
  useWedge(onScan);
  useEffect(() => { if (focus) document.getElementById(`rx-${focus}`)?.scrollIntoView({ behavior: "smooth", block: "center" }); }, [focus]);

  const list = [...state!.prescriptions].filter((r) => !who || r.patientId === who).sort((a, b) => (a.status === b.status ? b.createdAt.localeCompare(a.createdAt) : a.status === "kiadva" ? -1 : 1));
  return (
    <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-8">
      <div className="h-caps">Patikai nézet · {PHARMACY.name}, {PHARMACY.place}</div>
      <h1 className="text-3xl font-extrabold mt-1 mb-1">Receptek kiváltása</h1>
      <p className="text-muted mb-6">Bejelentkezve: {PHARMACY.pharmacist}. A beteg az EESZT-n keresztül kapja az értesítést a kiadásról és a cseréről.</p>
      <div className="card p-5 mb-5">
        <div className="h-caps mb-1">Azonosítás QR-kóddal</div>
        <p className="text-sm text-muted mb-3">Olvassa be a beteg digitális azonosítóját vagy a recept QR-kódját a vonalkód-olvasóval (a lap nyitva tartása elég), vagy a kamerával.</p>
        {who ? (
          <div className="rounded-2xl border-2 border-[#b7dccb] bg-[#eefaf3] p-3 flex flex-wrap items-center gap-3">
            <b className="text-[#1f6b43]">✓ Azonosítva: {patient(who)?.name}</b>
            <span className="text-sm text-muted">TAJ {patient(who) ? fmtTaj(patient(who)!.taj) : ""}</span>
            <button className="btn btn-ghost !min-h-9 !py-1 ml-auto" onClick={() => { setWho(null); setFocus(null); }}>Szűrés törlése</button>
          </div>
        ) : (
          <button className="btn btn-ghost" onClick={() => setCam((c) => !c)}>{cam ? "Kamera elrejtése" : "Kamera használata"}</button>
        )}
        {cam && !who && <div className="mt-3"><QrScanner onResult={(c) => { setCam(false); onScan(c); }} /></div>}
        {scanMsg && <p className="text-sm mt-2 text-[#7f1d1d] font-semibold">{scanMsg}</p>}
      </div>
      {list.length === 0 && <div className="card p-6 text-muted">Nincs recept.</div>}
      <div className="space-y-5">
        {list.map((rx) => {
          const p = patient(rx.patientId);
          return (
            <section key={rx.id} id={`rx-${rx.id}`} className={`card p-5 ${focus === rx.id ? "ring-4 ring-teal" : ""}`}>
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <b className="text-lg tabular-nums">{rx.id}</b>
                <Pill tone={rx.status === "kiváltva" ? "teal" : "warn"}>{rx.status === "kiváltva" ? "kiváltva" : "kiváltásra vár"}</Pill>
                <span className="text-sm text-muted">{p?.name} · TAJ {p ? fmtTaj(p.taj) : ""} · {rx.doctor} · {fmtDateTime(rx.createdAt)}</span>
              </div>
              <div className="space-y-3">{rx.items.map((i) => <Item key={i.id} rx={rx} item={i} />)}</div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
export default function Page() { return <Gate><Suspense><Inner /></Suspense></Gate>; }
