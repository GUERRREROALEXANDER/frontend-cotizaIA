import { useEffect, useState, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, Check, Clock3, FileSearch2, FileText, HelpCircle, ListFilter, PenLine, SkipForward, WandSparkles, X } from "lucide-react";
import { Badge, Button } from "../ui.jsx";
import { duration, ease, staggerDelay } from "../../motion/presets.js";
import { formatDuration, isFlagged } from "./stages.js";

const STEP_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--accent)",
  "var(--brand)",
];

const STEP_DESCRIPTIONS = {
  Classify: "Detecta el tipo de proyecto",
  Extract: "Saca los requisitos del brief",
  Estimate: "Calcula horas por requisito",
  Price: "Aplica tu tarifa y estrategia",
  AmbiguityCheck: "Marca lo que hay que preguntar",
  Generate: "Arma propuesta, contrato y cronograma",
  Compose: "Deja todo listo para tu revisión",
};

// Glossy orb for a finished stage. One brand-green hue for every stage; the
// shade deepens from lime to forest along the chain. The rim darkens toward
// the brand ink (never black, which turns the green muddy).
const orbShade = (index, total) =>
  "color-mix(in oklab, var(--accent) " + Math.round(75 - (75 * index) / Math.max(total - 1, 1)) + "%, var(--chart-1))";

function GlossyOrb({ color }) {
  return (
    <span
      aria-hidden="true"
      className="absolute inset-[-2px] grid place-items-center overflow-hidden rounded-full"
      style={{
        background:
          "radial-gradient(120% 120% at 50% 15%, color-mix(in oklab, " + color + " 60%, white) 0%, " + color +
          " 50%, color-mix(in oklab, " + color + " 75%, var(--brand)) 100%)",
        boxShadow:
          "inset 0 -4px 8px color-mix(in oklab, " + color + " 40%, var(--brand)), 0 4px 10px -2px color-mix(in oklab, " +
          color + " 55%, transparent)",
      }}
    >
      <span
        className="absolute left-[18%] right-[18%] top-[6%] h-[38%] rounded-full"
        style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.7), rgba(255,255,255,0))" }}
      />
      <Check
        size={22}
        strokeWidth={3}
        className="relative text-white"
        style={{ filter: "drop-shadow(0 1px 1px color-mix(in oklab, var(--brand) 55%, transparent))" }}
      />
    </span>
  );
}

function RunningRing({ reduce, color }) {
  if (reduce) return <span className="h-2 w-2 rounded-full" style={{ background: color }} aria-hidden="true" />;
  return (
    <span
      aria-hidden="true"
      className="absolute inset-0 rounded-full"
      style={{
        background: "conic-gradient(from 0deg, " + color + " 0deg, " + color + " 90deg, transparent 90deg, transparent 360deg)",
        animation: "spin 1.2s linear infinite",
      }}
    />
  );
}

function BouncingDots({ reduce }) {
  if (reduce) return <span className="font-mono text-xs text-faint">pensando</span>;
  return (
    <span className="inline-flex items-center gap-0.5 font-mono text-xs text-faint" aria-label="pensando">
      <span>pensando</span>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: "var(--accent)" }}
          initial={{ y: 0, opacity: 0.4 }}
          animate={{ y: [-4, 0], opacity: [1, 0.4] }}
          transition={{ duration: 0.6, repeat: Infinity, ease: ease.out, delay: i * 0.15 }}
        />
      ))}
    </span>
  );
}

