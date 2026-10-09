import { motion } from "framer-motion";

export function formatCurrency(value) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" }).format(new Date(value));
}

export function Panel({ children, className = "", ...props }) {
  return (
    <section className={`glass rounded-[24px] ${className}`} {...props}>
      {children}
    </section>
  );
}

export function SectionHeading({ eyebrow, title, description, action }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="mb-2 text-[10px] font-semibold uppercase tracking-[.22em] text-slate-500">{eyebrow}</p>}
        <h2 className="text-xl font-semibold tracking-tight text-slate-100 sm:text-2xl">{title}</h2>
        {description && <p className="mt-1.5 text-sm text-slate-400">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function MetricCard({ icon: Icon, label, value, detail, accent = "slate", delay = 0 }) {
  const accentStyles = {
    amber: "bg-amber-400/10 text-amber-300 ring-amber-400/15",
    indigo: "bg-indigo-400/10 text-indigo-300 ring-indigo-400/15",
    emerald: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/15",
    slate: "bg-slate-400/10 text-slate-300 ring-slate-400/15",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="glass rounded-[24px] p-5"
    >
      <div className="flex items-start justify-between">
        <span className="text-[11px] font-medium uppercase tracking-[.14em] text-slate-400">{label}</span>
        <span className={`grid h-9 w-9 place-items-center rounded-xl ring-1 ${accentStyles[accent]}`}>
          <Icon size={17} strokeWidth={1.8} />
        </span>
      </div>
      <div className="mt-5 font-mono text-2xl font-medium tracking-tight text-slate-100 sm:text-[28px]">{value}</div>
      <p className="mt-1.5 text-xs text-slate-500">{detail}</p>
    </motion.div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center px-6 py-10 text-center">
      {Icon && <Icon className="mb-4 text-slate-600" size={27} strokeWidth={1.5} />}
      <h3 className="text-sm font-medium text-slate-200">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-xs leading-5 text-slate-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function StatusBadge({ status }) {
  const normalized = String(status || "PENDING").toUpperCase();
  const styles = {
    ACCEPTED: "border-emerald-400/15 bg-emerald-400/10 text-emerald-300",
    APPROVED: "border-emerald-400/15 bg-emerald-400/10 text-emerald-300",
    SENT: "border-indigo-400/15 bg-indigo-400/10 text-indigo-300",
    PROCESSING: "border-indigo-400/15 bg-indigo-400/10 text-indigo-300",
    RUNNING: "border-indigo-400/15 bg-indigo-400/10 text-indigo-300",
    COMPLETED: "border-emerald-400/15 bg-emerald-400/10 text-emerald-300",
    SUCCEEDED: "border-emerald-400/15 bg-emerald-400/10 text-emerald-300",
    REJECTED: "border-rose-400/15 bg-rose-400/10 text-rose-300",
    FAILED: "border-rose-400/15 bg-rose-400/10 text-rose-300",
    IN_REVIEW: "border-amber-400/15 bg-amber-400/10 text-amber-300",
    QUOTED: "border-amber-400/15 bg-amber-400/10 text-amber-300",
    PENDING: "border-slate-400/15 bg-slate-400/10 text-slate-300",
  };
  const labels = {
    ACCEPTED: "Aceptada",
    APPROVED: "Aprobada",
    SENT: "Enviada",
    PROCESSING: "En proceso",
    COMPLETED: "Completada",
    REJECTED: "Rechazada",
    FAILED: "Fallida",
    IN_REVIEW: "Por revisar",
    PENDING: "Pendiente",
    DRAFT: "Borrador",
    RECEIVED: "Recibida",
    ANALYZING: "En análisis",
    QUOTED: "Cotizada",
    NEGOTIATING: "En negociación",
    CONTRACT_ISSUED: "Contrato emitido",
    EXPIRED: "Vencida",
    RUNNING: "En ejecución",
    SUCCEEDED: "Completada",
  };
  const statusStyle = styles[normalized] || styles.PENDING;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium ${statusStyle}`}>
      <span className="h-1 w-1 rounded-full bg-current" />
      {labels[normalized] || normalized.replaceAll("_", " ")}
    </span>
  );
}

export const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-full border border-slate-700 bg-white px-4 py-2.5 text-xs font-medium text-slate-200 shadow-sm shadow-slate-900/5 transition hover:border-slate-600 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50";

export const inputClass =
  "w-full rounded-2xl border border-slate-700 bg-white px-4 py-3 text-sm text-slate-200 outline-none transition placeholder:text-slate-500 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10";
