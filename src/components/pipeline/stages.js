// The seven agent handlers, in the order the backend runs them, with the
// Spanish labels the UI shows. API steps may carry an optional "Handler"
// suffix, so matching always goes through normalizeHandler.
import { Clock3, FileSearch2, FileText, HelpCircle, ListFilter, PenLine, WandSparkles } from "lucide-react";

export const agentStages = [
  { handler: "Classify", label: "Clasificación", description: "Tipo de proyecto", icon: ListFilter },
  { handler: "Extract", label: "Extracción", description: "Requisitos del brief", icon: FileSearch2 },
  { handler: "Estimate", label: "Estimación", description: "Horas por requisito", icon: Clock3 },
  { handler: "Price", label: "Precio", description: "Tarifa y estrategia", icon: WandSparkles },
  { handler: "AmbiguityCheck", label: "Ambigüedades", description: "Preguntas para el humano", icon: HelpCircle },
  { handler: "Generate", label: "Documentos", description: "Propuesta, contrato y cronograma en PDF", icon: FileText },
  { handler: "Compose", label: "Composición", description: "Borrador final", icon: PenLine },
];

export function normalizeHandler(name) {
  const value = String(name || "").trim();
  return value.endsWith("Handler") ? value.slice(0, -"Handler".length) : value;
}

// Indexes API steps by normalized handler, so an unknown extra step never
// shifts the seven canonical stages.
export function stepsByHandler(steps) {
  const map = new Map();
  for (const step of steps || []) {
    const key = normalizeHandler(step?.handler).toLowerCase();
    if (key && !map.has(key)) map.set(key, step);
  }
  return map;
}

// AmbiguityCheck flags open questions for a human with a [FLAG] marker.
export function isFlagged(step) {
  return String(step?.outputSummary || "").includes("[FLAG]");
}

export function formatDuration(ms) {
  const value = Number(ms);
  if (!Number.isFinite(value) || value < 0) return null;
  if (value < 1000) return `${Math.round(value)} ms`;
  if (value < 60_000) return `${(value / 1000).toFixed(1)} s`;
  const minutes = Math.floor(value / 60_000);
  const seconds = Math.round((value % 60_000) / 1000);
  return `${minutes} min ${seconds} s`;
}

// Wall clock when both timestamps exist, otherwise the sum of step timings.
export function executionDurationMs(execution) {
  if (!execution) return null;
  const start = Date.parse(execution.startedAt || "");
  const end = Date.parse(execution.finishedAt || "");
  if (Number.isFinite(start) && Number.isFinite(end) && end >= start) return end - start;
  const total = (execution.steps || []).reduce((sum, step) => sum + (Number(step?.durationMs) || 0), 0);
  return total > 0 ? total : null;
}
