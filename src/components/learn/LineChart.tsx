"use client";

// Minimal SVG line chart with a hover crosshair + tooltip. One y-axis only.
// Series colors come from the validated categorical palette (slot 1 blue) plus a neutral reference line.
import { useMemo, useRef, useState } from "react";

export type Series = { key: string; label: string; color: string; dashed?: boolean; values: number[] };
export type Marker = { index: number; label: string; tone: "up" | "down" };

type Props = {
  labels: string[];
  series: Series[];
  log?: boolean;
  markers?: Marker[];
  format: (n: number) => string;
  height?: number;
  ariaLabel: string;
};

const W = 760;
const PAD = { top: 16, right: 16, bottom: 28, left: 64 };

export function LineChart({ labels, series, log = false, markers = [], format, height = 300, ariaLabel }: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const H = height;
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const { y, ticks } = useMemo(() => {
    const all = series.flatMap((s) => s.values).filter((v) => v > 0);
    const min = Math.min(...all);
    const max = Math.max(...all);
    if (log) {
      const lo = Math.floor(Math.log10(min));
      const hi = Math.ceil(Math.log10(max));
      const y = (v: number) => PAD.top + innerH - ((Math.log10(Math.max(v, 10 ** lo)) - lo) / (hi - lo)) * innerH;
      const ticks = Array.from({ length: hi - lo + 1 }, (_, i) => 10 ** (lo + i));
      return { y, ticks };
    }
    const top = niceCeil(max);
    const y = (v: number) => PAD.top + innerH - (v / top) * innerH;
    return { y, ticks: [0, top / 4, top / 2, (3 * top) / 4, top] };
  }, [series, log, innerH]);

  const x = (i: number) => PAD.left + (labels.length <= 1 ? 0 : (i / (labels.length - 1)) * innerW);
  const path = (vals: number[]) => vals.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
  // January of each year; the first month only if it isn't crowded by the next January.
  const yearTicks = labels
    .map((l, i) => ({ l, i }))
    .filter(({ l }, i) => l.endsWith("-01") || (i === 0 && !labels.slice(1, 7).some((x) => x.endsWith("-01"))));

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    const rect = svgRef.current!.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.round(((px - PAD.left) / innerW) * (labels.length - 1));
    setHover(Math.max(0, Math.min(labels.length - 1, i)));
  }

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full touch-none select-none"
        role="img"
        aria-label={ariaLabel}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="#222d5a" strokeWidth={1} />
            <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill="#94a0c8">
              {format(t)}
            </text>
          </g>
        ))}
        {yearTicks.map(({ l, i }) => (
          <text key={l} x={x(i)} y={H - 8} textAnchor="middle" fontSize={11} fill="#94a0c8">
            {l.slice(0, 4)}
          </text>
        ))}
        {series.map((s) => (
          <path
            key={s.key}
            d={path(s.values)}
            fill="none"
            stroke={s.color}
            strokeWidth={2}
            strokeDasharray={s.dashed ? "5 4" : undefined}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}
        {markers.map((m) => (
          <g key={m.label}>
            <circle cx={x(m.index)} cy={y(series[0].values[m.index])} r={5} fill={series[0].color} stroke="#0d1430" strokeWidth={2} />
            <text
              x={x(m.index)}
              y={y(series[0].values[m.index]) - 12}
              textAnchor={m.index > labels.length * 0.8 ? "end" : m.index < labels.length * 0.15 ? "start" : "middle"}
              fontSize={11}
              fontWeight={600}
              fill="#e8eeff"
              stroke="#0d1430"
              strokeWidth={3}
              paintOrder="stroke"
            >
              {m.label}
            </text>
          </g>
        ))}
        {hover !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={H - PAD.bottom} stroke="#94a0c8" strokeWidth={1} strokeDasharray="3 3" />
            {series.map((s) => (
              <circle key={s.key} cx={x(hover)} cy={y(s.values[hover])} r={4} fill={s.color} stroke="#0d1430" strokeWidth={2} />
            ))}
          </g>
        )}
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute top-2 rounded-lg border border-line bg-ink/95 px-3 py-2 text-xs shadow-lg"
          style={{ left: `${(x(hover) / W) * 100}%`, transform: `translateX(${hover > labels.length / 2 ? "-105%" : "5%"})` }}
        >
          <p className="font-semibold text-text">
            {new Date(`${labels[hover]}-01T00:00:00Z`).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" })}
          </p>
          {series.map((s) => (
            <p key={s.key} className="mt-0.5 flex items-center gap-2 text-muted">
              <span className="inline-block h-0.5 w-3" style={{ background: s.color }} />
              {s.label}: <span className="font-mono text-text">{format(s.values[hover])}</span>
            </p>
          ))}
        </div>
      )}
      {series.length > 1 && (
        <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted">
          {series.map((s) => (
            <span key={s.key} className="flex items-center gap-2">
              <svg width="18" height="4" aria-hidden="true">
                <line x1="0" y1="2" x2="18" y2="2" stroke={s.color} strokeWidth="2" strokeDasharray={s.dashed ? "5 4" : undefined} />
              </svg>
              {s.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function niceCeil(v: number): number {
  const p = 10 ** Math.floor(Math.log10(v));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
}

export const compactUsd = (n: number) =>
  n === 0 ? "$0" : n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `$${(n / 1e3).toFixed(n >= 1e4 ? 0 : 1)}k` : n >= 1 ? `$${n.toFixed(n >= 100 ? 0 : 2)}` : `$${n.toPrecision(2)}`;
