import { BarChart3, Bot, BookOpen, Coins, FileText, Inbox, SlidersHorizontal, Users } from "lucide-react";

// Every screen of the app. `slug` is the URL hash (#/propuestas) and
// `shortcut` the single-key jump (1-8) handled in App.
export const views = [
  { id: "dashboard", slug: "resumen", label: "Resumen", title: "Resumen", icon: BarChart3, group: "Operación", shortcut: "1" },
  { id: "inbox", slug: "bandeja", label: "Bandeja", title: "Bandeja de briefs", icon: Inbox, group: "Operación", shortcut: "2" },
  { id: "pipeline", slug: "agente", label: "Agente", title: "Monitor del agente", icon: Bot, group: "Operación", shortcut: "3" },
  { id: "proposals", slug: "propuestas", label: "Propuestas", title: "Propuestas", icon: FileText, group: "Operación", shortcut: "4" },
  { id: "pricing", slug: "precios", label: "Precios", title: "Estrategia de precios", icon: SlidersHorizontal, group: "Configuración", shortcut: "5" },
  { id: "clients", slug: "clientes", label: "Clientes", title: "Clientes", icon: Users, group: "Configuración", shortcut: "6" },
  { id: "catalog", slug: "catalogo", label: "Catálogo", title: "Catálogo de servicios", icon: BookOpen, group: "Configuración", shortcut: "7" },
  { id: "rates", slug: "tarifas", label: "Tarifas", title: "Roles y tarifas", icon: Coins, group: "Configuración", shortcut: "8" },
];

export const viewById = Object.fromEntries(views.map((view) => [view.id, view]));
export const viewBySlug = Object.fromEntries(views.map((view) => [view.slug, view]));
export const viewGroups = [...new Set(views.map((view) => view.group))];
