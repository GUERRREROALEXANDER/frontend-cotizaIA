import { AnimatePresence, motion } from "framer-motion";
import { PanelLeftClose, PanelLeftOpen, Sparkles, X } from "lucide-react";
import { viewGroups, views } from "../../navigation.js";
import { duration, ease } from "../../motion/presets.js";

function NavList({ activeView, onNavigate, collapsed, counts, layoutGroup }) {
  return (
    <nav aria-label="Navegación principal" className="flex flex-1 flex-col gap-7 overflow-y-auto px-3 py-4 scrollbar-subtle">
      {viewGroups.map((group) => (
        <div key={group}>
          {!collapsed && <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-[0.08em] text-faint">{group}</p>}
          <ul className="flex flex-col gap-1">
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
                    className={`group relative flex h-11 w-full items-center gap-3 rounded-full px-4 text-[15px] font-medium transition-colors duration-200 ${active ? "text-accent-fg" : "text-muted hover:bg-surface-2 hover:text-fg"} ${collapsed ? "justify-center px-0" : ""}`}
                  >
                    {active && (
                      <motion.span
                        layoutId={`${layoutGroup}-active`}
                        className="absolute inset-0 rounded-full bg-accent"
                        transition={{ duration: duration.state, ease: ease.fluid }}
                      />
                    )}
                    <Icon size={18} className="relative shrink-0" aria-hidden />
                    {!collapsed && <span className="relative flex-1 truncate text-left">{label}</span>}
                    {!collapsed && count > 0 && (
                      <span className={`relative grid min-w-6 place-items-center rounded-full px-1.5 text-xs font-semibold ${active ? "bg-ink text-ink-fg" : "bg-accent-soft text-brand"}`}>{count}</span>
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
    <div className={`flex h-20 items-center gap-3 px-5 ${collapsed ? "justify-center px-0" : ""}`}>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink text-ink-fg">
        <Sparkles size={18} aria-hidden />
      </span>
      {!collapsed && (
        <p className="display text-[1.6rem] text-fg">CotizaIA</p>
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
        animate={{ width: collapsed ? 76 : 264 }}
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
            className="flex h-11 w-full items-center gap-3 rounded-full px-4 text-[15px] text-muted transition-colors hover:bg-surface-2 hover:text-fg"
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
