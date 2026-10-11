import { AnimatePresence, motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { Badge } from "../ui.jsx";
import { duration, ease } from "../../motion/presets.js";
import { formatDuration, isFlagged } from "./stages.js";

function DrawnCheck({ reduce }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <motion.path
        d="M5.5 12.5l4.2 4.2L18.5 7.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: reduce ? 0 : duration.reveal, ease: ease.out }}
      />
    </svg>
  );
}

const nodeTone = {
  failed: "border-danger/30 bg-danger/10 text-danger",
  done: "bg-ink text-ink-fg",
  current: "border-brand/40 bg-brand/5 text-brand",
  pending: "border-line bg-surface-2 text-faint",
};

const pulseRingTransition = { duration: 1.4, repeat: Infinity, ease: ease.out };

export function StageStepper({ stages, expanded, onToggle, live, simulationStep, reduce }) {
  return (
    <ol className="space-y-1">
      {stages.map((stage, index) => {
        const status = String(stage.result?.status || "").toUpperCase();
        const done = ["SUCCEEDED", "SUCCESS", "COMPLETED"].includes(status);
        const failed = ["FAILED", "ERROR"].includes(status);
        const reportedRunning = !done && !failed && status === "RUNNING";
        const simulated = !stage.result && live && index === simulationStep;
        const current = reportedRunning || simulated;
        const tone = failed ? "failed" : done ? "done" : current ? "current" : "pending";
        const connectorFilled = done || (!stage.result && live && index < simulationStep);
        const flagged = isFlagged(stage.result);
        const isExpanded = expanded === stage.handler;
        const durationText =
          stage.result?.durationMs != null
            ? formatDuration(stage.result.durationMs)
            : current
            ? "en curso"
            : "por ejecutar";

        return (
          <li key={stage.handler} className="relative">
            <div className="relative flex gap-4">
              {index !== stages.length - 1 && (
                <span aria-hidden="true" className="absolute left-5 top-11 h-[calc(100%-4px)] w-px bg-line">
                  <motion.span
                    className="absolute inset-x-0 top-0 block h-full origin-top bg-brand"
                    initial={false}
                    animate={{ scaleY: connectorFilled ? 1 : 0 }}
                    transition={{ duration: reduce ? 0 : duration.reveal, ease: ease.out }}
                  />
                </span>
              )}
              <button
                type="button"
                onClick={() => onToggle(stage.handler)}
                aria-expanded={isExpanded}
                aria-controls={`stage-detail-${stage.handler}`}
                className="relative z-10 flex min-w-0 flex-1 gap-4 rounded-lg px-2 py-2 text-left transition-colors duration-200 hover:bg-surface-2/70"
              >
                <span className={`relative grid h-12 w-12 shrink-0 place-items-center rounded-full border ${nodeTone[tone]}`}>
                  {current && !reduce && (
                    <motion.span
                      aria-hidden="true"
                      className="absolute -inset-1 rounded-full border border-accent"
                      initial={{ opacity: 0.55, scale: 1 }}
                      animate={{ opacity: 0, scale: 1.5 }}
                      transition={pulseRingTransition}
                    />
                  )}
                  {done ? (
                    <DrawnCheck reduce={reduce} />
                  ) : failed ? (
                    <X size={16} aria-hidden="true" />
                  ) : current ? (
                    <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
                  ) : (
                    <stage.icon size={16} aria-hidden="true" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                    <span className="text-lg font-bold tracking-tight text-fg">{stage.label}</span>
                    <span className="inline-flex items-center rounded-full border border-line bg-surface-2 px-2.5 py-0.5 tabular font-mono text-[11px] text-faint">
                      {durationText}
                    </span>
                  </span>
                  <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-mono text-sm text-faint">{stage.handler}</span>
                    {flagged && <Badge tone="warning">Requiere revisión</Badge>}
                  </span>
                  <span className={`mt-1.5 block text-sm ${failed ? "text-danger" : "text-muted"}`}>
                    {failed ? stage.result?.outputSummary || "La etapa falló sin detalle." : stage.description}
                  </span>
                </span>
              </button>
            </div>
            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  id={`stage-detail-${stage.handler}`}
                  initial={{ opacity: 0, y: reduce ? 0 : 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: reduce ? 0 : -4 }}
                  transition={{ duration: reduce ? duration.micro : duration.state, ease: ease.out }}
                  className="mb-2 ml-16 rounded-xl border border-line bg-surface-2 px-4 py-3 font-mono text-sm leading-6 text-muted"
                >
                  <p className="text-faint">entrada</p>
                  <p className="break-words">{stage.result?.inputSummary || "Sin resumen de entrada."}</p>
                  <p className="mt-2 text-faint">salida</p>
                  <p className="break-words">{stage.result?.outputSummary || "Aún sin salida para esta etapa."}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        );
      })}
    </ol>
  );
}