"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { findPatientByCode } from "@/lib/cards";
import { QrScanner } from "@/components/QrScanner";
import { useStore } from "@/lib/store";
import { DOCTOR } from "@/lib/demo";
import { Gate } from "@/components/ui";
import { fmtTaj, onlyDigits, tajValid } from "@/lib/util";
import type { Patient } from "@/lib/types";

type Mode = "taj" | "nev" | "kartya" | "dap" | "ujj";
const TABS: { k: Mode; label: string; sub?: string }[] = [
  { k: "taj", label: "TAJ-szám" },
  { k: "nev", label: "Név + születési dátum" },
  { k: "kartya", label: "Kártya (RFID / NFC)" },
  { k: "dap", label: "DÁP / QR-kód", sub: "szimuláció" },
  { k: "ujj", label: "Ujjlenyomat", sub: "szimuláció · vészhelyzet" },
];
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
        const m = /^(?:Digit|Numpad)(\d)$/.exec(e.code);
        if (m) buf.current.d += m[1];
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

      <div role="tablist" className="flex flex-wrap gap-2 mb-5">
        {TABS.map((t) => (
          <button key={t.k} role="tab" aria-selected={mode === t.k} onClick={() => { setMode(t.k); setErr(""); }}
            className={`rounded-xl border-2 px-4 py-2.5 text-left transition-colors ${mode === t.k ? "bg-navy text-white border-navy" : "bg-white border-line hover:bg-pale"}`}>
            <div className="font-bold">{t.label}</div>
            {t.sub && <div className={`text-xs ${mode === t.k ? "text-white/70" : "text-muted"}`}>{t.sub}</div>}
          </button>
        ))}
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
            {lastUid && err.startsWith("Ismeretlen") && (
              <div className="rounded-2xl border-2 border-line bg-pale p-4">
                <div className="font-bold mb-2">Kártya hozzárendelése ({lastUid})</div>
                <div className="flex flex-wrap gap-3">
                  {patients.map((p) => <button key={p.id} className="btn btn-teal" onClick={() => { assignCard(p.id, lastUid); saveCard(lastUid, p.id); setErr(""); }}>{p.name}</button>)}
                </div>
              </div>
            )}
          </div>
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
              <b>Vészhelyzeti (break-glass) hozzáférés.</b> Ha a beteg nem tud azonosítani (eszméletlen), az ujjlenyomatos azonosítás és kötelező indoklás után az orvos hozzáfér az adatokhoz. A hozzáférés megkülönböztetetten naplózódik, a beteg utólag értesül. A demóban az ujjlenyomat-olvasást szimuláljuk.
            </div>
            <label className="label" htmlFor="er">Indoklás (kötelező)</label>
            <input id="er" className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="pl. eszméletlen beteg, mentőellátás" />
            <div className="flex flex-wrap gap-3">
              {patients.map((p) => (
                <button key={p.id} className="btn btn-primary" disabled={reason.trim().length < 6} onClick={() => open(p, "ujjlenyomat (szimuláció)", true, reason.trim())}>Ujjlenyomat: {p.name}</button>
              ))}
            </div>
          </div>
        )}
        {err && <div role="alert" className="mt-4 rounded-xl bg-[#fbe9e9] border border-[#e6a1a1] text-[#7f1d1d] px-4 py-3 font-semibold">{err}</div>}
      </div>
    </div>
  );
}
export default function Page() { return <Gate><Inner /></Gate>; }
