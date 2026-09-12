/**
 * Constantes de RBAC — Archivo público (F3-05, Commit C unificación)
 *
 * Re-exporta ROLES y PERMISOS desde rbacConstantsBase.js, que es la ÚNICA
 * fuente de verdad. Este archivo existe como fachada pública para mantener
 * estabilidad de imports en el resto del códigobase.
 *
 * Razón de la separación:
 *   rbacConstantsBase.js evita dependencias circulares con rbacPermisosPorRol.js.
 *   rbacConstants.js agrega NOMBRES_ROLES y DESCRIPCIONES_ROLES (no usados por
 *   la matriz de permisos) y re-exporta PERMISOS_POR_ROL.
 *
 * Uso en componentes:
 *   import { ROLES, PERMISOS, PERMISOS_POR_ROL, NOMBRES_ROLES } from '../constants/rbacConstants'
 */

// Fuente única de verdad de ROLES y PERMISOS (Commit C: antes duplicados acá)
export { ROLES, PERMISOS } from './rbacConstantsBase'

// Matriz de permisos por rol
export { PERMISOS_POR_ROL } from './rbacPermisosPorRol'

// Nombres y descripciones legibles (locales a este archivo)
import { ROLES } from './rbacConstantsBase'

export const NOMBRES_ROLES = {
  [ROLES.ADMIN]: 'Administrador',
  [ROLES.DENTISTA]: 'Dentista',
  [ROLES.ASISTENTE]: 'Asistente Dental',
  [ROLES.RECEPCION]: 'Recepción'
}

export const DESCRIPCIONES_ROLES = {
  [ROLES.ADMIN]: 'Acceso total al sistema, incluyendo configuración y gestión de usuarios',
  [ROLES.DENTISTA]: 'Acceso clínico completo y datos financieros, sin configuración del sistema',
  [ROLES.ASISTENTE]: 'Acceso a módulos clínicos básicos, sin datos financieros',
  [ROLES.RECEPCION]: 'Solo agenda y registro básico de pacientes'
}
