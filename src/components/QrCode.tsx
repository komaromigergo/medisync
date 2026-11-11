"use client";

import { useEffect, useRef } from "react";
import QRCode from "qrcode";

export function QrCode({ text, size = 220 }: { text: string; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (ref.current) QRCode.toCanvas(ref.current, text, { width: size, margin: 2, color: { dark: "#14284b", light: "#ffffff" } });
  }, [text, size]);
  return <canvas ref={ref} width={size} height={size} aria-label="Azonosító QR-kód" className="rounded-xl border-2 border-line" />;
}
