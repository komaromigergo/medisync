// Szintetikus demóadatok. A betegek és az orvos kitalált személyek, a TAJ-számok nem valósak.
import type { AuditEntry, Med, Notice, Patient, Prescription, Product } from "./types";
import type { Catalog } from "./catalog";
import { emptyDosing } from "./util";

export interface AppState {
  v: 1;
  patients: Patient[];
  prescriptions: Prescription[];
  audit: AuditEntry[];
  notices: Notice[];
  /** Visszaállítás-azonosító: a magasabb epoch felülírja a régit minden eszközön. */
  epoch?: number;
}

export const DOCTOR = { name: "Dr. Minta Anna", role: "háziorvos", place: "Minta Háziorvosi Rendelő, Kaposvár" };
export const PHARMACY = { name: "Minta Patika", pharmacist: "Mintai Gábor gyógyszerész", place: "Kaposvár" };

function med(cat: Catalog, name: string, indication: string, dosing: Partial<Med["dosing"]>, since: string, prescriber: string): Med | null {
  const p: Product | undefined = cat.products.find((x) => x.n === name);
  if (!p) return null;
  return {
    id: `m-${p.id}`, productId: p.id, name: p.n, h: p.h, s: p.s, f: p.f, ff: p.ff,
    dosing: { ...emptyDosing(p.ff.includes("kapszula") ? "kapszula" : "tabletta"), morning: 0, ...dosing },
    indication, prescriber, since, active: true,
  };
}

export function buildSeed(cat: Catalog): AppState {
  const dr = DOCTOR.name;
  const elekMeds = [
    med(cat, "MARFARIN 3 mg tabletta", "Pitvarfibrilláció: szélütés (stroke) megelőzése, vérrög-képződés gátlása", { evening: 1, note: "INR-kontroll havonta" }, "2023-05-10", dr),
    med(cat, "ZOCOR 20 mg filmtabletta", "Magas koleszterinszint csökkentése", { night: 1 }, "2021-02-03", dr),
    med(cat, "HARTIL 5 mg tabletta", "Magas vérnyomás", { morning: 1 }, "2019-11-20", dr),
    med(cat, "AMLODIPIN SANDOZ 5 mg tabletta", "Magas vérnyomás", { morning: 1 }, "2020-06-15", dr),
  ].filter(Boolean) as Med[];

  const piroskaMeds = [
    med(cat, "L-THYROXIN HENNING 50 mikrogramm tabletta", "Pajzsmirigy-alulműködés pótlása", { morning: 1, note: "éhgyomorra, étkezés előtt fél órával" }, "2018-04-02", dr),
    med(cat, "SERTRALIN SANDOZ 50 mg filmtabletta", "Szorongás, depresszió", { morning: 1 }, "2024-01-12", dr),
  ].filter(Boolean) as Med[];

  const patients: Patient[] = [
    {
      id: "pt-elek", name: "Teszt Elek", taj: "123456788", birthDate: "1957-03-14", birthPlace: "Kaposvár", mother: "Minta Mária",
      sex: "férfi", bloodType: "A Rh+", address: "7400 Kaposvár, Teszt utca 1.",
      allergies: [{ key: "penicillin", reaction: "kiütés, 2008", since: "2008" }],
      conditions: ["Pitvarfibrilláció", "Magas vérnyomás", "Magas koleszterinszint"], meds: elekMeds, cardUid: "DEMO-ELEK",
    },
    {
      id: "pt-piroska", name: "Példa Piroska", taj: "987654322", birthDate: "1984-09-02", birthPlace: "Pécs", mother: "Mintai Katalin",
      sex: "nő", bloodType: "0 Rh−", address: "7621 Pécs, Példa tér 5.",
      allergies: [{ key: "nsaid", reaction: "asztmás roham, 2016", since: "2016" }],
      conditions: ["Hypothyreosis", "Szorongásos zavar"], meds: piroskaMeds, cardUid: "DEMO-PIROSKA",
    },
  ];

  const audit: AuditEntry[] = [
    { id: "au1", ts: "2026-10-02T09:14:00", patientId: "pt-elek", actorRole: "orvos", actorName: "Dr. Minta Anna", action: "Betegprofil megtekintése", detail: "Azonosítás: TAJ-szám" },
    { id: "au2", ts: "2026-10-05T16:40:00", patientId: "pt-elek", actorRole: "gyógyszerész", actorName: "Minta Patika", action: "Recept kiváltása", detail: "Marfarin 3 mg" },
    { id: "au3", ts: "2026-09-12T02:31:00", patientId: "pt-elek", actorRole: "orvos", actorName: "Dr. Példa Béla (sürgősségi)", action: "Vészhelyzeti hozzáférés", detail: "Indoklás: eszméletlen beteg, ismeretlen gyógyszerlista", emergency: true },
  ];

  // kiváltásra váró recept: a HARTIL 5 mg terméshiányos, a patikai csere bemutatására
  const hm = elekMeds.find((m) => m.name.startsWith("HARTIL"));
  const prescriptions: Prescription[] = [];
  const notices: Notice[] = [];
  if (hm) {
    const created = "2026-11-10T10:05:00";
    prescriptions.push({
      id: "5821-4417-9032", patientId: "pt-elek", createdAt: created, doctor: dr, status: "kiadva", dispenses: {},
      items: [{
        id: "ri-seed-1", productId: hm.productId, name: hm.name, h: hm.h, s: hm.s, f: hm.f, ff: hm.ff,
        dosing: hm.dosing, indication: hm.indication, quantity: 3,
      }],
    });
    notices.push({ id: "n-seed-1", ts: created, patientId: "pt-elek", read: false, title: "Új recept az EESZT-n", body: `${dr} új receptet állított ki: ${hm.name}. Receptazonosító: 5821-4417-9032.` });
  }

  return { v: 1, patients, prescriptions, audit, notices };
}
