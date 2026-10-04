/**
 * Hook de RBAC (Role-Based Access Control) — Studio Dental (F3-05)
 *
 * Punto de entrada para que los componentes consulten permisos del usuario
 * actual. Envuelve el sesionStore y el rbacService en una API reactiva.
 *
 * Uso en componentes:
 *   import { useRBAC } from '../hooks/useRBAC'
 *   import { PERMISOS } from '../constants/rbacConstants'
 *
 *   const { rol, puede, permisos } = useRBAC()
 *   if (puede(PERMISOS.VER_FINANZAS)) { ... }
 *
 * Diseño:
 * - Rol por defecto: 'recepcion' (el más restrictivo, fail-safe)
 * - Todas las funciones son sincrónicas y predecibles
 * - Re-renderiza automáticamente cuando cambia el userProfile en el store
 */

import { useSesionStore } from '../store/sesionStore'
import {
  puedeAcceder,
  obtenerPermisos,
  tieneAlgunPermiso,
  esRolValido
} from '../infrastructure/auth/rbacService'
import { ROLES, type PermisoValue } from '../constants/rbacConstants'

export interface UseRBACReturn {
  rol: string
  puede: (permiso: string) => boolean
  tieneAlguno: (permisos: string[]) => boolean
  permisos: PermisoValue[]
  es: (rolComparar: string) => boolean
  esAdmin: boolean
}

/**
 * Hook para consultar permisos del usuario logueado.
 */
export const useRBAC = (): UseRBACReturn => {
  const userProfile = useSesionStore((state: { userProfile?: { rol?: string } | null }) => state.userProfile)

  // Fallback seguro: si no hay userProfile o no tiene rol válido,
  // usar el rol más restrictivo (recepcion) en lugar de romper.
  const rolActual = userProfile?.rol && esRolValido(userProfile.rol)
    ? userProfile.rol
    : ROLES.RECEPCION

  return {
    rol: rolActual,

    /**
     * Verifica si el usuario actual tiene un permiso específico.
     */
    puede: (permiso: string): boolean => puedeAcceder(rolActual, permiso),

    /**
     * Verifica si el usuario actual tiene AL MENOS UNO de los permisos.
     */
    tieneAlguno: (permisos: string[]): boolean => tieneAlgunPermiso(rolActual, permisos),

    /**
     * Lista completa de permisos del rol actual.
     */
    permisos: obtenerPermisos(rolActual),

    /**
     * Verifica si el usuario actual tiene un rol específico.
     */
    es: (rolComparar: string): boolean => rolActual === rolComparar,

    /**
     * Indica si el usuario es administrador (atajo común).
     */
    esAdmin: rolActual === ROLES.ADMIN
  }
}
