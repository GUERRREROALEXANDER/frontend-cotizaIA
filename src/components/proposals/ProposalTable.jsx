import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, ChevronDown } from "lucide-react";
import { formatCurrency, formatDate, formatRelative, StatusBadge } from "../../components/ui.jsx";
import { staggerDelay } from "../../motion/presets.js";

const SORTABLE_FIELDS = ["createdAt", "total"];

export function ProposalTable({ proposals, selectedId, onSelect, onSort, sortConfig }) {
  const sortedProposals = useMemo(() => {
    if (!sortConfig.key) return proposals;
    return [...proposals].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortConfig.direction === "asc" ? comparison : -comparison;
    });
  }, [proposals, sortConfig]);

  const handleHeaderClick = (field) => {
    if (!SORTABLE_FIELDS.includes(field)) return;
    onSort(field);
  };

  const SortIcon = ({ field }) => {
    if (sortConfig.key !== field) return null;
    return sortConfig.direction === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-surface">
      <table className="w-full text-sm" role="grid">
        <thead className="sticky top-0 bg-surface/95 backdrop-blur-sm border-b border-line">
          <tr>
            <th
              className="px-4 py-3 text-left font-medium text-muted cursor-pointer select-none hover:text-fg transition-colors"
              onClick={() => handleHeaderClick("createdAt")}
              scope="col"
            >
              <div className="flex items-center gap-1.5">
                Creada
                <SortIcon field="createdAt" />
              </div>
            </th>
            <th className="px-4 py-3 text-left font-medium text-muted" scope="col">
              Propuesta
            </th>
            <th className="px-4 py-3 text-left font-medium text-muted" scope="col">
              Brief
            </th>
            <th
              className="px-4 py-3 text-right font-medium text-muted cursor-pointer select-none hover:text-fg transition-colors"
              onClick={() => handleHeaderClick("total")}
              scope="col"
            >
              <div className="flex items-center justify-end gap-1.5">
                Total
                <SortIcon field="total" />
              </div>
            </th>
            <th className="px-4 py-3 text-left font-medium text-muted" scope="col">
              Estado
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          <AnimatePresence mode="popLayout">
            {sortedProposals.map((proposal, index) => (
              <motion.tr
                key={proposal.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6, height: 0 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1], delay: staggerDelay(index) }}
                className={`transition-colors ${
                  String(selectedId) === String(proposal.id)
                    ? "bg-accent-soft"
                    : "hover:bg-surface-2"
                }`}
                onClick={() => onSelect(String(proposal.id))}
                tabIndex={0}
                role="row"
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(String(proposal.id));
                  }
                }}
                aria-selected={String(selectedId) === String(proposal.id)}
              >
                <td className="px-4 py-3 text-muted whitespace-nowrap">
                  {formatRelative(proposal.createdAt)}
                </td>
                <td className="px-4 py-3 font-mono text-fg tabular-nums">
                  #{proposal.id}
                </td>
                <td className="px-4 py-3 text-muted">
                  #{proposal.briefId}
                </td>
                <td className="px-4 py-3 font-mono text-fg tabular-nums text-right">
                  {formatCurrency(proposal.total)}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={proposal.status} />
                </td>
              </motion.tr>
            ))}
          </AnimatePresence>
          {!proposals.length && (
            <tr>
              <td colSpan={5} className="px-4 py-12 text-center text-muted">
                Aún no hay propuestas
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}