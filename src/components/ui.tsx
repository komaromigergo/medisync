"use client";

import type { Alert, Severity } from "@/lib/types";
import { SEVERITY_LABEL } from "@/lib/knowledge";
import { useStore } from "@/lib/store";

export const SEV_STYLE: Record<Severity, { bg: string; border: string; text: string; solid: string; icon: string }> = {
  1: { bg: "bg-[#eef5f8]", border: "border-[#b9d4df]", text: "text-[#3f6f84]", solid: "bg-sev1", icon: "i" },
  2: { bg: "bg-[#fdf6e7]", border: "border-[#ecd29a]", text: "text-[#8a5a12]", solid: "bg-sev2", icon: "!" },
  3: { bg: "bg-[#fdeee6]", border: "border-[#f0b58f]", text: "text-[#9a3412]", solid: "bg-sev3", icon: "!" },
  4: { bg: "bg-[#fbe9e9]", border: "border-[#e6a1a1]", text: "text-[#7f1d1d]", solid: "bg-sev4", icon: "×" },
};

export function SeverityBadge({ sev, big }: { sev: Severity; big?: boolean }) {
  const s = SEV_STYLE[sev];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full text-white font-bold ${s.solid} ${big ? "px-3.5 py-1.5 text-sm" : "px-2.5 py-0.5 text-xs"}`}>
      <span aria-hidden="true">{s.icon}</span>
      {SEVERITY_LABEL[sev]}
    </span>
  );
}

export function AlertCard({ a }: { a: Alert }) {
  const s = SEV_STYLE[a.severity];
  return (
    <div className={`rounded-2xl border-2 p-4 ${s.bg} ${s.border}`}>
      <div className="flex flex-wrap items-center gap-2 mb-1.5">
        <SeverityBadge sev={a.severity} />
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">{a.type}</span>
      </div>
      <div className={`font-bold text-[1.05rem] ${s.text}`}>{a.title}</div>
      <div className="text-sm text-ink/90 mt-1">{a.effect}</div>
      <div className="text-sm mt-2"><b>Javaslat:</b> {a.advice}</div>
    </div>
  );
}

export function Pill({ children, tone = "pale" }: { children: React.ReactNode; tone?: "pale" | "navy" | "teal" | "warn" }) {
  const t = {
    pale: "bg-pale text-navy border-line",
    navy: "bg-navy text-white border-navy",
    teal: "bg-teal text-white border-teal",
    warn: "bg-[#fdf6e7] text-[#8a5a12] border-[#ecd29a]",
  }[tone];
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${t}`}>{children}</span>;
}

export function Loading() {
  return (
    <div className="py-24 text-center text-muted">
      <div className="mx-auto mb-4 h-10 w-10 rounded-full border-4 border-line border-t-teal animate-spin" />
      Gyógyszeradatbázis betöltése…
    </div>
  );
}

export function Gate({ children }: { children: React.ReactNode }) {
  const { ready } = useStore();
  if (!ready) return <Loading />;
  return <>{children}</>;
}
