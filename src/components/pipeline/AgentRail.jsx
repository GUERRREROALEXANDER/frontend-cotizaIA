import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, SkipForward, X } from "lucide-react";
import { Badge, Button } from "../ui.jsx";
import { duration, ease } from "../../motion/presets.js";
import { agentStages, formatDuration, isFlagged } from "./stages.js";

// Horizontal rail of the seven agent stages. It replaces the vertical stepper
// and the 3D scene: one track, a brief token that travels to the stage being
// worked on, and the detail of the selected stage underneath.

const DONE = ["SUCCEEDED", "SUCCESS", "COMPLETED"];
const FAILED = ["FAILED", "ERROR"];

const STAGE_COPY = {
  Classify: "Detecta el tipo de proyecto",
  Extract: "Saca los requisitos del brief",
  Estimate: "Calcula horas por requisito",
  Price: "Aplica tu tarifa y estrategia",
  AmbiguityCheck: "Marca lo que hay que preguntar",
  Generate: "Arma propuesta, contrato y cronograma",
  Compose: "Deja todo listo para tu revisión",
};

// One state per stage, derived from the API step or from the simulation that
// runs while the backend has not reported steps yet.
export function stageState(stage, index, { live, simulationStep }) {
  const status = String(stage.result?.status || "").toUpperCase();
  if (DONE.includes(status)) return isFlagged(stage.result) ? "flagged" : "done";
  if (FAILED.includes(status)) return "failed";
  if (status === "SKIPPED") return "skipped";
  if (status === "RUNNING") return "running";
  if (!stage.result && live) {
    if (index < simulationStep) return "done";
    if (index === simulationStep) return "running";
  }
  return "pending";
}

const nodeStyle = {
  done: "border-transparent bg-accent text-accent-fg",
  flagged: "border-transparent bg-[var(--status-review-bg)] text-[var(--status-review-fg)]",
  failed: "border-danger bg-surface text-danger",
  running: "border-brand bg-surface text-brand",
  skipped: "border-line bg-surface text-faint",
  pending: "border-line bg-surface text-faint",
};

// The station circle. Shared with the auth demo so both rails look the same.
export function RailNode({ state, icon: Icon, size = "md", reduce }) {
  const box = size === "sm" ? "h-7 w-7" : "h-10 w-10";
  const iconSize = size === "sm" ? 13 : 16;
  return (
    <span className={`relative grid ${box} shrink-0 place-items-center rounded-full border-2 transition-colors duration-200 ${nodeStyle[state]}`}>
      {/* Live status: the one looping element, only while a stage is actually running. */}
      {state === "running" && !reduce && (
        <motion.span
          aria-hidden="true"
          className="absolute inset-[-2px] rounded-full border-2 border-brand"
          initial={{ opacity: 0.5, scale: 1 }}
          animate={{ opacity: 0, scale: 1.6 }}
          transition={{ duration: 1.6, repeat: Infinity, ease: ease.out }}
        />
      )}
      {(state === "done" || state === "flagged") && <Check size={iconSize} strokeWidth={2.5} aria-hidden="true" />}
      {state === "failed" && <X size={iconSize} strokeWidth={2.5} aria-hidden="true" />}
      {state === "skipped" && <SkipForward size={iconSize} aria-hidden="true" />}
      {(state === "running" || state === "pending") && Icon && <Icon size={iconSize} aria-hidden="true" />}
    </span>
  );
}

// Fraction of the track that is filled: up to the furthest stage reached.
export function trackProgress(states) {
  let reached = -1;
  states.forEach((state, index) => {
    if (state !== "pending") reached = index;
  });
  return reached <= 0 ? 0 : reached / (states.length - 1);
}

// The track sits behind the node centers: inset by half a column on each side.
export function RailTrack({ progress, reduce, columns = 7, top = "top-5" }) {
  const inset = `${50 / columns}%`;
  return (
    <span aria-hidden="true" className={`absolute ${top} h-[3px] -translate-y-1/2 rounded-full bg-line`} style={{ left: inset, right: inset }}>
      <motion.span
        className="absolute inset-0 origin-left rounded-full bg-brand"
        initial={false}
        animate={{ scaleX: progress }}
        transition={{ duration: reduce ? 0 : duration.reveal, ease: ease.out }}
      />
    </span>
  );
}

function StageDetail({ stage, state }) {
  const result = stage.result;
  const chips = (result?.outputSummary || "")
    .replace("[FLAG]", "")
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);
  const timing =
    result?.durationMs != null
      ? formatDuration(result.durationMs)
      : state === "running"
      ? "En curso"
      : state === "skipped"
      ? "Omitida"
      : "Por ejecutar";

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-semibold text-fg">{stage.label}</h3>
          {state === "flagged" && <Badge tone="warning">Requiere revisión</Badge>}
          {state === "failed" && <Badge tone="danger">Fallida</Badge>}
        </div>
        <p className="mt-1 text-sm text-muted">{STAGE_COPY[stage.handler] || stage.description}</p>
        <dl className="mt-4 flex gap-8 text-sm">
          <div>
            <dt className="text-xs text-faint">Tiempo</dt>
            <dd className="tabular mt-0.5 font-mono text-fg">{timing}</dd>
          </div>
          <div>
            <dt className="text-xs text-faint">Etapa</dt>
            <dd className="mt-0.5 font-mono text-fg">{stage.handler}</dd>
          </div>
        </dl>
      </div>
      <div className="rounded-xl border border-line bg-surface-2 p-4 font-mono text-[13px] leading-6">
        <p className="text-xs text-faint">Entrada</p>
        <p className="break-words text-muted">{result?.inputSummary || "Sin resumen de entrada"}</p>
        <p className="mt-3 text-xs text-faint">Salida</p>
        {chips.length > 0 ? (
          <ul className="mt-1 flex flex-wrap gap-1.5" aria-label="Salidas de la etapa">
            {chips.map((chip) => (
              <li key={chip} className="rounded-md bg-surface px-2 py-0.5 text-fg">
                {chip}
              </li>
            ))}
          </ul>
        ) : (
          <p className={state === "failed" ? "text-danger" : "text-muted"}>
            {state === "failed" ? result?.outputSummary || "La etapa falló sin detalle" : "Aún sin salida"}
          </p>
        )}
      </div>
    </div>
  );
}

