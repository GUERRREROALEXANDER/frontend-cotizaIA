import { motion } from "framer-motion";
import { Panel } from "../ui.jsx";

// Animated inline form card for create and edit forms on settings views.
// Wrap it in AnimatePresence to get opacity plus 6px rise on mount/unmount.
export function FormPanel({ title, subtitle, onSubmit, footer, children, className = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      <Panel className="overflow-hidden">
        <div className="border-b border-line px-5 py-4">
          <p className="text-sm font-semibold text-fg">{title}</p>
          {subtitle && <p className="mt-0.5 text-xs text-faint">{subtitle}</p>}
        </div>
        <form onSubmit={onSubmit} className="space-y-4 p-5">
          {children}
          {footer}
        </form>
      </Panel>
    </motion.div>
  );
}
