// Spanish names for every proposal, brief and agent status the API sends.
// Plain module (no JSX) so pure helpers and node tests can import it.
export const statusLabels = Object.freeze({
  ACCEPTED: "Aceptada",
  APPROVED: "Aprobada",
  SENT: "Enviada",
  PROCESSING: "En proceso",
  COMPLETED: "Completada",
  REJECTED: "Rechazada",
  FAILED: "Fallida",
  IN_REVIEW: "Por revisar",
  PENDING: "Pendiente",
  DRAFT: "Borrador",
  RECEIVED: "Recibida",
  ANALYZING: "En análisis",
  QUOTED: "Cotizada",
  NEGOTIATING: "En negociación",
  CONTRACT_ISSUED: "Contrato emitido",
  EXPIRED: "Vencida",
  RUNNING: "En ejecución",
  SUCCEEDED: "Completada",
  HALTED: "En pausa",
});

// Label for a status in any case; unknown values stay readable ("NEW_STATE" -> "new state").
export function statusLabel(status) {
  const key = String(status ?? "").trim().toUpperCase();
  return statusLabels[key] || key.replaceAll("_", " ").toLowerCase();
}
