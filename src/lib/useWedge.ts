"use client";

import { useEffect, useRef } from "react";

/** Billentyűzet-emulációs olvasó (RFID/vonalkód): gyors karaktersorozat + Enter. */
export function useWedge(onCode: (code: string) => void, enabled = true) {
  const cb = useRef(onCode);
  useEffect(() => { cb.current = onCode; }, [onCode]);
  useEffect(() => {
    if (!enabled) return;
    const buf = { s: "", t: 0 };
    const h = (e: KeyboardEvent) => {
      const now = performance.now();
      if (now - buf.t > 120) buf.s = "";
      buf.t = now;
      if (e.key === "Enter") {
        const code = buf.s.trim();
        buf.s = "";
        if (code.length >= 4) { e.preventDefault(); cb.current(code); }
      } else if (e.key.length === 1) buf.s += e.key;
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [enabled]);
}
