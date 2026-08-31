/**
 * Constructor de perfiles de usuario para login (F6-C-d).
 *
 * Extraído de LoginScreen.jsx para mantener el archivo dentro del límite
 * de la allowlist (337 líneas). Este módulo encapsula la lógica de
 * transformación de userMetadata de Supabase Auth a userProfile del sistema.
 */

import { obtenerRolEnClinicaActual } from './authService.js'

/**
 * F7-10b: Construye el objeto userProfile desde los datos de Supabase Auth.
 *
 * Consulta el rol contextual en la clínica activa (miembros_clinica.rol)
 * en lugar de usar el rol global de user_metadata.
 *
 * @param {string} email - Email del usuario (normalizado a minúsculas)
 * @param {Object} userMetadata - Datos retornados por Supabase Auth
 * @param {Object} metadata - Datos del formulario (fallback si userMetadata está incompleto)
 * @returns {Promise<Object>} userProfile listo para pasar a sesionStore
 */
export const construirUserProfile = async (email, userMetadata, metadata) => {
  // Obtener rol contextual de la clínica activa
  let rolContextual = null
  try {
    rolContextual = await obtenerRolEnClinicaActual()
  } catch (error) {
    // F7-10b: si falla la consulta, degradar al rol global sin romper la app
    console.warn('[userProfileBuilder] Error obteniendo rol contextual, usando fallback:', error.message)
  }

  // Fallback: usar rol global de user_metadata si no hay membresía
  const rol = rolContextual || userMetadata.role || metadata.rol

  return {
    email,
    nombreCompleto: userMetadata.full_name || metadata.nombreCompleto,
    rut: userMetadata.rut || metadata.rut,
    especialidad: userMetadata.especialidad || metadata.especialidad,
    rol,
    clinicaId: userMetadata.clinicaId || null,
    supabaseAuth: true,
  }
}
