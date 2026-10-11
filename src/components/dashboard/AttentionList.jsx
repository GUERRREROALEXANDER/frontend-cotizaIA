import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { Panel, StatusBadge, formatCurrency, formatRelative } from "../ui.jsx";
import { StaggerItem } from "../../motion/Motion.jsx";
import { duration, ease } from "../../motion/presets.js";
import AnimatedLink from "../motion/AnimatedLink.jsx";

const MAX_ROWS = 6;

export function AttentionList({ queue = [], onOpenProposal, onNavigate, className = "" }) {
  const [expanded, setExpanded] = useState(false);
  const reduce = useReducedMotion();
  const rows = expanded ? queue : queue.slice(0, MAX_ROWS);
  const hidden = queue.length - rows.length;

  return (
    <Panel className={`flex flex-col p-6 ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-fg">Requiere tu atención</h2>
          <p className="mt-1 text-sm text-muted">
            {queue.length
              ? `${queue.length} ${queue.length === 1 ? "propuesta espera" : "propuestas esperan"} tu revisión`
              : "El agente terminó su turno"}
          </p>
        </div>
        {queue.length > 0 && (
          <span className="rounded-full bg-surface-2 px-2.5 py-1 font-mono text-xs text-muted">{queue.length}</span>
        )}
      </div>

      {queue.length === 0 ? (
        <p className="mt-4 rounded-xl bg-surface-2 px-4 py-5 text-sm text-muted">
          Nada pendiente. Las propuestas nuevas aparecerán aquí.
        </p>
      ) : (
        <ul className="mt-2">
          {rows.map((proposal, index) => (
            <StaggerItem
              key={proposal.id}
              index={index}
              as="li"
              className="border-b border-line last:border-b-0"
            >
              <motion.button
                type="button"
                initial={false}
                whileHover="hover"
                onClick={() => onOpenProposal(proposal.id)}
                className="group -mx-2 flex w-full items-center gap-3 rounded-lg px-2 py-3 text-left transition-colors duration-200 hover:bg-surface-2 focus-visible:bg-surface-2"
              >                <span className="min-w-0">
                  <span className="display tabular block truncate text-xl text-fg">
                    {formatCurrency(proposal.total)}
                  </span>
                  <span className="mt-1 block font-mono text-xs text-faint">
                    Propuesta #{proposal.id}
                  </span>
                </span>
                <StatusBadge status={proposal.status} />
                <span className="ml-auto shrink-0 text-xs text-faint">
                  {formatRelative(proposal.createdAt)}
                </span>
                <motion.span
                  variants={{ hover: reduce ? {} : { x: 4 } }}
                  transition={{ duration: duration.state, ease: ease.out }}
                  className="grid shrink-0 place-items-center text-faint transition-colors duration-200 group-hover:text-brand"
                >
                  <ChevronRight size={16} aria-hidden />
                </motion.span>
              </motion.button>
            </StaggerItem>
          ))}
        </ul>
      )}

      {(hidden > 0 || expanded || queue.length > 0) && (
        <div className="mt-4 flex items-center gap-4 border-t border-line pt-4">
          {hidden > 0 ? (
            <AnimatedLink onClick={() => setExpanded(true)} className="text-sm">
              Ver {hidden} más
            </AnimatedLink>
          ) : expanded ? (
            <AnimatedLink onClick={() => setExpanded(false)} className="text-sm">
              Ver menos
            </AnimatedLink>
          ) : null}
          {queue.length > 0 && (
            <AnimatedLink onClick={() => onNavigate("proposals")} className="ml-auto text-sm">
              Abrir propuestas
            </AnimatedLink>
          )}
        </div>
      )}
    </Panel>
  );
}
