// Brief PDF checks used by the inbox dropzone. When the browser reports a MIME
// type it must be exactly application/pdf; only typeless files fall back to the
// file extension.
export function isPdfFile(file) {
  if (!file) return false;
  if (file.type) return file.type === "application/pdf";
  return String(file.name || "").toLowerCase().endsWith(".pdf");
}

export function formatMb(bytes) {
  return `${(Number(bytes || 0) / (1024 * 1024)).toFixed(2)} MB`;
}
