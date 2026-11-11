#!/usr/bin/env python3
"""OGYÉI törzskönyvi lista (CSV) -> a MediSync demó adatfájljai.

Kimenet (public/data):
  products.json   - készítmények (egy név = egy készítmény)
  packs.json      - csomagolások készítményenként (lazy)
  substances.json - normalizált hatóanyagok (angol INN) + magyar keresőnevek
"""
import csv, io, json, re, sys, os, hashlib, collections

SRC = sys.argv[1]
OUT = sys.argv[2]
os.makedirs(OUT, exist_ok=True)

text = open(SRC, "rb").read().decode("iso-8859-2")
rows = list(csv.reader(io.StringIO(text), delimiter=";", quotechar='"'))
recs = [[c.strip() for c in r] for r in rows[1:] if len(r) >= 6]

# ---------------------------------------------------------------- hatóanyag normalizálás
SALT = set("""hydrochloride hydrochloridum dihydrochloride monohydrate dihydrate trihydrate hemihydrate sesquihydrate
pentahydrate hexahydrate heptahydrate anhydrous sodium disodium potassium dipotassium calcium magnesium maleate
tartrate bitartrate succinate fumarate hemifumarate mesilate besilate besylate mesylate sulfate sulphate phosphate
acetate citrate lactate bromide hydrobromide nitrate tosylate medoxomil axetil pivoxil proxetil diluted micronised
micronized crystalline hydrate base tromethamine trometamol oxalate hydrogen napsylate pamoate embonate stearate
gluconate sodium. dihydrogen hemisulfate hemisulphate monosodium trisodium tetrahydrate""".split())

SPECIAL = {
    "potassium clavulanate": "clavulanic acid",
    "clavulanate potassium": "clavulanic acid",
    "clavulanic acid": "clavulanic acid",
    "acetylsalicylic acid": "acetylsalicylic acid",
}


def norm_one(s):
    s = s.lower().strip()
    s = re.sub(r"\(.*?\)", " ", s)
    s = s.replace(",", " ")
    s = re.sub(r"\s+", " ", s).strip()
    if s in SPECIAL:
        return SPECIAL[s]
    toks = s.split(" ")
    while len(toks) > 1 and toks[-1] in SALT:
        toks.pop()
    r = " ".join(toks)
    return SPECIAL.get(r, r)


def split_inn(raw):
    parts = [p for p in (x.strip() for x in raw.split(";")) if p]
    out = []
    for p in parts:
        n = norm_one(p)
        if n and n not in out:
            out.append(n)
    return out


# ---------------------------------------------------------------- név parse
UNIT = r"(?:mg|g|µg|μg|mcg|ml|M?IU|NE|mmol|MBq|GBq|%|mikrogramm|egység|ezer\s*NE|millió\s*NE|U)"
STR = re.compile(
    r"(\d[\d.,]*\s*" + UNIT + r"(?:\s*/\s*(?:\d[\d.,]*\s*)?" + UNIT + r")*(?:\s*/\s*\d[\d.,]*\s*" + UNIT + r")*)",
    re.I,
)


def parse_name(name):
    n = re.sub(r"\s+", " ", name).strip()
    m = STR.search(n)
    if not m:
        return n, "", ""
    brand = n[: m.start()].strip(" ,-")
    strength = re.sub(r"\s+", " ", m.group(1)).strip().replace(" /", "/").replace("/ ", "/")
    rest = n[m.end():].strip()
    return brand, strength, rest


def form_family(rest):
    r = rest.lower()
    if not r:
        return ""
    if re.search(r"retard|módosított|elnyújtott|hosszan", r):
        base = "retard "
    elif "gyomornedv" in r:
        base = "gyomornedv-ellenálló "
    elif "szájban diszpergálódó" in r or r.startswith("diszpergálódó"):
        base = "szájban oldódó "
    elif "rágó" in r:
        base = "rágó "
    elif "szopogató" in r:
        base = "szopogató "
    elif "nyelvalatti" in r:
        base = "nyelvalatti "
    elif "pezsgő" in r:
        base = "pezsgő "
    else:
        base = ""
    if "kapszula" in r:
        return base + "kapszula"
    if "tabletta" in r:
        return base + "tabletta"
    return re.sub(r"\s+", " ", r)[:48]


# ---------------------------------------------------------------- csoportosítás
prods = collections.OrderedDict()
for r in recs:
    tk, name, pack, pack_detail, inn, atc, holder, kiad = r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7]
    shortage = (r[13].strip().lower() == "igen") if len(r) > 13 else False
    final_sample = (r[11].strip().lower() == "igen") if len(r) > 11 else False
    key = re.sub(r"\s+", " ", name).strip()
    p = prods.get(key)
    if p is None:
        brand, strength, rest = parse_name(key)
        subs = split_inn(inn)
        atcs = [a.strip() for a in re.split(r"\s*/\s*|,", atc) if a.strip()]
        p = dict(
            name=key, brand=brand, strength=strength, form=rest, family=form_family(rest),
            subs=subs, atc=atcs, holder=holder.lstrip("'").strip(), rel=kiad, packs=[], shortage_packs=0,
        )
        prods[key] = p
    pk = re.sub(r"\s+", " ", pack).strip()
    p["packs"].append([tk, pk, 1 if shortage else 0])
    if shortage:
        p["shortage_packs"] += 1

products, packs, subst_count = [], {}, collections.Counter()
for i, (key, p) in enumerate(prods.items()):
    if not p["subs"] and not p["atc"]:
        continue  # nincs hatóanyag (homeopátiás, gyógynövény, stb.): felírásban nem használjuk
    for s in p["subs"]:
        subst_count[s] += 1
    eq_raw = "|".join(sorted(p["subs"])) + "|" + p["strength"].lower().replace(" ", "") + "|" + p["family"]
    eq = hashlib.md5(eq_raw.encode()).hexdigest()[:8] if p["subs"] and p["strength"] else ""
    pid = "p%d" % i
    shortage_all = p["shortage_packs"] == len(p["packs"])
    products.append({
        "id": pid, "n": p["name"], "b": p["brand"], "s": p["strength"], "f": p["form"], "ff": p["family"],
        "h": p["subs"], "a": p["atc"], "m": p["holder"], "r": p["rel"], "e": eq,
        "x": 1 if shortage_all else (2 if p["shortage_packs"] else 0),
    })
    packs[pid] = [[a[0], a[1], a[2]] for a in p["packs"]]

json.dump(products, open(os.path.join(OUT, "products.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
json.dump(packs, open(os.path.join(OUT, "packs.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
json.dump({s: c for s, c in subst_count.items()}, open(os.path.join(OUT, "substances.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))

print("rows", len(recs), "products(all)", len(prods), "products(kept)", len(products), "substances", len(subst_count))
print("with shortage (all packs):", sum(1 for p in products if p["x"] == 1), "partial:", sum(1 for p in products if p["x"] == 2))
print("with eq key:", sum(1 for p in products if p["e"]))
print("top substances:", subst_count.most_common(25))