function ShimmerSweep({ reduce }) {
  if (reduce) return null;
  return (
    <motion.div
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden"
      style={{
        background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
      }}
      initial={{ x: "-120%" }}
      animate={{ x: "120%" }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
    />
  );
}

function Connector({ filled, reduce, index, totalSteps, nodeHeight, gap }) {
  if (index === totalSteps - 1) return null;
  const railHeight = nodeHeight + gap;
  const topOffset = nodeHeight;
  return (
    <span
      aria-hidden="true"
      className="absolute"
      style={{
        left: "24px",
        top: topOffset + "px",
        width: "3px",
        height: railHeight + "px",
        background: "var(--border)",
      }}
    >
      <motion.span
        className="absolute inset-x-0 top-0 h-full origin-top"
        style={{ background: "linear-gradient(180deg, var(--accent), var(--chart-1))" }}
        initial={false}
        animate={{ scaleY: filled ? 1 : 0 }}
        transition={{ duration: reduce ? 0 : duration.reveal, ease: ease.out }}
      />
      {!filled && (
        <span
          className="absolute inset-0 h-full"
          style={{ background: "repeating-linear-gradient(var(--border), var(--border) 6px, transparent 6px, transparent 12px)" }}
        />
      )}
    </span>
  );
}

function StepCard({ stage, index, status, expanded, onToggle, reduce, nodeRefs, totalSteps, nodeHeight, gap }) {
  const {
    handler,
    label,
    icon: Icon,
    result,
    description: fallbackDescription,
  } = stage;

  const stepColor = STEP_COLORS[index % STEP_COLORS.length];
  const stepDescription = STEP_DESCRIPTIONS[handler] || fallbackDescription;

  const done = ["SUCCEEDED", "SUCCESS", "COMPLETED"].includes(status);
  const failed = ["FAILED", "ERROR"].includes(status);
  const running = status === "RUNNING";
  const flagged = isFlagged(result);
  const skipped = status === "SKIPPED";

  const isExpanded = expanded === handler;
  const durationText = result?.durationMs != null ? formatDuration(result.durationMs) : running ? "en curso" : skipped ? "omitido" : "por ejecutar";

  const outputChips = done && result?.outputSummary
    ? result.outputSummary.split(";").map((s, i) => s.trim()).filter(Boolean).map((s, i) => (
        <span key={i} className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-mono text-faint">{s}</span>
      ))
    : [];

  const connectorFilled = done || running;

  return (
    <motion.li
      ref={(el) => { nodeRefs.current[index] = el; }}
      key={handler}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? duration.micro : duration.panel, ease: ease.out, delay: staggerDelay(index) }}
      className="relative"
    >
      <button
        type="button"
        onClick={() => onToggle(handler)}
        aria-expanded={isExpanded}
        aria-controls={"stage-detail-" + handler}
        className={
        "relative z-10 flex w-full min-w-0 gap-4 rounded-2xl p-4 text-left transition-colors duration-200 " +
        (done ? "bg-surface hover:bg-surface-2" :
        failed ? "bg-surface hover:bg-surface-2 border border-[var(--status-closed-bg)]" :
        running ? "bg-surface hover:bg-surface-2" :
        skipped ? "bg-surface/50 hover:bg-surface-2" :
        "bg-surface hover:bg-surface-2")
      }
      >
        <div className="relative flex flex-col items-center shrink-0" style={{ minHeight: nodeHeight + "px" }}>
          {index < totalSteps - 1 && (
            // Rail to the next node: lives in this column so the opaque card
            // background cannot cover it; extends past the card padding (p-4)
            // and the list gap (space-y-1) to reach the next node.
            <span aria-hidden="true" className="absolute left-1/2 top-12 -bottom-9 w-[3px] -translate-x-1/2 overflow-hidden rounded-full bg-[var(--border)]">
              <motion.span
                className="absolute inset-0 origin-top rounded-full"
                style={{ background: "linear-gradient(180deg, var(--accent), var(--chart-1))" }}
                initial={false}
                animate={{ scaleY: connectorFilled ? 1 : 0 }}
                transition={{ duration: reduce ? 0 : duration.reveal, ease: ease.out }}
              />
            </span>
          )}
          <span
            className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full border-2"
            style={{
              background: done ? orbShade(index, totalSteps) : "transparent",
              borderColor: done ? orbShade(index, totalSteps) : failed ? "var(--status-closed-fg)" : running ? stepColor : skipped ? "var(--border)" : "var(--border)",
              color: done ? "white" : running ? stepColor : failed ? "var(--status-closed-fg)" : skipped ? "var(--text-faint)" : "var(--text-faint)",
            }}
            aria-hidden="true"
          >
            {done && <GlossyOrb color={orbShade(index, totalSteps)} />}
            {failed && <X size={16} aria-hidden="true" />}
            {running && <RunningRing reduce={reduce} color={stepColor} />}
            {skipped && <SkipForward size={16} aria-hidden="true" />}
            {!done && !failed && !running && !skipped && <Icon size={16} aria-hidden="true" />}
          </span>

          {running && (
            <span className="absolute top-full left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap">
              <BouncingDots reduce={reduce} />
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1 flex flex-col">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <span className="text-lg font-bold tracking-tight text-fg">{label}</span>
            <span className="inline-flex items-center rounded-full border border-line bg-surface-2 px-2.5 py-0.5 tabular font-mono text-[11px] text-faint">
              {durationText}
            </span>
            {running && (
              <span className="inline-flex items-center gap-1.5 font-mono text-xs text-faint">
                <BouncingDots reduce={reduce} />
              </span>
            )}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-mono text-xs text-faint">{handler}</span>
            {flagged && <Badge tone="warning">Requiere revisión</Badge>}
            {failed && <Badge tone="danger">Fallida</Badge>}
            {skipped && <Badge tone="neutral">Omitido</Badge>}
          </div>

          <p className={failed ? "mt-1.5 text-sm text-danger" : skipped ? "mt-1.5 text-sm text-faint" : "mt-1.5 text-sm text-muted"}>
            {failed ? result?.outputSummary || "La etapa falló sin detalle." : stepDescription}
          </p>

          {outputChips.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5" role="list" aria-label="Salidas de la etapa">
              {outputChips}
            </div>
          )}
        </div>
      </button>

      {running && <ShimmerSweep reduce={reduce} />}

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            id={"stage-detail-" + handler}
            initial={{ opacity: 0, y: reduce ? 0 : 6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: reduce ? 0 : -4, height: 0 }}
            transition={{ duration: reduce ? duration.micro : duration.state, ease: ease.out }}
            className="mb-2 ml-14 rounded-xl border border-line bg-surface-2 px-4 py-3 font-mono text-sm leading-6 text-muted overflow-hidden"
          >
            <p className="text-faint">entrada</p>
            <p className="break-words">{result?.inputSummary || "Sin resumen de entrada."}</p>
            <p className="mt-2 text-faint">salida</p>
            <p className="break-words">{result?.outputSummary || "Aún sin salida para esta etapa."}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
}

function ProgressPill({ completed, total, reduce }) {
  const pct = total > 0 ? completed / total : 0;
  return (
    <div className="flex items-center gap-3 shrink-0">
      <span className="text-sm font-semibold text-fg whitespace-nowrap">
        {completed} de {total}
      </span>
      <div className="relative h-2 w-28 shrink-0 rounded-full bg-surface-2 overflow-hidden">
        <motion.div
          className="absolute inset-0 origin-left rounded-full"
          style={{ background: "var(--accent)" }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: pct }}
          transition={{ duration: reduce ? 0 : duration.reveal, ease: ease.out }}
        />
      </div>
    </div>
  );
}

