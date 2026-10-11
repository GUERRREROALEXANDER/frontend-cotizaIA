import { useMemo, useState } from "react";
import { useReducedMotion } from "framer-motion";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Sector,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Panel, formatCurrency } from "../ui.jsx";
import { buildValueSeries, formatCompactCop } from "./dashboardData.js";

const axisTick = { fill: "var(--text-muted)", fontSize: 12 };

function ChartNote({ children }) {
  return (
    <div className="grid h-[240px] place-items-center px-6 text-center">
      <p className="max-w-[32ch] text-sm text-muted">{children}</p>
    </div>
  );
}

const STATUS_GROUPS = [
  { key: "won", label: "Ganadas", color: "var(--chart-1)", statuses: ["ACCEPTED", "CONTRACT_ISSUED"] },
  { key: "new", label: "Nuevas", color: "var(--chart-2)", statuses: ["RECEIVED", "ANALYZING", "QUOTED"] },
  { key: "review", label: "Por revisar", color: "var(--chart-3)", statuses: ["IN_REVIEW"] },
  { key: "sent", label: "Enviadas", color: "var(--chart-4)", statuses: ["SENT", "NEGOTIATING"] },
  { key: "closed", label: "Cerradas", color: "var(--chart-5)", statuses: ["REJECTED", "EXPIRED"] },
];

function renderDonutActiveShape(props) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={innerRadius}
      outerRadius={outerRadius + 8}
      startAngle={startAngle}
      endAngle={endAngle}
      cornerRadius={10}
      fill={fill}
    />
  );
}

function DonutTooltip({ active, payload, total }) {
  if (!active || !payload || payload.length === 0) return null;
  const entry = payload[0]?.payload;
  if (!entry) return null;
  const pct = total > 0 ? Math.round((entry.count / total) * 100) : 0;
  return (
    <div className="rounded-xl bg-ink px-4 py-3 shadow-overlay">
      <p className="display text-xl text-ink-fg tabular">{entry.count}</p>
      <p className="mt-1 text-xs text-ink-text/70">
        {entry.label} · {pct}%
      </p>
    </div>
  );
}

export function ProposalsStatusChart({ proposalsByStatus, className = "" }) {
  const reduce = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(-1);

  const data = useMemo(() => {
    const counts = proposalsByStatus || {};
    return STATUS_GROUPS.map((group) => ({
      ...group,
      count: group.statuses.reduce((sum, status) => sum + (Number(counts[status]) || 0), 0),
    })).filter((group) => group.count > 0);
  }, [proposalsByStatus]);

  const total = data.reduce((sum, group) => sum + group.count, 0);

  return (
    <Panel className={`flex flex-col p-6 ${className}`}>
      <h2 className="text-lg font-bold tracking-tight text-fg">Propuestas por estado</h2>
      <p className="mt-1 text-sm text-muted">Cómo se reparte tu pipeline hoy</p>
      {data.length === 0 ? (
        <ChartNote>Todavía no hay propuestas que clasificar.</ChartNote>
      ) : (
        <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row">
          <div className="relative h-[240px] w-full sm:w-1/2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<DonutTooltip total={total} />} />
                <Pie
                  data={data}
                  dataKey="count"
                  nameKey="label"
                  innerRadius="68%"
                  outerRadius="100%"
                  paddingAngle={3}
                  cornerRadius={10}
                  stroke="none"
                  activeIndex={activeIndex}
                  activeShape={renderDonutActiveShape}
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(-1)}
                  isAnimationActive={!reduce}
                  animationDuration={900}
                >
                  {data.map((group) => (
                    <Cell key={group.key} fill={group.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div className="text-center">
                <p className="display text-5xl text-fg tabular">{total}</p>
                <p className="mt-1 text-sm text-muted">propuestas</p>
              </div>
            </div>
          </div>
          <ul className="w-full flex-1 space-y-1">
            {data.map((group, index) => {
              const pct = total > 0 ? Math.round((group.count / total) * 100) : 0;
              const dimmed = activeIndex !== -1 && activeIndex !== index;
              return (
                <li
                  key={group.key}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(-1)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors duration-200 ${dimmed ? "text-faint" : "text-fg"}`}
                >
                  <span
                    aria-hidden
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: group.color }}
                  />
                  <span className="flex-1 text-sm font-medium">{group.label}</span>
                  <span className="font-mono text-sm tabular">{group.count}</span>
                  <span className="w-12 text-right font-mono text-xs text-muted tabular">{pct}%</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </Panel>
  );
}

function QuotedTooltip({ active, payload }) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0]?.payload;
  const shown = payload[0]?.value ?? point?.cumulative ?? 0;
  const caption = point?.label ?? "";
  return (
    <div className="rounded-xl bg-ink px-4 py-3 shadow-overlay">
      <p className="display text-xl text-ink-fg tabular">{formatCurrency(shown)}</p>
      <p className="mt-1 text-xs text-ink-text/70">{caption}</p>
    </div>
  );
}

export function QuotedValueChart({ proposals, className = "" }) {
  const reduce = useReducedMotion();

  const data = useMemo(() => {
    const daily = buildValueSeries(proposals);
    let running = 0;
    return daily.map((day) => {
      running += day.value;
      return { ...day, cumulative: running };
    });
  }, [proposals]);

  const total = data.length > 0 ? data[data.length - 1].cumulative : 0;
  const hasData = total > 0;

  return (
    <Panel className={`flex flex-col p-6 ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-fg">Valor acumulado (14 días)</h2>
          <p className="mt-1 text-sm text-muted">Suma acumulada según la fecha de creación de cada propuesta</p>
        </div>
        <span className="display text-3xl text-fg tabular">{formatCurrency(total)}</span>
      </div>
      {hasData ? (
        <div className="mt-4 h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="dash-quoted-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-fill)" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="var(--chart-fill)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={axisTick}
                minTickGap={12}
                interval="preserveStartEnd"
              />
              <YAxis
                tickFormatter={formatCompactCop}
                tickLine={false}
                axisLine={false}
                tick={axisTick}
                width={56}
                domain={[0, "dataMax"]}
              />
              <Tooltip
                content={<QuotedTooltip />}
                cursor={{ stroke: "var(--border-strong)", strokeDasharray: "4 4", strokeWidth: 1 }}
              />
              <Area
                type="monotone"
                dataKey="cumulative"
                stroke="var(--chart-line)"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="url(#dash-quoted-fill)"
                activeDot={{ r: 6, fill: "var(--chart-line)", stroke: "var(--surface)", strokeWidth: 3 }}
                isAnimationActive={!reduce}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <ChartNote>Las propuestas que crees empezarán a dibujar esta curva.</ChartNote>
      )}
    </Panel>
  );
}
