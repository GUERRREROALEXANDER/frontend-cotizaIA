import { useEffect, useRef } from "react";
import { Command } from "cmdk";
import { AnimatePresence, motion } from "framer-motion";
import { FileText, Inbox, LogOut, Moon, Plus, Sun, Users } from "lucide-react";
import { LIMITS } from "../limits.js";
import { overlay } from "../motion/presets.js";
import { views } from "../navigation.js";
import { StatusBadge, formatCurrency } from "./ui.jsx";

const itemClass =
  "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-fg data-[selected=true]:bg-surface-2 [&[data-selected=true]_svg]:text-brand";

function PaletteGroup({ heading, children }) {
  return (
    <Command.Group>
      <div aria-hidden className="px-3 pb-1 pt-3 text-xs font-medium text-muted">
        {heading}
      </div>
      {children}
    </Command.Group>
  );
}

export default function CommandPalette({
  open,
  onOpenChange,
  onNavigate,
  clients = [],
  briefs = [],
  proposals = [],
  theme,
  onToggleTheme,
  onOpenBrief,
  onOpenProposal,
  onSignOut,
}) {
  const previousFocus = useRef(null);

  useEffect(() => {
    if (open) {
      previousFocus.current = document.activeElement;
      return undefined;
    }
    if (previousFocus.current && typeof previousFocus.current.focus === "function") {
      previousFocus.current.focus();
    }
    previousFocus.current = null;
    return undefined;
  }, [open ]);

  useEffect(() => {
    if (!open) return undefined;
    function handleKey(event) {
      if (event.key === "Escape") onOpenChange(false);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onOpenChange]);

  function run(action) {
    action();
    onOpenChange(false);
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <motion.div
            aria-hidden
            onClick={() => onOpenChange(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-bg/70 backdrop-blur-sm"
          />
          <div className="pointer-events-none absolute inset-0 overflow-y-auto px-4">
            <motion.div
              {...overlay}
              role="dialog"
              aria-modal="true"
              aria-label="Buscador de comandos"
              className="pointer-events-auto mx-auto mb-8 mt-[15vh] w-full max-w-[640px] overflow-hidden rounded-xl border border-line bg-surface shadow-overlay"
            >
              <Command label="Buscador de comandos">
                <Command.Input
                  autoFocus
                  maxLength={LIMITS.search}
                  placeholder="Busca vistas, propuestas, clientes o acciones…"
                  className="w-full border-b border-line bg-transparent px-4 py-3 text-sm text-fg outline-none placeholder:text-faint"
                />
                <Command.List className="scrollbar-subtle max-h-[50vh] overflow-y-auto p-2">
                  <Command.Empty className="px-3 py-8 text-center text-[13px] text-muted">
                    Sin resultados
                  </Command.Empty>
                  <PaletteGroup heading="Ir a">
                    {views.map((view) => {
                      const ViewIcon = view.icon;
                      return (
                        <Command.Item
                          key={view.id}
                          value={`ir a ${view.label} ${view.title}`}
                          onSelect={() => run(() => onNavigate(view.id))}
                          className={itemClass}
                        >
                          <ViewIcon size={15} aria-hidden className="shrink-0 text-muted" />
                          <span className="flex-1">{view.label}</span>
                          <kbd className="rounded-md border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-faint">
                            {view.shortcut}
                          </kbd>
                        </Command.Item>
                      );
                    })}
                  </PaletteGroup>
                  <PaletteGroup heading="Acciones">
                    <Command.Item value="nuevo brief crear bandeja" onSelect={() => run(() => onNavigate("inbox"))} className={itemClass}>
                      <Plus size={15} aria-hidden className="shrink-0 text-muted" />
                      <span className="flex-1">Nuevo brief</span>
                    </Command.Item>
                    <Command.Item
                      value={`cambiar a tema ${theme === "dark" ? "claro" : "oscuro"}`}
                      onSelect={() => run(() => onToggleTheme())}
                      className={itemClass}
                    >
                      {theme === "dark" ? (
                        <Sun size={15} aria-hidden className="shrink-0 text-muted" />
                      ) : (
                        <Moon size={15} aria-hidden className="shrink-0 text-muted" />
                      )}
                      <span className="flex-1">Cambiar a tema {theme === "dark" ? "claro" : "oscuro"}</span>
                    </Command.Item>
                    <Command.Item value="cerrar sesion salir" onSelect={() => run(() => onSignOut())} className={itemClass}>
                      <LogOut size={15} aria-hidden className="shrink-0 text-muted" />
                      <span className="flex-1">Cerrar sesión</span>
                    </Command.Item>
                  </PaletteGroup>
                  {proposals.length > 0 && (
                    <PaletteGroup heading="Propuestas">
                      {proposals.map((proposal) => (
                        <Command.Item
                          key={proposal.id}
                          value={`propuesta ${proposal.id}`}
                          onSelect={() => run(() => onOpenProposal(proposal.id))}
                          className={itemClass}
                        >
                          <FileText size={15} aria-hidden className="shrink-0 text-muted" />
                          <span className="flex-1">Propuesta #{proposal.id}</span>
                          <span className="font-mono text-xs text-muted">{formatCurrency(proposal.total)}</span>
                          <StatusBadge status={proposal.status} />
                        </Command.Item>
                      ))}
                    </PaletteGroup>
                  )}
                  {briefs.length > 0 && (
                    <PaletteGroup heading="Briefs">
                      {briefs.map((brief) => (
                        <Command.Item
                          key={brief.id}
                          value={`brief ${brief.id} ${brief.rawText || ""}`}
                          onSelect={() => run(() => onOpenBrief(brief))}
                          className={itemClass}
                        >
                          <Inbox size={15} aria-hidden className="shrink-0 text-muted" />
                          <span className="flex-1 truncate">
                            Brief #{brief.id}
                            <span className="ml-2 text-muted">{String(brief.rawText || "").slice(0, 60)}</span>
                          </span>
                        </Command.Item>
                      ))}
                    </PaletteGroup>
                  )}
                  {clients.length > 0 && (
                    <PaletteGroup heading="Clientes">
                      {clients.map((client) => (
                        <Command.Item
                          key={client.id}
                          value={`cliente ${client.name || ""} ${client.company || ""}`}
                          onSelect={() => run(() => onNavigate("clients"))}
                          className={itemClass}
                        >
                          <Users size={15} aria-hidden className="shrink-0 text-muted" />
                          <span className="flex-1 truncate">
                            {client.name}
                            {client.company && <span className="ml-2 text-muted">{client.company}</span>}
                          </span>
                        </Command.Item>
                      ))}
                    </PaletteGroup>
                  )}
                </Command.List>
              </Command>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
