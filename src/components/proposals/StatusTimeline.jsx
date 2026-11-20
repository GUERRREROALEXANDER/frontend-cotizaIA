import { motion } from "framer-motion";
import { Eye } from "lucide-react";
import { formatDateTime, statusLabel } from "../../components/ui.jsx";
import { duration, ease, staggerDelay } from "../../motion/presets.js";

// CREADA is the first history entry the backend writes; it is not a proposal status.
const label = (status) => (status === "CREADA" ? "Creada" : statusLabel(status));

// `viewedAt` is a stamp the status history does not carry: the client opening the
// proposal is not a transition, so it is rendered as its own entry above the history.
export function StatusTimeline({ history, viewedAt }) {
  const entries = history?.length ? [...history].reverse() : [];
  if (!entries.length && !viewedAt) return null;

  const items = viewedAt ? [{ key: "viewed", viewed: true }, ...entries] : entries;

  return (
    <div className="space-y-4" role="list" aria-label="Historial de estados">
      {items.map((entry, index) => (
        <motion.div
          key={entry.viewed ? "viewed" : `${entry.changedAt}-${index}`}
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
            {entry.viewed ? (
              <p className="flex items-center gap-2 text-sm text-fg">
                <Eye size={14} className="text-brand" aria-hidden />
                <span className="font-semibold text-brand">Vista</span>
                <span className="text-muted">el cliente abrió la propuesta</span>
              </p>
            ) : (
              <p className="text-sm text-fg">
                <span className="font-medium">{label(entry.from || "CREADA")}</span>
                <span className="mx-2 text-faint" aria-hidden>→</span>
                <span className="font-semibold text-brand">{label(entry.to)}</span>
              </p>
            )}
            <p className="mt-1 text-sm text-muted">{formatDateTime(entry.viewed ? viewedAt : entry.changedAt)}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
