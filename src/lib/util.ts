import type { Dosing } from "./types";

export const fmtTaj = (t: string) => t.replace(/\D/g, "").replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3");
export const onlyDigits = (s: string) => s.replace(/\D/g, "");

export function tajValid(t: string): boolean {
  const d = onlyDigits(t);
  if (d.length !== 9) return false;
  let sum = 0;
  for (let i = 0; i < 8; i++) sum += Number(d[i]) * (i % 2 === 0 ? 3 : 7);
  return sum % 10 === Number(d[8]);
}

export function age(birth: string, now = new Date()): number {
  const b = new Date(birth);
  let a = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) a--;
  return a;
}

export const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}. ${String(d.getMonth() + 1).padStart(2, "0")}. ${String(d.getDate()).padStart(2, "0")}.`;
};
export const fmtDateTime = (iso: string) => {
  const d = new Date(iso);
  return `${fmtDate(iso)} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

export const emptyDosing = (unit = "tabletta"): Dosing => ({ morning: 1, noon: 0, evening: 0, night: 0, unit });

export function dosingParts(d: Dosing): { label: string; n: number }[] {
  return [
    { label: "reggel", n: d.morning },
    { label: "délben", n: d.noon },
    { label: "este", n: d.evening },
    { label: "lefekvéskor", n: d.night },
  ].filter((x) => x.n > 0);
}

export function dosingText(d: Dosing): string {
  if (d.asNeeded) return `Szükség esetén${d.note ? `, ${d.note}` : ""}`;
  const parts = dosingParts(d);
  const total = d.morning + d.noon + d.evening + d.night;
  const base = parts.map((p) => `${p.label} ${p.n} ${d.unit}`).join(", ");
  return `${base} (naponta ${total}-szor)${d.note ? ` – ${d.note}` : ""}`;
}

export function unitFor(form: string): string {
  const f = form.toLowerCase();
  if (f.includes("kapszula")) return "kapszula";
  if (f.includes("tabletta") || f.includes("drazsé")) return "tabletta";
  if (f.includes("végbélkúp")) return "kúp";
  if (f.includes("cseppek") || f.includes("szemcsepp")) return "csepp";
  if (f.includes("szirup") || f.includes("oldat") || f.includes("szuszpenzió")) return "adag";
  if (f.includes("injekció")) return "injekció";
  return "adag";
}

let n = 0;
export const newId = (prefix: string) => `${prefix}${Date.now().toString(36)}${(n++).toString(36)}${Math.random().toString(36).slice(2, 5)}`;
export const rxCode = () => `${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
