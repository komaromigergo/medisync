"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { equivalentProducts } from "@/lib/engine";
import { huName } from "@/lib/knowledge";
import { dosingParts, fmtDate, fmtDateTime } from "@/lib/util";
import { QrCode } from "@/components/QrCode";
import { rxQrText } from "@/lib/cards";
import { Gate, Pill } from "@/components/ui";

function Schedule({ d }: { d: import("@/lib/types").Dosing }) {
  const parts = dosingParts(d);
  if (d.asNeeded) return <Pill>Szükség esetén</Pill>;
  return (
    <div className="flex flex-wrap gap-2">
      {parts.map((p) => (
        <div key={p.label} className="rounded-xl bg-pale border border-line px-3 py-1.5 text-center">
          <div className="text-xs text-muted">{p.label}</div>
          <div className="font-extrabold text-lg">{p.n} <span className="text-sm font-semibold">{d.unit}</span></div>
        </div>
      ))}
    </div>
  );
}

function Inner() {
  const { id } = useParams<{ id: string }>();
  const { patient, cat, prescriptionsOf, auditOf, noticesOf, markNotice } = useStore();
  const p = patient(id);
  if (!p || !cat) return <div className="p-10">Nem található. <Link className="underline" href="/beteg">Vissza</Link></div>;
  const rxs = prescriptionsOf(id);
  const notices = noticesOf(id);
  const audit = auditOf(id);
  const unread = notices.filter((n) => !n.read).length;

  return (
    <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <div className="h-caps">Betegnézet</div>
        <h1 className="text-3xl font-extrabold mt-1">Üdvözöljük, {p.name}!</h1>
      </div>

      <section className="card p-5">
        <h2 className="text-xl font-extrabold mb-1">Digitális azonosítóm (DÁP-szimuláció)</h2>
        <p className="text-sm text-muted mb-3">Az orvos ezt a QR-kódot olvassa be, hogy azonosítson. A valódi rendszerben ezt a DÁP-alkalmazás adná.</p>
        <QrCode text={`MEDISYNC${(p.cardUid ?? p.id).replace(/[^0-9a-z]/gi, "").toUpperCase()}`} />
      </section>

      <section className="card p-5">
        <div className="flex items-center gap-3 mb-3"><h2 className="text-xl font-extrabold">Értesítések</h2>{unread > 0 && <Pill tone="teal">{unread} új</Pill>}</div>
        {notices.length === 0 ? <div className="text-muted">Nincs értesítés.</div> : (
          <ul className="space-y-3">
            {notices.map((n) => (
              <li key={n.id} className={`rounded-2xl border-2 p-4 ${n.read ? "border-line bg-white" : "border-teal bg-[#eef8fb]"}`}>
                <div className="flex flex-wrap items-center gap-2"><b>{n.title}</b><span className="text-xs text-muted">{fmtDateTime(n.ts)}</span></div>
                <div className="text-[0.95rem] mt-1">{n.body}</div>
                {!n.read && <button className="btn btn-ghost !min-h-9 !py-1 mt-2" onClick={() => markNotice(n.id)}>Elolvastam</button>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card p-5">
        <h2 className="text-xl font-extrabold mb-3">Receptjeim</h2>
        {rxs.length === 0 ? <div className="text-muted">Nincs recept.</div> : rxs.map((r) => (
          <div key={r.id} className="mb-5 last:mb-0">
            <div className="flex flex-wrap items-center gap-2 mb-2"><b className="tabular-nums">{r.id}</b><Pill tone={r.status === "kiváltva" ? "teal" : "warn"}>{r.status === "kiváltva" ? "kiváltva" : "kiváltásra vár"}</Pill><span className="text-sm text-muted">{fmtDate(r.createdAt)} · {r.doctor}</span></div>
            {r.status === "kiadva" && (
              <div className="mb-3 flex flex-wrap items-center gap-4 rounded-2xl bg-pale border border-line p-3">
                <QrCode text={rxQrText(r.id)} size={140} />
                <div className="text-sm"><b>Recept-QR</b><br />Mutassa meg a patikában, a gyógyszerész ezt olvassa be.</div>
              </div>
            )}
            <div className="space-y-3">
              {r.items.map((i) => {
                const disp = r.dispenses[i.id];
                const prod = cat.byId.get(i.productId);
                const eq = prod ? equivalentProducts(cat, prod).available.slice(0, 5) : [];
                return (
                  <div key={i.id} className="rounded-2xl border-2 border-line p-4">
                    <div className="text-lg font-extrabold">{i.name}</div>
                    <div className="text-sm text-muted mb-2">Hatóanyag: {i.h.map(huName).join(", ")} · {i.quantity} doboz</div>
                    <div className="mb-2"><span className="label">Mire való: </span>{i.indication}</div>
                    <Schedule d={i.dosing} />
                    {i.dosing.note && <div className="text-sm mt-2"><b>Megjegyzés:</b> {i.dosing.note}</div>}
                    {disp?.substituted && <div className="mt-3 rounded-xl bg-[#fdf6e7] border border-[#ecd29a] p-3 text-sm"><b>Patikai csere:</b> a patikában „{disp.name}” készítményt adták ki. Ugyanaz a hatóanyag, erősség és forma, a hatása ugyanaz.</div>}
                    {!disp && eq.length > 0 && (
                      <details className="mt-3"><summary className="cursor-pointer font-semibold text-teal">Azonos hatóanyagú alternatívák ({eq.length})</summary>
                        <ul className="list-disc pl-6 mt-2 text-sm">{eq.map((q) => <li key={q.id}>{q.n}</li>)}</ul>
                        <p className="text-xs text-muted mt-1">Ha az eredeti nem kapható, a gyógyszerész ezek egyikét adhatja ki.</p>
                      </details>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      <section className="card p-5">
        <h2 className="text-xl font-extrabold mb-3">Szedett gyógyszereim</h2>
        <div className="space-y-3">
          {p.meds.filter((m) => m.active).map((m) => (
            <div key={m.id} className="rounded-2xl border-2 border-line p-4">
              <div className="font-extrabold text-lg">{m.name}</div>
              <div className="text-sm text-muted mb-2">{m.h.map(huName).join(", ")} · felírta: {m.prescriber} · {fmtDate(m.since)} óta</div>
              <div className="mb-2"><span className="label">Mire való: </span>{m.indication}</div>
              <Schedule d={m.dosing} />
              {m.dosing.note && <div className="text-sm mt-2">{m.dosing.note}</div>}
            </div>
          ))}
        </div>
      </section>

      <section className="card p-5">
        <h2 className="text-xl font-extrabold mb-1">Ki nézte meg az adataimat?</h2>
        <p className="text-sm text-muted mb-3">Minden hozzáférés naplózva van. A vészhelyzeti hozzáférést külön jelöljük.</p>
        <ul className="divide-y divide-line text-sm">
          {audit.map((a) => (
            <li key={a.id} className="py-2 flex flex-wrap gap-x-3 items-center"><span className="text-muted tabular-nums">{fmtDateTime(a.ts)}</span><b>{a.actorName}</b><span>{a.action}</span>{a.detail && <span className="text-muted">({a.detail})</span>}{a.emergency && <Pill tone="warn">vészhelyzet</Pill>}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
export default function Page() { return <Gate><Inner /></Gate>; }
