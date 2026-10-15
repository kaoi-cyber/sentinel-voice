import { ShieldCheck, ShieldAlert, ShieldQuestion, ShieldX, Eye } from "lucide-react";
import { RISK_COPY } from "@/lib/security/explain";
import type { RiskLevel, Severity } from "@/lib/security/types";

const RISK_STYLE: Record<RiskLevel, { cls: string; icon: typeof ShieldCheck }> = {
  low: { cls: "border-safe/50 bg-safe/10 text-safe", icon: ShieldCheck },
  medium: { cls: "border-gold/50 bg-gold/10 text-gold", icon: Eye },
  high: { cls: "border-danger/50 bg-danger/10 text-danger", icon: ShieldX },
  unverified: { cls: "border-gold/50 bg-gold/10 text-gold", icon: ShieldQuestion },
  insufficient: { cls: "border-muted/50 bg-muted/10 text-muted", icon: ShieldAlert },
};

export function RiskBadge({ level, size = "md" }: { level: RiskLevel; size?: "md" | "lg" }) {
  const { cls, icon: Icon } = RISK_STYLE[level];
  const big = size === "lg";
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border font-semibold ${cls} ${
        big ? "px-4 py-2 text-base" : "px-3 py-1 text-xs"
      }`}
    >
      <Icon size={big ? 20 : 14} />
      {RISK_COPY[level].label}
    </span>
  );
}

const SEVERITY_STYLE: Record<Severity, string> = {
  info: "text-muted border-line",
  low: "text-blue border-blue/40",
  medium: "text-gold border-gold/40",
  high: "text-danger border-danger/40",
};

export function SeverityPill({ severity }: { severity: Severity }) {
  return (
    <span className={`inline-block rounded-md border px-2 py-0.5 font-mono text-[11px] uppercase ${SEVERITY_STYLE[severity]}`}>
      {severity}
    </span>
  );
}

export function severityDot(severity: Severity): string {
  return { info: "bg-muted", low: "bg-blue", medium: "bg-gold", high: "bg-danger" }[severity];
}
