/**
 * Constructor de perfiles de usuario para login (F6-C-d).
 *
 * Extraído de LoginScreen.jsx para mantener el archivo dentro del límite
 * de la allowlist (337 líneas). Este módulo encapsula la lógica de
 * transformación de userMetadata de Supabase Auth a userProfile del sistema.
 */

import { obtenerRolEnClinicaActual } from '../auth/authService'
import { createLogger } from '../logging/logger'

export interface UserProfile {
  email: string
  nombreCompleto: string | null | undefined
  rut: string | null | undefined
  especialidad: string | null | undefined
  rol: string | null | undefined
  clinicaId: string | null
  supabaseAuth: boolean
}

export interface SupabaseUserMetadata {
  role?: string
  full_name?: string
  rut?: string
  especialidad?: string
  clinicaId?: string | null
  [key: string]: unknown
}

export interface FormMetadataFallback {
  rol?: string
  nombreCompleto?: string
  rut?: string
  especialidad?: string
  [key: string]: unknown
}

const log = createLogger('userProfileBuilder')

/**
 * F7-10b: Construye el objeto userProfile desde los datos de Supabase Auth.
 *
 * Consulta el rol contextual en la clínica activa (miembros_clinica.rol)
 * en lugar de usar el rol global de user_metadata.
 */
export const construirUserProfile = async (
  email: string,
  userMetadata: SupabaseUserMetadata = {},
  metadata: FormMetadataFallback = {}
): Promise<UserProfile> => {
  // Obtener rol contextual de la clínica activa
  let rolContextual: string | null = null
  try {
    rolContextual = await obtenerRolEnClinicaActual()
  } catch (error: unknown) {
    // F7-10b: si falla la consulta, degradar al rol global sin romper la app
    const msg = error instanceof Error ? error.message : String(error)
    log.warn('Error obteniendo rol contextual, usando fallback:', msg)
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
    supabaseAuth: true
  }
}
