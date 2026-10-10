import { useId, useMemo } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Panel } from "../ui.jsx";
import { CHART_COLORS, buildStatusSeries, buildValueSeries, formatCompactCop } from "./dashboardData.js";
import { formatCurrency } from "../ui.jsx";

const axisTick = { fill: "var(--text-muted)", fontSize: 11 };
const gridStroke = "var(--border)";
const tooltipContent = {
  backgroundColor: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: "10px",
  boxShadow: "var(--shadow-overlay)",
  color: "var(--text)",
  fontSize: "12px",
  padding: "6px 10px",
};

function ChartNote({ children }) {
  return (
    <div className="grid h-[240px] place-items-center px-6 text-center">
      <p className="max-w-[32ch] text-xs text-muted">{children}</p>
    </div>
  );
}

export function ProposalsStatusChart({ proposalsByStatus, className = "" }) {
  const data = useMemo(() => buildStatusSeries(proposalsByStatus), [proposalsByStatus]);

  return (
    <Panel className={`flex flex-col p-5 ${className}`}>
      <h2 className="text-sm font-semibold text-fg">Propuestas por estado</h2>
      <p className="mt-1 text-xs text-muted">Cómo se reparte tu pipeline hoy</p>
      {data.length === 0 ? (
        <ChartNote>Todavía no hay propuestas que clasificar.</ChartNote>
      ) : (
        <div className="mt-4 h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 0 }} barCategoryGap="30%">
              <CartesianGrid horizontal={false} stroke={gridStroke} />
              <XAxis type="number" hide allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="label"
                width={116}
                tickLine={false}
                axisLine={false}
                tick={axisTick}
              />
              <Tooltip
                contentStyle={tooltipContent}
                itemStyle={{ color: "var(--text)" }}
                labelStyle={{ color: "var(--text-muted)" }}
                cursor={{ fill: "var(--surface-2)" }}
              />
              <Bar dataKey="count" radius={[0, 6, 6, 0]} isAnimationActive animationDuration={480}>
                {data.map((entry, index) => (
                  <Cell key={entry.status} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Panel>
  );
}

export function QuotedValueChart({ proposals, className = "" }) {
  const gradientId = useId().replace(/:/g, "");
  const data = useMemo(() => buildValueSeries(proposals), [proposals]);
  const total = data.reduce((sum, day) => sum + day.value, 0);
  const hasData = total > 0;

  return (
    <Panel className={`flex flex-col p-5 ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-fg">Valor cotizado (14 días)</h2>
          <p className="mt-1 text-xs text-muted">Suma de los totales por día de creación</p>
        </div>
        <span className="font-mono text-sm text-fg">{formatCurrency(total)}</span>
      </div>
      {hasData ? (
        <div className="mt-4 h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.32} />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke={gridStroke} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={axisTick} minTickGap={16} />
              <YAxis
                tickFormatter={formatCompactCop}
                tickLine={false}
                axisLine={false}
                tick={axisTick}
                width={64}
              />
              <Tooltip
                contentStyle={tooltipContent}
                itemStyle={{ color: "var(--text)" }}
                labelStyle={{ color: "var(--text-muted)" }}
                formatter={(value) => [formatCurrency(value), "Valor"]}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--accent)"
                strokeWidth={2}
                fill={`url(#${gradientId})`}
                dot={false}
                isAnimationActive
                animationDuration={480}
                activeDot={{ r: 3, fill: "var(--accent)", stroke: "var(--surface)" }}
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
