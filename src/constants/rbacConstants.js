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
  VER_LOGS_SISTEMA: 'ver_logs_sistema'
}

/**
 * Matriz de permisos por rol.
 * Define qué permisos tiene cada rol. Si un permiso no está en la lista,
 * el rol NO tiene acceso a esa capacidad.
 */
export const PERMISOS_POR_ROL = {
  [ROLES.ADMIN]: [
    // Acceso total: todos los permisos
    PERMISOS.VER_FINANZAS,
    PERMISOS.VER_REPORTES,
    PERMISOS.VER_CONFIGURACION,
    PERMISOS.VER_INVENTARIO,
    PERMISOS.VER_LABORATORIO,
    PERMISOS.VER_ESTERILIZACION,
    PERMISOS.EDITAR_PRECIOS,
    PERMISOS.ELIMINAR_PACIENTES,
    PERMISOS.VER_HISTORIA_CLINICA_COMPLETA,
    PERMISOS.GESTIONAR_USUARIOS,
    PERMISOS.VER_LOGS_SISTEMA
  ],
  
  [ROLES.DENTISTA]: [
    // Acceso clínico completo + financiero (sin configuración del sistema)
    PERMISOS.VER_FINANZAS,
    PERMISOS.VER_REPORTES,
    PERMISOS.VER_INVENTARIO,
    PERMISOS.VER_LABORATORIO,
    PERMISOS.VER_ESTERILIZACION,
    PERMISOS.EDITAR_PRECIOS,
    PERMISOS.ELIMINAR_PACIENTES,
    PERMISOS.VER_HISTORIA_CLINICA_COMPLETA
  ],
  
  [ROLES.ASISTENTE]: [
    // Acceso clínico básico (sin datos financieros ni configuración)
    PERMISOS.VER_INVENTARIO,
    PERMISOS.VER_LABORATORIO,
    PERMISOS.VER_ESTERILIZACION,
    PERMISOS.VER_HISTORIA_CLINICA_COMPLETA
  ],
  
  [ROLES.RECEPCION]: [
    // Solo agenda y registro básico (sin historia clínica completa ni finanzas)
    // No tiene permisos especiales — solo acceso a Agenda y Directorio de Pacientes
  ]
}

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