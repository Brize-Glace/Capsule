"use client";

import { useEffect, useRef, useState } from "react";
import { BUDGET_COLORS, niceTicks, type ProjectionRow } from "@/lib/budget";
import { formatFr, money, moneyShort } from "@/lib/format";

const HEIGHT = 270;
const PAD_LEFT = 52;
const PAD_TOP = 16;
const PAD_BOTTOM = 30;

const SERIES = [
  { key: "account", label: "Compte courant", color: BUDGET_COLORS.account },
  { key: "savings", label: "Épargne", color: BUDGET_COLORS.savings },
] as const;

type ProjectionChartProps = {
  rows: ProjectionRow[];
  startAccount: number;
  startSavings: number;
  goal: number;
  goalLabel: string;
};

/** Line chart of the current account and savings over the next 12 months, with the savings goal. */
export function ProjectionChart({ rows, startAccount, startSavings, goal, goalLabel }: ProjectionChartProps) {
  const [hover, setHover] = useState<number | null>(null);
  const [width, setWidth] = useState(720);
  const container = useRef<HTMLDivElement>(null);

  // The SVG is drawn at the container's pixel width.
  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(280, entry.contentRect.width)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const points = [
    { short: "Auj.", long: "Aujourd’hui", account: startAccount, savings: startSavings },
    ...rows.map((row) => ({
      short: formatFr(row.month, "MMM").replace(".", ""),
      long: `Fin ${formatFr(row.month, "MMMM yyyy")}`,
      account: row.account,
      savings: row.savings,
    })),
  ];
  const end = points[points.length - 1];

  // Scales
  const padRight = width < 520 ? 78 : 118; // room for the end labels
  const innerWidth = width - PAD_LEFT - padRight;
  const innerHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const values = points.flatMap((p) => [p.account, p.savings]).concat(goal > 0 ? [goal] : []);
  const min = Math.min(0, ...values);
  const max = Math.max(1, ...values) * 1.06;
  const x = (i: number) => PAD_LEFT + (i / (points.length - 1)) * innerWidth;
  const y = (value: number) => PAD_TOP + (1 - (value - min) / (max - min)) * innerHeight;
  const ticks = niceTicks(min, max, 4);
  const step = innerWidth / (points.length - 1);
  const labelEvery = step < 34 ? 2 : 1;

  const linePath = (key: "account" | "savings") =>
    points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p[key]).toFixed(1)}`).join("");

  // End labels: pushed apart when the two lines finish too close to each other.
  let accountLabelY = y(end.account);
  let savingsLabelY = y(end.savings);
  if (Math.abs(accountLabelY - savingsLabelY) < 30) {
    const middle = (accountLabelY + savingsLabelY) / 2;
    const direction = accountLabelY <= savingsLabelY ? -1 : 1;
    accountLabelY = middle + 15 * direction;
    savingsLabelY = middle - 15 * direction;
  }
  const endX = x(points.length - 1) + 10;

  const hovered = hover === null ? null : points[hover];

  return (
    <div className="svg-chart" ref={container} onMouseLeave={() => setHover(null)}>
      <svg
        width={width}
        height={HEIGHT}
        role="img"
        aria-label={`Projection : compte courant ${money(end.account)} et épargne ${money(end.savings)} dans 12 mois`}
      >
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={PAD_LEFT}
              x2={PAD_LEFT + innerWidth}
              y1={y(tick)}
              y2={y(tick)}
              className={tick === 0 ? "axis-zero" : "grid-line"}
            />
            <text x={PAD_LEFT - 8} y={y(tick)} className="axis-label" textAnchor="end" dominantBaseline="middle">
              {moneyShort(tick)}
            </text>
          </g>
        ))}

        {points.map(
          (p, i) =>
            i % labelEvery === 0 && (
              <text key={i} x={x(i)} y={HEIGHT - 8} className="axis-label" textAnchor="middle">
                {p.short}
              </text>
            ),
        )}

        {goal > 0 && (
          <g>
            <line x1={PAD_LEFT} x2={PAD_LEFT + innerWidth} y1={y(goal)} y2={y(goal)} className="goal-line" />
            <text x={PAD_LEFT + 4} y={y(goal) - 6} className="goal-text">
              {goalLabel} · {money(goal)}
            </text>
          </g>
        )}

        {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={PAD_TOP} y2={PAD_TOP + innerHeight} className="crosshair" />}

        {SERIES.map((s) => (
          <path
            key={s.key}
            d={linePath(s.key)}
            fill="none"
            stroke={s.color}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}
        {SERIES.map((s) => (
          <circle key={s.key} cx={x(points.length - 1)} cy={y(end[s.key])} r={4} fill={s.color} stroke="#fff" strokeWidth={2} />
        ))}
        {hovered &&
          hover !== null &&
          SERIES.map((s) => (
            <circle key={s.key} cx={x(hover)} cy={y(hovered[s.key])} r={4.5} fill={s.color} stroke="#fff" strokeWidth={2} />
          ))}

        <g className="end-labels">
          <EndLabel x={endX} y={accountLabelY} name="Compte courant" value={end.account} />
          <EndLabel x={endX} y={savingsLabelY} name="Épargne" value={end.savings} />
        </g>

        {/* One invisible hover zone per month */}
        {points.map((_, i) => (
          <rect
            key={i}
            x={x(i) - step / 2}
            y={PAD_TOP}
            width={step}
            height={innerHeight}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
            onTouchStart={() => setHover(i)}
          />
        ))}
      </svg>

      {hovered && hover !== null && (
        <div className={`chart-tooltip ${x(hover) > width - 180 ? "flip" : ""}`} style={{ left: x(hover), top: PAD_TOP }}>
          <strong>{hovered.long}</strong>
          {SERIES.map((s) => (
            <span key={s.key}>
              <i style={{ background: s.color }} />
              {s.label}
              <b>{money(hovered[s.key])}</b>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function EndLabel({ x, y, name, value }: { x: number; y: number; name: string; value: number }) {
  return (
    <text x={x} y={y} dominantBaseline="middle">
      <tspan className="end-name" x={x} dy="-0.55em">
        {name}
      </tspan>
      <tspan className="end-value" x={x} dy="1.25em">
        {moneyShort(value)}
      </tspan>
    </text>
  );
}
