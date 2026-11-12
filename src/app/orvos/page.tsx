"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { digitOfKey, findPatientByCode } from "@/lib/cards";
import { EidReader } from "@/components/EidReader";
import { FingerprintReader } from "@/components/FingerprintReader";
import { QrScanner } from "@/components/QrScanner";
import { useStore } from "@/lib/store";
import { DOCTOR } from "@/lib/demo";
import { Gate } from "@/components/ui";
import { fmtTaj, onlyDigits, tajValid } from "@/lib/util";
import type { Patient } from "@/lib/types";

type Mode = "taj" | "nev" | "kartya" | "eid" | "dap" | "ujj";
const ico = (d: React.ReactNode) => (
  <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
);
const TABS: { k: Mode; label: string; sub: string; device: boolean; icon: React.ReactNode }[] = [
  { k: "taj", label: "TAJ-szám", sub: "kézi megadás", device: false,
    icon: ico(<><rect x="3" y="5" width="18" height="14" rx="2.5" /><circle cx="8.5" cy="11" r="2" /><path d="M5.8 16c.6-1.6 1.7-2.3 2.7-2.3s2.1.7 2.7 2.3M14 10h4M14 13.5h3" /></>) },
  { k: "nev", label: "Név + születési dátum", sub: "kézi megadás", device: false,
    icon: ico(<><circle cx="10" cy="8" r="3.5" /><path d="M3.5 20c.8-3.6 3.4-5.5 6.5-5.5 1.3 0 2.5.3 3.5 1" /><circle cx="17" cy="17" r="3" /><path d="m19.2 19.2 2 2" /></>) },
  { k: "kartya", label: "Kártya", sub: "RFID / NFC / vonalkód", device: true,
    icon: ico(<><rect x="2.5" y="6" width="14" height="10" rx="2" /><path d="M8 20h8M19 8.5a5 5 0 0 1 0 7M21.5 6a8.5 8.5 0 0 1 0 12" /></>) },
  { k: "eid", label: "e-személyi", sub: "chipkártya-olvasó", device: true,
    icon: ico(<><rect x="3" y="5" width="18" height="14" rx="2.5" /><rect x="6" y="9" width="5" height="4" rx="1" /><path d="M6 15.5h12M14 9.5h4M14 12h3" /></>) },
  { k: "dap", label: "DÁP / QR-kód", sub: "QR-olvasó", device: true,
    icon: ico(<><rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1" /><rect x="14" y="3.5" width="6.5" height="6.5" rx="1" /><rect x="3.5" y="14" width="6.5" height="6.5" rx="1" /><path d="M14 14h3v3M20.5 14v.01M14 20.5h.01M17 20.5h3.5v-3.5" /></>) },
  { k: "ujj", label: "Ujjlenyomat", sub: "USB-olvasó · vészhelyzet", device: true,
    icon: ico(<><path d="M12 3.5a8 8 0 0 0-8 8v1.5M12 3.5a8 8 0 0 1 8 8v2.5" /><path d="M8 20c.8-2.2 1-4 1-6.5a3 3 0 0 1 6 0c0 3.5.3 5.5 1.5 7.5M12 20.5c-.6-2-.8-4-.8-6.5M5.5 15.5c0 2-.3 3.4-.9 4.6M18.5 18c.4-1.2.6-2.4.6-3.5" /></>) },
];
// az ujjlenyomat-olvasó tárolóhelyei (1. hely = Teszt Elek, 2. hely = Példa Piroska)
const FP_SLOTS: Record<number, string> = { 1: "pt-elek", 2: "pt-piroska" };
const CARDS_KEY = "medisync-cards-v1";
const nuid = (u: string) => u.replace(/[^0-9a-z]/gi, "").toUpperCase().replace(/^MEDISYNC/, "");
function loadCards(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(CARDS_KEY) || "{}"); } catch { return {}; }
}
function saveCard(uid: string, patientId: string) {
  try { localStorage.setItem(CARDS_KEY, JSON.stringify({ ...loadCards(), [nuid(uid)]: patientId })); } catch { /* semmi */ }
}
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();

