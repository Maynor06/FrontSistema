import { getToken } from "./auth";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/**
 * Construye los headers base con Content-Type y el Bearer token si existe.
 * @returns {HeadersInit}
 */
function buildHeaders(extra = {}) {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

/**
 * Maneja la respuesta HTTP: lanza un error si no es ok, devuelve JSON.
 * @param {Response} res
 * @returns {Promise<any>}
 */
async function handleResponse(res) {
  if (!res.ok) {
    let message = `Error ${res.status}`;
    try {
      const data = await res.json();
      message = data?.message || JSON.stringify(data) || message;
    } catch {
      // respuesta sin cuerpo JSON
    }
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  // 204 No Content
  if (res.status === 204) return null;
  return res.json();
}

/**
 * Clase Api — wrapper de fetch que consume NEXT_PUBLIC_API_URL.
 *
 * @example
 *   import Api from "@/lib/Api";
 *   const list   = await Api.get("/establecimiento");
 *   const item   = await Api.get("/establecimiento/1");
 *   const created = await Api.post("/establecimiento", body);
 *   const updated = await Api.put("/establecimiento/1", body);
 *   const patched = await Api.patch("/establecimiento/1", body);
 *   await Api.delete("/establecimiento/1");
 */
const Api = {
  /**
   * GET — obtiene un recurso o lista.
   * @param {string} url  Ruta relativa, ej: "/establecimiento"
   */
  async get(url) {
    const res = await fetch(`${BASE_URL}${url}`, {
      method: "GET",
      headers: buildHeaders(),
    });
    return handleResponse(res);
  },

  /**
   * POST — crea un nuevo recurso.
   * @param {string} url   Ruta relativa, ej: "/establecimiento"
   * @param {object} body  Cuerpo de la solicitud
   */
  async post(url, body) {
    const res = await fetch(`${BASE_URL}${url}`, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },

  /**
   * PUT — reemplaza un recurso completo.
   * @param {string} url   Ruta relativa, ej: "/establecimiento/1"
   * @param {object} body  Cuerpo de la solicitud
   */
  async put(url, body) {
    const res = await fetch(`${BASE_URL}${url}`, {
      method: "PUT",
      headers: buildHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },

  /**
   * PATCH — actualiza parcialmente un recurso.
   * @param {string} url   Ruta relativa, ej: "/establecimiento/1"
   * @param {object} body  Cuerpo de la solicitud
   */
  async patch(url, body) {
    const res = await fetch(`${BASE_URL}${url}`, {
      method: "PATCH",
      headers: buildHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },

  /**
   * DELETE — elimina un recurso.
   * @param {string} url  Ruta relativa, ej: "/establecimiento/1"
   */
  async delete(url) {
    const res = await fetch(`${BASE_URL}${url}`, {
      method: "DELETE",
      headers: buildHeaders(),
    });
    return handleResponse(res);
  },
  /**
   * Alias de post — sin token (para login público).
   * Internamente hace fetch directo sin Authorization header.
   * @param {string} url
   * @param {object} body
   */
  async Post(url, body) {
    const res = await fetch(`${BASE_URL}${url}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },
};

/**
 * Login helper — POST /auth/login sin token.
 * @param {string} nombreUsuario
 * @param {string} password
 */
export async function loginRequest(nombreUsuario, password) {
  return Api.Post("/auth/login", { nombreUsuario, password });
}

// named + default export
export { Api };
export default Api;
