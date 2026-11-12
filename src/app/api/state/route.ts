import { NextResponse } from "next/server";
import { getDb } from "@/lib/serverdb";
import { mergeStates } from "@/lib/merge";
import type { AppState } from "@/lib/demo";

export const dynamic = "force-dynamic";

const KEY = "medisync:state:v1";
const VKEY = "medisync:ver:v1";
const json = (b: unknown, status = 200) => NextResponse.json(b, { status, headers: { "Cache-Control": "no-store" } });

export async function GET(req: Request) {
  const db = getDb();
  if (!db) return json({ error: "nincs-adatbazis" }, 503);
  try {
    const since = Number(new URL(req.url).searchParams.get("since") || 0);
    const version = Number((await db.get(VKEY)) ?? 0);
    if (!version) return json({ version: 0, state: null });
    if (since && since === version) return json({ version, unchanged: true });
    return json({ version, state: await db.get(KEY) });
  } catch {
    return json({ error: "adatbazis-hiba" }, 503);
  }
}

export async function PUT(req: Request) {
  const db = getDb();
  if (!db) return json({ error: "nincs-adatbazis" }, 503);
  try {
    const raw = await req.text();
    if (raw.length > 2_000_000) return json({ error: "tul-nagy" }, 413);
    const body = JSON.parse(raw) as { state?: AppState; reset?: boolean };
    const incoming = body.state;
    if (!incoming || incoming.v !== 1 || !Array.isArray(incoming.prescriptions)) return json({ error: "hibas-adat" }, 400);
    const current = (await db.get(KEY)) as AppState | null;
    const merged = body.reset || !current ? incoming : mergeStates(current, incoming);
    await db.set(KEY, merged);
    const version = await db.incr(VKEY);
    return json({ version, state: merged });
  } catch {
    return json({ error: "adatbazis-hiba" }, 503);
  }
}
