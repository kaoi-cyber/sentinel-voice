"use client";

import { useMemo, useState } from "react";
import { COINS, coinStats, getCoin, money, monthLabel, PRICE_SOURCE } from "@/lib/markets/stats";
import { compactUsd, LineChart } from "./LineChart";

const BLUE = "#3987e5";
const ORANGE = "#d95926";

export function CoinTabs({ value, onChange }: { value: string; onChange: (s: string) => void }) {
  return (
    <div role="tablist" className="flex flex-wrap gap-1.5">
      {COINS.map((c) => (
        <button
          key={c.symbol}
          role="tab"
          aria-selected={value === c.symbol}
          onClick={() => onChange(c.symbol)}
          className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition ${
            value === c.symbol ? "border-blue bg-blue/20 text-text" : "border-line text-muted hover:text-text"
          }`}
        >
          {c.name} <span className="font-mono text-xs text-muted">{c.symbol}</span>
        </button>
      ))}
    </div>
  );
}

export function MarketHistory() {
  const [symbol, setSymbol] = useState("BTC");
  const [log, setLog] = useState(false);
  const coin = getCoin(symbol);
  const s = useMemo(() => coinStats(coin.months), [coin]);
  const idx = (m: string) => coin.months.findIndex((x) => x.month === m);
  const maxAbs = Math.max(...s.yearly.map((y) => Math.abs(y.percent)));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <CoinTabs value={symbol} onChange={setSymbol} />
        <label className="flex items-center gap-2 text-xs text-muted">
          <input type="checkbox" checked={log} onChange={(e) => setLog(e.target.checked)} className="accent-[#3987e5]" />
          Log scale <span className="hidden sm:inline">(shows % moves evenly)</span>
        </label>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <Tile label={`Since ${monthLabel(s.first.month)}`} value={`${s.changePercent >= 0 ? "+" : ""}${Math.round(s.changePercent).toLocaleString("en-US")}%`} note={`${money(s.first.close)} → ${money(s.last.close)}`} />
        <Tile label="Worst fall from a high" value={`${Math.round(s.maxDrawdown.percent)}%`} note={`${monthLabel(s.maxDrawdown.peak.month)} → ${monthLabel(s.maxDrawdown.trough.month)}`} tone="down" />
        <Tile label="Months that ended lower" value={`${Math.round(s.downMonthsPercent)}%`} note="of all months on record" />
        <Tile label="Highest month-end" value={money(s.ath.close)} note={monthLabel(s.ath.month)} />
      </div>

      <div className="mt-5 rounded-2xl border border-line bg-ink/40 p-3 sm:p-4">
        <LineChart
          labels={coin.months.map((m) => m.month)}
          series={[{ key: "close", label: `${coin.name} month-end price`, color: BLUE, values: coin.months.map((m) => m.close) }]}
          log={log}
          format={compactUsd}
          ariaLabel={`${coin.name} monthly closing price since ${s.first.month}`}
          markers={[
            { index: idx(s.ath.month), label: "Highest", tone: "up" },
            { index: idx(s.maxDrawdown.trough.month), label: `${Math.round(s.maxDrawdown.percent)}% low`, tone: "down" },
          ]}
        />
      </div>

      <h3 className="mt-6 text-sm font-semibold uppercase tracking-[0.15em] text-muted">Year by year</h3>
      <table className="mt-2 w-full text-sm">
        <caption className="sr-only">{coin.name} calendar-year price change</caption>
        <tbody>
          {s.yearly.map((y) => (
            <tr key={y.year} className="border-t border-line/40">
              <td className="w-16 py-1.5 font-mono text-muted">
                {y.year}
                {y.partial && "*"}
              </td>
              <td className="py-1.5">
                <div className="relative h-4">
                  <div className="absolute left-1/2 top-0 h-full w-px bg-line" />
                  <div
                    className="absolute top-0.5 h-3 rounded"
                    style={{
                      background: y.percent >= 0 ? BLUE : ORANGE,
                      width: `${(Math.abs(y.percent) / maxAbs) * 50}%`,
                      left: y.percent >= 0 ? "50%" : `${50 - (Math.abs(y.percent) / maxAbs) * 50}%`,
                    }}
                    title={`${y.year}: ${y.percent.toFixed(0)}%`}
                  />
                </div>
              </td>
              <td className="w-24 py-1.5 text-right font-mono text-text">
                {y.percent >= 0 ? "▲ +" : "▼ "}
                {Math.round(y.percent).toLocaleString("en-US")}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-muted">
        * partial year. Source: {PRICE_SOURCE.source}, fetched {new Date(PRICE_SOURCE.fetched_at).toLocaleDateString("en-US", { dateStyle: "medium", timeZone: "UTC" })}. {PRICE_SOURCE.note} Month-end
        prices hide even deeper drops inside the month. Past performance tells you how bumpy the ride has been — not where it goes next.
      </p>
    </div>
  );
}

export function Tile({ label, value, note, tone }: { label: string; value: string; note: string; tone?: "down" }) {
  return (
    <div className="rounded-2xl border border-line bg-ink/40 p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-1 text-2xl font-extrabold ${tone === "down" ? "text-danger" : "text-text"}`}>{value}</p>
      <p className="mt-0.5 text-xs text-muted">{note}</p>
    </div>
  );
}
