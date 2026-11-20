import { PDF_LIMITS } from "./limits.js";

// Knowledge file limits, following the same style as limits.js.
// The backend only accepts PDF (KnowledgeController -> reader validation).
export const KNOWLEDGE_FILE = Object.freeze({
  maxBytes: PDF_LIMITS.maxBytes,
  accept: ".pdf,application/pdf",
});

export function isPdfFile(file) {
  if (!file) return false;
  const name = String(file.name || "").toLowerCase();
  const type = String(file.type || "").toLowerCase();
  return type === "application/pdf" || name.endsWith(".pdf");
}

// Returns "" when the file is valid, or the message in Spanish otherwise.
export function validateKnowledgeFile(file) {
  if (!file) return "Selecciona un archivo PDF antes de subir.";
  if (!isPdfFile(file)) return "Solo se aceptan archivos PDF.";
  if (typeof file.size === "number" && file.size > KNOWLEDGE_FILE.maxBytes) {
    return `El archivo supera los ${formatKnowledgeSize(KNOWLEDGE_FILE.maxBytes)}.`;
  }
  if (typeof file.size === "number" && file.size <= 0) return "El archivo está vacío.";
  return "";
}

export function formatKnowledgeSize(bytes) {
  const value = Number(bytes || 0);
  if (!Number.isFinite(value) || value <= 0) return "0 KB";
  if (value >= 1024 * 1024) {
    const mb = value / (1024 * 1024);
    return `${mb >= 10 ? Math.round(mb) : Math.round(mb * 10) / 10} MB`;
  }
  return `${Math.max(1, Math.round(value / 1024))} KB`;
}

export function formatKnowledgeKind(kind) {
  const normalized = String(kind || "").toUpperCase();
  if (normalized === "APPROVED_PROPOSAL") return "Propuesta aprobada";
  return "PDF de propuesta";
}

export function knowledgeCountText(count) {
  const value = Number(count || 0);
  return value === 1 ? "1 documento" : `${value} documentos`;
}

export function knowledgeChunkText(document) {
  const items = Number(document?.items || 0);
  const passages = Number(document?.passages || 0);
  const parts = [];
  if (items > 0) parts.push(items === 1 ? "1 ítem" : `${items} ítems`);
  if (passages > 0) parts.push(passages === 1 ? "1 pasaje" : `${passages} pasajes`);
  return parts.length > 0 ? parts.join(" · ") : "Sin fragmentos";
}
