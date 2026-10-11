import { useMemo } from "react";
import { LayoutGroup } from "framer-motion";
import { formatCurrency } from "../../components/ui.jsx";
import { ProposalCard } from "./ProposalCard.jsx";

// Column chips use the shared status palette (tokens --status-*), the same
// colors as the badges and the dashboard donut.
const toneChip = {
  new: "bg-[var(--status-new-bg)] text-[var(--status-new-fg)]",
  review: "bg-[var(--status-review-bg)] text-[var(--status-review-fg)]",
  sent: "bg-[var(--status-sent-bg)] text-[var(--status-sent-fg)]",
  won: "bg-[var(--status-won-bg)] text-[var(--status-won-fg)]",
  closed: "bg-[var(--status-closed-bg)] text-[var(--status-closed-fg)]",
};

export const STATUS_GROUPS = [
  {
    id: "nuevas",
    tone: "new",
    label: "Nuevas",
    statuses: ["RECEIVED", "ANALYZING", "QUOTED"],
  },
  {
    id: "por-revisar",
    tone: "review",
    label: "Por revisar",
    statuses: ["IN_REVIEW"],
  },
  {
    id: "enviadas",
    tone: "sent",
    label: "Enviadas",
    statuses: ["SENT", "NEGOTIATING"],
  },
  {
    id: "ganadas",
    tone: "won",
    label: "Ganadas",
    statuses: ["ACCEPTED", "CONTRACT_ISSUED"],
  },
  {
    id: "cerradas",
    tone: "closed",
    label: "Cerradas",
    statuses: ["REJECTED", "EXPIRED"],
  },
];

const groupStatuses = (id) => STATUS_GROUPS.find((group) => group.id === id)?.statuses || [];

// The four headline numbers shown above the board come from the same grouping
// the columns use, so a proposal is never counted twice or in two places.
export function summarizeProposals(proposals = []) {
  const count = (id) => proposals.filter((proposal) => groupStatuses(id).includes(proposal.status)).length;
  const inPlayStatuses = STATUS_GROUPS.filter((group) => group.id !== "cerradas").flatMap((group) => group.statuses);
  return {
    inPlay: proposals
      .filter((proposal) => inPlayStatuses.includes(proposal.status))
      .reduce((sum, proposal) => sum + Number(proposal.total || 0), 0),
    review: count("por-revisar"),
    sent: count("enviadas"),
    won: count("ganadas"),
    closed: count("cerradas"),
  };
}

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
        className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:scroll-px-6 sm:px-6 xl:mx-0 xl:grid xl:grid-cols-5 xl:overflow-visible xl:px-0"
      >
        {columns.map((column) => (
          <section
            key={column.id}
            aria-label={`Columna ${column.label}`}
            className="flex w-72 shrink-0 snap-start flex-col gap-4 rounded-2xl bg-surface-2/60 p-3 xl:w-auto xl:min-w-0"
          >
            <header className="px-2 pt-2">
              <h3 className="flex items-center gap-2.5 text-sm font-semibold text-fg">
                <span className={`tabular grid h-7 min-w-7 place-items-center rounded-full px-2 text-xs font-semibold ${toneChip[column.tone]}`}>
                  {column.count}
                </span>
                {column.label}
              </h3>
              <p className="display tabular mt-3 text-2xl text-fg">{formatCurrency(column.total)}</p>
            </header>
            <ul className="flex min-h-40 flex-1 flex-col gap-3">
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
                <li className="tabular grid flex-1 place-items-center rounded-xl border border-dashed border-line py-8 text-sm text-faint">
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
