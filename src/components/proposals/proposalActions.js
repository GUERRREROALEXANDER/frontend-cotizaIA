// Which lifecycle moves the UI offers for a proposal. The backend has no APPROVED
// status: approval is the `approvedAt` timestamp on an IN_REVIEW proposal, and every
// later move is whatever `allowedTransitions` lists, so the buttons can never offer
// something the state machine will reject.
const ACTION_LABELS = {
  approve: "Aprobar",
  send: "Enviar al cliente",
  accept: "Registrar aceptación",
  negotiate: "Pasar a negociación",
  reject: "Marcar rechazada",
  expire: "Marcar vencida",
};

export const ACTION_TOASTS = {
  approve: "Propuesta aprobada para continuar con el envío.",
  send: "Propuesta enviada al cliente.",
  accept: "Aceptación registrada: contrato emitido y anticipo simulado creado.",
  negotiate: "Propuesta en negociación.",
  reject: "Propuesta marcada como rechazada.",
  expire: "Propuesta marcada como vencida.",
};

// Order = priority (first one is the primary button); value = target status.
const AFTER_SEND = [
  ["accept", "ACCEPTED"],
  ["negotiate", "NEGOTIATING"],
  ["reject", "REJECTED"],
  ["expire", "EXPIRED"],
];

const toAction = (action) => ({ action, label: ACTION_LABELS[action] });

export function availableActions(detail) {
  if (!detail) return [];
  const allowed = Array.isArray(detail.allowedTransitions) ? detail.allowedTransitions : [];

  if (detail.status === "IN_REVIEW") {
    if (!detail.approvedAt) return [toAction("approve")];
    return allowed.includes("SENT") ? [toAction("send")] : [];
  }
  return AFTER_SEND.filter(([, target]) => allowed.includes(target)).map(([action]) => toAction(action));
}
