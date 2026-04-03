/**
 * Shared API base URL.
 *
 * Dev  (Vite proxy):  /api → http://localhost:8000
 * Prod (nginx proxy): /api → http://backend:8000
 *
 * Override at build time: VITE_API_BASE=http://my-hf-space.hf.space
 */
export const API_BASE =
  (import.meta.env.VITE_API_BASE as string | undefined) ?? "/api";
