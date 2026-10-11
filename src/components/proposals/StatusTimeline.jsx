import { motion } from "framer-motion";
import { formatDateTime, statusLabels } from "../../components/ui.jsx";
import { duration, ease, staggerDelay } from "../../motion/presets.js";

const label = (status) =>
  statusLabels[status] || (status === "CREADA" ? "Creada" : String(status || "").replaceAll("_", " ").toLowerCase());

export function StatusTimeline({ history }) {
  if (!history?.length) return null;

  const items = [...history].reverse();

  return (
    <div className="space-y-4" role="list" aria-label="Historial de estados">
      {items.map((entry, index) => (
        <motion.div
          key={`${entry.changedAt}-${index}`}
          layout
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: duration.state, ease: ease.out, delay: staggerDelay(index) }}
          className="relative flex gap-4"
          role="listitem"
        >
          <div className="relative flex flex-col items-center shrink-0" aria-hidden>
            <span className="z-10 h-2.5 w-2.5 rounded-full bg-brand" />
            {index < items.length - 1 && (
              <span className="h-full w-0.5 bg-line" />
            )}
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <p className="text-sm text-fg">
              <span className="font-medium">{label(entry.from || "CREADA")}</span>
              <span className="mx-2 text-faint" aria-hidden>→</span>
              <span className="font-semibold text-brand">{label(entry.to)}</span>
            </p>
            <p className="mt-1 text-sm text-muted">{formatDateTime(entry.changedAt)}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
