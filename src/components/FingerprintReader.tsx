"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useCallback, useEffect, useRef, useState } from "react";
import { Pill } from "./ui";

export type FpSlot = { id: number; label: string };
type St = "ki" | "csatlakozva" | "nincs-tamogatas";

/**
 * Ujjlenyomat-olvasó (ESP32 + R307) Web Serial kapcsolaton, lásd tools/fingerprint.
 * A lenyomatok az olvasó saját memóriájában vannak; az oldal csak a találat azonosítóját (pl. 1) kapja.
 */
export function FingerprintReader({ slots, onMatch }: { slots: FpSlot[]; onMatch: (id: number) => void }) {
  const [st, setSt] = useState<St>("ki");
  const [templates, setTemplates] = useState<number | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState<number | null>(null);
  const [unknown, setUnknown] = useState(false);
  const portRef = useRef<any>(null);
  const readerRef = useRef<any>(null);
  const writerRef = useRef<any>(null);
  const cb = useRef(onMatch);
  useEffect(() => { cb.current = onMatch; }, [onMatch]);

  const handleLine = useCallback((raw: string) => {
    const l = raw.trim();
    if (!l) return;
    let m: RegExpMatchArray | null;
    if ((m = l.match(/^READY(?: templates=(\d+))?/))) { setTemplates(m[1] != null ? Number(m[1]) : null); setMsg("Az olvasó kész."); }
    else if (l.startsWith("ERR:SENSOR")) setMsg("Az ESP32 él, de az ujjlenyomat-olvasó nem válaszol. Ellenőrizze a vezetékeket.");
    else if (l === "FP:NOMATCH") { setUnknown(true); setTimeout(() => setUnknown(false), 3000); }
    else if ((m = l.match(/^FP:(\d+):/))) { setUnknown(false); cb.current(Number(m[1])); }
    else if (l === "ENROLL:PUT") setMsg("Tegye az ujját az olvasóra…");
    else if (l === "ENROLL:LIFT") setMsg("Emelje fel az ujját…");
    else if (l === "ENROLL:AGAIN") setMsg("Tegye rá ugyanazt az ujját még egyszer…");
    else if ((m = l.match(/^ENROLL:OK:(\d+)/))) { setBusy(null); setMsg("Ujjlenyomat felvéve (" + m[1] + ". hely)."); setTemplates((t) => (t ?? 0) + 1); }
    else if (l === "ENROLL:FAIL") { setBusy(null); setMsg("Nem sikerült a felvétel, próbálja újra."); }
  }, []);

  const attach = useCallback(async (port: any) => {
    await port.open({ baudRate: 115200 });
    portRef.current = port;
    writerRef.current = port.writable.getWriter();
    const reader = port.readable.getReader();
    readerRef.current = reader;
    setSt("csatlakozva");
    setMsg("Csatlakozva, az olvasó indul…");
    const dec = new TextDecoder();
    let buf = "";
    (async () => {
      try {
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          let i: number;
          while ((i = buf.indexOf("\n")) >= 0) { handleLine(buf.slice(0, i)); buf = buf.slice(i + 1); }
        }
      } catch { /* leválasztották */ }
      try { reader.releaseLock(); } catch { /* semmi */ }
      try { writerRef.current?.releaseLock(); } catch { /* semmi */ }
      try { await port.close(); } catch { /* semmi */ }
      portRef.current = null; readerRef.current = null; writerRef.current = null;
      setSt("ki"); setBusy(null); setMsg("");
    })();
    setTimeout(() => send("PING"), 2500);
  }, [handleLine]); // eslint-disable-line react-hooks/exhaustive-deps

  const send = (s: string) => { try { writerRef.current?.write(new TextEncoder().encode(s + "\n")); } catch { /* semmi */ } };

  useEffect(() => {
    const serial = (navigator as any).serial;
    if (!serial) { setSt("nincs-tamogatas"); return; }
    // korábban engedélyezett port automatikus újracsatlakozása
    serial.getPorts().then((ports: any[]) => { if (ports[0] && !portRef.current) attach(ports[0]).catch(() => {}); }).catch(() => {});
    return () => { try { readerRef.current?.cancel(); } catch { /* semmi */ } };
  }, [attach]);

  async function connect() {
    try {
      const port = await (navigator as any).serial.requestPort();
      await attach(port);
    } catch (e) {
      const t = String((e as Error)?.message ?? e);
      if (!/No port selected|NotFound/i.test(t)) setMsg("Nem sikerült csatlakozni: " + t + " (zárja be az Arduino Serial Monitort, ha nyitva van.)");
    }
  }
  function disconnect() { try { readerRef.current?.cancel(); } catch { /* semmi */ } }
  function enroll(id: number) { setBusy(id); setMsg("Indul a felvétel…"); send("ENROLL " + id); }

  return (
    <div className="rounded-2xl border-2 border-line p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="font-extrabold">Ujjlenyomat-olvasó (USB)</div>
        {st === "csatlakozva" ? <Pill tone="teal">csatlakozva{templates != null ? ` · ${templates} tárolt lenyomat` : ""}</Pill>
          : st === "nincs-tamogatas" ? <Pill tone="warn">ez a böngésző nem támogatja</Pill> : <Pill tone="warn">nincs csatlakoztatva</Pill>}
      </div>
      {st === "nincs-tamogatas" && <p className="text-sm text-muted">Az USB-kapcsolathoz Chrome (vagy Edge) böngésző kell számítógépen. A Safari és a telefonos böngészők nem támogatják.</p>}
      {st === "ki" && (
        <div>
          <button className="btn btn-primary" onClick={connect}>Olvasó csatlakoztatása</button>
          <p className="text-sm text-muted mt-2">Válassza ki a listából a <code>usbserial</code> nevű portot. Az Arduino Serial Monitornak zárva kell lennie.</p>
        </div>
      )}
      {st === "csatlakozva" && (
        <>
          <div className="rounded-xl bg-pale px-4 py-3 font-semibold">{unknown ? "Ismeretlen ujjlenyomat." : msg || "Tegye az ujját az olvasóra az azonosításhoz."}</div>
          <details className="text-sm">
            <summary className="cursor-pointer font-semibold">Ujjlenyomat felvétele (előkészítés a demóra)</summary>
            <div className="flex flex-wrap gap-3 mt-3">
              {slots.map((s) => (
                <button key={s.id} className="btn btn-ghost" disabled={busy !== null} onClick={() => enroll(s.id)}>
                  {busy === s.id ? "Felvétel…" : `${s.label}: ujj felvétele (${s.id}. hely)`}
                </button>
              ))}
            </div>
            <p className="text-muted mt-2">Az ujját kétszer kell az olvasóra tenni. A lenyomat csak az olvasó chipjében tárolódik.</p>
          </details>
          <button className="btn btn-ghost" onClick={disconnect}>Leválasztás</button>
        </>
      )}
    </div>
  );
}
