import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Clock3, FileText, Inbox, ListChecks, Percent, Sparkles } from "lucide-react";
import { Line, LineChart, ResponsiveContainer } from "recharts";
import { Button, EmptyState, InkPanel, KpiTile, Panel } from "../components/ui.jsx";
import { CountUp, FadeUp, MaskedText, StaggerItem } from "../motion/Motion.jsx";
import { duration } from "../motion/presets.js";
import AnimatedLink from "../components/motion/AnimatedLink.jsx";
import { AgentRunPanel } from "../components/dashboard/AgentRunPanel.jsx";
import { AttentionList } from "../components/dashboard/AttentionList.jsx";
import { OnboardingChecklist } from "../components/dashboard/OnboardingChecklist.jsx";
import { ProposalsStatusChart, QuotedValueChart } from "../components/dashboard/DashboardCharts.jsx";
import { RecentBriefs } from "../components/dashboard/RecentBriefs.jsx";
import { DashboardSkeleton } from "../components/dashboard/DashboardSkeleton.jsx";
import { acceptancePercent, buildCountSeries, formatCompactCop, formatMinutes, greetingForHour } from "../components/dashboard/dashboardData.js";

// Organic lime glow behind the hero content: a radial SVG blob on a slow
// rotate and drift loop (transform only). Static when reduced motion is on.
function HeroBlob() {
  const reduce = useReducedMotion();
  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute -right-28 -top-36 h-[440px] w-[440px]"
      initial={false}
      animate={reduce ? undefined : { rotate: [0, 360], x: [0, 40, -24, 0], y: [0, -28, 24, 0] }}
      transition={reduce ? undefined : { duration: 16, repeat: Infinity, ease: "linear" }}
    >
      <svg viewBox="0 0 400 400" className="h-full w-full">
        <defs>
          <radialGradient id="dash-hero-blob" cx="50%" cy="50%" r="50%">
            <stop offset="0%" style={{ stopColor: "var(--ink-fg)", stopOpacity: 0.5 }} />
            <stop offset="100%" style={{ stopColor: "var(--ink-fg)", stopOpacity: 0 }} />
          </radialGradient>
        </defs>
        <path
          d="M214 28c82 8 148 84 144 172-4 88-84 158-172 152S34 268 38 180 132 20 214 28Z"
          fill="url(#dash-hero-blob)"
        />
      </svg>
    </motion.div>
  );
}

