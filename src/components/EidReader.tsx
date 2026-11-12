"use client";

import { useEffect, useRef, useState } from "react";
import { Pill } from "./ui";

type Status = "keres" | "nincs" | "csatlakozva";

/** Chipkártya-olvasó (PC/SC) híd a saját gépen: ws://127.0.0.1:8787, lásd tools/reader-bridge. */
export function EidReader({ onCard, onSim }: { onCard: (atr: string) => void; onSim: () => void }) {
  const [st, setSt] = useState<Status>("keres");
  const [readers, setReaders] = useState<string[]>([]);
  const [card, setCard] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [mute, setMute] = useState(false);
  const cb = useRef(onCard);
  useEffect(() => { cb.current = onCard; }, [onCard]);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stop = false;
    const connect = () => {
      try { ws = new WebSocket("ws://127.0.0.1:8787"); } catch { setSt("nincs"); timer = setTimeout(connect, 3000); return; }
      ws.onopen = () => setSt("csatlakozva");
      ws.onmessage = (ev) => {
        try {
          const m = JSON.parse(ev.data);
          if (m.type === "state") { setReaders(m.readers ?? []); setCard(m.card?.atr ?? null); }
          if (m.type === "mute") setMute(true);
          if (m.type === "card" && m.atr) { setMute(false); setCard(m.atr); cb.current(m.atr); }
          if (m.type === "remove") { setCard(null); setMute(false); }
        } catch { /* ismeretlen üzenet */ }
      };
      ws.onclose = () => { setSt("nincs"); setCard(null); if (!stop) timer = setTimeout(connect, 3000); };
      ws.onerror = () => ws?.close();
    };
    connect();
    return () => { stop = true; if (timer) clearTimeout(timer); ws?.close(); };
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="text-xl font-extrabold">Helyezze be az e-személyi (chipkártya) olvasóba</div>
        {st === "csatlakozva" ? <Pill tone="teal">olvasó-híd csatlakozva</Pill> : <Pill tone="warn">{st === "keres" ? "keresés…" : "olvasó-híd nem fut"}</Pill>}
      </div>
      {st === "csatlakozva" && (
        <div className="rounded-2xl border-2 border-line bg-pale p-4">
          <div>Olvasó: <b>{readers.length ? readers.join(", ") : "nincs csatlakoztatva olvasó"}</b></div>
          <div className="mt-1">Kártya: <b>{card ? "behelyezve" : "nincs"}</b>{card && <span className="text-xs text-muted ml-2 break-all">típusjel (ATR): {card}</span>}</div>
          {mute && !card && <div className="mt-2 text-[#8a5a12] font-semibold">Kártya érzékelve, de a chip nem válaszol. Fordítsa meg, tolja mélyebbre, vagy próbáljon másik, chipes kártyát.</div>}
        </div>
      )}
      {st !== "csatlakozva" && (
        <details className="rounded-2xl border-2 border-line p-4" open={st === "nincs"}>
          <summary className="font-semibold cursor-pointer">A híd nem fut: hogyan indítható?</summary>
          <ol className="list-decimal pl-6 mt-2 space-y-1 text-sm">
            <li>A MacBookon, a projekt <code>tools/reader-bridge</code> mappájában: <code>npm install</code>, majd <code>npm start</code>.</li>
            <li>Chrome böngészőben nyissa meg ezt az oldalt (a Safari blokkolja a helyi kapcsolatot).</li>
            <li>Ha a Chrome engedélyt kér a helyi hálózat eléréséhez, engedélyezze.</li>
          </ol>
        </details>
      )}
      <p className="text-sm text-muted">
        Az olvasó a kártya jelenlétét és típusjelét (ATR) érzékeli. Személyes adatot nem olvasunk ki, PIN-kód nincs. Az első behelyezésnél egyszer hozzárendeljük egy beteghez.
      </p>
      <div>
        <div className="label mb-2">Olvasó nélkül: szimuláció</div>
        <button className="btn btn-ghost" disabled={busy} onClick={() => { setBusy(true); setTimeout(() => { setBusy(false); onSim(); }, 1200); }}>
          {busy ? "Kártya olvasása…" : "e-személyi behelyezése (szimuláció)"}
        </button>
      </div>
    </div>
  );
}
