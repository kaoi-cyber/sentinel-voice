// Simple per-visitor limit for routes that spend paid API credits (ElevenLabs).
// In-memory, so it's per server instance — enough to stop casual abuse of a public demo.
const hits = new Map<string, number[]>();

export function rateLimited(req: Request, key: string, max: number, windowMs: number): boolean {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const id = `${key}:${ip}`;
  const now = Date.now();
  const recent = (hits.get(id) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    hits.set(id, recent);
    return true;
  }
  recent.push(now);
  hits.set(id, recent);
  return false;
}
