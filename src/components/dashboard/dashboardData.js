import { FileText, Globe, Inbox, MessageCircle } from "lucide-react";
import { statusLabels } from "../ui.jsx";


const DAY_MS = 86400000;

export function greetingForHour(hour = new Date().getHours()) {
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

// The backend may send a ratio (0..1) or a percentage (0..100).
export function acceptancePercent(value) {
  const rate = Number(value);
  if (!Number.isFinite(rate) || rate <= 0) return 0;
  return rate <= 1 ? rate * 100 : rate;
}

export function buildStatusSeries(proposalsByStatus) {
  return Object.entries(proposalsByStatus || {})
    .map(([status, count]) => ({
      status,
      label: statusLabels[status] || status.replaceAll("_", " ").toLowerCase(),
      count: Number(count) || 0,
    }))
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count);
}

function dayKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

// Sums proposal totals per local day across the last `days` days.
export function buildValueSeries(proposals, days = 14) {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end.getTime() - (days - 1) * DAY_MS);
  start.setHours(0, 0, 0, 0);

  const buckets = new Map();
  for (let index = 0; index < days; index += 1) {
    const day = new Date(start.getTime() + index * DAY_MS);
    buckets.set(dayKey(day), { date: day, value: 0 });
  }

  for (const proposal of proposals || []) {
    const created = new Date(proposal?.createdAt);
    if (Number.isNaN(created.getTime())) continue;
    const bucket = buckets.get(dayKey(created));
    if (bucket) bucket.value += Number(proposal?.total) || 0;
  }

  const dayLabel = new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "short" });
  return [...buckets.values()].map(({ date, value }) => ({
    date,
    label: dayLabel.format(date).replace(".", ""),
    value: Math.round(value),
  }));
}

const compactCop = new Intl.NumberFormat("es-CO", {
  notation: "compact",
  compactDisplay: "short",
  maximumFractionDigits: 1,
});

export function formatCompactCop(value) {
  return `$${compactCop.format(Number(value) || 0)}`;
}

export function formatMinutes(value) {
  return `${Math.round(Number(value) || 0)} min`;
}

export function formatDuration(ms) {
  const seconds = Math.max(0, Math.round((Number(ms) || 0) / 1000));
  if (seconds < 60) return `${seconds} s`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return rest ? `${minutes} min ${rest} s` : `${minutes} min`;
}

export function executionDurationMs(execution) {
  if (!execution) return 0;
  const started = new Date(execution.startedAt).getTime();
  const finished = new Date(execution.finishedAt).getTime();
  if (Number.isFinite(started) && Number.isFinite(finished) && finished >= started) {
    return finished - started;
  }
  const steps = Array.isArray(execution.steps) ? execution.steps : [];
  return steps.reduce((total, step) => total + (Number(step?.durationMs) || 0), 0);
}

export function stepCount(execution) {
  return Array.isArray(execution?.steps) ? execution.steps.length : 0;
}

const CHANNELS = {
  EMAIL: { label: "Correo", icon: Inbox },
  WHATSAPP: { label: "WhatsApp", icon: MessageCircle },
  WEB_FORM: { label: "Formulario", icon: Globe },
  PDF: { label: "PDF", icon: FileText },
};

export function channelFor(source) {
  return CHANNELS[String(source || "").toUpperCase()] || { label: "Brief", icon: FileText };
}

export function previewText(text, max = 96) {
  const flat = String(text || "").replace(/\s+/g, " ").trim();
  if (!flat) return "Sin texto guardado";
  if (flat.length <= max) return flat;
  return `${flat.slice(0, max).trimEnd()}…`;
}
