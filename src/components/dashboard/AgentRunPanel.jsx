import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Bot, ListChecks, Timer } from "lucide-react";
import { Button, Panel, StatusBadge, formatDateTime } from "../ui.jsx";
import { FadeUp } from "../../motion/Motion.jsx";
import { executionDurationMs, formatDuration, stepCount } from "./dashboardData.js";

const panelStyle = {
  background: "linear-gradient(120deg, var(--accent-soft) 0%, var(--surface) 70%)",
};

export function AgentRunPanel({ activeExecution, recentExecution, onNavigate, className = "" }) {
  const execution = activeExecution || recentExecution;
  const reduce = useReducedMotion();

  if (!execution) {
    // Empty state keeps the mascot so the panel still feels alive before the
    // first run; the user asked for it on this panel.
    return (
      <Panel className={`flex flex-col items-center gap-6 rounded-2xl p-8 text-center sm:flex-row sm:text-left ${className}`} style={panelStyle}>
        <motion.img
          src="/brand/agent-mascot.png"
          alt="Mascota de CotizaIA"
          width={128}
          height={128}
          className="h-32 w-32 shrink-0 rounded-2xl object-cover"
          initial={false}
          animate={reduce ? undefined : { y: [0, -6, 0] }}
          transition={reduce ? undefined : { duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <FadeUp delay={0.1} className="min-w-0 flex-1">
          <h2 className="text-xl font-bold tracking-tight text-fg">Tu agente está listo</h2>
          <p className="mt-1.5 max-w-[52ch] text-sm leading-6 text-muted">
            Cuando proceses tu primer brief, verás aquí cuánto tardó y cada paso que dio.
          </p>
          <div className="mt-4">
            <Button variant="primary" onClick={() => onNavigate("inbox")}>
              Crear el primer brief
            </Button>
          </div>
        </FadeUp>
      </Panel>
    );
  }

  const live = Boolean(activeExecution && !activeExecution.finishedAt);
  const steps = stepCount(execution);
  const duration = formatDuration(executionDurationMs(execution));

  return (
    <Panel
      className={`flex flex-col gap-5 rounded-2xl p-6 lg:flex-row lg:items-center lg:justify-between ${className}`}
      style={panelStyle}
    >
      <div className="flex min-w-0 items-center gap-5">
        <motion.img
          src="/brand/agent-mascot.png"
          alt="Mascota de CotizaIA"
          width={112}
          height={112}
          className="h-28 w-28 shrink-0 rounded-2xl object-cover"
          initial={false}
          animate={reduce ? undefined : { y: [0, -6, 0] }}
          transition={reduce ? undefined : { duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
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
