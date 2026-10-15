import type { HolderGroup, StandardGroup } from "@/lib/supply/types";

// Categorical palette validated (dataviz validate_palette.js, dark mode) against the
// app's navy surface #0d1430: all checks pass. Fixed order — color follows the group.
export const GROUP_COLOR: Record<StandardGroup, string> = {
  founderTeam: "#3987e5",
  privateInvestors: "#d95926",
  publicInvestors: "#199e70",
  community: "#c98500",
  reserve: "#d55181",
  others: "#9085e9",
};

const fmt = (n: number) =>
  n >= 1e9 ? `${(n / 1e9).toFixed(2)}B` : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : Math.round(n).toLocaleString("en-US");

/** Who holds the supply: one stacked bar + a legend that doubles as the data table. */
export function HolderChart({ holders, symbol }: { holders: HolderGroup[]; symbol: string }) {
  return (
    <figure>
      <div className="flex h-5 w-full gap-[2px] overflow-hidden rounded" role="img" aria-label="Supply by holder type">
        {holders.map((h) => (
          <div
            key={h.group}
            title={`${h.label}: ${h.percent.toFixed(1)}% (${fmt(h.amount)} ${symbol})`}
            style={{ width: `${h.percent}%`, background: GROUP_COLOR[h.group] }}
            className="h-full first:rounded-l last:rounded-r"
          />
        ))}
      </div>
      <table className="mt-3 w-full text-sm">
        <caption className="sr-only">Supply allocation by holder type</caption>
        <tbody>
          {holders.map((h) => (
            <tr key={h.group} className="border-t border-line/40 first:border-t-0">
              <td className="py-1.5">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: GROUP_COLOR[h.group] }} />
                  {h.label}
                  {(h.group === "founderTeam" || h.group === "privateInvestors") && (
                    <span className="rounded border border-line px-1 text-[10px] uppercase tracking-wide text-muted">insider</span>
                  )}
                </span>
              </td>
              <td className="py-1.5 text-right font-mono text-text">{h.percent.toFixed(1)}%</td>
              <td className="py-1.5 pl-3 text-right font-mono text-muted">
                {fmt(h.amount)} {symbol}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

/** Unlocked share of max supply — a single-series progress bar. */
export function FloatBar({ percent }: { percent: number }) {
  return (
    <div>
      <div className="h-3 w-full overflow-hidden rounded bg-line/60" role="img" aria-label={`${percent.toFixed(1)}% unlocked`}>
        <div className="h-full rounded" style={{ width: `${Math.min(100, percent)}%`, background: "#3987e5" }} />
      </div>
      <p className="mt-1.5 text-sm text-muted">
        <span className="font-mono text-text">{percent.toFixed(1)}%</span> of max supply unlocked
      </p>
    </div>
  );
}

export { fmt as formatAmount };
