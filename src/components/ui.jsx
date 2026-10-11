import { forwardRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { CountUp, MaskedText } from "../motion/Motion.jsx";
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

// Wise shape language: every button is a pill. Lime fill is the single
// primary action; secondary is an outlined forest pill.
export const buttonVariants = {
  primary: "bg-accent text-accent-fg hover:bg-accent-hover border-transparent",
  secondary: "bg-transparent text-brand border-brand/70 hover:bg-accent-soft hover:border-brand",
  ghost: "bg-transparent text-muted border-transparent hover:bg-surface-2 hover:text-fg",
  danger: "bg-transparent text-danger border-danger/40 hover:border-danger hover:bg-danger/10",
  ink: "bg-ink text-ink-fg border-transparent hover:bg-ink-2",
};

const buttonSizes = {
  sm: "h-9 px-4 text-[13px] gap-1.5",
  md: "h-11 px-5 text-[15px] gap-2",
  lg: "h-13 px-7 text-base gap-2.5",
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
      className={`inline-flex shrink-0 items-center justify-center rounded-full border font-medium transition-colors duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-50 ${buttonVariants[variant]} ${buttonSizes[size]} ${className}`}
      {...props}
    >
      {loading ? <Loader2 size={16} className="animate-spin" aria-hidden /> : Icon ? <Icon size={16} aria-hidden /> : null}
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
      className={`relative grid h-10 w-10 shrink-0 place-items-center rounded-full text-muted transition-colors duration-200 hover:bg-surface-2 hover:text-fg ${className}`}
      {...props}
    >
      <Icon size={18} aria-hidden />
      {badge ? (
        <span className="absolute right-0.5 top-0.5 grid min-w-[18px] place-items-center rounded-full bg-accent px-1 font-mono text-[10px] font-semibold leading-[18px] text-accent-fg ring-2 ring-surface">
          {badge > 99 ? "99+" : badge}
        </span>
      ) : null}
    </button>
  );
});

export function Panel({ as: Component = "section", children, className = "", ...props }) {
  return (
    <Component className={`rounded-xl bg-surface shadow-card ${className}`} {...props}>
      {children}
    </Component>
  );
}

// Inverted forest section (Wise "dark section card"): lime headline on ink.
export function InkPanel({ as: Component = "section", children, className = "", ...props }) {
  return (
    <Component className={`relative overflow-hidden rounded-2xl bg-ink text-ink-text ${className}`} {...props}>
      {children}
    </Component>
  );
}

// Page titles are the brand's shout: ultra-heavy display type revealed word
// by word through a mask.
export function PageHeader({ title, description, actions }) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-5">
      <div className="min-w-0">
        <MaskedText as="h1" text={title} className="display block text-[clamp(2.5rem,5vw,4rem)] text-fg" />
        {description && <p className="mt-3 max-w-[60ch] text-base text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </header>
  );
}

export function SectionHeading({ title, description, action }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-bold tracking-tight text-fg">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
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
    <Panel className={`flex flex-col gap-4 p-6 transition-shadow duration-300 hover:shadow-lift ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-muted">{label}</span>
        {Icon && (
          <span className="grid h-9 w-9 place-items-center rounded-full bg-accent-soft text-brand">
            <Icon size={17} aria-hidden />
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="display text-[2.75rem] text-fg">
          {numeric ? <CountUp value={value} format={format} /> : value}
        </span>
        {delta != null && (
          <span className={`text-sm font-semibold ${delta >= 0 ? "text-success" : "text-danger"}`}>
            {delta >= 0 ? "+" : ""}
            {delta}%
          </span>
        )}
      </div>
      {detail && <p className="text-sm text-faint">{detail}</p>}
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
    <div className="flex min-h-56 flex-col items-center justify-center px-6 py-12 text-center">
      {Icon && (
        <span className="mb-5 grid h-14 w-14 place-items-center rounded-full bg-accent-soft text-brand">
          <Icon size={24} strokeWidth={1.8} aria-hidden />
        </span>
      )}
      <h3 className="text-lg font-bold tracking-tight text-fg">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm leading-6 text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Skeleton({ className = "" }) {
  return <span aria-hidden className={`skeleton block rounded-md ${className}`} />;
}

// Statuses share the five kanban groups, so a status has one color in badges,
// kanban columns and the dashboard donut (tokens --status-* / --chart-*).
const statusTone = {
  RECEIVED: "new",
  ANALYZING: "new",
  QUOTED: "new",
  IN_REVIEW: "review",
  SENT: "sent",
  NEGOTIATING: "sent",
  ACCEPTED: "won",
  CONTRACT_ISSUED: "won",
  REJECTED: "closed",
  EXPIRED: "closed",
  PENDING: "neutral",
  DRAFT: "neutral",
  RUNNING: "new",
  PROCESSING: "new",
  HALTED: "review",
  APPROVED: "won",
  COMPLETED: "won",
  SUCCEEDED: "won",
  FAILED: "closed",
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
  neutral: "bg-surface-2 text-muted border-transparent",
  new: "bg-[var(--status-new-bg)] text-[var(--status-new-fg)] border-transparent",
  review: "bg-[var(--status-review-bg)] text-[var(--status-review-fg)] border-transparent",
  sent: "bg-[var(--status-sent-bg)] text-[var(--status-sent-fg)] border-transparent",
  won: "bg-[var(--status-won-bg)] text-[var(--status-won-fg)] border-transparent",
  closed: "bg-[var(--status-closed-bg)] text-[var(--status-closed-fg)] border-transparent",
  // Generic tones kept for non-status badges.
  info: "bg-[var(--status-new-bg)] text-[var(--status-new-fg)] border-transparent",
  warning: "bg-[var(--status-review-bg)] text-[var(--status-review-fg)] border-transparent",
  accent: "bg-accent-soft text-brand border-transparent",
  success: "bg-[var(--status-won-bg)] text-[var(--status-won-fg)] border-transparent",
  danger: "bg-[var(--status-closed-bg)] text-[var(--status-closed-fg)] border-transparent",
};

export function Badge({ tone = "neutral", children, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${toneClass[tone]} ${className}`}>
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
  "inline-flex items-center justify-center gap-2 rounded-full border border-brand/70 bg-transparent px-5 h-11 text-[15px] font-medium text-brand transition-colors duration-200 hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-50";

export const inputClass = fieldClass;
