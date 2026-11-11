"use client";

import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

/** Kamerás QR-olvasó (jsQR). Csak felhasználói kattintás után indul, HTTPS vagy localhost kell hozzá. */
export function QrScanner({ onResult }: { onResult: (text: string) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [on, setOn] = useState(false);
  const [err, setErr] = useState("");
  const cb = useRef(onResult);
  useEffect(() => { cb.current = onResult; }, [onResult]);

  useEffect(() => {
    if (!on) return;
    let stop = false;
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
        const v = video.current;
        if (!v || stop) return;
        v.srcObject = stream;
        await v.play();
        const tick = () => {
          if (stop || !ctx) return;
          if (v.readyState >= 2 && v.videoWidth) {
            canvas.width = v.videoWidth; canvas.height = v.videoHeight;
            ctx.drawImage(v, 0, 0);
            const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const q = jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" });
            if (q?.data) { cb.current(q.data); return; }
          }
          timer = setTimeout(tick, 150);
        };
        tick();
      } catch (e) {
        setErr(e instanceof Error ? e.message : "A kamera nem érhető el.");
        setOn(false);
      }
    })();
    return () => { stop = true; if (timer) clearTimeout(timer); stream?.getTracks().forEach((t) => t.stop()); };
  }, [on]);

  return (
    <div>
      {on ? (
        <div className="relative max-w-sm rounded-2xl overflow-hidden border-2 border-line bg-black">
          <video ref={video} className="w-full" playsInline muted />
          <div className="pointer-events-none absolute inset-8 border-4 border-white/80 rounded-2xl" />
          <button className="absolute top-2 right-2 btn btn-ghost !min-h-9 !py-1" onClick={() => setOn(false)}>Leállítás</button>
        </div>
      ) : (
        <button className="btn btn-teal" onClick={() => { setErr(""); setOn(true); }}>Kamera indítása</button>
      )}
      {err && <p className="text-sm mt-2 text-[#7f1d1d]">Kamerahiba: {err}. Engedélyezze a kamerát a böngészőben.</p>}
    </div>
  );
}
