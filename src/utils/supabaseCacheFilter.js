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
 *
 * Se extrae a util para ser testeable de forma aislada, evitando
 * problemas con `new Function()` en entorno jsdom.
 *
 * @param {{url: URL}} param0 - Objeto con la URL a evaluar (formato Workbox)
 * @returns {boolean} true si debe cachearse, false si debe excluirse
 */
export const debeCachearSupabase = ({ url }) => {
  if (!url.hostname.includes('supabase')) return false
  const path = url.pathname
  // F7-06: excluir endpoints de PHI del caching del SW
  return !(
    path.startsWith('/rest/v1/') ||
    path.startsWith('/storage/v1/') ||
    path.startsWith('/auth/v1/') ||
    path.startsWith('/realtime/v1/')
  )
}
