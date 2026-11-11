// Közös típusok. A gyógyszeradat az OGYÉI törzskönyvi listából készül (scripts/build_data.py).

export type Severity = 1 | 2 | 3 | 4; // 1 enyhe, 2 mérsékelt, 3 súlyos, 4 ellenjavallt

export interface Product {
  id: string;
  n: string; // teljes név
  b: string; // márkanév
  s: string; // erősség
  f: string; // gyógyszerforma (szöveg)
  ff: string; // gyógyszerforma-család
  h: string[]; // hatóanyagok (normalizált angol INN)
  a: string[]; // ATC-kódok
  m: string; // forgalomba hozatali engedély jogosultja
  r: string; // kiadhatóság (OGYÉI kód)
  e: string; // egyenértékűségi kulcs (hatóanyag + erősség + forma)
  x: 0 | 1 | 2; // 1 = terméshiánnyal érintett
}

export type PackInfo = [string, string, number]; // [TK-szám, kiszerelés, hiány]

/** Amit a szabálymotor a gyógyszerről tud. */
export interface DrugLike {
  name: string;
  h: string[];
  f?: string;
  s?: string;
  ff?: string;
}

export interface Dosing {
  morning: number;
  noon: number;
  evening: number;
  night: number;
  unit: string; // tabletta, kapszula, adag, ml, ...
  asNeeded?: boolean;
  note?: string;
  days?: number; // kezelés időtartama
}

export interface AllergyEntry {
  key: string; // ALLERGENS kulcs
  reaction?: string;
  since?: string;
}

export interface Med {
  id: string;
  productId: string;
  name: string;
  h: string[];
  s: string;
  f: string;
  ff: string;
  dosing: Dosing;
  indication: string;
  prescriber: string;
  since: string; // ISO dátum
  active: boolean;
}

export interface Patient {
  id: string;
  name: string;
  taj: string; // szóközök nélkül, 9 számjegy
  birthDate: string; // ISO
  birthPlace: string;
  mother: string;
  sex: "férfi" | "nő";
  bloodType: string;
  address: string;
  allergies: AllergyEntry[];
  conditions: string[];
  meds: Med[];
  cardUid?: string; // NFC / RFID kártya azonosító (demó)
}

export interface RxItem {
  id: string;
  productId: string;
  name: string;
  h: string[];
  s: string;
  f: string;
  ff: string;
  packLabel?: string;
  dosing: Dosing;
  indication: string;
  quantity: number; // dobozok száma
  overrides?: { alertId: string; severity: Severity; reason: string }[];
}

export interface Dispense {
  productId: string;
  name: string;
  s: string;
  substituted: boolean;
  reason?: string;
  by: string;
  at: string; // ISO
}

export interface Prescription {
  id: string; // receptazonosító
  patientId: string;
  createdAt: string;
  doctor: string;
  items: RxItem[];
  status: "kiadva" | "kiváltva";
  dispenses: Record<string, Dispense>; // itemId -> kiadás
}

export interface AuditEntry {
  id: string;
  ts: string;
  patientId: string;
  actorRole: "orvos" | "gyógyszerész" | "beteg" | "rendszer";
  actorName: string;
  action: string;
  detail?: string;
  emergency?: boolean;
}

export interface Notice {
  id: string;
  ts: string;
  patientId: string;
  title: string;
  body: string;
  read: boolean;
}

export interface Alert {
  id: string;
  type: "interakció" | "allergia" | "duplikáció";
  severity: Severity;
  title: string;
  with: string; // másik gyógyszer vagy allergia megnevezése
  effect: string;
  advice: string;
  altKey?: string;
}

export interface AltSuggestion {
  substance: string;
  hu: string;
  products: Product[];
  residual: Alert[]; // az alternatívánál megmaradó (legfeljebb mérsékelt) figyelmeztetések
  note?: string;
}

export interface AnalysisResult {
  alerts: Alert[];
  max: Severity | 0;
  alternatives: AltSuggestion[];
}
