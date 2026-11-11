"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";

export function Logo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <rect x="4" y="4" width="40" height="40" rx="12" fill="#ffffff" opacity=".12" />
      <rect x="19" y="8" width="10" height="32" rx="5" fill="#ffffff" />
      <rect x="8" y="19" width="32" height="10" rx="5" fill="#6fb3c8" />
      <rect x="19" y="19" width="10" height="10" fill="#2f7893" />
    </svg>
  );
}

const NAV = [
  { href: "/orvos", label: "Orvos" },
  { href: "/beteg", label: "Beteg" },
  { href: "/patika", label: "Patika" },
];

export function Header() {
  const path = usePathname();
  return (
    <header className="bg-navy text-white sticky top-0 z-30">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center gap-6">
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <Logo />
          <span className="text-[1.35rem] font-extrabold tracking-tight">MediSync</span>
        </Link>
        <nav className="flex items-center gap-1 ml-auto sm:ml-4">
          {NAV.map((n) => {
            const active = path === n.href || path.startsWith(n.href + "/");
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`px-3.5 py-2 rounded-xl text-[0.95rem] font-semibold transition-colors ${active ? "bg-white/15" : "hover:bg-white/10 text-white/85"}`}
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
  const { reset, ready } = useStore();
  return (
    <footer className="border-t border-line bg-white">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 text-[0.8rem] text-muted flex flex-wrap items-center gap-x-6 gap-y-2">
        <span>
          <b className="text-ink">Oktatási prototípus.</b> Szintetikus adatokkal készült, nem orvosi eszköz, klinikai döntéshez nem használható.
        </span>
        {ready && (
          <button className="ml-auto underline underline-offset-2 hover:text-ink" onClick={() => { if (confirm("Visszaállítja a demó adatait az eredeti állapotra?")) reset(); }}>
            Demó visszaállítása
          </button>
        )}
      </div>
    </footer>
  );
}
