"use client";

import { useMemo, useState } from "react";
import { COINS, coinStats, getCoin, money, monthLabel, PRICE_SOURCE } from "@/lib/markets/stats";
import { compactUsd, LineChart } from "./LineChart";

const BLUE = "#3987e5";

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

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <CoinTabs value={symbol} onChange={setSymbol} />
        <label className="flex items-center gap-2 text-xs text-muted">
          <input type="checkbox" checked={log} onChange={(e) => setLog(e.target.checked)} className="accent-[#3987e5]" />
          Log scale <span className="hidden sm:inline">(shows % moves evenly)</span>
        </label>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Tile label={`Since ${monthLabel(s.first.month)}`} value={`${s.changePercent >= 0 ? "+" : ""}${Math.round(s.changePercent).toLocaleString("en-US")}%`} note={`${money(s.first.close)} → ${money(s.last.close)}`} />
        <Tile label="Years of history" value={s.years.toFixed(1)} note={`${coin.months.length} month-end prices`} />
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
          ]}
        />
      </div>

      <p className="mt-3 text-xs text-muted">
        Source: {PRICE_SOURCE.source}, fetched {new Date(PRICE_SOURCE.fetched_at).toLocaleDateString("en-US", { dateStyle: "medium", timeZone: "UTC" })}. {PRICE_SOURCE.note} Prices move in
        both directions; past performance does not tell you where they go next.
      </p>
    </div>
  );
}

export function Tile({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-2xl border border-line bg-ink/40 p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-2xl font-extrabold text-text">{value}</p>
      <p className="mt-0.5 text-xs text-muted">{note}</p>
    </div>
  );
}
