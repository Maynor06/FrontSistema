const TOKEN_KEY = "access_token";
const USER_KEY = "usuario";

/**
 * Guarda el token y los datos del usuario en cookies
 * @param {string} token
 * @param {object} usuario
 */
export function saveSession(token, usuario) {
  const expires = new Date();
  expires.setHours(expires.getHours() + 9); // ~9h igual que el JWT exp

  document.cookie = `${TOKEN_KEY}=${token}; path=/; expires=${expires.toUTCString()}; SameSite=Strict`;
  document.cookie = `${USER_KEY}=${encodeURIComponent(JSON.stringify(usuario))}; path=/; expires=${expires.toUTCString()}; SameSite=Strict`;
}

/**
 * Lee el valor de una cookie por nombre
 * @param {string} name
 * @returns {string|null}
 */
export function getCookie(name) {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  return match ? match.split("=").slice(1).join("=") : null;
}

/**
 * Obtiene el token guardado
 * @returns {string|null}
 */
export function getToken() {
  return getCookie(TOKEN_KEY);
}

/**
 * Obtiene los datos del usuario guardado
 * @returns {object|null}
 */
export function getUsuario() {
  const raw = getCookie(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(decodeURIComponent(raw));
  } catch {
    return null;
  }
}

/**
 * Elimina la sesión (logout)
 */
export function clearSession() {
  document.cookie = `${TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  document.cookie = `${USER_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

/**
 * Verifica si hay sesión activa
 * @returns {boolean}
 */
export function isAuthenticated() {
  return !!getToken();
}
