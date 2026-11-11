"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { equivalentProducts } from "@/lib/engine";
import { huName } from "@/lib/knowledge";
import { dosingText, fmtDateTime, fmtTaj } from "@/lib/util";
import { PHARMACY } from "@/lib/demo";
import { Gate, Pill } from "@/components/ui";
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
  const { state, patient } = useStore();
  const sp = useSearchParams();
  const focus = sp.get("rx");
  const list = [...state!.prescriptions].sort((a, b) => (a.status === b.status ? b.createdAt.localeCompare(a.createdAt) : a.status === "kiadva" ? -1 : 1));
  return (
    <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-8">
      <div className="h-caps">Patikai nézet · {PHARMACY.name}, {PHARMACY.place}</div>
      <h1 className="text-3xl font-extrabold mt-1 mb-1">Receptek kiváltása</h1>
      <p className="text-muted mb-6">Bejelentkezve: {PHARMACY.pharmacist}. A beteg az EESZT-n keresztül kapja az értesítést a kiadásról és a cseréről.</p>
      {list.length === 0 && <div className="card p-6 text-muted">Nincs recept.</div>}
      <div className="space-y-5">
        {list.map((rx) => {
          const p = patient(rx.patientId);
          return (
            <section key={rx.id} className={`card p-5 ${focus === rx.id ? "ring-2 ring-teal" : ""}`}>
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
