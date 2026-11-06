import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { FileText, MessageCircle, RotateCcw } from "lucide-react";
import { formatCurrency } from "../ui.jsx";
import { duration, ease } from "../../motion/presets.js";
import { agentStages } from "../pipeline/stages.js";
import { RailNode, RailTrack, trackProgress } from "../pipeline/AgentRail.jsx";

// The auth screen's right panel: one real run of the product, played once.
// A single clock (elapsed ms) drives every element, so the sequence is
// deterministic, never loops, and reduced motion simply starts at the end.

const BRIEF = "Hola, necesito una tienda online para mi café, con pagos, un blog y un panel para ver los pedidos.";
const REQUIREMENTS = ["Tienda con pagos", "Blog", "Panel de pedidos"];
const SHORT_LABELS = ["Clasifica", "Extrae", "Estima", "Precio", "Dudas", "Docs", "Arma"];
const DOCUMENTS = ["Propuesta", "Contrato", "Cronograma"];
const PRICE = 12_400_000;

const T = {
  brief: 300,
  typeEnd: 2000,
  chips: 2200,
  rail: 2800,
  railStep: 320,
  proposal: 5300,
  countEnd: 6200,
  docs: 6300,
  end: 6900,
};

const clamp01 = (value) => Math.min(Math.max(value, 0), 1);
const easeOutCubic = (value) => 1 - (1 - value) ** 3;

function useClock(reduce) {
  const [elapsed, setElapsed] = useState(reduce ? T.end : 0);
  const [runId, setRunId] = useState(0);
  const frame = useRef(0);

  useEffect(() => {
    if (reduce) {
      setElapsed(T.end);
      return undefined;
    }
    const start = performance.now();
    const tick = (now) => {
      const next = Math.min(now - start, T.end);
      setElapsed(next);
      if (next < T.end) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [reduce, runId]);

  const replay = useCallback(() => setRunId((id) => id + 1), []);
  return [elapsed, replay];
}

// Enter: fade and rise a few pixels once `on` flips. Space is always reserved.
function Reveal({ on, delay = 0, className = "", children }) {
  return (
    <motion.div
      initial={false}
      animate={on ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
      transition={{ duration: duration.panel, ease: ease.out, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function AuthDemo() {
  const reduce = useReducedMotion();
  const [t, replay] = useClock(reduce);

  const typed = Math.round(clamp01((t - T.brief) / (T.typeEnd - T.brief)) * BRIEF.length);
  const typing = t >= T.brief && typed < BRIEF.length;
  // -1 before the rail starts, then one more finished stage every railStep.
  const doneStages = t < T.rail ? -1 : Math.min(Math.floor((t - T.rail) / T.railStep), agentStages.length);
  const states = agentStages.map((_, index) =>
    t < T.rail ? "pending" : index < doneStages ? "done" : index === doneStages ? "running" : "pending",
  );
  const price = Math.round(easeOutCubic(clamp01((t - T.proposal) / (T.countEnd - T.proposal))) * PRICE);
  const finished = t >= T.end;

  return (
    <div className="flex w-full max-w-[640px] flex-col gap-3 text-left" aria-label="Ejemplo: un brief convertido en propuesta">
      {/* 1. The brief arrives */}
      <Reveal on={t >= T.brief} className="w-full max-w-[480px] rounded-xl bg-surface p-4 text-fg">
        <p className="flex items-center gap-2 text-xs text-faint">
          <MessageCircle size={14} aria-hidden="true" />
          Brief por WhatsApp · Café Origen
        </p>
        <p className="mt-2 min-h-[3rem] text-[15px] leading-6">
          {BRIEF.slice(0, typed)}
          {typing && <span aria-hidden="true" className="ml-px inline-block h-4 w-[2px] translate-y-0.5 bg-brand" />}
        </p>
      </Reveal>

      {/* 2. The agent works it: requirements, then the seven stations */}
      <Reveal on={t >= T.chips} className="w-full max-w-[480px] self-center rounded-xl bg-surface p-4 text-fg">
        <div className="flex items-center justify-between">
          <p className="text-xs text-faint">Agente</p>
          <p className="tabular font-mono text-xs text-faint">{Math.max(doneStages, 0)} de 7</p>
        </div>
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {REQUIREMENTS.map((label, index) => (
            <motion.li
              key={label}
              initial={false}
              animate={t >= T.chips + index * 140 ? { opacity: 1, x: 0 } : { opacity: 0, x: -6 }}
              transition={{ duration: duration.state, ease: ease.out }}
              className="rounded-md bg-surface-2 px-2 py-0.5 font-mono text-xs text-fg"
            >
              {label}
            </motion.li>
          ))}
        </ul>
        <ol className="relative mt-4 grid grid-cols-7">
          <RailTrack progress={trackProgress(states)} reduce={reduce} top="top-3.5" />
          {agentStages.map((stage, index) => (
            <li key={stage.handler} className="relative flex flex-col items-center gap-1.5">
              <RailNode state={states[index]} icon={stage.icon} size="sm" reduce={reduce} />
              <span className={`text-[11px] transition-colors duration-200 ${states[index] === "pending" ? "text-faint" : "text-fg"}`}>
                {SHORT_LABELS[index]}
              </span>
            </li>
          ))}
        </ol>
      </Reveal>

      {/* 3. The proposal lands */}
      <Reveal on={t >= T.proposal} className="w-full max-w-[480px] self-end rounded-xl bg-surface p-4 text-fg">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-faint">Propuesta #12 · 38 h estimadas</p>
            <p className="display tabular mt-1 text-[2rem] leading-none">{formatCurrency(price)}</p>
          </div>
          <span className="rounded-md bg-[var(--status-review-bg)] px-2 py-1 text-xs font-medium text-[var(--status-review-fg)]">
            Por revisar
          </span>
        </div>
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {DOCUMENTS.map((name, index) => (
            <motion.li
              key={name}
              initial={false}
              animate={t >= T.docs + index * 120 ? { opacity: 1, y: 0 } : { opacity: 0, y: 4 }}
              transition={{ duration: duration.state, ease: ease.out }}
              className="flex items-center gap-1.5 rounded-md border border-line px-2 py-1 text-xs text-muted"
            >
              <FileText size={13} aria-hidden="true" />
              {name}.pdf
            </motion.li>
          ))}
        </ul>
      </Reveal>

      <div className="flex h-8 items-center self-end">
        {finished && !reduce && (
          <button
            type="button"
            onClick={replay}
            className="inline-flex items-center gap-1.5 rounded-md px-1 text-xs text-ink-text/70 transition-colors duration-200 hover:text-ink-fg focus-visible:outline-2 focus-visible:outline-ink-fg"
          >
            <RotateCcw size={13} aria-hidden="true" />
            Ver otra vez
          </button>
        )}
      </div>
    </div>
  );
}
