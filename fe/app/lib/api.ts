/**
 * Returns the base URL for the backend API.
 * - In browser: uses the same host as the current page but with port 8000
 * - On server (SSR): falls back to 127.0.0.1:8000
 */
export function getApiBase(): string {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    return `http://${host}:8000`;
  }
  return "http://127.0.0.1:8000";
}
