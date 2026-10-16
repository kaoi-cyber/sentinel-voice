// Historical statistics from real month-end prices. Describes the past only —
// nothing here predicts or recommends.
import prices from "@/data/prices.json";

export type MonthPoint = { month: string; close: number };
export type Coin = { symbol: string; name: string; pair: string; months: MonthPoint[] };

export const PRICE_SOURCE = { source: prices.source, fetched_at: prices.fetched_at, note: prices.note };
export const COINS: Coin[] = Object.entries(prices.series).map(([symbol, s]) => ({ symbol, ...s }));
export const getCoin = (symbol: string) => COINS.find((c) => c.symbol === symbol) ?? COINS[0];

export type CoinStats = {
  first: MonthPoint;
  last: MonthPoint;
  years: number;
  changePercent: number;
  ath: MonthPoint;
};

export function coinStats(months: MonthPoint[]): CoinStats {
  const first = months[0];
  const last = months[months.length - 1];
  const ath = months.reduce((best, m) => (m.close > best.close ? m : best), first);
  return { first, last, years: months.length / 12, changePercent: (last.close / first.close - 1) * 100, ath };
}

export type DcaPoint = { month: string; invested: number; value: number };
export type DcaResult = { points: DcaPoint[]; invested: number; value: number };

/** Buy a fixed amount at each month-end close, starting at `startMonth`. */
export function simulateDca(months: MonthPoint[], monthly: number, startMonth: string): DcaResult {
  let units = 0;
  let invested = 0;
  const points: DcaPoint[] = [];
  for (const m of months.filter((x) => x.month >= startMonth)) {
    units += monthly / m.close;
    invested += monthly;
    points.push({ month: m.month, invested, value: units * m.close });
  }
  const last = points[points.length - 1];
  return { points, invested: last?.invested ?? 0, value: last?.value ?? 0 };
}

export const monthLabel = (m: string) =>
  new Date(`${m}-01T00:00:00Z`).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });

export const money = (n: number) =>
  n >= 100 ? "$" + Math.round(n).toLocaleString("en-US") : n >= 1 ? "$" + n.toFixed(2) : "$" + n.toPrecision(3);
