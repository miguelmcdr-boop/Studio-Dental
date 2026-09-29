/**
 * F7-36 FASE 9: Validación de MIME types para archivos clínicos.
 * 
 * Extraído de useArchivosClinicos.helpers.js para cumplir límite
 * constitucional de 150 líneas por archivo (Cap. III Constitución).
 * 
 * ALINEADO CON BACKEND: supabase/functions/r2-upload-url/validarFormatoArchivo.ts
 * 
 * Regla del brief: "Si GIF no está soportado → frontend rechaza GIF, backend rechaza GIF."
 */

// Límites de validación
export const MAX_TAMANO_MB = 50
export const MAX_TAMANO_BYTES = MAX_TAMANO_MB * 1024 * 1024

/**
 * F7-36 FASE 9: MIME types permitidos por categoría.
 * 
 * ALINEADO CON BACKEND: supabase/functions/r2-upload-url/validarFormatoArchivo.ts
 * 
 * Cambios vs versión anterior:
 * - Eliminado: image/gif (backend lo rechaza)
 * - Agregado: application/dicom (radiografías médicas)
 * - Agregado: application/msword (documentos Word .doc)
 * - Agregado: application/vnd.openxmlformats-officedocument.wordprocessingml.document (.docx)
 * - Agregado: text/plain (notas de texto)
 */
export const MIME_TYPES_POR_CATEGORIA = {
  radiografia: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/dicom',
  ],
  foto_intraoral: [
    'image/jpeg',
    'image/png',
    'image/webp',
  ],
  foto_clinica: [
    'image/jpeg',
    'image/png',
    'image/webp',
  ],
  pdf: [
    'application/pdf',
  ],
  documento: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  otro: [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'text/plain',
  ],
}

/**
 * F7-36 FASE 9: Valida archivo antes de subir.
 * 
 * ALINEADO CON BACKEND: usa validación por categoría.
 * 
 * @param {File} file - Archivo a validar
 * @param {Object} permisos - Permisos del usuario
 * @param {string} categoria - Categoría del archivo (radiografia, foto_clinica, etc.)
 * @returns {{ valido: boolean, mensaje: string }}
 */
export const validarArchivo = (file, permisos, categoria = 'otro') => {
  if (file.size > MAX_TAMANO_BYTES) {
    return {
      valido: false,
      mensaje: `El archivo es demasiado grande (${(file.size / 1024 / 1024).toFixed(1)}MB). Máximo ${MAX_TAMANO_MB}MB.`,
    }
  }

  const mimeTypesPermitidos = MIME_TYPES_POR_CATEGORIA[categoria]
  
  if (!mimeTypesPermitidos) {
    return {
      valido: false,
      mensaje: `Categoría desconocida: ${categoria}`,
    }
  }

  if (!mimeTypesPermitidos.includes(file.type)) {
    return {
      valido: false,
      mensaje: `Tipo de archivo no permitido para ${categoria}: ${file.type || 'desconocido'}. Tipos permitidos: ${mimeTypesPermitidos.join(', ')}`,
    }
  }

  if (!permisos.puedeSubir) {
    return {
      valido: false,
      mensaje: 'No tienes permisos para subir archivos. Solo administradores y dentistas pueden subir.',
    }
  }

  return { valido: true, mensaje: '' }
}
