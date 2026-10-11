import { ArrowRight, Bot, ListChecks, Timer } from "lucide-react";
import { Button, EmptyState, Panel, StatusBadge, formatDateTime } from "../ui.jsx";
import { FadeUp } from "../../motion/Motion.jsx";
import { executionDurationMs, formatDuration, stepCount } from "./dashboardData.js";

export function AgentRunPanel({ activeExecution, recentExecution, onNavigate, className = "" }) {
  const execution = activeExecution || recentExecution;

  if (!execution) {
    return (
      <Panel className={className}>
        <FadeUp delay={0.1}>
          <EmptyState
            icon={Bot}
            title="Sin ejecuciones todavía"
            description="Cuando proceses tu primer brief, verás aquí cada paso del agente."
            action={
              <Button variant="primary" onClick={() => onNavigate("inbox")}>
                Crear el primer brief
              </Button>
            }
          />
        </FadeUp>
      </Panel>
    );
  }

  const live = Boolean(activeExecution && !activeExecution.finishedAt);
  const steps = stepCount(execution);
  const duration = formatDuration(executionDurationMs(execution));

  return (
    <Panel className={`flex flex-col gap-5 p-6 lg:flex-row lg:items-center lg:justify-between ${className}`}>
      <div className="flex min-w-0 items-center gap-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent-soft text-brand">
          <Bot size={19} aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-bold tracking-tight text-fg">Última ejecución del agente</h2>
          <p className="mt-0.5 truncate text-sm text-muted">
            {`Brief #${execution.briefId} · ${formatDateTime(execution.startedAt)}`}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex items-center gap-2">
          <StatusBadge status={execution?.status || "PENDING"} />
          {live && <span className="text-sm font-medium text-info">En curso</span>}
        </div>
        <div className="flex items-center gap-2">
          <ListChecks size={15} className="text-faint" aria-hidden />
          <span className="font-mono text-sm text-fg tabular">{steps}</span>
          <span className="text-sm text-muted">{steps === 1 ? "paso" : "pasos"}</span>
        </div>
        <div className="flex items-center gap-2">
          <Timer size={15} className="text-faint" aria-hidden />
          <span className="font-mono text-sm text-fg tabular">{duration}</span>
        </div>
        <Button variant="secondary" icon={ArrowRight} onClick={() => onNavigate("pipeline")}>
          Abrir monitor
        </Button>
      </div>
    </Panel>
  );
}
