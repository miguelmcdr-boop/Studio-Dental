/**
 * Constructor de perfiles de usuario para login (F6-C-d).
 *
 * Extraído de LoginScreen.jsx para mantener el archivo dentro del límite
 * de la allowlist (337 líneas). Este módulo encapsula la lógica de
 * transformación de userMetadata de Supabase Auth a userProfile del sistema.
 */

/**
 * Construye el objeto userProfile desde los datos de Supabase Auth.
 *
 * @param {string} email - Email del usuario (normalizado a minúsculas)
 * @param {Object} userMetadata - Datos retornados por Supabase Auth
 * @param {Object} metadata - Datos del formulario (fallback si userMetadata está incompleto)
 * @returns {Object} userProfile listo para pasar a sesionStore
 */
export const construirUserProfile = (email, userMetadata, metadata) => {
  return {
    email,
    nombreCompleto: userMetadata.full_name || metadata.nombreCompleto,
    rut: userMetadata.rut || metadata.rut,
    especialidad: userMetadata.especialidad || metadata.especialidad,
    rol: userMetadata.role || metadata.rol,
    clinicaId: userMetadata.clinicaId || null,
    supabaseAuth: true,
  }
}
