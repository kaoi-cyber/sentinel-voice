// What VoiceGuard actually says out loud. Built from the same findings as the screen.
import { formatUnits } from "@/lib/security/abi";
import { RISK_COPY, sortFindings } from "@/lib/security/explain";
import type { SecurityReport } from "@/lib/security/types";
import type { GuideReply } from "@/lib/voiceguard/answer";

const sentence = (s: string) => (/[.!?]$/.test(s.trim()) ? s.trim() : `${s.trim()}.`);

export function replyToSpeech(reply: GuideReply): string {
  return [reply.title, ...reply.paragraphs, ...(reply.bullets ?? [])].map(sentence).join(" ");
}

/** A short technical briefing for the expert view — no hex strings read aloud. */
export function expertSummary(r: SecurityReport): string {
  const parts = [`Risk level: ${RISK_COPY[r.risk_level].label}.`];
  const d = r.decoded;
  const sym = r.token?.symbol ?? "an unrecognised token";

  if (d.kind === "unknown") {
    parts.push("The calldata could not be decoded.");
  } else {
    const party = r.counterparty;
    const who = party?.label ?? `an unlabelled address ending in ${party?.address.slice(-4).split("").join(" ")}`;
    parts.push(`Decoded call: ${d.kind} on ${sym}, ${party?.role ?? "counterparty"} ${who}.`);
    if (d.kind === "approval_for_all") {
      parts.push(d.approved ? "Approval for all items in the collection." : "Revokes a collection-wide approval.");
    } else if (d.kind === "approve") {
      parts.push(
        d.unlimited
          ? "Allowance: unlimited."
          : `Allowance: ${r.token ? formatUnits(BigInt(d.amount_raw), r.token.decimals) : d.amount_raw} ${sym}.`,
      );
    }
  }

  const flagged = sortFindings(r.findings).filter((f) => f.severity !== "info");
  parts.push(`${r.findings.length} findings, ${flagged.length} flagged.`);
  for (const f of flagged) parts.push(`${f.severity}${f.unverified ? ", unverified" : ""}: ${sentence(f.title)}`);
  parts.push(`Recommended action: ${sentence(r.recommended_action)}`);
  return parts.join(" ");
}
