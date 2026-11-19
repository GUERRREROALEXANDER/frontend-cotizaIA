// Pure helpers for the email-verification flow (spec 16b). No DOM, no
// network, no logging here: the API token must never be printed anywhere.
export const VERIFY_MESSAGES = {
  checkInbox: "Revisa tu correo para activar la cuenta",
  verified: "Cuenta verificada",
  expired: "El enlace venció o ya se usó",
  resent: "Si esa cuenta existe y está pendiente de verificación, acabamos de enviarle un nuevo correo.",
  missing: "Falta el enlace de verificación. Revisa el correo y abre el enlace completo.",
};

function tokenFromQueryString(query) {
  if (!query) return "";
  const clean = String(query).replace(/^[?#]/, "");
  if (!clean) return "";
  try {
    const params = new URLSearchParams(clean);
    return (params.get("token") || "").trim();
  } catch {
    return "";
  }
}

// The app uses hash routing (#/verify-email?token=...), but a plain path
// route (/verify-email?token=...) also works. Hash wins when both exist.
export function getVerifyTokenFromLocation({ hash = "", search = "", href = "" } = {}) {
  if (href) {
    try {
      const url = new URL(href, "http://localhost");
      const fromHash = tokenFromQueryString((url.hash || "").split("?").slice(1).join("?"));
      if (fromHash) return fromHash;
      return tokenFromQueryString(url.search || "");
    } catch {
      return "";
    }
  }
  const hashQuery = String(hash).split("?").slice(1).join("?");
  const fromHash = tokenFromQueryString(hashQuery ? `?${hashQuery}` : "");
  if (fromHash) return fromHash;
  return tokenFromQueryString(search);
}

export function isVerifyEmailLocation({ pathname = "", hash = "" } = {}) {
  if (pathname === "/verify-email") return true;
  return /^#\/verify-email(\?|\/|$)/.test(String(hash));
}

function normalizedError({ status, body, message } = {}) {
  const text = typeof body === "string" ? body : (body?.error || body?.message || message || "");
  return { status, text: String(text) };
}

// Login 403 {"error":"Email not verified"} (spec 16).
export function isEmailNotVerifiedError(input = {}) {
  const { status, text } = normalizedError(input);
  return status === 403 && /email not verified/i.test(text);
}

// POST /api/auth/verify-email 400 {"error":"Invalid or expired token"}.
export function isInvalidTokenError(input = {}) {
  const { status, text } = normalizedError(input);
  return status === 400 && /invalid or expired token/i.test(text);
}

// Register response may include `emailVerificationRequired: true` (spec 16b).
export function registerRequiresVerification(body) {
  return body != null && typeof body === "object" && body.emailVerificationRequired === true;
}

// Maps raw API failures to the Spanish sentence the UI must show. Returns the
// server message untouched when it is not one of the verification cases.
export function authErrorMessage(error = {}) {
  if (isEmailNotVerifiedError(error)) {
    return "Tu correo aún no está verificado. Revisa tu correo para activar la cuenta.";
  }
  if (isInvalidTokenError(error)) {
    return VERIFY_MESSAGES.expired;
  }
  return error.message || "La solicitud falló. Intenta de nuevo.";
}
