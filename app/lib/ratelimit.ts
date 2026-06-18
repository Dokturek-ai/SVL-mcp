// ---------------------------------------------------------------------------
// Best-effort in-memory sliding-window rate limiter.
//
// POZOR: stav je per-instance (každá serverless instance má vlastní mapu).
// Pro silnou ochranu napříč instancemi nasaďte sdílené úložiště (Upstash/KV)
// a nahraďte implementaci. Pro základní ochranu proti zneužití (e-mail
// bombing, pálení Resend kvóty) je per-instance limiter dostatečná pojistka.
// ---------------------------------------------------------------------------

const hits = new Map<string, number[]>();
let lastPrune = 0;

function prune(now: number, windowMs: number) {
  // Občasný úklid, ať mapa neroste donekonečna.
  if (now - lastPrune < windowMs) return;
  lastPrune = now;
  for (const [key, arr] of hits) {
    const fresh = arr.filter((t) => now - t < windowMs);
    if (fresh.length === 0) hits.delete(key);
    else hits.set(key, fresh);
  }
}

/**
 * Vrátí true, pokud je požadavek v limitu (a započítá ho), jinak false.
 * @param key   Identifikátor (např. `ip:1.2.3.4` nebo `email:a@b.cz`).
 * @param max   Maximální počet požadavků v okně.
 * @param windowMs  Délka okna v ms.
 */
export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  prune(now, windowMs);
  const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (arr.length >= max) {
    hits.set(key, arr);
    return false;
  }
  arr.push(now);
  hits.set(key, arr);
  return true;
}

/** Vytáhne klientskou IP z proxy hlaviček (Vercel nastavuje x-forwarded-for). */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}