function GhostDemo({ reduce }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const nodeRefs = useRef([]);
  const nodeHeight = 60;
  const gap = 8;

  useEffect(() => {
    if (reduce) return undefined;
    const timer = window.setInterval(() => {
      setActiveIndex((i) => (i + 1) % 7);
    }, 900);
    return () => window.clearInterval(timer);
  }, [reduce]);

  return (
    <div className="opacity-85" style={{ opacity: 0.85 }}>
      <ol className="space-y-1">
        {Array.from({ length: 7 }).map((_, i) => {
          const stage = {
            handler: ["Classify", "Extract", "Estimate", "Price", "AmbiguityCheck", "Generate", "Compose"][i],
            label: ["Clasificación", "Extracción", "Estimación", "Precio", "Ambigüedades", "Documentos", "Composición"][i],
            icon: [ListFilter, FileSearch2, Clock3, WandSparkles, HelpCircle, FileText, PenLine][i],
            description: Object.values(STEP_DESCRIPTIONS)[i],
          };
          const stepColor = STEP_COLORS[i];
          const isActive = i === activeIndex;
          const filled = i < activeIndex;

          return (
            <motion.li
              ref={(el) => { nodeRefs.current[i] = el; }}
              key={stage.handler}
              className="relative"
              style={{ transition: "opacity 0.3s" }}
            >
              <Connector
                filled={filled}
                index={i}
                totalSteps={7}
                reduce={true}
                nodeHeight={nodeHeight}
                gap={gap}
              />
              <div className="relative flex gap-4 rounded-2xl p-4 bg-surface/50" style={{ minHeight: nodeHeight + "px" }}>
                <div className="relative flex flex-col items-center shrink-0" style={{ minHeight: nodeHeight + "px" }}>
                  <span
                    className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full border-2"
                    style={{
                      background: "transparent",
                      borderColor: isActive ? stepColor : "var(--border)",
                      color: isActive ? stepColor : "var(--text-faint)",
                    }}
                    aria-hidden="true"
                  >
                    {isActive ? (
                      <RunningRing reduce={true} color={stepColor} />
                    ) : (
                      <stage.icon size={16} aria-hidden="true" />
                    )}
                  </span>
                </div>
                <div className="min-w-0 flex-1 flex flex-col">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <span className="text-lg font-bold tracking-tight text-fg">{stage.label}</span>
                    <span className="inline-flex items-center rounded-full border border-line bg-surface-2 px-2.5 py-0.5 tabular font-mono text-[11px] text-faint">
                      {isActive ? "en curso" : "por ejecutar"}
                    </span>
                    {isActive && (
                      <span className="inline-flex items-center gap-1.5 font-mono text-xs text-faint">
                        <BouncingDots reduce={true} />
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-mono text-xs text-faint">{stage.handler}</span>
                  </div>
                  <p className="mt-1.5 text-sm text-muted">{stage.description}</p>
                </div>
              </div>
            </motion.li>
          );
        })}
      </ol>
      <p className="mt-4 text-center text-sm text-muted">
        Así trabaja el agente cuando procesas un brief
      </p>
    </div>
  );
}

export function StageStepper({ stages, expanded, onToggle, live, simulationStep, reduce }) {
  const executionSteps = stages.filter((s) => s.result);
  const completedCount = executionSteps.filter((s) => ["SUCCEEDED", "SUCCESS", "COMPLETED"].includes(String(s.result?.status || "").toUpperCase())).length;

  const hasExecution = stages.some((s) => s.result);
  const isLive = live || stages.some((s) => String(s.result?.status || "").toUpperCase() === "RUNNING");
  const nodeRefs = useRef([]);
  const nodeHeight = 60;
  const gap = 8;

  if (!hasExecution && !isLive) {
    return (
      <div className="space-y-4">
        <GhostDemo reduce={reduce} />
        <div className="flex justify-center">
          <Button variant="primary" onClick={() => window.location.href = "/inbox"}>
            Procesar un brief
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-fg">Cadena de procesamiento</h2>
          <p className="mt-0.5 text-sm text-muted">Responsabilidad encadenada, evidencia por etapa</p>
        </div>
        <ProgressPill completed={completedCount} total={7} reduce={reduce} />
      </div>

      <ol className="space-y-1">
        {stages.map((stage, index) => {
          const status = String(stage.result?.status || "").toUpperCase();
          const done = ["SUCCEEDED", "SUCCESS", "COMPLETED"].includes(status);
          const failed = ["FAILED", "ERROR"].includes(status);
          const reportedRunning = !done && !failed && status === "RUNNING";
          const simulated = !stage.result && live && index === simulationStep;
          const current = reportedRunning || simulated;
          const connectorFilled = done || current || (!stage.result && live && index < simulationStep);

          return (
            <StepCard
              key={stage.handler}
              stage={{ ...stage, description: STEP_DESCRIPTIONS[stage.handler] }}
              index={index}
              status={current ? "RUNNING" : status}
              expanded={expanded}
              onToggle={onToggle}
              reduce={reduce}
              nodeRefs={nodeRefs}
              totalSteps={7}
              nodeHeight={nodeHeight}
              gap={gap}
            />
          );
        })}
      </ol>
    </div>
  );
}