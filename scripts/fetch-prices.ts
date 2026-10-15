// Downloads monthly closing prices from Binance's public market-data API (no key needed)
// into src/data/prices.json. Re-run to refresh: `npm run fetch:prices`
import { writeFileSync } from "node:fs";
import path from "node:path";

const COINS = [
  { symbol: "BTC", name: "Bitcoin", pair: "BTCUSDT" },
  { symbol: "ETH", name: "Ethereum", pair: "ETHUSDT" },
  { symbol: "BNB", name: "BNB", pair: "BNBUSDT" },
  { symbol: "SOL", name: "Solana", pair: "SOLUSDT" },
  { symbol: "AVAX", name: "Avalanche", pair: "AVAXUSDT" },
];
const API = "https://data-api.binance.vision/api/v3/klines";

async function main() {
  const series: Record<string, { name: string; pair: string; months: { month: string; close: number }[] }> = {};
  for (const c of COINS) {
    const res = await fetch(`${API}?symbol=${c.pair}&interval=1M&limit=1000`);
    if (!res.ok) throw new Error(`${c.pair}: HTTP ${res.status}`);
    // Kline: [openTime, open, high, low, close, volume, closeTime, ...]
    const rows = (await res.json()) as [number, string, string, string, string, ...unknown[]][];
    // Drop the current, unfinished month so every point is a real month-end close.
    const thisMonth = new Date().toISOString().slice(0, 7);
    const months = rows
      .map((r) => ({ month: new Date(r[0]).toISOString().slice(0, 7), close: Number(r[4]) }))
      .filter((m) => m.month < thisMonth);
    series[c.symbol] = { name: c.name, pair: c.pair, months };
    console.log(`${c.symbol}: ${months.length} months, ${months[0].month} → ${months.at(-1)!.month}`);
  }
  const out = {
    source: "Binance public market data (monthly klines, close price in USDT)",
    source_url: API,
    fetched_at: new Date().toISOString(),
    note: "History starts when each pair was listed on Binance, not when the coin launched.",
    series,
  };
  writeFileSync(path.join(__dirname, "..", "src/data/prices.json"), JSON.stringify(out) + "\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
