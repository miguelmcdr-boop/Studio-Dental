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
 *   import { puedeAcceder, obtenerPermisos } from '../services/rbacService'
 *   puedeAcceder('admin', PERMISOS.VER_FINANZAS) // true
 */

import { ROLES, PERMISOS_POR_ROL } from '../constants/rbacConstants'

/**
 * Verifica si un rol específico tiene un permiso determinado.
 *
 * @param {string} rol - El rol del usuario (uno de ROLES).
 * @param {string} permiso - El permiso a verificar (uno de PERMISOS).
 * @returns {boolean} `true` si el rol tiene el permiso, `false` en cualquier
 *   otro caso (rol inválido, permiso desconocido, rol null, etc.).
 *   Nunca lanza excepción.
 *
 * @example
 *   puedeAcceder('admin', 'ver_finanzas')    // true
 *   puedeAcceder('recepcion', 'ver_finanzas') // false
 *   puedeAcceder(null, 'ver_finanzas')        // false (guard clause)
 */
export const puedeAcceder = (rol, permiso) => {
  if (!rol || !permiso) return false
  const permisosRol = PERMISOS_POR_ROL[rol]
  if (!Array.isArray(permisosRol)) return false
  return permisosRol.includes(permiso)
}

/**
 * Retorna la lista completa de permisos de un rol específico.
 *
 * @param {string} rol - El rol del usuario (uno de ROLES).
 * @returns {string[]} Array de permisos del rol. Array vacío si el rol
 *   es inválido o no tiene permisos (ej: 'recepcion').
 *
 * @example
 *   obtenerPermisos('admin')      // ['ver_finanzas', 'ver_reportes', ...]
 *   obtenerPermisos('recepcion')  // []
 *   obtenerPermisos('invalido')   // []
 */
export const obtenerPermisos = (rol) => {
  if (!rol) return []
  const permisosRol = PERMISOS_POR_ROL[rol]
  return Array.isArray(permisosRol) ? permisosRol : []
}

/**
 * Verifica si un rol tiene AL MENOS UNO de los permisos de una lista.
 * Útil para UI donde un componente es visible si el usuario tiene
 * cualquiera de varios permisos (ej: ver módulo si tiene permiso A o B).
 *
 * @param {string} rol - El rol del usuario.
 * @param {string[]} permisos - Lista de permisos a verificar (cualquiera).
 * @returns {boolean} `true` si el rol tiene al menos uno de los permisos.
 *
 * @example
 *   tieneAlgunPermiso('dentista', ['ver_finanzas', 'ver_configuracion']) // true
 *   tieneAlgunPermiso('recepcion', ['ver_finanzas', 'ver_configuracion']) // false
 */
export const tieneAlgunPermiso = (rol, permisos) => {
  if (!rol || !Array.isArray(permisos)) return false
  return permisos.some(permiso => puedeAcceder(rol, permiso))
}

/**
 * Verifica si un rol es válido (existe en la definición del sistema).
 * Útil para validación de datos de entrada antes de procesarlos.
 *
 * @param {string} rol - El rol a validar.
 * @returns {boolean} `true` si el rol está definido en ROLES.
 *
 * @example
 *   esRolValido('admin')     // true
 *   esRolValido('desconocido') // false
 */
export const esRolValido = (rol) => {
  return Object.values(ROLES).includes(rol)
}

/**
 * Obtiene el rol por defecto para nuevos usuarios.
 * Centraliza la decisión del rol inicial para evitar inconsistencias.
 *
 * @returns {string} El rol por defecto (actualmente RECEPCION, el más restrictivo).
 */
export const obtenerRolPorDefecto = () => {
  return ROLES.RECEPCION
}