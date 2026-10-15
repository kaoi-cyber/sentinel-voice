
/** JSON with object keys sorted, so the same report always produces the same bytes. */
export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => (a < b ? -1 : 1));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

/** SHA-256 fingerprint of a report (excluding its own hash and verification fields). */
export async function hashReport(report: object): Promise<string> {
  const body = canonicalJson({ ...report, report_hash: null, verification_tx: null });
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(body));
  return "0x" + Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}
