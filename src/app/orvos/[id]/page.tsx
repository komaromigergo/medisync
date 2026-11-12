"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { ALLERGENS, huName } from "@/lib/knowledge";
import { reviewMeds } from "@/lib/engine";
import { age, dosingText, fmtDate, fmtDateTime, fmtTaj } from "@/lib/util";
import { DOCTOR } from "@/lib/demo";
import { AlertCard, Gate, Pill } from "@/components/ui";
import { Prescribe } from "@/components/Prescribe";

function Field({ k, v }: { k: string; v: React.ReactNode }) {
  return <div><div className="label">{k}</div><div className="font-semibold">{v}</div></div>;
}

function Inner() {
  const { id } = useParams<{ id: string }>();
  const { patient, cat, prescriptionsOf, auditOf } = useStore();
  const p = patient(id);
  const rxs = prescriptionsOf(id);
  const audit = auditOf(id);
  const review = useMemo(
    () => (p ? reviewMeds(p.meds.filter((m) => m.active).map((m) => ({ label: m.name, drug: { name: m.name, h: m.h, f: m.f, s: m.s } })), p) : []),
    [p],
  );
  if (!p || !cat) return <div className="p-10">A beteg nem található. <Link className="underline" href="/orvos">Vissza az azonosításhoz</Link></div>;
  // csak akkor vészhelyzeti, ha a beteg LEGUTÓBBI azonosítása vészhelyzeti (ujjlenyomatos) volt, és az 30 percnél frissebb
  const lastId = audit
    .filter((a) => a.actorRole === "orvos" && (a.action === "Beteg azonosítása" || a.action === "Vészhelyzeti hozzáférés"))
    .reduce<(typeof audit)[number] | undefined>((best, a) => (!best || new Date(a.ts) > new Date(best.ts) ? a : best), undefined);
  const emergency = lastId?.emergency && Date.now() - new Date(lastId.ts).getTime() < 1000 * 60 * 30 ? lastId : undefined;

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Link href="/orvos" className="btn btn-ghost !min-h-10 !py-1.5">← Új azonosítás</Link>
        <span className="text-sm text-muted">Bejelentkezve: {DOCTOR.name}, {DOCTOR.place}</span>
        <Pill tone="teal">Azonosítva</Pill>
      </div>
      {emergency && <div className="mb-4 rounded-2xl border-2 border-[#e6a1a1] bg-[#fbe9e9] p-4 font-semibold text-[#7f1d1d]">Vészhelyzeti hozzáférés aktív. A hozzáférés megkülönböztetetten naplózva van, a beteg értesül.</div>}

      <div className="grid lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] gap-6 items-start">
        <aside className="space-y-5">
          <div className="card p-5">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-14 w-14 rounded-full bg-navy text-white grid place-items-center text-xl font-extrabold">{p.name.split(" ").map((x) => x[0]).slice(0, 2).join("")}</div>
              <div><div className="text-2xl font-extrabold leading-tight">{p.name}</div><div className="text-muted">{age(p.birthDate)} éves · {p.sex}</div></div>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-[0.95rem]">
              <Field k="Születési dátum" v={fmtDate(p.birthDate)} />
              <Field k="Születési hely" v={p.birthPlace} />
              <Field k="TAJ-szám" v={<span className="tabular-nums">{fmtTaj(p.taj)}</span>} />
              <Field k="Vércsoport" v={p.bloodType} />
              <Field k="Anyja neve" v={p.mother} />
              <Field k="Lakcím" v={p.address} />
            </div>
          </div>

          <div className="card p-5">
            <div className="h-caps mb-2">Allergiák</div>
            {p.allergies.length === 0 ? <div className="text-muted">Nincs rögzített allergia.</div> : p.allergies.map((a) => (
              <div key={a.key} className="rounded-xl bg-[#fbe9e9] border border-[#e6a1a1] px-3 py-2 mb-2 text-[#7f1d1d]"><b>{ALLERGENS[a.key]?.hu ?? a.key}</b>{a.reaction && <span> · {a.reaction}</span>}</div>
            ))}
            <div className="h-caps mt-4 mb-2">Betegségek</div>
            <div className="flex flex-wrap gap-2">{p.conditions.map((c) => <Pill key={c}>{c}</Pill>)}</div>
          </div>

          <div className="card p-5">
            <div className="h-caps mb-2">Jelenlegi gyógyszerek</div>
            <ul className="divide-y divide-line">
              {p.meds.filter((m) => m.active).map((m) => (
                <li key={m.id} className="py-2.5">
                  <div className="font-bold">{m.name}</div>
                  <div className="text-sm text-muted">{m.h.map(huName).join(", ")} · {dosingText(m.dosing)}</div>
                  <div className="text-sm">{m.indication}</div>
                </li>
              ))}
            </ul>
            {review.length > 0 && (
              <div className="mt-4">
                <div className="h-caps mb-2">Meglévő gyógyszerek áttekintése</div>
                <div className="space-y-2">{review.map((r, i) => <AlertCard key={i} a={{ ...r.alert, title: `${r.a} + ${r.b}: ${r.alert.title}` }} />)}</div>
              </div>
            )}
          </div>
        </aside>

        <main className="space-y-6">
          <Prescribe patient={p} cat={cat} />
          <div className="card p-5">
            <div className="h-caps mb-2">Korábbi receptek</div>
            {rxs.length === 0 ? <div className="text-muted">Még nincs recept.</div> : (
              <ul className="divide-y divide-line">
                {rxs.map((r) => (
                  <li key={r.id} className="py-3">
                    <div className="flex flex-wrap items-center gap-2"><b className="tabular-nums">{r.id}</b><Pill tone={r.status === "kiváltva" ? "teal" : "warn"}>{r.status}</Pill><span className="text-sm text-muted">{fmtDateTime(r.createdAt)}</span></div>
                    <div className="text-sm">{r.items.map((i) => i.name).join(", ")}</div>
                    {Object.values(r.dispenses).filter((d) => d.substituted).map((d) => <div key={d.productId} className="text-sm text-[#8a5a12]">Patikai csere: {d.name}</div>)}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="card p-5">
            <div className="h-caps mb-2">Hozzáférési napló</div>
            <ul className="divide-y divide-line text-sm">
              {audit.slice(0, 8).map((a) => (
                <li key={a.id} className="py-2 flex flex-wrap gap-x-3"><span className="text-muted tabular-nums">{fmtDateTime(a.ts)}</span><b>{a.actorName}</b><span>{a.action}</span>{a.emergency && <Pill tone="warn">vészhelyzet</Pill>}</li>
              ))}
            </ul>
          </div>
        </main>
      </div>
    </div>
  );
}
export default function Page() { return <Gate><Inner /></Gate>; }
