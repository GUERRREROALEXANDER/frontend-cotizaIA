import { motion } from "framer-motion";
import { formatDateTime } from "../../components/ui.jsx";
import { duration, ease, staggerDelay } from "../../motion/presets.js";

export function StatusTimeline({ history }) {
  if (!history?.length) return null;

  const items = [...history].reverse();

  return (
    <div className="space-y-3" role="list" aria-label="Historial de estados">
      {items.map((entry, index) => (
        <motion.div
          key={`${entry.changedAt}-${index}`}
          layout
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: duration.state, ease: ease.out, delay: staggerDelay(index) }}
          className="relative flex gap-3"
          role="listitem"
        >
          <div className="relative flex flex-col items-center shrink-0" aria-hidden>
            <span className="z-10 h-2.5 w-2.5 rounded-full bg-accent" />
            {index < items.length - 1 && (
              <span className="h-full w-0.5 bg-border" />
            )}
          </div>
          <div className="flex-1 min-w-0 pt-1">
            <p className="text-sm text-fg">
              <span className="font-medium">{entry.from || "CREADA"}</span>
              <span className="mx-2 text-muted">→</span>
              <span className="font-medium text-brand">{entry.to}</span>
            </p>
            <p className="mt-0.5 text-xs text-muted">{formatDateTime(entry.changedAt)}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}