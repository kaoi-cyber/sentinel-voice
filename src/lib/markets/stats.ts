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
  maxDrawdown: { percent: number; peak: MonthPoint; trough: MonthPoint };
  downMonthsPercent: number;
  yearly: { year: string; percent: number; partial: boolean }[];
};

export function coinStats(months: MonthPoint[]): CoinStats {
  const first = months[0];
  const last = months[months.length - 1];
  let ath = first;
  let peak = first;
  let maxDd = { percent: 0, peak: first, trough: first };
  let down = 0;
  months.forEach((m, i) => {
    if (m.close > ath.close) ath = m;
    if (m.close > peak.close) peak = m;
    const dd = (m.close / peak.close - 1) * 100;
    if (dd < maxDd.percent) maxDd = { percent: dd, peak, trough: m };
    if (i > 0 && m.close < months[i - 1].close) down++;
  });

  // Calendar-year returns: December close vs previous December close (first year from listing).
  const yearly: CoinStats["yearly"] = [];
  const years = [...new Set(months.map((m) => m.month.slice(0, 4)))];
  for (const y of years) {
    const inYear = months.filter((m) => m.month.startsWith(y));
    const prevDec = months.find((m) => m.month === `${Number(y) - 1}-12`);
    const start = prevDec ?? inYear[0];
    const end = inYear[inYear.length - 1];
    if (start === end) continue;
    yearly.push({ year: y, percent: (end.close / start.close - 1) * 100, partial: !prevDec || !end.month.endsWith("-12") });
  }

  return {
    first,
    last,
    years: months.length / 12,
    changePercent: (last.close / first.close - 1) * 100,
    ath,
    maxDrawdown: maxDd,
    downMonthsPercent: (down / (months.length - 1)) * 100,
    yearly,
  };
}

export type DcaPoint = { month: string; invested: number; value: number };
export type DcaResult = {
  points: DcaPoint[];
  invested: number;
  value: number;
  /** The moment the savings were furthest below what had been put in. */
  worst: { month: string; lossPercent: number; invested: number; value: number } | null;
  /** Largest fall in the savings' value from a previous high. */
  maxDrawdownPercent: number;
};

/** Buy a fixed amount at each month-end close, starting at `startMonth`. */
export function simulateDca(months: MonthPoint[], monthly: number, startMonth: string): DcaResult {
  let units = 0;
  let invested = 0;
  let peak = 0;
  let maxDd = 0;
  let worst: DcaResult["worst"] = null;
  const points: DcaPoint[] = [];
  for (const m of months.filter((x) => x.month >= startMonth)) {
    units += monthly / m.close;
    invested += monthly;
    const value = units * m.close;
    points.push({ month: m.month, invested, value });
    peak = Math.max(peak, value);
    maxDd = Math.min(maxDd, (value / peak - 1) * 100);
    const loss = (value / invested - 1) * 100;
    if (!worst || loss < worst.lossPercent) worst = { month: m.month, lossPercent: loss, invested, value };
  }
  const last = points[points.length - 1];
  return {
    points,
    invested: last?.invested ?? 0,
    value: last?.value ?? 0,
    worst: worst && worst.lossPercent < 0 ? worst : null,
    maxDrawdownPercent: maxDd,
  };
}

export const monthLabel = (m: string) =>
  new Date(`${m}-01T00:00:00Z`).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });

export const money = (n: number) =>
  n >= 100 ? "$" + Math.round(n).toLocaleString("en-US") : n >= 1 ? "$" + n.toFixed(2) : "$" + n.toPrecision(3);
