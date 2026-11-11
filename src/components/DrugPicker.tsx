"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/lib/types";
import type { Catalog } from "@/lib/catalog";
import { huName } from "@/lib/knowledge";
import { atcLabel } from "@/lib/atc";
import { Pill } from "./ui";

export function DrugPicker({ cat, onPick }: { cat: Catalog; onPick: (p: Product) => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Product[]>([]);

  useEffect(() => {
    const t = setTimeout(() => setResults(cat.search(q, 14)), 120);
    return () => clearTimeout(t);
  }, [q, cat]);

  return (
    <div>
      <label className="label" htmlFor="drugq">Gyógyszer keresése (márkanév vagy hatóanyag)</label>
      <input
        id="drugq" className="input mt-1 text-lg" value={q} onChange={(e) => setQ(e.target.value)}
        placeholder="pl. nurofen, ibuprofen, szimvasztatin, klaritromicin…" autoComplete="off" spellCheck={false}
      />
      {q.trim().length >= 2 && (
        <ul className="mt-3 card divide-y divide-line overflow-hidden max-h-[420px] overflow-y-auto">
          {results.length === 0 && <li className="p-4 text-muted">Nincs találat.</li>}
          {results.map((p) => (
            <li key={p.id}>
              <button className="w-full text-left px-4 py-3 hover:bg-pale focus:bg-pale transition-colors" onClick={() => { onPick(p); setQ(""); }}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-ink">{p.n}</span>
                  {p.x === 1 && <Pill tone="warn">terméshiányos jelzés</Pill>}
                  {p.r === "VN" && <Pill>vény nélkül</Pill>}
                </div>
                <div className="text-sm text-muted mt-0.5">
                  Hatóanyag: {p.h.map(huName).join(", ") || "–"} · {atcLabel(p.a) || "ATC: –"} · {p.m}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
