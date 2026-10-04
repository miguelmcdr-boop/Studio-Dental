/**
 * Filtro de URLs para el caching del Service Worker de Supabase — F7-06
 *
 * Decide si una petición a un dominio Supabase debe cachearse o no.
 * Excluye endpoints que sirven PHI (información de salud protegida):
 *   - /rest/v1/ (datos clínicos, recetas, evoluciones, pacientes)
 *   - /storage/v1/ (blobs de adjuntos clínicos)
 *   - /auth/v1/ (tokens de sesión)
 *   - /realtime/v1/ (WebSocket de sincronización)
 *
 * Solo permite cachear assets estáticos del dominio Supabase
 * (favicon, etc.) que no contengan PHI.
 */

export interface SupabaseCacheFilterParams {
  url: URL | string
}

export const debeCachearSupabase = ({ url }: SupabaseCacheFilterParams): boolean => {
  const parsedUrl: URL = typeof url === 'string' ? new URL(url) : url
  if (!parsedUrl.hostname.includes('supabase')) return false
  const path: string = parsedUrl.pathname
  // F7-06: excluir endpoints de PHI del caching del SW.
  // Constante dentro de la función para permitir serialización segura en Workbox generateSW.
  const EXCLUDED_PREFIXES: readonly string[] = [
    '/rest/v1/',
    '/storage/v1/',
    '/auth/v1/',
    '/realtime/v1/'
  ]
  return !EXCLUDED_PREFIXES.some((prefix: string): boolean => path.startsWith(prefix))
}
