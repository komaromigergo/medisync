"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { Gate } from "@/components/ui";
import { age } from "@/lib/util";

function Inner() {
  const { state } = useStore();
  return (
    <div className="max-w-[800px] mx-auto px-4 sm:px-6 py-8">
      <div className="h-caps">Betegnézet</div>
      <h1 className="text-3xl font-extrabold mt-1 mb-2">Ki nézi a saját adatait?</h1>
      <p className="text-muted mb-6">A valós rendszerben a beteg ügyfélkapus / DÁP-belépéssel jutna ide. A demóban válasszon tesztbeteget.</p>
      <div className="grid sm:grid-cols-2 gap-4">
        {state!.patients.map((p) => (
          <Link key={p.id} href={`/beteg/${p.id}`} className="card p-5 hover:border-teal transition-colors block">
            <div className="text-xl font-extrabold">{p.name}</div>
            <div className="text-muted">{age(p.birthDate)} éves · {p.conditions.join(", ")}</div>
            <div className="btn btn-primary mt-4 w-fit">Belépés (szimuláció)</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
export default function Page() { return <Gate><Inner /></Gate>; }
