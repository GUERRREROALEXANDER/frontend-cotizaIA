// Pure helpers for the WhatsApp screen: no React, no fetch, so they run in the unit tests.

export const CODE_LENGTH = 6;
export const RESEND_SECONDS = 60;

// What the user typed, as the backend expects it (+ and digits). A Colombian mobile typed without
// the country code (10 digits starting with 3) gets +57, the case almost every user here is in.
export function normalizePhone(typed) {
  const raw = String(typed ?? "").trim();
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (raw.startsWith("+")) return `+${digits}`;
  if (digits.length === 10 && digits.startsWith("3")) return `+57${digits}`;
  if (digits.startsWith("00")) return `+${digits.slice(2)}`;
  return `+${digits}`;
}

// null when the number looks valid, otherwise the sentence to show under the field.
export function phoneError(typed) {
  const phone = normalizePhone(typed);
  if (!phone) return "Escribe tu número de WhatsApp.";
  if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
    return "Revisa el número: escríbelo con indicativo, por ejemplo +57 300 123 4567.";
  }
  return null;
}

// Only digits, at most six: a pasted "123 456" or "Código: 123456" still works.
export function cleanCode(typed) {
  return String(typed ?? "").replace(/\D/g, "").slice(0, CODE_LENGTH);
}

// "+573010944197" -> "+57 301 094 4197" for Colombian numbers; others stay as they are.
export function formatPhone(phone) {
  const match = /^\+57(\d{3})(\d{3})(\d{4})$/.exec(phone ?? "");
  return match ? `+57 ${match[1]} ${match[2]} ${match[3]}` : phone ?? "";
}

// Link that opens a chat with the bot with "cotizar" already typed; null without a number.
export function chatLink(botNumber, text = "cotizar") {
  const digits = String(botNumber ?? "").replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}` : null;
}

// The backend answers in English; these are the cases the user can do something about.
export function whatsappErrorMessage(error, step) {
  const status = error?.status;
  if (status === 429) {
    return "Ya pediste varios códigos. Espera un momento antes de pedir otro.";
  }
  if (step === "verify" && (status === 400 || status === 404)) {
    return "El código no es correcto o ya venció. Revísalo o pide uno nuevo.";
  }
  if (step === "send" && status === 400) {
    return "Ese número no es válido. Escríbelo con indicativo, por ejemplo +57 300 123 4567.";
  }
  return error?.message || "No se pudo completar la acción. Intenta de nuevo.";
}
