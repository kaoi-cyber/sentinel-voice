"use client";

import { useMemo, useState } from "react";
import { TriangleAlert } from "lucide-react";
import { getCoin, money, monthLabel, simulateDca } from "@/lib/markets/stats";
import { compactUsd, LineChart } from "./LineChart";
import { CoinTabs, Tile } from "./MarketHistory";

const AMOUNTS = [10, 25, 50, 100, 250];

export function SavingsSimulator() {
  const [symbol, setSymbol] = useState("BTC");
  const [monthly, setMonthly] = useState(50);
  const coin = getCoin(symbol);
  const startYears = [...new Set(coin.months.map((m) => m.month.slice(0, 4)))].slice(0, -1);
  const [startYear, setStartYear] = useState("2021");
  const start = startYears.includes(startYear) ? startYear : startYears[0];
  const r = useMemo(() => simulateDca(coin.months, monthly, `${start}-01`), [coin, monthly, start]);
  const gain = r.invested ? (r.value / r.invested - 1) * 100 : 0;

  return (
    <div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <CoinTabs value={symbol} onChange={setSymbol} />
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <label className="flex items-center gap-2 text-muted">
            Every month
            <select value={monthly} onChange={(e) => setMonthly(Number(e.target.value))} className="rounded-lg border border-line bg-ink px-2 py-1.5 text-text">
              {AMOUNTS.map((a) => (
                <option key={a} value={a}>
                  ${a}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-muted">
            starting
            <select value={start} onChange={(e) => setStartYear(e.target.value)} className="rounded-lg border border-line bg-ink px-2 py-1.5 text-text">
              {startYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Tile label="You put in" value={money(r.invested)} note={`${r.points.length} monthly buys`} />
        <Tile label="Worth at the end" value={money(r.value)} note={`${gain >= 0 ? "+" : ""}${Math.round(gain)}% vs. what you put in`} />
        <Tile label="Biggest fall along the way" value={`${Math.round(r.maxDrawdownPercent)}%`} note="from the savings' previous high" tone="down" />
      </div>

      {r.worst && (
        <p className="mt-4 flex gap-2 rounded-xl border border-gold/40 bg-gold/10 p-3 text-sm">
          <TriangleAlert size={18} className="shrink-0 text-gold" />
          <span>
            <span className="font-semibold text-gold">The hard part: </span>
            in {monthLabel(r.worst.month)} you&apos;d have put in {money(r.worst.invested)} but your savings were worth {money(r.worst.value)} —{" "}
            {Math.round(r.worst.lossPercent)}%. People who panic-sell at moments like this lock in the loss. Only save what you could leave
            untouched for years.
          </span>
        </p>
      )}

      <div className="mt-5 rounded-2xl border border-line bg-ink/40 p-3 sm:p-4">
        <LineChart
          labels={r.points.map((p) => p.month)}
          series={[
            { key: "value", label: "What your savings were worth", color: "#3987e5", values: r.points.map((p) => p.value) },
            { key: "invested", label: "What you had put in", color: "#94a0c8", dashed: true, values: r.points.map((p) => p.invested) },
          ]}
          format={compactUsd}
          ariaLabel={`Value of saving $${monthly} a month in ${coin.name} from ${start}`}
        />
      </div>
      <p className="mt-3 text-xs text-muted">
        A history simulation on real month-end prices: buys at each month-end close, ignores fees and taxes. It shows what happened —
        not what will happen, and not a recommendation.
      </p>
    </div>
  );
}
