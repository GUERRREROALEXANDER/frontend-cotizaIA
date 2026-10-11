import { useEffect, useState } from "react";
import { Check, Coins, Inbox, Library, Users } from "lucide-react";
import { Panel } from "../ui.jsx";
import { StaggerItem } from "../../motion/Motion.jsx";
import AnimatedLink from "../motion/AnimatedLink.jsx";
import { get } from "../../api.js";

// Setup checklist: the agent cannot quote without a catalog and rates, so a
// new agency sees exactly what is missing. Hidden once everything is done,
// and hidden while the setup state is still unknown.
export function OnboardingChecklist({ clientsCount = 0, proposalsCount = 0, onNavigate, className = "" }) {
  const [catalog, setCatalog] = useState(null);
  const [roles, setRoles] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [catalogData, rolesData] = await Promise.all([get("/api/catalog"), get("/api/roles")]);
        if (!cancelled) {
          setCatalog(catalogData || []);
          setRoles(rolesData || []);
        }
      } catch {
        // Setup state unknown (offline or error): hide instead of nagging.
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (catalog == null || roles == null) return null;

  const items = [
    { key: "catalog", icon: Library, done: catalog.length > 0, label: "Configura tu catálogo", action: "Abrir catálogo", target: "catalog" },
    { key: "rates", icon: Coins, done: roles.length > 0, label: "Define tus tarifas", action: "Abrir tarifas", target: "rates" },
    { key: "clients", icon: Users, done: clientsCount > 0, label: "Crea tu primer cliente", action: "Abrir clientes", target: "clients" },
    { key: "brief", icon: Inbox, done: proposalsCount > 0, label: "Procesa tu primer brief", action: "Crear brief", target: "inbox" },
  ];
  if (items.every((item) => item.done)) return null;

  return (
    <Panel className={`p-6 ${className}`}>
      <h2 className="text-lg font-bold tracking-tight text-fg">Primeros pasos</h2>
      <p className="mt-1 text-sm text-muted">Deja todo listo para que el agente pueda cotizar sin frenarse.</p>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
        {items.map((item, index) => {
          const ItemIcon = item.icon;
          return (
            <StaggerItem key={item.key} index={index} as="li">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-bg p-4">
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${
                    item.done ? "bg-accent text-accent-fg" : "border border-line-strong text-faint"
                  }`}
                >
                  {item.done ? <Check size={16} aria-hidden /> : <ItemIcon size={16} aria-hidden />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-medium text-fg">
                    {item.label}
                    <span className="sr-only">{item.done ? " (completado)" : " (pendiente)"}</span>
                  </span>
                </span>
                {!item.done && (
                  <AnimatedLink onClick={() => onNavigate(item.target)} className="ml-auto text-sm">
                    {item.action}
                  </AnimatedLink>
                )}
              </div>
            </StaggerItem>
          );
        })}
      </ul>
    </Panel>
  );
}
