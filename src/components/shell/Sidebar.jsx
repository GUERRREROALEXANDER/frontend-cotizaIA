import { AnimatePresence, motion } from "framer-motion";
import { PanelLeftClose, PanelLeftOpen, Sparkles, X } from "lucide-react";
import { viewGroups, views } from "../../navigation.js";
import { duration, ease } from "../../motion/presets.js";

function NavList({ activeView, onNavigate, collapsed, counts, layoutGroup }) {
  return (
    <nav aria-label="Navegación principal" className="flex flex-1 flex-col gap-5 overflow-y-auto px-2 py-3 scrollbar-subtle">
      {viewGroups.map((group) => (
        <div key={group}>
          {!collapsed && <p className="mb-1.5 px-2.5 text-[11px] font-medium text-faint">{group}</p>}
          <ul className="flex flex-col gap-0.5">
            {views.filter((view) => view.group === group).map(({ id, label, icon: Icon, shortcut }) => {
              const active = activeView === id;
              const count = counts?.[id];
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => onNavigate(id)}
                    aria-current={active ? "page" : undefined}
                    title={collapsed ? `${label} (${shortcut})` : undefined}
                    className={`group relative flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-[13px] transition-colors duration-200 ${active ? "text-fg" : "text-muted hover:bg-surface-2 hover:text-fg"} ${collapsed ? "justify-center" : ""}`}
                  >
                    {active && (
                      <motion.span
                        layoutId={`${layoutGroup}-active`}
                        className="absolute inset-0 rounded-lg border border-line bg-surface-2"
                        transition={{ duration: duration.state, ease: ease.fluid }}
                      />
                    )}
                    <Icon size={16} className={`relative shrink-0 ${active ? "text-accent" : ""}`} aria-hidden />
                    {!collapsed && <span className="relative flex-1 truncate text-left">{label}</span>}
                    {!collapsed && count > 0 && (
                      <span className="relative rounded-full bg-accent-soft px-1.5 font-mono text-[11px] text-accent">{count}</span>
                    )}
                    {!collapsed && !count && (
                      <kbd className="relative hidden font-mono text-[10px] text-faint opacity-0 transition-opacity group-hover:opacity-100 lg:inline">{shortcut}</kbd>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function Brand({ collapsed }) {
  return (
    <div className={`flex h-14 items-center gap-2.5 px-4 ${collapsed ? "justify-center px-0" : ""}`}>
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent text-accent-fg">
        <Sparkles size={16} aria-hidden />
      </span>
      {!collapsed && (
        <div className="min-w-0 leading-tight">
          <p className="text-sm font-semibold text-fg">CotizaIA</p>
          <p className="text-[11px] text-faint">Centro de operaciones</p>
        </div>
      )}
    </div>
  );
}

// Desktop: fixed rail (248px, or 64px collapsed). Under lg it becomes an
// off-canvas sheet opened from the topbar.
export default function Sidebar({ activeView, onNavigate, collapsed, onToggleCollapsed, mobileOpen, onMobileClose, counts }) {
  return (
    <>
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 64 : 248 }}
        transition={{ duration: duration.panel, ease: ease.fluid }}
        className="sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-line bg-surface lg:flex"
      >
        <Brand collapsed={collapsed} />
        <NavList activeView={activeView} onNavigate={onNavigate} collapsed={collapsed} counts={counts} layoutGroup="desktop" />
        <div className={`border-t border-line p-2 ${collapsed ? "flex justify-center" : ""}`}>
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? "Expandir menú" : "Contraer menú"}
            className="flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-[13px] text-muted transition-colors hover:bg-surface-2 hover:text-fg"
          >
            {collapsed ? <PanelLeftOpen size={16} className="mx-auto" /> : <PanelLeftClose size={16} />}
            {!collapsed && <span>Contraer</span>}
          </button>
        </div>
      </motion.aside>

      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.button
              type="button"
              aria-label="Cerrar menú"
              className="absolute inset-0 bg-bg/70 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: duration.state }}
              onClick={onMobileClose}
            />
            <motion.aside
              className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-line bg-surface shadow-overlay"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: duration.panel, ease: ease.fluid }}
            >
              <div className="flex items-center justify-between pr-2">
                <Brand collapsed={false} />
                <button type="button" onClick={onMobileClose} aria-label="Cerrar menú" className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-surface-2">
                  <X size={16} />
                </button>
              </div>
              <NavList
                activeView={activeView}
                onNavigate={(id) => { onNavigate(id); onMobileClose(); }}
                collapsed={false}
                counts={counts}
                layoutGroup="mobile"
              />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
