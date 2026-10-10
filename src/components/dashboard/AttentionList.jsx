import { useState } from "react";
import { Panel, StatusBadge, formatCurrency, formatRelative } from "../ui.jsx";
import { StaggerItem } from "../../motion/Motion.jsx";

const MAX_ROWS = 6;

export function AttentionList({ queue = [], onOpenProposal, onNavigate, className = "" }) {
  const [expanded, setExpanded] = useState(false);
  const rows = expanded ? queue : queue.slice(0, MAX_ROWS);
  const hidden = queue.length - rows.length;

  return (
    <Panel className={`flex flex-col p-5 ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-fg">Requiere tu atención</h2>
          <p className="mt-1 text-xs text-muted">
            {queue.length
              ? `${queue.length} ${queue.length === 1 ? "propuesta espera" : "propuestas esperan"} tu revisión`
              : "El agente terminó su turno"}
          </p>
        </div>
        {queue.length > 0 && (
          <span className="font-mono text-xs text-faint">{queue.length}</span>
        )}
      </div>

      {queue.length === 0 ? (
        <p className="mt-4 rounded-lg border border-line bg-surface-2 px-3.5 py-4 text-xs text-muted">
          Nada pendiente. Las propuestas nuevas aparecerán aquí.
        </p>
      ) : (
        <ul className="mt-3">
          {rows.map((proposal, index) => (
            <StaggerItem
              key={proposal.id}
              index={index}
              as="li"
              className="border-b border-line last:border-b-0"
            >
              <button
                type="button"
                onClick={() => onOpenProposal(proposal.id)}
                className="flex w-full items-center gap-3 py-2.5 text-left transition-colors duration-200 hover:bg-surface-2 focus-visible:bg-surface-2"
              >
                <span className="font-mono text-[13px] text-fg">#{proposal.id}</span>
                <span className="font-mono text-[13px] text-fg">{formatCurrency(proposal.total)}</span>
                <StatusBadge status={proposal.status} />
                <span className="ml-auto shrink-0 text-xs text-faint">
                  {formatRelative(proposal.createdAt)}
                </span>
              </button>
            </StaggerItem>
          ))}
        </ul>
      )}

      {(hidden > 0 || queue.length > 0) && (
        <div className="mt-4 flex items-center gap-2 border-t border-line pt-3">
          {hidden > 0 && (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="text-xs font-medium text-accent transition-colors duration-200 hover:text-accent-hover"
            >
              Ver {hidden} más
            </button>
          )}
          {queue.length > 0 && (
            <button
              type="button"
              onClick={() => onNavigate("proposals")}
              className="ml-auto text-xs font-medium text-muted transition-colors duration-200 hover:text-fg"
            >
              Abrir propuestas
            </button>
          )}
        </div>
      )}
    </Panel>
  );
}
