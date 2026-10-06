/**
 * Constantes y helpers para useArchivosClinicos.
 * Extraído para cumplir límite constitucional de 150 líneas por archivo.
 * 
 * F7-36 FASE 9: Validación MIME extraída a useArchivosClinicos.mimeValidation.js
 */

import type { ArchivoClinicoRow } from '../../../../infrastructure/storage/r2ArchivosService'
import type { PermisosArchivos } from './useArchivosClinicos.mimeValidation'

// Re-export de validación MIME (backward compatibility)
export {
  MAX_TAMANO_MB,
  MAX_TAMANO_BYTES,
  MIME_TYPES_POR_CATEGORIA,
  validarArchivo,
} from './useArchivosClinicos.mimeValidation'

export type { PermisosArchivos, CategoriaArchivo, ValidacionArchivoResult } from './useArchivosClinicos.mimeValidation'

// Mapeo bidireccional entre tipo UI y categoría R2.
// M4b: 'consentimiento' usa categoría 'pdf' porque es la válida en el
// Edge Function r2-upload-url. Se distingue de otros PDFs por metadata.
export const TIPO_A_CATEGORIA: Record<string, string> = {
  foto: 'foto_clinica',
  rx: 'radiografia',
  consentimiento: 'pdf',
}

export const CATEGORIA_A_TIPO: Record<string, string> = {
  foto_clinica: 'foto',
  radiografia: 'rx',
  documento: 'documento',
  otro: 'otro',
  // M4b: 'pdf' puede ser consentimiento u otro PDF.
  // Se distingue por metadata.subcategoria en la respuesta.
}

// M4b: subcategorías para distinguir tipos dentro de categoría 'pdf'
export const SUBCATEGORIAS = {
  CONSENTIMIENTO: 'consentimiento',
} as const

export interface RolesMapRef {
  ADMIN: string
  DENTISTA: string
  ASISTENTE: string
  RECEPCION: string
  [key: string]: string
}

/**
 * Calcula permisos basados en rol.
 * Nota: las Edge Functions también validan RBAC server-side.
 * Esto solo controla visibilidad/UX en frontend.
 */
export const calcularPermisos = (rol: string, ROLES: RolesMapRef): PermisosArchivos => {
  const puedeSubir = rol === ROLES.ADMIN || rol === ROLES.DENTISTA
  const puedeEliminar = rol === ROLES.ADMIN || rol === ROLES.DENTISTA
  const puedeVer = [ROLES.ADMIN, ROLES.DENTISTA, ROLES.ASISTENTE, ROLES.RECEPCION].includes(rol)
  const puedeDescargar = puedeVer

  return { puedeSubir, puedeEliminar, puedeVer, puedeDescargar, rol }
}

/**
 * M4b: Determina el tipo UI real de un archivo basado en categoría y metadata.
 * Necesario porque 'pdf' puede ser consentimiento u otro PDF.
 * @param archivo — archivo de archivos_clinicos
 * @returns tipo UI ('consentimiento', 'documento', 'otro', etc)
 */
export const determinarTipoDesdeArchivo = (archivo?: ArchivoClinicoRow | null): string | null => {
  if (!archivo) return null

  if (archivo.categoria === 'pdf' && archivo.metadata?.subcategoria === SUBCATEGORIAS.CONSENTIMIENTO) {
    return 'consentimiento'
  }

  return CATEGORIA_A_TIPO[archivo.categoria] || archivo.categoria
}
