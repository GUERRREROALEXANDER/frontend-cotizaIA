// Commercial extras the backend attaches to an IN_REVIEW proposal. They are real
// money on the total, so the UI only offers them while the proposal is still
// editable; once it is approved or sent the backend answers 409 anyway.
export const EXTRA_TYPES = ["URGENCY", "DISCOUNT", "EXTENDED_WARRANTY"];

export const EXTRA_LABELS = {
  URGENCY: "Urgencia",
  DISCOUNT: "Descuento",
  EXTENDED_WARRANTY: "Garantía extendida",
};

export function extraLabel(type) {
  return EXTRA_LABELS[String(type || "").toUpperCase()] || String(type || "");
}

export function canEditExtras(detail) {
  if (!detail) return false;
  return detail.status === "IN_REVIEW" && !detail.approvedAt;
}
