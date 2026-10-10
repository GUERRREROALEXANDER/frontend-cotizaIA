import { ArrowRight, Bot, ListChecks, Timer } from "lucide-react";
import { Button, Panel, StatusBadge, formatDateTime } from "../ui.jsx";
import { executionDurationMs, formatDuration, stepCount } from "./dashboardData.js";

export function AgentRunPanel({ activeExecution, recentExecution, onNavigate, className = "" }) {
  const execution = activeExecution || recentExecution;
  const live = Boolean(activeExecution && !activeExecution.finishedAt);
  const steps = stepCount(execution);
  const duration = formatDuration(executionDurationMs(execution));

  return (
    <Panel className={`flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between ${className}`}>
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line bg-surface-2 text-accent">
          <Bot size={18} aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-fg">Última ejecución del agente</h2>
          <p className="mt-0.5 truncate text-xs text-muted">
            {execution
              ? `Brief #${execution.briefId} · ${formatDateTime(execution.startedAt)}`
              : "Todavía no hay ejecuciones registradas"}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex items-center gap-2">
          <StatusBadge status={execution?.status || "PENDING"} />
          {live && <span className="text-xs font-medium text-info">En curso</span>}
        </div>
        <div className="flex items-center gap-2">
          <ListChecks size={14} className="text-faint" aria-hidden />
          <span className="font-mono text-[13px] text-fg">{steps}</span>
          <span className="text-xs text-muted">{steps === 1 ? "paso" : "pasos"}</span>
        </div>
        <div className="flex items-center gap-2">
          <Timer size={14} className="text-faint" aria-hidden />
          <span className="font-mono text-[13px] text-fg">{execution ? duration : "Sin datos"}</span>
        </div>
        <Button variant="secondary" icon={ArrowRight} onClick={() => onNavigate("pipeline")}>
          Abrir monitor
        </Button>
      </div>
    </Panel>
  );
}
