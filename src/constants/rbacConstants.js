/**
 * Constantes de RBAC (Role-Based Access Control) — Studio Dental (F3-05)
 *
 * Define los 4 roles del sistema y la matriz de permisos por rol.
 * Esta es la ÚNICA fuente de verdad para decisiones de acceso.
 *
 * Roles:
 * - ADMIN: acceso total (incluye configuración del sistema y gestión de usuarios)
 * - DENTISTA: acceso clínico completo + finanzas + reportes (sin configuración del sistema)
 * - ASISTENTE: acceso clínico básico (agenda, pacientes, odontograma) sin datos financieros
 * - RECEPCION: solo agenda y registro básico de pacientes (sin acceso a historias clínicas completas)
 */

export const ROLES = {
  ADMIN: 'admin',
  DENTISTA: 'dentista',
  ASISTENTE: 'asistente',
  RECEPCION: 'recepcion'
}

/**
 * Permisos disponibles en el sistema.
 * Cada permiso representa una capacidad específica que puede ser otorgada o denegada por rol.
 */
export const PERMISOS = {
  // Módulos críticos (visibilidad en Sidebar)
  VER_FINANZAS: 'ver_finanzas',
  VER_REPORTES: 'ver_reportes',
  VER_CONFIGURACION: 'ver_configuracion',
  VER_INVENTARIO: 'ver_inventario',
  VER_LABORATORIO: 'ver_laboratorio',
  VER_ESTERILIZACION: 'ver_esterilizacion',
  
  // Acciones clínicas
  EDITAR_PRECIOS: 'editar_precios',
  ELIMINAR_PACIENTES: 'eliminar_pacientes',
  VER_HISTORIA_CLINICA_COMPLETA: 'ver_historia_clinica_completa',
  
  // Gestión del sistema
  GESTIONAR_USUARIOS: 'gestionar_usuarios',
  VER_LOGS_SISTEMA: 'ver_logs_sistema',
  
  // Administración de datos de referencia (vademécum)
  VER_VADEMECUM: 'ver_vademecum',
  ADMINISTRAR_VADEMECUM: 'administrar_vademecum',
  VER_PAPELERA: 'ver_papelera',

  // Papelera de reciclaje (Feature 1 — F7-33)
  VACIAR_PAPELERA: 'vaciar_papelera'
}

// Matriz de permisos por rol (extraída a rbacPermisosPorRol.js)
export { PERMISOS_POR_ROL } from './rbacPermisosPorRol'

/**
 * Nombres legibles de los roles para mostrar en la UI.
 */
export const NOMBRES_ROLES = {
  [ROLES.ADMIN]: 'Administrador',
  [ROLES.DENTISTA]: 'Dentista',
  [ROLES.ASISTENTE]: 'Asistente Dental',
  [ROLES.RECEPCION]: 'Recepción'
}

/**
 * Descripciones de los roles para tooltips o ayuda en la UI.
 */
export const DESCRIPCIONES_ROLES = {
  [ROLES.ADMIN]: 'Acceso total al sistema, incluyendo configuración y gestión de usuarios',
  [ROLES.DENTISTA]: 'Acceso clínico completo y datos financieros, sin configuración del sistema',
  [ROLES.ASISTENTE]: 'Acceso a módulos clínicos básicos, sin datos financieros',
  [ROLES.RECEPCION]: 'Solo agenda y registro básico de pacientes'
}