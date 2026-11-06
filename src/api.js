const apiBase = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

// The browser never holds a credential: the backend sets HttpOnly cookies and
// every request travels same-origin. Writes must echo the readable XSRF-TOKEN
// cookie in X-XSRF-TOKEN (double-submit), so this module is the only place that
// touches document.cookie.
function readCookie(name) {
  const pattern = new RegExp(`(?:^|;\\s*)${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]*)`);
  const match = document.cookie.match(pattern);
  return match ? decodeURIComponent(match[1]) : null;
}

let csrfPending = null;

// GET /api/auth/csrf issues the double-submit cookie when we do not have it yet.
async function csrfToken() {
  let token = readCookie("XSRF-TOKEN");
  if (token) return token;
  if (!csrfPending) {
    csrfPending = fetch(`${apiBase}/api/auth/csrf`, { credentials: "same-origin" }).catch(() => null);
  }
  try {
    await csrfPending;
  } finally {
    csrfPending = null;
  }
  return readCookie("XSRF-TOKEN");
}

function isAuthPath(path) {
  return path.startsWith("/api/auth/");
}

let refreshPending = null;

// POST /api/auth/refresh rotates both cookies once; concurrent 401s share it.
function refreshSession() {
  if (!refreshPending) {
    refreshPending = (async () => {
      try {
        const token = await csrfToken();
        const headers = new Headers();
        if (token) headers.set("X-XSRF-TOKEN", token);
        const response = await fetch(`${apiBase}/api/auth/refresh`, {
          method: "POST",
          headers,
          credentials: "same-origin",
        });
        return response.ok;
      } catch {
        return false;
      }
    })().finally(() => {
      refreshPending = null;
    });
  }
  return refreshPending;
}

async function send(path, options) {
  const method = String(options.method || "GET").toUpperCase();
  const headers = new Headers(options.headers || {});
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (method !== "GET" && method !== "HEAD") {
    const token = await csrfToken();
    if (token) headers.set("X-XSRF-TOKEN", token);
  }
  try {
    return await fetch(`${apiBase}${path}`, {
      ...options,
      method,
      headers,
      credentials: "same-origin",
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        "No se pudo conectar con el backend. Verifica que CotizaIA esté iniciado y disponible en http://localhost:8080.",
      );
    }
    throw error;
  }
}

function networkError() {
  return new Error(
    "El frontend está conectado, pero el backend no responde en http://localhost:8080. Inicia el backend y PostgreSQL.",
  );
}

async function readBody(response) {
  if (response.status === 204) return { empty: true, body: null };
  const text = await response.text();
  if (
    response.status === 500 &&
    !text &&
    response.headers.get("Content-Type")?.includes("text/plain")
  ) {
    throw networkError();
  }
  let body = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }
  return { empty: false, body };
}

export async function request(path, options = {}) {
  let response = await send(path, options);

  // A cookie session expires silently after 15 minutes: refresh once, retry the
  // original call once, and only then tell the app the session is gone.
  if (response.status === 401 && !isAuthPath(path)) {
    await refreshSession();
    response = await send(path, options);
    if (response.status === 401) {
      window.dispatchEvent(new Event("cotizaia:session-expired"));
    }
  }

  if (response.status === 204) {
    if (!response.ok) throw new Error(`La solicitud falló (${response.status}).`);
    return null;
  }

  const { body: result } = await readBody(response);

  if (!response.ok) {
    if (response.status === 500 && typeof result === "string" && result.includes("Internal Server Error")) {
      throw networkError();
    }
    const message =
      typeof result === "string"
        ? result
        : result?.message || result?.error || `La solicitud falló (${response.status}).`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return result;
}

export function get(path) {
  return request(path);
}

export function post(path, body) {
  return request(path, {
    method: "POST",
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

export function put(path, body) {
  return request(path, { method: "PUT", body: JSON.stringify(body) });
}

export function del(path) {
  return request(path, { method: "DELETE" });
}

// Current identity, or null when there is no live cookie session.
export async function getSession() {
  try {
    return await request("/api/auth/me");
  } catch (error) {
    if (error.status === 401) return null;
    throw error;
  }
}

export function logout() {
  return request("/api/auth/logout", { method: "POST" });
}

// Multipart upload with progress. fetch() has no upload progress events, so
// this one call uses XMLHttpRequest; errors are shaped like request()'s.
export async function upload(path, formData, { onProgress } = {}) {
  const csrf = await csrfToken();
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${apiBase}${path}`);
    xhr.withCredentials = true;
    if (csrf) xhr.setRequestHeader("X-XSRF-TOKEN", csrf);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(event.loaded / event.total);
    };
    xhr.onload = () => {
      let body = null;
      try {
        body = xhr.responseText ? JSON.parse(xhr.responseText) : null;
      } catch {
        body = xhr.responseText;
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(body);
        return;
      }
      const message =
        xhr.status === 413
          ? "El archivo supera los 10 MB."
          : body?.error || body?.message || `La solicitud falló (${xhr.status}).`;
      const error = new Error(message);
      error.status = xhr.status;
      if (xhr.status === 401) window.dispatchEvent(new Event("cotizaia:session-expired"));
      reject(error);
    };
    xhr.onerror = () => reject(new Error("No se pudo conectar con el backend."));
    xhr.send(formData);
  });
}

// Downloads reuse the same cookie session; no token ever reaches this code.
async function download(path, message) {
  let response = await fetch(`${apiBase}${path}`, { credentials: "same-origin" });
  if (response.status === 401) {
    await refreshSession();
    response = await fetch(`${apiBase}${path}`, { credentials: "same-origin" });
    if (response.status === 401) window.dispatchEvent(new Event("cotizaia:session-expired"));
  }
  if (!response.ok) throw new Error(`${message} (${response.status}).`);
  return response.blob();
}

export function downloadBriefAttachment(briefId) {
  return download(`/api/briefs/${briefId}/attachment`, "No se pudo abrir el PDF");
}

export function downloadProposalDocument(proposalId, type) {
  return download(`/api/proposals/${proposalId}/documents/${type}`, "No se pudo descargar el documento");
}
