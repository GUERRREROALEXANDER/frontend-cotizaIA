import { motion } from "framer-motion";
import { formatCurrency } from "../../components/ui.jsx";
import { CountUp } from "../../motion/Motion.jsx";
import { duration, ease, staggerDelay } from "../../motion/presets.js";

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
            {items.map((item, index) => (
              <motion.tr
                key={item.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: duration.state, ease: ease.out, delay: staggerDelay(index) }}
                className="border-b border-line/70 align-top"
              >
                <td className="py-4 pr-4 text-fg">{item.description}</td>
                <td className="tabular py-4 pl-4 text-right font-mono text-muted">
                  {Number(item.hours).toLocaleString("es-CO", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                </td>
                <td className="tabular py-4 pl-4 text-right font-mono text-muted">{formatCurrency(item.unitPrice)}</td>
                <td className="tabular py-4 pl-4 text-right font-mono text-fg">
                  <CountUp value={item.lineTotal} format={formatCurrency} />
                </td>
              </motion.tr>
            ))}
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