function Inner() {
  const { state, log, assignCard } = useStore();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("kartya");
  const [taj, setTaj] = useState("");
  const [name, setName] = useState("");
  const [bd, setBd] = useState("");
  const [err, setErr] = useState("");
  const [lastUid, setLastUid] = useState("");
  const [reason, setReason] = useState("");
  const [dapStep, setDapStep] = useState<0 | 1 | 2>(0);
  const [dapPick, setDapPick] = useState("");
  const [nfc, setNfc] = useState<"" | "figyel" | "nincs" | "hiba">("");
  const [nfcMsg, setNfcMsg] = useState("");
  const [fpHit, setFpHit] = useState<Patient | null>(null);
  const patients = state!.patients;

  async function startNfc() {
    // Web NFC: csak Android Chrome, HTTPS alatt, felhasználói érintés után
    const NDEF = (window as unknown as { NDEFReader?: new () => any }).NDEFReader;
    if (!NDEF) { setNfc("nincs"); return; }
    try {
      const r = new NDEF();
      await r.scan();
      setNfc("figyel"); setNfcMsg("");
      r.onreadingerror = () => setNfcMsg("A kártyát nem sikerült beolvasni, próbálja újra.");
      r.onreading = (ev: any) => {
        let uid = "";
        for (const rec of ev.message?.records ?? []) {
          if (rec.recordType === "text" || rec.recordType === "url") {
            const t = new TextDecoder(rec.encoding || "utf-8").decode(rec.data).trim();
            if (/^MEDISYNC:/i.test(t)) { uid = t.replace(/^MEDISYNC:/i, ""); break; }
          }
        }
        byCard(uid || ev.serialNumber || "");
      };
    } catch (e) { setNfc("hiba"); setNfcMsg(String((e as Error)?.message ?? e)); }
  }

  function open(p: Patient, method: string, emergency = false, detail?: string) {
    log({
      patientId: p.id, actorRole: "orvos", actorName: DOCTOR.name, action: emergency ? "Vészhelyzeti hozzáférés" : "Beteg azonosítása",
      detail: `${method}${detail ? " – " + detail : ""}`, emergency,
    });
    router.push(`/orvos/${p.id}`);
  }

  function byCard(uid: string, digits?: string) {
    setLastUid(uid);
    const p = findPatientByCode(patients, uid, digits);
    if (p) open(p, `kártya (${uid})`);
    else setErr(`Ismeretlen kártya: ${uid}. Az alábbi listából hozzárendelheti egy beteghez.`);
  }

  // billentyűzet-emulációs (keyboard wedge) olvasó: gyors karaktersorozat + Enter
  const buf = useRef({ s: "", d: "", t: 0 });
  useEffect(() => {
    if (mode !== "kartya" && mode !== "dap") return;
    const h = (e: KeyboardEvent) => {
      const now = performance.now();
      if (now - buf.current.t > 120) { buf.current.s = ""; buf.current.d = ""; }
      buf.current.t = now;
      if (e.key === "Enter") {
        const uid = buf.current.s.trim();
        const digits = buf.current.d;
        buf.current.s = ""; buf.current.d = "";
        if (uid.length >= 4) { e.preventDefault(); byCard(uid, digits); }
      } else if (e.key.length === 1) {
        buf.current.s += e.key;
        const dg = digitOfKey(e);
        if (dg) buf.current.d += dg;
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, patients]);

  function byTaj(e: React.FormEvent) {
    e.preventDefault();
    const t = onlyDigits(taj);
    if (!tajValid(t)) return setErr("Érvénytelen TAJ-szám (9 számjegy, ellenőrző számjeggyel).");
    const p = patients.find((x) => x.taj === t);
    if (!p) return setErr("Nincs ilyen TAJ-számú beteg a demóadatbázisban.");
    open(p, "TAJ-szám");
  }
  function byName(e: React.FormEvent) {
    e.preventDefault();
    const p = patients.find((x) => norm(x.name) === norm(name) && x.birthDate === bd);
    if (!p) return setErr("Nincs egyezés. Próbálja: Teszt Elek, 1957-03-14.");
    open(p, "név + születési dátum");
  }

  return (
    <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-8">
      <div className="h-caps">Orvosi nézet · {DOCTOR.name}</div>
      <h1 className="text-3xl font-extrabold mt-1 mb-1">Beteg azonosítása</h1>
      <p className="text-muted mb-5">Válasszon azonosítási módot. A beteg adatai az azonosítás után jelennek meg, és a hozzáférés naplózódik.</p>

      <div role="tablist" className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {TABS.map((t) => {
          const on = mode === t.k;
          return (
            <button key={t.k} role="tab" aria-selected={on} onClick={() => { setMode(t.k); setErr(""); }}
              className={`relative flex items-center gap-3.5 rounded-2xl border-2 p-3.5 text-left transition-all ${on ? "bg-navy text-white border-navy shadow-lg -translate-y-0.5" : "bg-white border-line hover:border-teal-2 hover:shadow-md"}`}>
              <span className={`shrink-0 grid place-items-center h-11 w-11 sm:h-12 sm:w-12 rounded-xl ${on ? "bg-teal text-white" : t.device ? "bg-pale text-teal" : "bg-[#f1f4f7] text-muted"}`}>{t.icon}</span>
              <span className="min-w-0">
                <span className="block font-extrabold leading-tight">{t.label}</span>
                <span className={`block text-xs mt-0.5 ${on ? "text-white/75" : "text-muted"}`}>{t.sub}</span>
              </span>
              {t.device && <span className={`hidden sm:block absolute top-2 right-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${on ? "bg-white/15 text-white" : "bg-pale text-teal"}`}>eszköz</span>}
            </button>
          );
        })}
      </div>

      <div className="card p-6">
        {mode === "taj" && (
          <form onSubmit={byTaj} className="space-y-4 max-w-md">
            <div><label className="label" htmlFor="taj">TAJ-szám</label>
              <input id="taj" className="input mt-1 text-2xl tracking-widest tabular-nums" inputMode="numeric" value={taj} onChange={(e) => setTaj(fmtTaj(e.target.value.slice(0, 11)))} placeholder="000 000 000" autoFocus /></div>
            <button className="btn btn-primary">Keresés</button>
            <p className="text-sm text-muted">Demó: 123 456 788 (Teszt Elek) · 987 654 322 (Példa Piroska)</p>
          </form>
        )}
        {mode === "nev" && (
          <form onSubmit={byName} className="space-y-4 max-w-md">
            <div><label className="label" htmlFor="nm">Név</label><input id="nm" className="input mt-1" value={name} onChange={(e) => setName(e.target.value)} placeholder="Teszt Elek" autoFocus /></div>
            <div><label className="label" htmlFor="bd">Születési dátum</label><input id="bd" type="date" className="input mt-1" value={bd} onChange={(e) => setBd(e.target.value)} /></div>
            <button className="btn btn-primary">Keresés</button>
            <p className="text-sm text-muted">Demó: Teszt Elek, 1957. 03. 14. A beteg anyja neve, születési helye nem szükséges.</p>
          </form>
        )}
        {mode === "kartya" && (
          <div className="space-y-5">
            <div className="flex items-center gap-5">
              <div className="h-20 w-20 rounded-2xl bg-pale border-2 border-line grid place-items-center">
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#2f7893" strokeWidth="1.8" strokeLinecap="round"><path d="M5 12a7 7 0 0 1 7-7M8 12a4 4 0 0 1 4-4M11 12a1 1 0 0 1 1-1" /><rect x="3" y="3" width="18" height="18" rx="4" /></svg>
              </div>
              <div>
                <div className="text-xl font-extrabold">Érintse a kártyát az olvasóhoz</div>
                <div className="text-muted">Az USB RFID/NFC olvasó billentyűzetként küldi be a kártya azonosítóját, az Android tablet pedig saját NFC-olvasóval is képes olvasni. Ismeretlen kártyát egyszer hozzá lehet rendelni egy beteghez.</div>
                {lastUid && <div className="text-sm mt-1">Utolsó olvasott azonosító: <b className="tabular-nums">{lastUid}</b></div>}
              </div>
            </div>
            <div className="rounded-2xl border-2 border-line bg-pale p-4">
              <div className="font-bold mb-1">Android tablet saját NFC-olvasója</div>
              <p className="text-sm text-muted mb-3">Chrome böngészőben működik (Android). Kattintson a gombra, majd érintse a kártyát a tablet hátuljához.</p>
              <button className="btn btn-teal" onClick={startNfc}>{nfc === "figyel" ? "Olvasás aktív, érintse a kártyát…" : "NFC-olvasás indítása"}</button>
              {nfc === "nincs" && <p className="text-sm mt-2 text-[#8a5a12]">Ez az eszköz vagy böngésző nem támogatja a Web NFC-t (iPhone/iPad, MacBook vagy nem Chrome). Használjon USB-olvasót vagy a szimulációt.</p>}
              {nfc === "hiba" && <p className="text-sm mt-2 text-[#7f1d1d]">NFC-hiba: {nfcMsg}. Ellenőrizze, hogy az NFC be van kapcsolva, és engedélyezte a böngészőnek.</p>}
              {nfc === "figyel" && nfcMsg && <p className="text-sm mt-2 text-[#8a5a12]">{nfcMsg}</p>}
            </div>
            <div>
              <div className="label mb-2">Olvasó nélkül: kártya érintésének szimulálása</div>
              <div className="flex flex-wrap gap-3">
                {patients.filter((p) => p.cardUid).map((p) => (
                  <button key={p.id} className="btn btn-ghost" onClick={() => byCard(p.cardUid!)}>Kártya: {p.name}</button>
                ))}
                <button className="btn btn-ghost" onClick={() => byCard("ISMERETLEN-0001")}>Ismeretlen kártya</button>
              </div>
            </div>
          </div>
        )}
        {mode === "eid" && (
          <EidReader
            onCard={(atr) => byCard("ATR" + atr)}
            onSim={() => byCard(patients.find((x) => x.id === "pt-elek")?.cardUid ?? "DEMO-ELEK")}
          />
        )}
        {mode === "dap" && (
          <div className="space-y-4 max-w-lg">
            <p className="text-muted">A DÁP (Digitális Állampolgárság Program) valódi integrációja állami szerződést igényel. A demóban a beteg digitális azonosítóját egy QR-kód helyettesíti.</p>
            <div className="rounded-2xl border-2 border-line bg-pale p-4">
              <div className="font-bold mb-1">1. QR-kód beolvasása a beteg telefonjáról</div>
              <p className="text-sm text-muted mb-3">A beteg a saját nézetében (Beteg → belépés) megmutatja a „Digitális azonosítóm" QR-kódot. Az orvos <b>USB/Bluetooth vonalkód-olvasóval</b> beolvassa (a fül nyitva tartása elég, nincs teendő), vagy a kamerával:</p>
              <QrScanner onResult={byCard} />
            </div>
            <div className="font-bold">2. Vagy: jóváhagyás szimulálása</div>
            {dapStep === 0 && (
              <>
                <label className="label" htmlFor="dp">Beteg</label>
                <select id="dp" className="input" value={dapPick} onChange={(e) => setDapPick(e.target.value)}>
                  <option value="">Válasszon…</option>
                  {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <button className="btn btn-primary" disabled={!dapPick} onClick={() => { setDapStep(1); setTimeout(() => setDapStep(2), 2200); }}>Jóváhagyási kérés küldése</button>
              </>
            )}
            {dapStep === 1 && <div className="rounded-2xl border-2 border-line bg-pale p-5 flex items-center gap-4"><div className="h-8 w-8 rounded-full border-4 border-line border-t-teal animate-spin" />Várakozás a beteg DÁP-jóváhagyására a telefonján…</div>}
            {dapStep === 2 && (
              <div className="rounded-2xl border-2 border-[#b7dccb] bg-[#eefaf3] p-5">
                <div className="font-extrabold text-[#1f6b43] mb-3">✓ A beteg jóváhagyta a hozzáférést (szimuláció)</div>
                <button className="btn btn-teal" onClick={() => { const p = patients.find((x) => x.id === dapPick)!; setDapStep(0); open(p, "DÁP-jóváhagyás (szimuláció)"); }}>Beteg megnyitása</button>
              </div>
            )}
          </div>
        )}
        {mode === "ujj" && (
          <div className="space-y-4 max-w-lg">
            <div className="rounded-2xl border-2 border-[#ecd29a] bg-[#fdf6e7] p-4 text-sm">
              <b>Vészhelyzeti (break-glass) hozzáférés.</b> Ha a beteg nem tud azonosítani (eszméletlen), az ujjlenyomatos azonosítás és kötelező indoklás után az orvos hozzáfér az adatokhoz. A hozzáférés megkülönböztetetten naplózódik, a beteg utólag értesül. Az ujjlenyomatot az USB-olvasó hasonlítja össze a saját memóriájában; az oldalra csak a találat azonosítója jut el. Olvasó nélkül szimulálható.
            </div>
            <label className="label" htmlFor="er">Indoklás (kötelező)</label>
            <input id="er" className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="pl. eszméletlen beteg, mentőellátás" />
            <FingerprintReader
              slots={Object.entries(FP_SLOTS).map(([id, pid]) => ({ id: Number(id), label: patients.find((x) => x.id === pid)?.name ?? pid }))}
              onMatch={(id) => { const p = patients.find((x) => x.id === FP_SLOTS[id]); setFpHit(p ?? null); if (!p) setErr("Ismeretlen ujjlenyomat-hely: " + id); else setErr(""); }}
            />
            {fpHit && (
              <div className="rounded-2xl border-2 border-[#b7dccb] bg-[#eefaf3] p-4">
                <div className="font-extrabold text-[#1f6b43] mb-2">✓ Ujjlenyomat egyezik: {fpHit.name}</div>
                <button className="btn btn-teal" disabled={reason.trim().length < 6} onClick={() => { const p = fpHit; setFpHit(null); open(p, "ujjlenyomat (olvasó)", true, reason.trim()); }}>
                  {reason.trim().length < 6 ? "Írja be az indoklást a megnyitáshoz" : "Beteg megnyitása (vészhelyzeti hozzáférés)"}
                </button>
              </div>
            )}
            <div>
              <div className="label mb-2">Olvasó nélkül: szimuláció</div>
              <div className="flex flex-wrap gap-3">
                {patients.map((p) => (
                  <button key={p.id} className="btn btn-ghost" disabled={reason.trim().length < 6} onClick={() => open(p, "ujjlenyomat (szimuláció)", true, reason.trim())}>Ujjlenyomat: {p.name}</button>
                ))}
              </div>
            </div>
          </div>
        )}
        {lastUid && err.startsWith("Ismeretlen") && (
                  <div className="mt-4 rounded-2xl border-2 border-line bg-pale p-4">
                    <div className="font-bold mb-2">Kártya hozzárendelése ({lastUid})</div>
                    <div className="flex flex-wrap gap-3">
                      {patients.map((p) => <button key={p.id} className="btn btn-teal" onClick={() => { assignCard(p.id, lastUid); saveCard(lastUid, p.id); setErr(""); }}>{p.name}</button>)}
                    </div>
                  </div>
                )}
        {err && <div role="alert" className="mt-4 rounded-xl bg-[#fbe9e9] border border-[#e6a1a1] text-[#7f1d1d] px-4 py-3 font-semibold">{err}</div>}
      </div>
    </div>
  );
}
export default function Page() { return <Gate><Inner /></Gate>; }
