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
} from '../services/rbacService'
import { ROLES } from '../constants/rbacConstants'

/**
 * Hook para consultar permisos del usuario logueado.
 *
 * @returns {Object} Objeto con:
 *   - `rol` {string} - Rol actual del usuario (o ROLES.RECEPCION como fallback)
 *   - `puede` {function(permiso): boolean} - Verifica un permiso específico
 *   - `tieneAlguno` {function(permisos[]): boolean} - Verifica si tiene al menos uno
 *   - `permisos` {string[]} - Lista completa de permisos del rol actual
 *   - `es` {function(rol): boolean} - Compara si el usuario tiene un rol específico
 */
export const useRBAC = () => {
  const userProfile = useSesionStore((state) => state.userProfile)

  // Fallback seguro: si no hay userProfile o no tiene rol válido,
  // usar el rol más restrictivo (recepcion) en lugar de romper.
  const rolActual = userProfile?.rol && esRolValido(userProfile.rol)
    ? userProfile.rol
    : ROLES.RECEPCION

  return {
    rol: rolActual,

    /**
     * Verifica si el usuario actual tiene un permiso específico.
     * @param {string} permiso - Uno de los valores de PERMISOS
     * @returns {boolean}
     */
    puede: (permiso) => puedeAcceder(rolActual, permiso),

    /**
     * Verifica si el usuario actual tiene AL MENOS UNO de los permisos.
     * @param {string[]} permisos - Array de permisos
     * @returns {boolean}
     */
    tieneAlguno: (permisos) => tieneAlgunPermiso(rolActual, permisos),

    /**
     * Lista completa de permisos del rol actual.
     * @type {string[]}
     */
    permisos: obtenerPermisos(rolActual),

    /**
     * Verifica si el usuario actual tiene un rol específico.
     * @param {string} rolComparar - Uno de los valores de ROLES
     * @returns {boolean}
     */
    es: (rolComparar) => rolActual === rolComparar,

    /**
     * Indica si el usuario es administrador (atajo común).
     * @type {boolean}
     */
    esAdmin: rolActual === ROLES.ADMIN
  }
}