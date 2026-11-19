// Turns raw transport failures into one Spanish sentence. Returns null when the
// server's own message should be kept (validation errors, 409s, ...).
const looksLikeHtml = (body) => typeof body === "string" && /^\s*</.test(body);

export function friendlyMessage({ error, status, body } = {}) {
  if (error?.name === "TimeoutError" || error?.name === "AbortError") {
    return "El servidor tarda más de lo normal (puede estar despertando). Espera un momento y reintenta; si el brief ya se envió, revísalo en el historial.";
  }
  if (status === 502 || status === 504 || (status >= 500 && looksLikeHtml(body))) {
    return "El servidor no está disponible en este momento. Reintenta en un minuto.";
  }
  if (status === 503 && body?.executionId) {
    return `El agente no pudo terminar esta cotización (ejecución ${body.executionId}). Pulsa "Reintentar" para volver a procesarla.`;
  }
  return null;
}
