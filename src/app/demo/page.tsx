import Link from "next/link";

const S = [
  { n: 1, t: "Ütközés: ibuprofen + warfarin", steps: ["Orvos → kártya (Teszt Elek) → új felírás: „nurofen”", "Súlyos figyelmeztetés (vérzésveszély), alternatíva: paracetamol, metamizol", "„Csere” egy alternatívára, majd hozzáadás és kiállítás"] },
  { n: 2, t: "Ellenjavallt: klaritromicin + szimvasztatin", steps: ["Új felírás: „fromilid”", "Ellenjavallt (szimvasztatin) és súlyos (warfarin) jelzés, alternatíva: azitromicin, doxiciklin, cefuroxim", "Felülbírálás csak indoklással"] },
  { n: 3, t: "Allergia: penicillin", steps: ["Új felírás: „aksolin” vagy „amoxicillin”", "Ellenjavallt allergiajelzés, alternatívák más antibiotikum-csoportból"] },
  { n: 4, t: "Duplikáció", steps: ["Új felírás: „atoris” (a beteg már szed sztatint) vagy „tritace” (ramipril, a HARTIL hatóanyaga)", "Terápiás, illetve hatóanyag-duplikáció jelzése"] },
  { n: 5, t: "Patikai csere", steps: ["Patika → a Teszt Elek-nek felírt HARTIL 5 mg (terméshiányos jelzés)", "„Patikai csere” → azonos hatóanyagú ramipril 5 mg készítmény kiadása", "Beteg → értesítésben látszik a csere magyarázata"] },
  { n: 6, t: "Vészhelyzeti hozzáférés", steps: ["Orvos → Ujjlenyomat fül → indoklás → szimulált azonosítás", "A beteg hozzáférési naplójában megkülönböztetve jelenik meg"] },
];

export default function Page() {
  return (
    <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-10">
      <div className="h-caps">Bemutató</div>
      <h1 className="text-3xl font-extrabold mt-1 mb-6">Forgatókönyv a zsűri számára</h1>
      <div className="space-y-4">
        {S.map((s) => (
          <section key={s.n} className="card p-5">
            <div className="flex items-center gap-3 mb-2"><div className="h-9 w-9 rounded-full bg-navy text-white grid place-items-center font-extrabold">{s.n}</div><h2 className="text-lg font-extrabold">{s.t}</h2></div>
            <ol className="list-decimal pl-6 space-y-1">{s.steps.map((x) => <li key={x}>{x}</li>)}</ol>
          </section>
        ))}
      </div>
      <div className="card p-5 mt-6 bg-pale">
        <h2 className="font-extrabold mb-2">Mi valódi, mi szimuláció?</h2>
        <ul className="list-disc pl-6 space-y-1 text-[0.95rem]">
          <li><b>Valódi:</b> az OGYÉI törzskönyvi lista adatai, a gyógyszerkereső, a szabályalapú ellenőrzés és az alternatívakeresés.</li>
          <li><b>Szimuláció:</b> DÁP, ujjlenyomat, e-személyi chip, EESZT-értesítés. Az USB RFID/NFC olvasó működik, a kártyák azonosítója demóadat.</li>
          <li><b>Figyelem:</b> a kölcsönhatás-szabályok oktatási célú, kézzel összeállított példák, orvosi validációt igényelnek. Szintetikus betegadatok.</li>
        </ul>
      </div>
      <div className="mt-6 flex gap-3"><Link href="/orvos" className="btn btn-primary">Indítás: orvosi nézet</Link></div>
    </div>
  );
}
