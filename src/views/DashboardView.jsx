import { Clock3, FileText, Inbox, ListChecks, Percent, Sparkles, Users } from "lucide-react";
import { Badge, Button, EmptyState, KpiTile, PageHeader, Panel } from "../components/ui.jsx";
import { AgentRunPanel } from "../components/dashboard/AgentRunPanel.jsx";
import { AttentionList } from "../components/dashboard/AttentionList.jsx";
import { ProposalsStatusChart, QuotedValueChart } from "../components/dashboard/DashboardCharts.jsx";
import { RecentBriefs } from "../components/dashboard/RecentBriefs.jsx";
import { DashboardSkeleton } from "../components/dashboard/DashboardSkeleton.jsx";
import { acceptancePercent, formatMinutes, greetingForHour } from "../components/dashboard/dashboardData.js";

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
  const loading = analytics == null;
  const totalProposals = Number(analytics?.totalProposals || 0);
  const acceptance = acceptancePercent(analytics?.acceptanceRate);
  const responseMinutes = Number(analytics?.averageResponseTimeMinutes || 0);
  const pending = queue.length;
  const firstNameEmpty = proposals.length === 0;
  const summary = pending
    ? `${pending} ${pending === 1 ? "propuesta espera" : "propuestas esperan"} tu revisión`
    : "Todo al día, ninguna propuesta en cola";

  return (
    <div className="space-y-5">
      <PageHeader
        title={greetingForHour()}
        description={summary}
        actions={
          <>
            <Badge tone="neutral">
              <Users size={12} aria-hidden />
              {clients.length} {clients.length === 1 ? "cliente" : "clientes"}
            </Badge>
            <Button variant="primary" icon={Sparkles} onClick={() => onNavigate("inbox")}>
              Nuevo brief
            </Button>
          </>
        }
      />

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KpiTile
              icon={FileText}
              label="Propuestas"
              value={totalProposals}
              detail="Histórico de tu agencia"
            />
            <KpiTile
              icon={Percent}
              label="Tasa de aceptación"
              value={acceptance}
              format={(n) => `${n.toFixed(1)}%`}
              detail={`${analytics?.acceptedCount ?? 0} de ${analytics?.sentCount ?? 0} enviadas`}
            />
            <KpiTile
              icon={Clock3}
              label="Respuesta promedio"
              value={responseMinutes}
              format={formatMinutes}
              detail="Desde que el brief llega hasta que se envía"
            />
            <KpiTile
              icon={ListChecks}
              label="Por revisar"
              value={pending}
              detail="Esperando tu aprobación"
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-12">
            {firstNameEmpty ? (
              <>
                <Panel className="rounded-xl xl:col-span-7">
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
