import type { Patient } from "./types";

const CARDS_KEY = "medisync-cards-v1";

/** Betűk és számok, nagybetűs, MEDISYNC előtag nélkül. */
export const nuid = (u: string) => u.replace(/[^0-9a-z]/gi, "").toUpperCase().replace(/^MEDISYNC/, "");

export function loadCards(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(CARDS_KEY) || "{}"); } catch { return {}; }
}

/** Számjegyes QR-azonosítók: téves billentyűkiosztásnál is megbízhatóan beolvashatók (a számjegyek a fizikai gombról is kiolvashatók). */
const NUM: Record<string, string> = { "pt-elek": "91000001", "pt-piroska": "91000002" };
export const patientQrText = (p: Patient) => NUM[p.id] ?? `MEDISYNC${nuid(p.cardUid ?? p.id)}`;

function lookup(patients: Patient[], code: string): Patient | undefined {
  const c = code.trim();
  const numId = Object.keys(NUM).find((k) => NUM[k] === c);
  if (numId) return patients.find((x) => x.id === numId);
  const key = nuid(c);
  const bound = loadCards()[key];
  return (
    patients.find((x) => x.id === bound) ??
    patients.find((x) => x.cardUid && nuid(x.cardUid) === key) ??
    patients.find((x) => nuid(x.id) === key)
  );
}

/** `digits`: a fizikai számgombokból összerakott változat (téves kiosztás esetén ez a megbízható). */
export function findPatientByCode(patients: Patient[], code: string, digits?: string): Patient | undefined {
  return lookup(patients, code) ?? (digits ? lookup(patients, digits) : undefined);
}

/** A recept QR-kódjának tartalma. */
export const rxQrText = (rxId: string) => `92${rxId.replace(/\D/g, "")}`;
/** Ha a kód recept-QR, visszaadja a receptazonosító számjegyeit. */
export function parseRxCode(code: string, digits?: string): string | null {
  for (const raw of [code, digits ?? ""]) {
    const c = raw.replace(/[^0-9a-z]/gi, "").toUpperCase();
    const m = /^MEDISYNCRX(\d{6,})$/.exec(c) ?? /^92(\d{12})$/.exec(c);
    if (m) return m[1];
  }
  return null;
}
