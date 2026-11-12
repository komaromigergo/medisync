import type { AppState } from "./demo";

type WithId = { id: string };
function union<T extends WithId>(a: T[], b: T[], merge: (x: T, y: T) => T): T[] {
  const map = new Map<string, T>();
  for (const i of a) map.set(i.id, i);
  for (const j of b) {
    const e = map.get(j.id);
    map.set(j.id, e ? merge(e, j) : j);
  }
  return [...map.values()];
}

/**
 * Két eszköz állapotának összefésülése: új receptek, értesítések és naplóbejegyzések egyesítése,
 * a kiadások (patikai kiváltás) egyesítése. Visszaállításnál (magasabb epoch) az újabb állapot nyer.
 */
export function mergeStates(a: AppState, b: AppState): AppState {
  const ea = a.epoch ?? 0;
  const eb = b.epoch ?? 0;
  if (ea !== eb) return ea > eb ? a : b;
  const prescriptions = union(a.prescriptions, b.prescriptions, (p, q) => {
    const dispenses = { ...q.dispenses, ...p.dispenses };
    const all = p.items.every((i) => dispenses[i.id]);
    return { ...p, dispenses, status: all ? ("kiváltva" as const) : ("kiadva" as const) };
  }).sort((x, y) => y.createdAt.localeCompare(x.createdAt));
  const notices = union(a.notices, b.notices, (p, q) => ({ ...p, read: p.read || q.read })).sort((x, y) => y.ts.localeCompare(x.ts));
  const audit = union(a.audit, b.audit, (p) => p).sort((x, y) => y.ts.localeCompare(x.ts));
  const patients = union(a.patients, b.patients, (p) => p);
  return { ...a, patients, prescriptions, notices, audit };
}
