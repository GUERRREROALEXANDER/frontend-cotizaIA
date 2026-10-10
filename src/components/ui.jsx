import { forwardRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { CountUp } from "../motion/Motion.jsx";
import { duration, ease } from "../motion/presets.js";
import { fieldClass } from "./fields.jsx";

export function formatCurrency(value) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export function formatDate(value) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" }).format(new Date(value));
}

export function formatDateTime(value) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function formatRelative(value) {
  if (!value) return "";
  const seconds = Math.round((new Date(value).getTime() - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat("es-CO", { numeric: "auto" });
  const units = [["day", 86400], ["hour", 3600], ["minute", 60]];
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return rtf.format(seconds, "second");
}

export const buttonVariants = {
  primary: "bg-accent text-accent-fg hover:bg-accent-hover border-transparent",
  secondary: "bg-surface-2 text-fg border-line hover:border-line-strong hover:bg-surface",
  ghost: "bg-transparent text-muted border-transparent hover:bg-surface-2 hover:text-fg",
  danger: "bg-transparent text-danger border-line hover:border-danger hover:bg-danger/10",
};

const buttonSizes = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-9 px-3.5 text-[13px] gap-2",
};

// Loading swaps the icon for a spinner in place, so the label never jumps.
export const Button = forwardRef(function Button(
  { variant = "secondary", size = "md", icon: Icon, loading = false, className = "", children, disabled, ...props },
  ref,
) {
  const reduce = useReducedMotion();
  return (
    <motion.button
      ref={ref}
      type="button"
      whileTap={reduce || disabled || loading ? undefined : { scale: 0.97 }}
      transition={{ duration: duration.micro, ease: ease.out }}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex shrink-0 items-center justify-center rounded-lg border font-medium transition-colors duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-50 ${buttonVariants[variant]} ${buttonSizes[size]} ${className}`}
      {...props}
    >
      {loading ? <Loader2 size={14} className="animate-spin" aria-hidden /> : Icon ? <Icon size={14} aria-hidden /> : null}
      {children}
    </motion.button>
  );
});

export const IconButton = forwardRef(function IconButton({ icon: Icon, label, className = "", badge, ...props }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      className={`relative grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted transition-colors duration-200 hover:bg-surface-2 hover:text-fg ${className}`}
      {...props}
    >
      <Icon size={16} aria-hidden />
      {badge ? (
        <span className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-accent px-1 font-mono text-[10px] leading-4 text-accent-fg">
          {badge > 99 ? "99+" : badge}
        </span>
      ) : null}
    </button>
  );
});

export function Panel({ as: Component = "section", children, className = "", ...props }) {
  return (
    <Component className={`rounded-xl border border-line bg-surface shadow-card ${className}`} {...props}>
      {children}
    </Component>
  );
}

export function PageHeader({ title, description, actions }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-fg">{title}</h1>
        {description && <p className="mt-1 max-w-[68ch] text-[13px] text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function SectionHeading({ title, description, action }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-base font-semibold text-fg">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

// KPI tile: label, animated value, optional delta and sparkline slot.
// Deliberately not the big-number hero template: same weight as other panels.
export function KpiTile({ icon: Icon, label, value, format, detail, delta, children, className = "" }) {
  const numeric = typeof value === "number";
  return (
    <Panel className={`flex flex-col gap-3 p-4 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted">{label}</span>
        {Icon && <Icon size={15} className="text-faint" aria-hidden />}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-2xl font-medium tracking-tight text-fg">
          {numeric ? <CountUp value={value} format={format} /> : value}
        </span>
        {delta != null && (
          <span className={`font-mono text-xs ${delta >= 0 ? "text-success" : "text-danger"}`}>
            {delta >= 0 ? "+" : ""}
            {delta}%
          </span>
        )}
      </div>
      {detail && <p className="text-xs text-faint">{detail}</p>}
      {children}
    </Panel>
  );
}

// Kept for v1 call sites; new code uses KpiTile.
export function MetricCard({ icon, label, value, detail }) {
  return <KpiTile icon={icon} label={label} value={value} detail={detail} />;
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center px-6 py-10 text-center">
      {Icon && (
        <span className="mb-4 grid h-11 w-11 place-items-center rounded-xl border border-line bg-surface-2 text-muted">
          <Icon size={20} strokeWidth={1.6} aria-hidden />
        </span>
      )}
      <h3 className="text-sm font-medium text-fg">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-xs leading-5 text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Skeleton({ className = "" }) {
  return <span aria-hidden className={`skeleton block rounded-md ${className}`} />;
}

const statusTone = {
  RECEIVED: "neutral",
  QUOTED: "neutral",
  PENDING: "neutral",
  DRAFT: "neutral",
  ANALYZING: "info",
  PROCESSING: "info",
  RUNNING: "info",
  IN_REVIEW: "warning",
  HALTED: "warning",
  SENT: "accent",
  NEGOTIATING: "accent",
  ACCEPTED: "success",
  APPROVED: "success",
  CONTRACT_ISSUED: "success",
  COMPLETED: "success",
  SUCCEEDED: "success",
  REJECTED: "danger",
  EXPIRED: "danger",
  FAILED: "danger",
};

export const statusLabels = {
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
  HALTED: "En pausa",
};

const toneClass = {
  neutral: "bg-surface-2 text-muted border-line",
  info: "bg-info/12 text-info border-info/25",
  warning: "bg-warning/12 text-warning border-warning/25",
  accent: "bg-accent-soft text-accent border-accent/25",
  success: "bg-success/12 text-success border-success/25",
  danger: "bg-danger/10 text-danger border-danger/25",
};

export function Badge({ tone = "neutral", children, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium ${toneClass[tone]} ${className}`}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }) {
  const normalized = String(status || "PENDING").toUpperCase();
  return (
    <Badge tone={statusTone[normalized] || "neutral"}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {statusLabels[normalized] || normalized.replaceAll("_", " ").toLowerCase()}
    </Badge>
  );
}

// v1 string classes, now token-based, so untouched call sites keep working.
export const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-surface-2 px-3.5 h-9 text-[13px] font-medium text-fg transition-colors duration-200 hover:border-line-strong disabled:cursor-not-allowed disabled:opacity-50";

export const inputClass = fieldClass;
