import { useMemo } from "react";
import { LayoutGroup } from "framer-motion";
import { ProposalCard } from "./ProposalCard.jsx";

const STATUS_GROUPS = [
  {
    id: "nuevas",
    label: "Nuevas",
    statuses: ["RECEIVED", "ANALYZING", "QUOTED"],
    tone: "neutral",
  },
  {
    id: "por-revisar",
    label: "Por revisar",
    statuses: ["IN_REVIEW"],
    tone: "warning",
  },
  {
    id: "enviadas",
    label: "Enviadas",
    statuses: ["SENT", "NEGOTIATING"],
    tone: "accent",
  },
  {
    id: "ganadas",
    label: "Ganadas",
    statuses: ["ACCEPTED", "CONTRACT_ISSUED"],
    tone: "success",
  },
  {
    id: "cerradas",
    label: "Cerradas",
    statuses: ["REJECTED", "EXPIRED"],
    tone: "danger",
  },
];

const toneClasses = {
  neutral: "bg-surface-2 text-muted border-line",
  info: "bg-info/12 text-info border-info/25",
  warning: "bg-warning/12 text-warning border-warning/25",
  accent: "bg-accent-soft text-accent border-accent/25",
  success: "bg-success/12 text-success border-success/25",
  danger: "bg-danger/10 text-danger border-danger/25",
};

export function ProposalKanban({ proposals, selectedId, onSelect }) {
  const columns = useMemo(() => {
    return STATUS_GROUPS.map((group) => {
      const items = proposals.filter((p) => group.statuses.includes(p.status));
      const total = items.reduce((sum, p) => sum + Number(p.total || 0), 0);
      return { ...group, items, count: items.length, total };
    });
  }, [proposals]);

  // One board for every width: a snap scroller below xl, a 5-column grid on xl.
  // Rendering it once matters: each card owns a layoutId, and two mounted
  // copies (one display:none) make framer-motion hide the visible card.
  return (
    <LayoutGroup>
      <div
        role="region"
        aria-label="Tablero de propuestas"
        className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:scroll-px-6 sm:px-6 xl:mx-0 xl:grid xl:grid-cols-5 xl:overflow-visible xl:px-0"
      >
        {columns.map((column) => (
          <section key={column.id} aria-label={`Columna ${column.label}`} className="flex w-72 shrink-0 snap-start flex-col rounded-xl border border-line bg-surface/60 p-2 xl:w-auto xl:min-w-0">
            <header className="mb-2 flex items-center justify-between gap-2 px-2 pt-1">
              <h3 className="flex items-center gap-2 text-xs font-semibold text-fg">
                <span className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full border px-1 font-mono text-[10px] ${toneClasses[column.tone]}`}>
                  {column.count}
                </span>
                {column.label}
              </h3>
              <span className="truncate font-mono text-[11px] text-faint tabular-nums">
                {column.total.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}
              </span>
            </header>
            <ul className="flex min-h-40 flex-1 flex-col gap-2">
              {column.items.length > 0 ? (
                column.items.map((proposal) => (
                  <li key={proposal.id}>
                    <ProposalCard
                      proposal={proposal}
                      selected={String(selectedId) === String(proposal.id)}
                      onClick={() => onSelect(String(proposal.id))}
                      layoutId={`proposal-${proposal.id}`}
                    />
                  </li>
                ))
              ) : (
                <li className="grid flex-1 place-items-center rounded-lg border border-dashed border-line py-8 text-xs text-faint">
                  Sin propuestas
                </li>
              )}
            </ul>
          </section>
        ))}
      </div>
    </LayoutGroup>
  );
}