// Empty state: the token runs the seven stations once, then waits.
function useDemoRun(enabled, reduce) {
  const [step, setStep] = useState(reduce || !enabled ? agentStages.length : 0);
  useEffect(() => {
    if (!enabled || reduce) return undefined;
    setStep(0);
    const timer = window.setInterval(
      () => setStep((current) => (current >= agentStages.length ? current : current + 1)),
      700,
    );
    return () => window.clearInterval(timer);
  }, [enabled, reduce]);
  return step;
}

export function AgentRail({ stages, live, simulationStep, reduce, briefId, onNavigate, selected, onSelect }) {
  const hasExecution = stages.some((stage) => stage.result);
  const demo = !hasExecution && !live;
  const demoStep = useDemoRun(demo, reduce);

  const states = useMemo(
    () =>
      demo
        ? stages.map((_, index) => (index < demoStep ? "done" : index === demoStep ? "running" : "pending"))
        : stages.map((stage, index) => stageState(stage, index, { live, simulationStep })),
    [demo, demoStep, stages, live, simulationStep],
  );

  const completed = states.filter((state) => state === "done" || state === "flagged").length;
  const flagged = states.filter((state) => state === "flagged").length;
  const runningIndex = states.indexOf("running");
  // The token rests on the running stage, or on the last one reached.
  const tokenIndex = runningIndex >= 0 ? runningIndex : Math.max(states.findLastIndex((state) => state !== "pending"), 0);

  const fallbackSelection = stages[tokenIndex]?.handler;
  const activeHandler = stages.some((stage) => stage.handler === selected) ? selected : fallbackSelection;
  const activeIndex = stages.findIndex((stage) => stage.handler === activeHandler);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-fg">Cadena de procesamiento</h2>
          <p className="mt-1 text-sm text-muted">
            {demo ? "Así recorre el agente un brief, de la clasificación al borrador" : "Toca una etapa para ver su entrada y su salida"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {flagged > 0 && <Badge tone="review">{flagged} por revisar</Badge>}
          <span className="tabular font-mono text-sm text-muted">
            {completed} de {stages.length}
          </span>
        </div>
      </div>

      <div className="-mx-6 mt-8 overflow-x-auto px-6 pb-2">
        <ol className="relative grid min-w-[720px] grid-cols-7" aria-label="Etapas del agente">
          <RailTrack progress={trackProgress(states)} reduce={reduce} top="top-[60px]" />
          {stages.map((stage, index) => {
            const state = states[index];
            const isActive = !demo && index === activeIndex;
            return (
              <li key={stage.handler} className="relative flex flex-col items-center">
                <div className="flex h-10 items-end pb-2">
                  {index === tokenIndex && (
                    <motion.span
                      layoutId="rail-token"
                      layout={!reduce}
                      transition={{ duration: reduce ? 0 : duration.panel, ease: ease.fluid }}
                      className="tabular whitespace-nowrap rounded-md bg-ink px-2 py-1 font-mono text-[11px] text-ink-fg"
                    >
                      {briefId != null ? `Brief #${briefId}` : "Brief"}
                    </motion.span>
                  )}
                </div>
                <button
                  type="button"
                  disabled={demo}
                  onClick={() => onSelect(stage.handler)}
                  aria-pressed={isActive}
                  aria-label={`${stage.label}: ${stateLabel[state]}`}
                  className="group flex w-full flex-col items-center gap-3 rounded-xl px-1 pb-3 pt-0 text-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-default"
                >
                  <RailNode state={state} icon={stage.icon} reduce={reduce} />
                  <span className={`text-sm font-medium transition-colors duration-200 ${isActive ? "text-fg" : "text-muted group-hover:text-fg"}`}>
                    {stage.label}
                  </span>
                  <span className="tabular -mt-2 font-mono text-xs text-faint">
                    {stage.result?.durationMs != null ? formatDuration(stage.result.durationMs) : stateLabel[state]}
                  </span>
                  <span
                    aria-hidden="true"
                    className={`h-0.5 w-8 rounded-full transition-colors duration-200 ${isActive ? "bg-brand" : "bg-transparent"}`}
                  />
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      {demo ? (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-dashed border-line px-5 py-4">
          <p className="text-sm text-muted">Todavía no hay ejecuciones. Procesa un brief desde la bandeja y aparece aquí en vivo.</p>
          <Button variant="primary" onClick={() => onNavigate?.("inbox")}>
            Procesar un brief
          </Button>
        </div>
      ) : (
        <div className="mt-6 border-t border-line pt-6">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeHandler}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4 }}
              transition={{ duration: duration.state, ease: ease.out }}
            >
              {activeIndex >= 0 && <StageDetail stage={stages[activeIndex]} state={states[activeIndex]} />}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

const stateLabel = {
  done: "lista",
  flagged: "revisar",
  failed: "fallida",
  running: "en curso",
  skipped: "omitida",
  pending: "en espera",
};
