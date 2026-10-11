import { motion, useReducedMotion } from "framer-motion";
import { formatCurrency, formatRelative, StatusBadge } from "../../components/ui.jsx";
import { duration, ease } from "../../motion/presets.js";

export function ProposalCard({ proposal, onClick, layoutId, selected = false }) {
  const reduce = useReducedMotion();
  return (
    <motion.article
      layoutId={layoutId}
      onClick={onClick}
      className={`group block w-full cursor-pointer rounded-xl bg-surface p-5 text-left shadow-card transition-shadow duration-300 hover:shadow-lift ${
        selected ? "ring-2 ring-brand" : ""
      }`}
      layout
      transition={{ duration: duration.panel, ease: ease.fluid }}
      whileHover={reduce ? undefined : { y: -3 }}
      aria-pressed={selected}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="tabular text-sm font-semibold text-fg">#{proposal.id}</p>
          <p className="mt-1 text-sm text-muted">Propuesta</p>
        </div>
        <StatusBadge status={proposal.status} />
      </div>
      <p className="display tabular mt-5 text-3xl text-fg">{formatCurrency(proposal.total)}</p>
      <p className="mt-4 text-sm text-faint">Creada {formatRelative(proposal.createdAt)}</p>
    </motion.article>
  );
}
