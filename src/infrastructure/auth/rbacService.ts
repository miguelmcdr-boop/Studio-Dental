/**
 * Servicio de RBAC (Role-Based Access Control) — Studio Dental (F3-05)
 *
 * Centraliza la lógica de verificación de permisos. Toda decisión de
 * "¿puede este usuario hacer X?" debe pasar por este servicio, nunca
 * hardcodearse en componentes.
 *
 * Este servicio es puramente sincrónico (sin llamadas a storage ni red),
 * lo que lo hace fácil de testear y predecible.
 *
 * Uso:
 *   import { puedeAcceder, obtenerPermisos } from './rbacService'
 *   puedeAcceder('admin', PERMISOS.VER_FINANZAS) // true
 */

import { ROLES, PERMISOS_POR_ROL } from '../../constants/rbacConstants'
import type { RolKey, PermisoValue } from '../../constants/rbacConstants'

/**
 * Verifica si un rol específico tiene un permiso determinado.
 *
 * @param rol - El rol del usuario (uno de ROLES).
 * @param permiso - El permiso a verificar (uno de PERMISOS).
 * @returns `true` si el rol tiene el permiso, `false` en cualquier
 *   otro caso (rol inválido, permiso desconocido, rol null, etc.).
 *   Nunca lanza excepción.
 */
export const puedeAcceder = (rol: unknown, permiso: unknown): boolean => {
  if (typeof rol !== 'string' || typeof permiso !== 'string') return false
  if (!(rol in PERMISOS_POR_ROL)) return false
  const permisosRol = PERMISOS_POR_ROL[rol as RolKey]
  if (!Array.isArray(permisosRol)) return false
  return permisosRol.includes(permiso as PermisoValue)
}

/**
 * Retorna la lista completa de permisos de un rol específico.
 *
 * @param rol - El rol del usuario (uno de ROLES).
 * @returns Array de permisos del rol. Array vacío si el rol
 *   es inválido o no tiene permisos (ej: 'recepcion').
 */
export const obtenerPermisos = (rol: unknown): PermisoValue[] => {
  if (typeof rol !== 'string' || !(rol in PERMISOS_POR_ROL)) return []
  const permisos = PERMISOS_POR_ROL[rol as RolKey]
  return Array.isArray(permisos) ? [...permisos] : []
}

/**
 * Verifica si un rol tiene AL MENOS UNO de los permisos especificados (OR lógico).
 *
 * Útil para menús o secciones que son visibles si el usuario tiene cualquiera
 * de varios permisos.
 *
 * @param rol - El rol del usuario.
 * @param permisos - Array de permisos a verificar.
 * @returns `true` si tiene al menos uno, `false` si no tiene ninguno o argumentos inválidos.
 */
export const tieneAlgunPermiso = (rol: unknown, permisos: unknown): boolean => {
  if (!Array.isArray(permisos) || permisos.length === 0) return false
  return permisos.some((permiso: unknown) => puedeAcceder(rol, permiso))
}

/**
 * Verifica si un rol tiene TODOS los permisos especificados (AND lógico).
 *
 * Útil para acciones que requieren múltiples permisos simultáneos.
 *
 * @param rol - El rol del usuario.
 * @param permisos - Array de permisos a verificar.
 * @returns `true` si tiene todos, `false` si le falta alguno o argumentos inválidos.
 */
export const tieneTodosLosPermisos = (rol: unknown, permisos: unknown): boolean => {
  if (!Array.isArray(permisos) || permisos.length === 0) return false
  return permisos.every((permiso: unknown) => puedeAcceder(rol, permiso))
}

/**
 * Verifica si un rol es válido (existe en la definición del sistema).
 * Útil para validación de datos de entrada antes de procesarlos.
 *
 * @param rol - El rol a validar.
 * @returns `true` si el rol está definido en ROLES.
 */
export const esRolValido = (rol: unknown): rol is RolKey => {
  if (typeof rol !== 'string') return false
  return (Object.values(ROLES) as string[]).includes(rol)
}

/**
 * Obtiene el rol por defecto para nuevos usuarios.
 * Centraliza la decisión del rol inicial para evitar inconsistencias.
 *
 * @returns El rol por defecto (actualmente RECEPCION, el más restrictivo).
 */
export const obtenerRolPorDefecto = (): RolKey => {
  return ROLES.RECEPCION
}
