/**
 * Utilidades para manejo de UUIDs (F4-02c-2).
 *
 * Archivo independiente sin dependencias de servicios para evitar
 * imports circulares entre pacientesStorageService y migratePacientesToSupabase.
 */

/**
 * Verifica si un ID es un UUID válido de Supabase.
 * Los UUIDs tienen formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 *
 * @param {string|number} id - ID a verificar
 * @returns {boolean} true si es un UUID válido
 */
export const esUuidValido = (id) => {
  return typeof id === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
}
