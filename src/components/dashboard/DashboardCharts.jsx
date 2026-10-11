import { useMemo } from "react";
import { useReducedMotion } from "framer-motion";
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Panel } from "../ui.jsx";
import { duration } from "../../motion/presets.js";
import { buildStatusSeries, buildValueSeries, formatCompactCop } from "./dashboardData.js";
import { formatCurrency } from "../ui.jsx";

const axisTick = { fill: "var(--text-muted)", fontSize: 12 };
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
      <p className="max-w-[32ch] text-sm text-muted">{children}</p>
    </div>
  );
}

export function ProposalsStatusChart({ proposalsByStatus, className = "" }) {
  const data = useMemo(() => buildStatusSeries(proposalsByStatus), [proposalsByStatus]);
  const reduce = useReducedMotion();

  return (
    <Panel className={`flex flex-col p-6 ${className}`}>
      <h2 className="text-lg font-bold tracking-tight text-fg">Propuestas por estado</h2>
      <p className="mt-1 text-sm text-muted">Cómo se reparte tu pipeline hoy</p>
      {data.length === 0 ? (
        <ChartNote>Todavía no hay propuestas que clasificar.</ChartNote>
      ) : (
        <div className="mt-4 h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            {/* One series (count), so one hue: identity is the row label, not a
                color. Thin 16px bars, 4px rounded data-end, value at the tip, no
                gridlines because every bar is labeled (dataviz marks spec). */}
            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 36, bottom: 0, left: 0 }}>
              <XAxis type="number" hide allowDecimals={false} domain={[0, "dataMax"]} />
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
                formatter={(value) => [value, "Propuestas"]}
              />
              <Bar dataKey="count" fill="var(--chart-1)" barSize={16} radius={[0, 4, 4, 0]} isAnimationActive={!reduce} animationDuration={duration.reveal * 1000} animationEasing="ease-out">
                <LabelList dataKey="count" position="right" offset={8} fill="var(--text-muted)" fontSize={12} fontFamily="var(--font-mono)" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Panel>
  );
}

export function QuotedValueChart({ proposals, className = "" }) {
  const data = useMemo(() => buildValueSeries(proposals), [proposals]);
  const total = data.reduce((sum, day) => sum + day.value, 0);
  const hasData = total > 0;
  const peak = Math.max(0, ...data.map((day) => day.value));
  const reduce = useReducedMotion();

  return (
    <Panel className={`flex flex-col p-6 ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-fg">Valor cotizado por día</h2>
          <p className="mt-1 text-sm text-muted">Últimos 14 días, según la fecha de creación de cada propuesta</p>
        </div>
        <span className="font-mono text-sm text-fg">{formatCurrency(total)}</span>
      </div>
      {hasData ? (
        <div className="mt-4 h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            {/* Daily totals are discrete buckets, so columns, not an interpolated
                area (an area implied a ramp between days that never happened).
                Only the peak day is labeled; the tooltip carries the rest. */}
            <BarChart data={data} margin={{ top: 20, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} stroke={gridStroke} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={axisTick} minTickGap={12} interval="preserveStartEnd" />
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
                cursor={{ fill: "var(--surface-2)" }}
                formatter={(value) => [formatCurrency(value), "Valor cotizado"]}
              />
              <Bar dataKey="value" fill="var(--chart-1)" maxBarSize={24} radius={[4, 4, 0, 0]} isAnimationActive={!reduce} animationDuration={duration.reveal * 1000} animationEasing="ease-out">
                <LabelList
                  dataKey="value"
                  position="top"
                  offset={6}
                  fill="var(--text-muted)"
                  fontSize={12}
                  fontFamily="var(--font-mono)"
                  formatter={(value) => (value === peak && value > 0 ? formatCompactCop(value) : "")}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <ChartNote>Las propuestas que crees empezarán a dibujar esta curva.</ChartNote>
      )}
    </Panel>
  );
}