export default function DashboardView({
  analytics,
  proposals = [],
  clients = [],
  queue = [],
  briefs = [],
  activeExecution,
  recentExecution,
  onNavigate,
  onOpenProposal,
  onOpenBrief,
}) {
  const reduce = useReducedMotion();
  const lift = reduce ? undefined : { y: -3 };

  const loading = analytics == null;
  const totalProposals = Number(analytics?.totalProposals || 0);
  const acceptance = acceptancePercent(analytics?.acceptanceRate);
  const responseMinutes = Number(analytics?.averageResponseTimeMinutes || 0);
  const pending = queue.length;
  const isNew = proposals.length === 0;
  const summary = pending
    ? `${pending} ${pending === 1 ? "propuesta espera" : "propuestas esperan"} tu revisión`
    : "Todo al día, ninguna propuesta en cola";

  const monthValue = useMemo(() => {
    const now = new Date();
    return (proposals || []).reduce((sum, proposal) => {
      const created = new Date(proposal?.createdAt);
      if (Number.isNaN(created.getTime())) return sum;
      if (created.getFullYear() !== now.getFullYear() || created.getMonth() !== now.getMonth()) return sum;
      return sum + (Number(proposal?.total) || 0);
    }, 0);
  }, [proposals]);

  const spark = useMemo(() => buildCountSeries(proposals), [proposals]);

  return (
    <div className="space-y-8">
      <InkPanel className="p-8 lg:p-10">
        <HeroBlob />
        <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_auto]">
          <div className="min-w-0">
            <MaskedText
              as="h1"
              text={`${greetingForHour()}, Agencia`}
              className="display block text-[clamp(2.25rem,4.5vw,3.75rem)] text-ink-fg"
            />
            <p className="mt-3 max-w-[60ch] text-base text-ink-text/80">{summary}</p>
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Button variant="primary" size="lg" icon={Sparkles} onClick={() => onNavigate("inbox")}>
                Nuevo brief
              </Button>
              <AnimatedLink onClick={() => onNavigate("proposals")} className="text-ink-fg! text-base">
                Ver propuestas
              </AnimatedLink>
            </div>
          </div>
          <div className="lg:text-right">
            <p className="text-sm font-medium text-ink-text/70">Valor cotizado este mes</p>
            <p className="display mt-2 text-[clamp(2.5rem,5vw,4.5rem)] text-ink-fg">
              <CountUp value={monthValue} format={formatCompactCop} />
            </p>
          </div>
        </div>
      </InkPanel>

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            <StaggerItem index={0} className="sm:col-span-2 xl:col-span-2" whileHover={lift}>
              <KpiTile
                icon={FileText}
                label="Propuestas"
                value={totalProposals}
                detail="Histórico de tu agencia"
                className="h-full"
              >
                <div className="h-12" aria-hidden="true">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={spark} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="var(--chart-1)"
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={!reduce}
                        animationDuration={duration.reveal * 1000}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </KpiTile>
            </StaggerItem>
            <StaggerItem index={1} whileHover={lift}>
              <KpiTile
                icon={Percent}
                label="Tasa de aceptación"
                value={acceptance}
                format={(n) => `${n.toFixed(1)}%`}
                detail={`${analytics?.acceptedCount ?? 0} de ${analytics?.sentCount ?? 0} enviadas`}
                className="h-full"
              />
            </StaggerItem>
            <StaggerItem index={2} whileHover={lift}>
              <KpiTile
                icon={Clock3}
                label="Respuesta promedio"
                value={responseMinutes}
                format={formatMinutes}
                detail="Desde que el brief llega hasta que se envía"
                className="h-full"
              />
            </StaggerItem>
            <StaggerItem index={3} whileHover={lift}>
              <KpiTile
                icon={ListChecks}
                label="Por revisar"
                value={pending}
                detail="Esperando tu aprobación"
                className="h-full"
              />
            </StaggerItem>
          </div>

          <OnboardingChecklist
            clientsCount={clients.length}
            proposalsCount={proposals.length}
            onNavigate={onNavigate}
          />

          <div className="grid gap-6 xl:grid-cols-12">
            {isNew ? (
              <>
                <Panel className="xl:col-span-7">
                  <FadeUp delay={0.1}>
                    <EmptyState
                      icon={Inbox}
                      title="Crea tu primer brief"
                      description="Pega el mensaje de tu cliente o sube el PDF: el agente lo analiza, arma la cotización y te la deja lista para revisar."
                      action={
                        <Button variant="primary" icon={Sparkles} onClick={() => onNavigate("inbox")}>
                          Crear el primer brief
                        </Button>
                      }
                    />
                  </FadeUp>
                </Panel>
                <AttentionList
                  className="xl:col-span-5"
                  queue={queue}
                  onOpenProposal={onOpenProposal}
                  onNavigate={onNavigate}
                />
                <RecentBriefs
                  className="xl:col-span-5"
                  briefs={briefs}
                  onOpenBrief={onOpenBrief}
                  onNavigate={onNavigate}
                />
                <AgentRunPanel
                  className="xl:col-span-7"
                  activeExecution={activeExecution}
                  recentExecution={recentExecution}
                  onNavigate={onNavigate}
                />
              </>
            ) : (
              <>
                <ProposalsStatusChart
                  className="xl:col-span-7"
                  proposalsByStatus={analytics?.proposalsByStatus}
                />
                <AttentionList
                  className="xl:col-span-5"
                  queue={queue}
                  onOpenProposal={onOpenProposal}
                  onNavigate={onNavigate}
                />
                <QuotedValueChart className="xl:col-span-8" proposals={proposals} />
                <RecentBriefs
                  className="xl:col-span-4"
                  briefs={briefs}
                  onOpenBrief={onOpenBrief}
                  onNavigate={onNavigate}
                />
                <AgentRunPanel
                  className="xl:col-span-12"
                  activeExecution={activeExecution}
                  recentExecution={recentExecution}
                  onNavigate={onNavigate}
                />
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
