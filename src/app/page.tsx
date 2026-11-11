import Link from "next/link";

const CARDS = [
  { href: "/orvos", t: "Orvosi nézet", d: "Beteg azonosítása (TAJ, kártya, DÁP, ujjlenyomat), profil, gyógyszerfelírás ütközés-ellenőrzéssel.", c: "bg-navy text-white" },
  { href: "/beteg", t: "Betegnézet", d: "Mit írtak fel, mire való, mikor és hányszor kell szedni; értesítések és hozzáférési napló.", c: "bg-white" },
  { href: "/patika", t: "Patikanézet", d: "Recept kiváltása, terméshiány esetén patikai csere azonos hatóanyagú készítményre.", c: "bg-white" },
];

export default function Home() {
  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-12">
      <div className="h-caps">OTIO projekt · interaktív demó</div>
      <h1 className="text-4xl sm:text-5xl font-extrabold mt-2 leading-tight">Egy beteg, egy profil,<br />biztonságos gyógyszerfelírás.</h1>
      <p className="text-lg text-muted mt-4 max-w-2xl">A MediSync gyors azonosítást és automatikus gyógyszer-ellenőrzést ad az orvosnak, átlátható információt a betegnek, és patikai cserét terméshiány esetén. Az alábbi demó az OGYÉI törzskönyvi lista (10 ezernél több készítmény) alapján működik.</p>
      <div className="grid md:grid-cols-3 gap-5 mt-8">
        {CARDS.map((c) => (
          <Link key={c.href} href={c.href} className={`card p-6 hover:-translate-y-0.5 transition-transform block ${c.c}`}>
            <div className="text-xl font-extrabold">{c.t}</div>
            <div className={`mt-2 text-[0.95rem] ${c.c.includes("navy") ? "text-white/85" : "text-muted"}`}>{c.d}</div>
          </Link>
        ))}
      </div>
      <div className="mt-6"><Link href="/demo" className="btn btn-teal">Bemutató forgatókönyv</Link></div>
    </div>
  );
}
