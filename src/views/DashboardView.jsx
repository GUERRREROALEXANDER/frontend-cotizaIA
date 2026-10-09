import { ArrowUpRight, BriefcaseBusiness, Clock3, FileCheck2, Percent, Radio, Sparkles } from "lucide-react";
import { formatCurrency, formatDate, MetricCard, Panel, SectionHeading, StatusBadge } from "../components/ui.jsx";
import AgentCity from "../components/AgentCity.jsx";

export default function DashboardView({ analytics, proposals, clients, queue, briefs = [], activeExecution, onNavigate }) {
  const statusEntries = Object.entries(analytics?.proposalsByStatus || {}).filter(([, count]) => count > 0);
  const total = Number(analytics?.totalProposals || 0);
  const acceptanceRate = Number(analytics?.acceptanceRate || 0) * 100;
  const recent = [...proposals].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

  return (
    <div className="portal-in">
      <SectionHeading
        eyebrow="Vista ejecutiva · Agencia"
        title="El trabajo nunca se detiene."
        description="Acompaña cada oportunidad desde el primer brief hasta la propuesta."
        action={
          <div className="flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[.06] px-3 py-2 text-[10px] font-medium text-emerald-300">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
              <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            API conectada
          </div>
        }
      />

      <div className="mb-5">
        <AgentCity
          briefCount={briefs.length}
          activeAgents={activeExecution?.status === "RUNNING" ? 1 : 0}
          reviewCount={queue.length}
          onNavigate={onNavigate}
        />
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Percent} label="Tasa de aceptación" value={`${acceptanceRate.toFixed(1)}%`} detail="Propuestas aceptadas / enviadas" accent="amber" delay={0.02} />
        <MetricCard icon={BriefcaseBusiness} label="Propuestas procesadas" value={total.toLocaleString("es-CO")} detail="Histórico de tu agencia" accent="indigo" delay={0.08} />
        <MetricCard icon={Clock3} label="Tiempo de respuesta" value={analytics?.averageResponseTimeMinutes == null ? "—" : `${(Number(analytics.averageResponseTimeMinutes) / 60).toFixed(1)} h`} detail="Promedio desde recepción hasta envío" accent="slate" delay={0.14} />
        <MetricCard icon={FileCheck2} label="En revisión" value={queue.length.toLocaleString("es-CO")} detail="Pendientes de aprobación humana" accent="emerald" delay={0.2} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_.85fr]">
        <Panel className="overflow-hidden">
          <div className="flex items-start justify-between border-b border-slate-800/70 px-5 py-5 sm:px-6">
            <div>
              <p className="text-sm font-semibold text-slate-100">Actividad comercial</p>
              <p className="mt-1 text-xs text-slate-500">Distribución actual de tus propuestas</p>
            </div>
            <span className="rounded-lg border border-slate-700/70 bg-slate-900/70 px-2.5 py-1.5 font-mono text-[10px] text-slate-400">{total} total</span>
          </div>
          <div className="space-y-4 px-5 py-6 sm:px-6">
            {statusEntries.length ? statusEntries.map(([status, count]) => (
              <div key={status} className="grid grid-cols-[112px_1fr_32px] items-center gap-3">
                <StatusBadge status={status} />
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className={`h-full rounded-full transition-all ${status === "ACCEPTED" ? "bg-amber-400" : status === "IN_REVIEW" ? "bg-indigo-400" : "bg-slate-500"}`}
                    style={{ width: `${total ? Math.max((Number(count) / total) * 100, 2) : 0}%` }}
                  />
                </div>
                <span className="text-right font-mono text-xs text-slate-400">{count}</span>
              </div>
            )) : (
              <div className="py-7 text-center text-xs text-slate-500">Aún no hay actividad. Al procesar tu primer brief aparecerán los resultados.</div>
            )}
          </div>
          <div className="grid grid-cols-2 divide-x divide-slate-800/70 border-t border-slate-800/70">
            <div className="px-5 py-4 sm:px-6">
              <span className="text-[10px] uppercase tracking-[.16em] text-slate-500">Propuestas enviadas</span>
              <p className="mt-1.5 font-mono text-lg text-slate-100">{analytics?.sentCount ?? 0}</p>
            </div>
            <div className="px-5 py-4 sm:px-6">
              <span className="text-[10px] uppercase tracking-[.16em] text-slate-500">Aceptadas</span>
              <p className="mt-1.5 font-mono text-lg text-amber-300">{analytics?.acceptedCount ?? 0}</p>
            </div>
          </div>
        </Panel>

        <Panel className="flex flex-col p-5 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-100">Revisión humana</p>
              <p className="mt-1 text-xs text-slate-500">El último control antes del cliente</p>
            </div>
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-400/10 text-amber-300"><Sparkles size={17} /></span>
          </div>
          <div className="my-6 flex items-end gap-2">
            <span className="font-mono text-4xl tracking-tight text-slate-100">{queue.length.toString().padStart(2, "0")}</span>
            <span className="pb-1 text-xs text-slate-500">en cola</span>
          </div>
          <div className="space-y-3">
            {queue.slice(0, 3).map((proposal) => (
              <div key={proposal.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-800/70 bg-slate-950/35 px-3.5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-slate-200">Propuesta #{proposal.id}</p>
                  <p className="mt-1 text-[10px] text-slate-500">{formatDate(proposal.createdAt)}</p>
                </div>
                <span className="shrink-0 font-mono text-xs text-amber-300">{formatCurrency(proposal.total)}</span>
              </div>
            ))}
            {!queue.length && <p className="rounded-xl border border-slate-800/50 px-3.5 py-4 text-xs text-slate-500">Tu cola está despejada por ahora.</p>}
          </div>
          <button type="button" onClick={() => onNavigate("proposals")} className="mt-auto flex items-center justify-between border-t border-slate-800/70 pt-4 text-xs text-indigo-600 transition hover:text-indigo-700">
            Abrir bandeja de aprobación <ArrowUpRight size={14} />
          </button>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.35fr_.85fr]">
        <Panel className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800/70 px-5 py-4 sm:px-6">
            <div>
              <p className="text-sm font-semibold text-slate-100">Últimas propuestas</p>
              <p className="mt-1 text-xs text-slate-500">Seguimiento del trabajo reciente</p>
            </div>
            <button onClick={() => onNavigate("proposals")} className="text-[10px] font-medium text-slate-400 transition hover:text-slate-100">Ver todas</button>
          </div>
          <div className="divide-y divide-slate-800/50">
            {recent.map((proposal) => (
              <div key={proposal.id} className="grid grid-cols-[1fr_auto] items-center gap-3 px-5 py-3.5 sm:grid-cols-[1fr_130px_100px] sm:px-6">
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-slate-200">Propuesta #{proposal.id}</p>
                  <p className="mt-1 text-[10px] text-slate-500">Brief #{proposal.briefId} · {formatDate(proposal.createdAt)}</p>
                </div>
                <span className="hidden text-right font-mono text-xs text-slate-300 sm:block">{formatCurrency(proposal.total)}</span>
                <span className="justify-self-end"><StatusBadge status={proposal.status} /></span>
              </div>
            ))}
            {!recent.length && <p className="px-6 py-8 text-center text-xs text-slate-500">Todavía no hay propuestas que mostrar.</p>}
          </div>
        </Panel>
        <Panel className="p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-100">Equipo comercial</p>
              <p className="mt-1 text-xs text-slate-500">Clientes activos registrados</p>
            </div>
            <Radio size={17} className="text-slate-500" />
          </div>
          <div className="mt-6 flex items-baseline gap-2">
            <span className="font-mono text-3xl text-slate-100">{clients.length.toString().padStart(2, "0")}</span>
            <span className="text-xs text-slate-500">clientes</span>
          </div>
          <div className="mt-4 flex -space-x-2">
            {clients.slice(0, 5).map((client) => (
              <span key={client.id} title={client.name} className="grid h-8 w-8 place-items-center rounded-full border-2 border-slate-950 bg-slate-800 text-[9px] font-semibold text-slate-300">
                {client.name?.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}
              </span>
            ))}
            {!clients.length && <span className="text-xs text-slate-500">Agrega clientes desde la bandeja de briefs.</span>}
            {clients.length > 5 && <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-slate-950 bg-slate-800 text-[9px] text-slate-400">+{clients.length - 5}</span>}
          </div>
          <div className="mt-6 rounded-xl border border-slate-800/70 bg-slate-950/40 px-3.5 py-3 text-[10px] leading-5 text-slate-500">
            El tablero muestra únicamente datos guardados por tu agencia en CotizaIA.
          </div>
        </Panel>
      </div>
    </div>
  );
}
