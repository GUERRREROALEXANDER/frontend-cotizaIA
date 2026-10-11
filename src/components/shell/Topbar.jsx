import { Bell, LogOut, Menu, Moon, RotateCw, Search, Sun } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { IconButton } from "../ui.jsx";
import { duration, ease } from "../../motion/presets.js";

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

export default function Topbar({ title, group, user, theme, onToggleTheme, onOpenPalette, onOpenNotifications, unreadCount, onRefresh, refreshing, onSignOut, onOpenMobileNav }) {
  return (
    <header className="glass-bar sticky top-0 z-30 border-b border-line">
      <div className="flex h-16 items-center gap-2 px-4 sm:px-8">
        <IconButton icon={Menu} label="Abrir menú" onClick={onOpenMobileNav} className="lg:hidden" />
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={title}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: duration.state, ease: ease.out }}
            className="min-w-0 flex-1 truncate text-sm text-faint"
          >
            {group} <span aria-hidden className="mx-1.5">/</span> <span className="font-semibold text-fg">{title}</span>
          </motion.p>
        </AnimatePresence>

        <button
          type="button"
          onClick={onOpenPalette}
          className="hidden h-11 w-72 items-center gap-2.5 rounded-full border border-line bg-surface px-4 text-sm text-faint transition-colors hover:border-brand/50 hover:text-muted md:flex"
        >
          <Search size={14} aria-hidden />
          <span className="flex-1 text-left">Buscar o ir a…</span>
          <kbd className="rounded-full bg-surface-2 px-2 py-0.5 font-mono text-[11px]">{isMac ? "⌘" : "Ctrl"} K</kbd>
        </button>
        <IconButton icon={Search} label="Buscar" onClick={onOpenPalette} className="md:hidden" />
        <IconButton icon={RotateCw} label="Actualizar" onClick={onRefresh} disabled={refreshing} className={refreshing ? "[&_svg]:animate-spin" : ""} />
        <IconButton icon={Bell} label={`Notificaciones${unreadCount ? ` (${unreadCount} nuevas)` : ""}`} onClick={onOpenNotifications} badge={unreadCount} />
        <IconButton icon={theme === "dark" ? Sun : Moon} label={theme === "dark" ? "Tema claro" : "Tema oscuro"} onClick={onToggleTheme} />
        <span className="mx-1 hidden h-6 w-px bg-line sm:block" aria-hidden />
        <div className="hidden text-right leading-tight sm:block">
          <p className="text-sm font-semibold text-fg">Agencia #{user?.agencyId ?? "?"}</p>
          <p className="text-xs text-faint">{user?.role === "OWNER" ? "Propietario" : user?.role || "Operador"}</p>
        </div>
        <IconButton icon={LogOut} label="Cerrar sesión" onClick={onSignOut} className="hover:text-danger" />
      </div>
    </header>
  );
}
