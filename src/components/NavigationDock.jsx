import { BarChart3, Bot, FileText, Inbox, SlidersHorizontal } from "lucide-react";

const items = [
  { id: "dashboard", label: "Resumen", shortcut: "1", icon: BarChart3 },
  { id: "pipeline", label: "Agente IA", shortcut: "2", icon: Bot },
  { id: "inbox", label: "Briefs", shortcut: "3", icon: Inbox },
  { id: "pricing", label: "Precios", shortcut: "4", icon: SlidersHorizontal },
  { id: "proposals", label: "Propuestas", shortcut: "5", icon: FileText },
];

export default function NavigationDock({ activeView, onNavigate }) {
  return (
    <nav
      aria-label="Navegación principal"
      className="glass mx-auto flex w-fit max-w-full items-center gap-1 overflow-x-auto rounded-full p-1.5 shadow-glass"
    >
      {items.map(({ id, label, shortcut, icon: Icon }) => {
        const active = activeView === id;
        return (
          <button
            key={id}
            type="button"
            aria-label={`${label} [${shortcut}]`}
            aria-current={active ? "page" : undefined}
            title={`${label}  [${shortcut}]`}
            onClick={() => onNavigate(id)}
            className={`group relative flex h-10 shrink-0 items-center justify-center gap-2 rounded-full px-3 transition sm:px-4 ${
              active
                ? "bg-indigo-500 text-white shadow-sm shadow-indigo-950/10"
                : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
            }`}
          >
            <Icon size={17} strokeWidth={active ? 2 : 1.7} />
            <span className="hidden text-xs font-medium sm:inline">{label}</span>
            <span className="pointer-events-none absolute left-1/2 top-[calc(100%+10px)] -translate-x-1/2 whitespace-nowrap rounded-full border border-slate-700 bg-white px-3 py-1.5 text-[10px] font-medium text-slate-200 opacity-0 shadow-xl transition group-hover:opacity-100 sm:hidden">
              {label} <span className="ml-1 font-mono text-slate-500">[{shortcut}]</span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}
