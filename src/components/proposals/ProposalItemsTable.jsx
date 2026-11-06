import { motion } from "framer-motion";
import { Badge, formatCurrency } from "../../components/ui.jsx";
import { CountUp } from "../../motion/Motion.jsx";
import { duration, ease, staggerDelay } from "../../motion/presets.js";

const sourceBadges = {
  MEMORY: { label: "Memoria", tone: "accent" },
  CATALOG: { label: "Catálogo", tone: "info" },
  DEFAULT: { label: "Por defecto", tone: "neutral" },
};

function formatHours(value) {
  const hours = Number(value);
  if (!Number.isFinite(hours)) return "—";
  return hours.toLocaleString("es-CO", { maximumFractionDigits: 1 });
}

function citationLabel(citation) {
  const parts = [citation.documentName];
  if (citation.page != null) parts.push(`p. ${citation.page}`);
  if (citation.hours != null) parts.push(`${formatHours(citation.hours)} h`);
  if (citation.similarity != null) parts.push(`sim ${Number(citation.similarity).toFixed(2)}`);
  return parts.filter(Boolean).join(" · ");
}

export function ProposalItemsTable({ items, extras, subtotal, total }) {
  if (!items?.length) {
    return (
      <p className="py-10 text-center text-sm text-muted">
        La propuesta no tiene ítems detallados.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <div className="overflow-x-auto">
        <table className="w-full text-[15px]">
          <thead>
            <tr className="border-b border-line">
              <th scope="col" className="py-3 text-left text-sm font-medium text-muted">Descripción</th>
              <th scope="col" className="py-3 pl-4 text-right text-sm font-medium text-muted">Horas</th>
              <th scope="col" className="py-3 pl-4 text-right text-sm font-medium text-muted">Tarifa</th>
              <th scope="col" className="py-3 pl-4 text-right text-sm font-medium text-muted">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const source = sourceBadges[String(item.estimateSource || "").toUpperCase()];
              const citations = item.estimateSource === "MEMORY" && Array.isArray(item.citations) ? item.citations : [];
              return (
                <motion.tr
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: duration.state, ease: ease.out, delay: staggerDelay(index) }}
                  className="border-b border-line/70 align-top"
                >
                  <td className="py-4 pr-4 text-fg">
                    <span className="flex flex-wrap items-center gap-2">
                      <span>{item.description}</span>
                      {source && <Badge tone={source.tone}>{source.label}</Badge>}
                    </span>
                    {citations.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {citations.map((citation, citationIndex) => (
                          <li
                            key={`${item.id}-${citation.chunkId ?? citationIndex}`}
                            className="tabular text-xs leading-5 text-faint"
                          >
                            {citationLabel(citation)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td className="tabular py-4 pl-4 text-right font-mono text-muted">
                    {Number(item.hours).toLocaleString("es-CO", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                  </td>
                  <td className="tabular py-4 pl-4 text-right font-mono text-muted">{formatCurrency(item.unitPrice)}</td>
                  <td className="tabular py-4 pl-4 text-right font-mono text-fg">
                    <CountUp value={item.lineTotal} format={formatCurrency} />
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {extras?.length > 0 && (
        <div className="space-y-2 border-t border-line pt-4">
          {extras.map((extra) => (
            <div key={extra.id} className="flex justify-between gap-4 text-sm">
              <span className="text-muted">{extra.type}</span>
              <span className="tabular font-mono text-fg">{formatCurrency(extra.amount)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3 border-t border-line pt-5">
        <div className="flex justify-between gap-4 text-sm">
          <span className="text-muted">Subtotal</span>
          <span className="tabular font-mono text-fg">{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex items-end justify-between gap-4">
          <span className="text-base font-semibold text-fg">Total de la propuesta</span>
          <span className="display tabular text-[28px] text-fg">{formatCurrency(total)}</span>
        </div>
      </div>
    </div>
  );
}
