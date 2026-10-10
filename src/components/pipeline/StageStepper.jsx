import { AnimatePresence, motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { Badge } from "../ui.jsx";
import { duration, ease } from "../../motion/presets.js";
import { formatDuration, isFlagged } from "./stages.js";

// Check drawn stroke by stroke, so a finished step reads as "sealed".
function DrawnCheck({ reduce }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <motion.path
        d="M5.5 12.5l4.2 4.2L18.5 7.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
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
  done: "border-success/25 bg-success/10 text-success",
  current: "border-accent/40 bg-accent-soft text-accent",
  pending: "border-line bg-surface-2 text-faint",
};

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
            <div className="relative flex gap-3">
              {index !== stages.length - 1 && (
                <span aria-hidden="true" className="absolute left-4 top-9 h-[calc(100%-2px)] w-px bg-line">
                  <motion.span
                    className="absolute inset-x-0 top-0 block h-full origin-top bg-accent"
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
                className="relative z-10 flex min-w-0 flex-1 gap-3 rounded-lg px-1.5 py-1.5 text-left transition-colors duration-200 hover:bg-surface-2/70"
              >
                <span className={`relative grid h-8 w-8 shrink-0 place-items-center rounded-full border ${nodeTone[tone]}`}>
                  {current && !reduce && (
                    <motion.span
                      aria-hidden="true"
                      className="absolute -inset-0.5 rounded-full border border-accent"
                      initial={{ opacity: 0.55, scale: 1 }}
                      animate={{ opacity: 0, scale: 1.4 }}
                      transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
                    />
                  )}
                  {done ? (
                    <DrawnCheck reduce={reduce} />
                  ) : failed ? (
                    <X size={14} aria-hidden="true" />
                  ) : current ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
                  ) : (
                    <stage.icon size={14} aria-hidden="true" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                    <span className={`text-[13px] font-medium ${tone === "pending" ? "text-muted" : "text-fg"}`}>
                      {stage.label}
                    </span>
                    <span className="tabular font-mono text-[11px] text-faint">{durationText}</span>
                  </span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-mono text-[11px] text-faint">{stage.handler}</span>
                    {flagged && <Badge tone="warning">Requiere revisión</Badge>}
                  </span>
                  <span className={`mt-1 block text-xs ${failed ? "text-danger" : "text-muted"}`}>
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
                  className="mb-2 ml-11 rounded-md border border-line bg-surface-2 px-3 py-2.5 font-mono text-[11px] leading-5 text-muted"
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
