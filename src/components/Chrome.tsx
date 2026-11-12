"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";

const NAV = [
  { href: "/orvos", label: "Orvos" },
  { href: "/beteg", label: "Beteg" },
  { href: "/patika", label: "Patika" },
];

export function Header() {
  const path = usePathname();
  return (
    <header className="bg-white border-b border-line sticky top-0 z-30">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center gap-6">
        <Link href="/" className="flex items-center gap-3 shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-horizontal.png" alt="MediSync Medical Software" className="h-12 w-auto" />
        </Link>
        <nav className="flex items-center gap-1 ml-auto sm:ml-4">
          {NAV.map((n) => {
            const active = path === n.href || path.startsWith(n.href + "/");
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`px-3.5 py-2 rounded-xl text-[0.95rem] font-semibold transition-colors ${active ? "bg-navy text-white" : "text-navy hover:bg-pale"}`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  const { reset, ready, sync } = useStore();
  return (
    <footer className="border-t border-line bg-white">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 text-[0.8rem] text-muted flex flex-wrap items-center gap-x-6 gap-y-2">
        <span>
          <b className="text-ink">Oktatási prototípus.</b> Szintetikus adatokkal készült, nem orvosi eszköz, klinikai döntéshez nem használható.
        </span>
        {ready && (
          <span title={sync === "online" ? "Az adatok minden eszközön közösek" : "Az adatok csak ebben a böngészőben vannak"} className="inline-flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-full ${sync === "online" ? "bg-[#2f8f5b]" : "bg-[#c9a227]"}`} />
            {sync === "online" ? "Közös adatbázis: online" : "Helyi mód (adatbázis nélkül)"}
          </span>
        )}
        {ready && (
          <button className="ml-auto underline underline-offset-2 hover:text-ink" onClick={() => { if (confirm("Visszaállítja a demó adatait az eredeti állapotra?")) reset(); }}>
            Demó visszaállítása
          </button>
        )}
      </div>
    </footer>
  );
}
