import { Bell, LogOut, Menu, Moon, RotateCw, Search, Sun } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { IconButton } from "../ui.jsx";
import { duration, ease } from "../../motion/presets.js";

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

export default function Topbar({ title, user, theme, onToggleTheme, onOpenPalette, onOpenNotifications, unreadCount, onRefresh, refreshing, onSignOut, onOpenMobileNav }) {
  return (
    <header className="glass-bar sticky top-0 z-30 border-b border-line">
      <div className="flex h-14 items-center gap-2 px-4 sm:px-6">
        <IconButton icon={Menu} label="Abrir menú" onClick={onOpenMobileNav} className="lg:hidden" />
        <AnimatePresence mode="wait" initial={false}>
          <motion.h1
            key={title}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: duration.state, ease: ease.out }}
            className="min-w-0 flex-1 truncate text-sm font-semibold text-fg"
          >
            {title}
          </motion.h1>
        </AnimatePresence>

        <button
          type="button"
          onClick={onOpenPalette}
          className="hidden h-9 w-64 items-center gap-2 rounded-lg border border-line bg-surface-2 px-3 text-[13px] text-faint transition-colors hover:border-line-strong hover:text-muted md:flex"
        >
          <Search size={14} aria-hidden />
          <span className="flex-1 text-left">Buscar o ir a…</span>
          <kbd className="rounded border border-line px-1.5 font-mono text-[10px]">{isMac ? "⌘" : "Ctrl"} K</kbd>
        </button>
        <IconButton icon={Search} label="Buscar" onClick={onOpenPalette} className="md:hidden" />
        <IconButton icon={RotateCw} label="Actualizar" onClick={onRefresh} disabled={refreshing} className={refreshing ? "[&_svg]:animate-spin" : ""} />
        <IconButton icon={Bell} label={`Notificaciones${unreadCount ? ` (${unreadCount} nuevas)` : ""}`} onClick={onOpenNotifications} badge={unreadCount} />
        <IconButton icon={theme === "dark" ? Sun : Moon} label={theme === "dark" ? "Tema claro" : "Tema oscuro"} onClick={onToggleTheme} />
        <span className="mx-1 hidden h-6 w-px bg-line sm:block" aria-hidden />
        <div className="hidden text-right leading-tight sm:block">
          <p className="text-xs font-medium text-fg">Agencia #{user?.agencyId ?? "?"}</p>
          <p className="text-[11px] text-faint">{user?.role === "OWNER" ? "Propietario" : user?.role || "Operador"}</p>
        </div>
        <IconButton icon={LogOut} label="Cerrar sesión" onClick={onSignOut} className="hover:text-danger" />
      </div>
    </header>
  );
}
