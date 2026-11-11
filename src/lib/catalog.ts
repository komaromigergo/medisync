import MiniSearch from "minisearch";
import type { PackInfo, Product } from "./types";
import { huName } from "./knowledge";

export interface Catalog {
  products: Product[];
  byId: Map<string, Product>;
  bySub: Map<string, Product[]>;
  byEq: Map<string, Product[]>;
  search(q: string, limit?: number): Product[];
  equivalents(p: Product): Product[];
}

const fold = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

export function buildCatalog(products: Product[]): Catalog {
  const byId = new Map<string, Product>();
  const bySub = new Map<string, Product[]>();
  const byEq = new Map<string, Product[]>();
  for (const p of products) {
    byId.set(p.id, p);
    for (const s of p.h) {
      const arr = bySub.get(s);
      if (arr) arr.push(p);
      else bySub.set(s, [p]);
    }
    if (p.e) {
      const arr = byEq.get(p.e);
      if (arr) arr.push(p);
      else byEq.set(p.e, [p]);
    }
  }

  const mini = new MiniSearch<{ id: string; n: string; hu: string; h: string; a: string }>({
    fields: ["n", "hu", "h", "a"],
    storeFields: [],
    idField: "id",
    processTerm: (t) => fold(t),
    searchOptions: { boost: { n: 3, hu: 2, h: 1.5, a: 0.5 }, prefix: true, fuzzy: (term) => (term.length > 5 ? 0.15 : false), combineWith: "AND" },
    tokenize: (s) => s.split(/[\s,;/()+\-.]+/).filter(Boolean),
  });
  mini.addAll(
    products.map((p) => ({
      id: p.id,
      n: p.n,
      hu: p.h.map(huName).join(" "),
      h: p.h.join(" "),
      a: p.a.join(" "),
    })),
  );

  return {
    products,
    byId,
    bySub,
    byEq,
    search(q: string, limit = 25) {
      const query = q.trim();
      if (query.length < 2) return [];
      const res = mini.search(query);
      // a pontos névkezdetek előre
      const f = fold(query);
      const scored = res.slice(0, 200).map((r) => {
        const p = byId.get(r.id)!;
        const starts = fold(p.n).startsWith(f) ? 1000 : 0;
        return { p, s: r.score + starts + (p.h.length === 1 ? 2 : 0) + (p.x === 1 ? -3 : 0) + (/gyermek|csecsem|junior|baby/i.test(p.n) ? -1.5 : 0) };
      });
      scored.sort((a, b) => b.s - a.s);
      return scored.slice(0, limit).map((x) => x.p);
    },
    equivalents(p: Product) {
      if (!p.e) return [];
      return (byEq.get(p.e) ?? []).filter((q) => q.id !== p.id);
    },
  };
}

// ---------------------------------------------------------------- betöltés (böngésző)
let catalogPromise: Promise<Catalog> | null = null;
export function loadCatalog(): Promise<Catalog> {
  if (!catalogPromise) {
    catalogPromise = fetch("/data/products.json")
      .then((r) => r.json())
      .then((arr: Product[]) => buildCatalog(arr));
  }
  return catalogPromise;
}

let packsPromise: Promise<Record<string, PackInfo[]>> | null = null;
export function loadPacks(): Promise<Record<string, PackInfo[]>> {
  if (!packsPromise) packsPromise = fetch("/data/packs.json").then((r) => r.json());
  return packsPromise;
}
