import { motion } from "framer-motion";
import { formatCurrency } from "../../components/ui.jsx";
import { CountUp } from "../../motion/Motion.jsx";
import { staggerDelay } from "../../motion/presets.js";

export function ProposalItemsTable({ items, extras, subtotal, total }) {
  if (!items?.length) {
    return (
      <p className="text-sm text-muted text-center py-8">
        La propuesta no tiene ítems detallados.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 text-xs font-medium text-muted">
        <span>Descripción</span>
        <span className="text-right">Horas</span>
        <span className="text-right">Tarifa</span>
        <span className="text-right">Subtotal</span>
      </div>
      <div className="space-y-2" role="list">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1], delay: staggerDelay(index) }}
            className="grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center rounded-lg border border-line bg-surface-2 p-3"
            role="listitem"
          >
            <p className="text-sm text-fg truncate">{item.description}</p>
            <span className="font-mono text-sm text-fg text-right tabular-nums">
              {Number(item.hours).toLocaleString("es-CO", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
            </span>
            <span className="font-mono text-sm text-muted text-right tabular-nums">
              {formatCurrency(item.unitPrice)}
            </span>
            <span className="font-mono text-sm text-fg text-right tabular-nums">
              <CountUp value={item.lineTotal} format={formatCurrency} />
            </span>
          </motion.div>
        ))}
      </div>
      {extras?.length > 0 && (
        <div className="mt-4 space-y-2 border-t border-line pt-4">
          {extras.map((extra) => (
            <div key={extra.id} className="flex justify-between gap-4 text-sm">
              <span className="text-muted">{extra.type}</span>
              <span className="font-mono text-fg tabular-nums">{formatCurrency(extra.amount)}</span>
            </div>
          ))}
        </div>
      )}
      <div className="mt-4 space-y-2 border-t border-line pt-4">
        <div className="flex justify-between gap-4 text-sm">
          <span className="text-muted">Subtotal</span>
          <span className="font-mono text-fg tabular-nums">{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between gap-4 text-base font-semibold">
          <span className="text-fg">Total de la propuesta</span>
          <span className="font-mono text-accent tabular-nums">{formatCurrency(total)}</span>
        </div>
      </div>
    </div>
  );
}