import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, ChevronDown } from "lucide-react";
import { formatCurrency, formatRelative, StatusBadge } from "../../components/ui.jsx";
import { duration, ease, staggerDelay } from "../../motion/presets.js";

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
    <div className="overflow-x-auto">
      <table className="w-full text-[15px]">
        <thead>
          <tr className="border-b border-line">
            <th
              className="cursor-pointer select-none py-3 pl-6 pr-4 text-left text-sm font-medium text-muted transition-colors hover:text-fg"
              onClick={() => handleHeaderClick("createdAt")}
              scope="col"
            >
              <div className="flex items-center gap-1.5">
                Creada
                <SortIcon field="createdAt" />
              </div>
            </th>
            <th className="py-3 px-4 text-left text-sm font-medium text-muted" scope="col">
              Propuesta
            </th>
            <th className="py-3 px-4 text-left text-sm font-medium text-muted" scope="col">
              Brief
            </th>
            <th
              className="cursor-pointer select-none py-3 px-4 text-right text-sm font-medium text-muted transition-colors hover:text-fg"
              onClick={() => handleHeaderClick("total")}
              scope="col"
            >
              <div className="flex items-center justify-end gap-1.5">
                Total
                <SortIcon field="total" />
              </div>
            </th>
            <th className="py-3 pl-4 pr-6 text-left text-sm font-medium text-muted" scope="col">
              Estado
            </th>
          </tr>
        </thead>
        <tbody>
          <AnimatePresence mode="popLayout">
            {sortedProposals.map((proposal, index) => {
              const selected = String(selectedId) === String(proposal.id);
              return (
                <motion.tr
                  key={proposal.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6, height: 0 }}
                  transition={{ duration: duration.state, ease: ease.out, delay: staggerDelay(index) }}
                  className={`cursor-pointer border-b border-line/70 transition-colors duration-200 last:border-0 ${
                    selected ? "bg-accent-soft" : "hover:bg-surface-2/60"
                  }`}
                  onClick={() => onSelect(String(proposal.id))}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelect(String(proposal.id));
                    }
                  }}
                  aria-selected={selected}
                >
                  <td className="py-4 pl-6 pr-4 text-muted whitespace-nowrap">
                    {formatRelative(proposal.createdAt)}
                  </td>
                  <td className="tabular px-4 py-4 font-mono font-medium text-fg">
                    #{proposal.id}
                  </td>
                  <td className="tabular px-4 py-4 text-muted">
                    #{proposal.briefId}
                  </td>
                  <td className="tabular px-4 py-4 text-right font-mono font-medium text-fg">
                    {formatCurrency(proposal.total)}
                  </td>
                  <td className="py-4 pl-4 pr-6">
                    <StatusBadge status={proposal.status} />
                  </td>
                </motion.tr>
              );
            })}
          </AnimatePresence>
          {!proposals.length && (
            <tr>
              <td colSpan={5} className="px-6 py-12 text-center text-muted">
                Aún no hay propuestas
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
