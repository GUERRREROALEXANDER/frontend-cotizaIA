// Text helpers for the quoted-items table: hours in Colombian format and the
// "document · page · hours · similarity" label shown under each estimate.
export function formatHours(value) {
  const hours = Number(value);
  if (!Number.isFinite(hours)) return "—";
  return hours.toLocaleString("es-CO", { maximumFractionDigits: 1 });
}

export function citationLabel(citation) {
  const parts = [citation.documentName];
  if (citation.page != null) parts.push(`p. ${citation.page}`);
  if (citation.hours != null) parts.push(`${formatHours(citation.hours)} h`);
  if (citation.similarity != null) parts.push(`sim ${Number(citation.similarity).toFixed(2)}`);
  return parts.filter(Boolean).join(" · ");
}
