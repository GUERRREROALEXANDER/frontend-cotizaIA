const apiBase = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
export const tokenStorageKey = "cotizaia.accessToken";

export async function request(path, options = {}) {
  const token = window.localStorage.getItem(tokenStorageKey);
  const headers = new Headers(options.headers || {});

  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response;
  try {
    response = await fetch(`${apiBase}${path}`, { ...options, headers });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        "No se pudo conectar con el backend. Verifica que CotizaIA esté iniciado y disponible en http://localhost:8080.",
      );
    }
    throw error;
  }
  if (response.status === 204) {
    if (!response.ok) throw new Error(`La solicitud falló (${response.status}).`);
    return null;
  }

  const body = await response.text();
  if (
    response.status === 500 &&
    !body &&
    response.headers.get("Content-Type")?.includes("text/plain")
  ) {
    throw new Error(
      "El frontend está conectado, pero el backend no responde en http://localhost:8080. Inicia el backend y PostgreSQL.",
    );
  }
  let result = null;
  if (body) {
    try {
      result = JSON.parse(body);
    } catch {
      result = body;
    }
  }

  if (!response.ok) {
    if (response.status === 500 && typeof result === "string" && result.includes("Internal Server Error")) {
      throw new Error(
        "El frontend está conectado, pero el backend no responde en http://localhost:8080. Inicia el backend y PostgreSQL.",
      );
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

export async function downloadProposalDocument(proposalId, type) {
  const token = window.localStorage.getItem(tokenStorageKey);
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const response = await fetch(`${apiBase}/api/proposals/${proposalId}/documents/${type}`, {
    headers,
  });
  if (!response.ok) throw new Error(`No se pudo descargar el documento (${response.status}).`);
  return response.blob();
}
