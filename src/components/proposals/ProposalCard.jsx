import { motion } from "framer-motion";
import { formatCurrency, formatRelative, StatusBadge } from "../../components/ui.jsx";

export function ProposalCard({ proposal, onClick, layoutId, selected = false }) {
  return (
    <motion.article
      layoutId={layoutId}
      onClick={onClick}
      className={`group cursor-pointer rounded-lg border bg-surface p-3 transition-colors duration-200 hover:border-line-strong ${selected ? "border-accent/60 ring-1 ring-accent/30" : "border-line"}`}
      layout
      transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
      whileHover={{ y: -2, transition: { duration: 0.12 } }}
      aria-pressed={selected}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-fg">#{proposal.id}</p>
          <p className="mt-0.5 text-xs text-muted">Creada {formatRelative(proposal.createdAt)}</p>
        </div>
        <span className="shrink-0 font-mono text-sm text-fg">{formatCurrency(proposal.total)}</span>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <StatusBadge status={proposal.status} />
      </div>
    </motion.article>
  );
}