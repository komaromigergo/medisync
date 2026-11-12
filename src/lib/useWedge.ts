"use client";

import { useEffect, useRef } from "react";
import { digitOfKey } from "./cards";

/** Billentyűzet-emulációs olvasó (RFID/vonalkód): gyors karaktersorozat + Enter. */
export function useWedge(onCode: (code: string, digits?: string) => void, enabled = true) {
  const cb = useRef(onCode);
  useEffect(() => { cb.current = onCode; }, [onCode]);
  useEffect(() => {
    if (!enabled) return;
    const buf = { s: "", d: "", t: 0 };
    const h = (e: KeyboardEvent) => {
      const now = performance.now();
      if (now - buf.t > 120) { buf.s = ""; buf.d = ""; }
      buf.t = now;
      if (e.key === "Enter") {
        const code = buf.s.trim();
        const digits = buf.d;
        buf.s = ""; buf.d = "";
        if (code.length >= 4) { e.preventDefault(); cb.current(code, digits); }
      } else if (e.key.length === 1) {
        buf.s += e.key;
        const dg = digitOfKey(e);
        if (dg) buf.d += dg;
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [enabled]);
}
