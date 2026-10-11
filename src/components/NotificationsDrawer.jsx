import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, CheckCircle2, Eye, FileText, Loader2, Send, X, XCircle } from "lucide-react";
import { duration, ease } from "../motion/presets.js";
import { Button, EmptyState, IconButton, formatRelative, statusLabels } from "./ui.jsx";

// Shared copy for the drawer rows and the sonner toasts.
export function notificationText(item) {
  const data = item && typeof item.data === "object" && item.data !== null ? item.data : {};
  if (item && item.eventType === "PROPOSAL_STATUS_CHANGED") {
    const toLabel = statusLabels[data.to] || String(data.to || "").replaceAll("_", " ").toLowerCase();
    const fromLabel = statusLabels[data.from] || String(data.from || "").replaceAll("_", " ").toLowerCase();
    return {
      title: `${data.clientName || "Propuesta"}: ${toLabel}`,
      description: `De ${fromLabel} a ${toLabel}`,
    };
  }
  return {
    title: String((item && item.eventType) || "").toLowerCase().replaceAll("_", " "),
    description: data.message || "",
  };
}

function statusIcon(status) {
  const normalized = String(status || "").toUpperCase();
  if (normalized === "ACCEPTED" || normalized === "CONTRACT_ISSUED") {
    return { Icon: CheckCircle2, className: "text-success" };
  }
  if (normalized === "REJECTED" || normalized === "EXPIRED") {
    return { Icon: XCircle, className: "text-danger" };
  }
  if (normalized === "SENT" || normalized === "NEGOTIATING") {
    return { Icon: Send, className: "text-brand" };
  }
  if (normalized === "IN_REVIEW") {
    return { Icon: Eye, className: "text-warning" };
  }
  if (normalized === "ANALYZING") {
    return { Icon: Loader2, className: "text-info" };
  }
  return { Icon: FileText, className: "text-muted" };
}

function NotificationRow({ item, unread, onOpenProposal }) {
  const { title, description } = notificationText(item);
  const target = item.data && item.data.to ? item.data.to : null;
  const { Icon, className } = statusIcon(target);
  return (
    <button
      type="button"
      onClick={() => onOpenProposal(item.proposalId)}
      className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors duration-200 hover:bg-surface-2"
    >
      <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line bg-surface-2 ${className}`}>
        <Icon size={15} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span className="truncate text-[13px] font-medium text-fg">{title}</span>
          {unread && <span aria-label="Sin leer" className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />}
        </span>
        {description && <span className="mt-0.5 block truncate text-xs text-muted">{description}</span>}
        <span className="mt-1 flex items-center gap-2 font-mono text-[11px] text-faint">
          <span>Propuesta #{item.proposalId}</span>
          <span aria-hidden>·</span>
          <span>{formatRelative(item.sentAt)}</span>
        </span>
      </span>
    </button>
  );
}

function NotificationGroup({ heading, items, lastSeenId, onOpenProposal }) {
  if (items.length === 0) return null;
  return (
    <section aria-label={heading}>
      <h3 className="px-3 pb-1 pt-4 text-xs font-medium text-muted">{heading}</h3>
      <div className="flex flex-col gap-0.5">
        {items.map((item) => (
          <NotificationRow
            key={item.id}
            item={item}
            unread={item.id > (lastSeenId ?? 0)}
            onOpenProposal={onOpenProposal}
          />
        ))}
      </div>
    </section>
  );
}

export default function NotificationsDrawer({ open, onClose, notifications, lastSeenId, onMarkAllRead, onOpenProposal }) {
  const closeRef = useRef(null);
  const list = Array.isArray(notifications) ? notifications : [];

  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open ]);

  useEffect(() => {
    if (!open) return undefined;
    function handleKey(event) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  const todayLabel = new Date().toDateString();
  const today = list.filter((item) => {
    try {
      return new Date(item.sentAt).toDateString() === todayLabel;
    } catch {
      return false;
    }
  });
  const older = list.filter((item) => !today.includes(item));

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Notificaciones">
          <motion.div
            aria-hidden
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: duration.panel * 0.6, ease: ease.out }}
            className="absolute inset-0 bg-bg/70 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: duration.panel, ease: ease.fluid }}
            className="absolute right-0 top-0 flex h-full w-full max-w-[420px] flex-col border-l border-line bg-surface shadow-overlay"
          >
            <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
              <h2 className="text-base font-semibold text-fg">Notificaciones</h2>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" onClick={onMarkAllRead}>
                  Marcar todo como leído
                </Button>
                <IconButton ref={closeRef} icon={X} label="Cerrar notificaciones" onClick={onClose} />
              </div>
            </header>
            <div className="scrollbar-subtle flex-1 overflow-y-auto px-2 pb-6 pt-1">
              {list.length === 0 ? (
                <EmptyState icon={Bell} title="Sin notificaciones todavía" description="Te avisaremos aquí cuando una propuesta cambie de estado." />
              ) : (
                <>
                  <NotificationGroup heading="Hoy" items={today} lastSeenId={lastSeenId} onOpenProposal={onOpenProposal} />
                  <NotificationGroup heading="Anteriores" items={older} lastSeenId={lastSeenId} onOpenProposal={onOpenProposal} />
                </>
              )}
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
