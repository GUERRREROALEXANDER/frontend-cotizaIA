import { motion, useReducedMotion } from "framer-motion";
import { formatCurrency, formatRelative, StatusBadge } from "../../components/ui.jsx";
import { formatCompactCop } from "../dashboard/dashboardData.js";
import { duration, ease } from "../../motion/presets.js";

export function ProposalCard({ proposal, onClick, layoutId, selected = false }) {
  const reduce = useReducedMotion();
  return (
    <motion.article
      layoutId={layoutId}
      onClick={onClick}
      className={`group block w-full cursor-pointer rounded-xl bg-surface p-4 text-left shadow-card transition-shadow duration-300 hover:shadow-lift ${
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
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-fg">#{proposal.id}</p>
          <span className="text-xs text-faint">{formatRelative(proposal.createdAt)}</span>
        </div>
        <p className="display mt-3 block text-[1.65rem] leading-none tabular-nums" title={formatCurrency(proposal.total)}>
          {formatCompactCop(proposal.total)}
        </p>
        <StatusBadge status={proposal.status} className="mt-3" />
      </div>
    </motion.article>
  );
}
