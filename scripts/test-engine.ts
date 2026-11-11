import { readFileSync } from "node:fs";
import { buildCatalog } from "../src/lib/catalog";
import { analyze } from "../src/lib/engine";
import { SEVERITY_LABEL } from "../src/lib/knowledge";
import type { Product } from "../src/lib/types";

const products: Product[] = JSON.parse(readFileSync("public/data/products.json", "utf-8"));
const cat = buildCatalog(products);
const byName = (n: string) => { const p = products.find((x) => x.n === n); if (!p) throw new Error("nincs: " + n); return p; };
const ctxOf = (names: string[]) => names.map((n) => { const p = byName(n); return { label: n, drug: { name: n, h: p.h, f: p.f, s: p.s } }; });

const meds = ["MARFARIN 3 mg tabletta", "ZOCOR 20 mg filmtabletta", "HARTIL 5 mg tabletta", "AMLODIPIN SANDOZ 5 mg tabletta"];
const patient = { allergies: [{ key: "penicillin" }] };
const ctx = ctxOf(meds);

function run(label: string, name: string) {
  const p = byName(name);
  const r = analyze({ name, h: p.h, f: p.f, s: p.s }, patient, ctx, cat);
  console.log(`\n=== ${label}: ${name} -> max ${r.max} (${r.max ? SEVERITY_LABEL[r.max] : "nincs"})`);
  for (const a of r.alerts) console.log(`  [${a.severity}] ${a.type}: ${a.title} | ${a.with}`);
  for (const alt of r.alternatives) console.log(`  ALT ${alt.hu}: ${alt.products.map((p) => p.n).join(" ; ")} | maradék: ${alt.residual.map((a) => a.severity + ":" + a.title).join(", ") || "-"}`);
}

run("NSAID warfarin mellett", "NUROFEN 200 mg bevont tabletta");
run("klaritromicin", "FROMILID 500 mg filmtabletta");
run("amoxicillin-klavulánsav", "AKSOLIN 875 mg/125 mg filmtabletta");
run("azitromicin", "AZI SANDOZ 500 mg filmtabletta");
run("doxiciklin", "DOXYPHARM 100 mg filmtabletta");
run("cefuroxim", "ZINNAT 500 mg filmtabletta");
run("atorvasztatin (terápiás duplikáció)", "ATORIS 20 mg filmtabletta");
run("ramipril másik márka (hatóanyag-duplikáció)", "TRITACE 5 mg tabletta");
run("paracetamol", "MEXALEN 500 mg tabletta");
run("topikális diklofenák gél", "DICLOFENAC SANDOZ 50 mg/g gél");
run("szildenafil", "SILDENAFIL SANDOZ 50 mg tabletta");
console.log("\nkeresés 'nurofen':", cat.search("nurofen", 5).map((p) => p.n));
console.log("keresés 'szimvasztatin':", cat.search("szimvasztatin", 5).map((p) => p.n));
console.log("keresés 'acetilszalicil':", cat.search("acetilszalicil", 5).map((p) => p.n));
console.log("keresés 'hartil':", cat.search("hartil", 3).map((p) => p.n));
console.log("egyenértékűek HARTIL:", cat.equivalents(byName("HARTIL 5 mg tabletta")).map((p) => p.n + (p.x ? " (hiány)" : "")));
