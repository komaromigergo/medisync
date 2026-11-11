import type { Patient } from "./types";

const CARDS_KEY = "medisync-cards-v1";

/** Betűk és számok, nagybetűs, MEDISYNC előtag nélkül. */
export const nuid = (u: string) => u.replace(/[^0-9a-z]/gi, "").toUpperCase().replace(/^MEDISYNC/, "");

export function loadCards(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(CARDS_KEY) || "{}"); } catch { return {}; }
}

export function findPatientByCode(patients: Patient[], code: string): Patient | undefined {
  const key = nuid(code);
  const bound = loadCards()[key];
  return (
    patients.find((x) => x.id === bound) ??
    patients.find((x) => x.cardUid && nuid(x.cardUid) === key) ??
    patients.find((x) => nuid(x.id) === key)
  );
}

/** A recept QR-kódjának tartalma. */
export const rxQrText = (rxId: string) => `MEDISYNCRX${rxId.replace(/\D/g, "")}`;
/** Ha a kód recept-QR, visszaadja a receptazonosító számjegyeit. */
export function parseRxCode(code: string): string | null {
  const c = code.replace(/[^0-9a-z]/gi, "").toUpperCase();
  const m = /^MEDISYNCRX(\d{6,})$/.exec(c);
  return m ? m[1] : null;
}
