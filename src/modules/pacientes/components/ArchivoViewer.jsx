import React, { memo } from 'react'

/**
 * Grid/lista de archivos clínicos almacenados en R2.
 *
 * Nota importante:
 * No se renderizan thumbnails remotos automáticamente porque cada preview
 * requeriría una URL firmada y registraría FILE_DOWNLOAD en audit_log.
 * En su lugar se muestra una tarjeta con icono y acciones explícitas:
 * Ver / Descargar / Eliminar.
 */
export const ArchivoViewer = memo(({
  archivos,
  cargando,
  tipoArchivo,
  permisos,
  onVer,
  onDescargar,
  onEliminar,
}) => {
  const textosVacios = {
    foto: 'No hay fotografías clínicas cargadas todavía.',
    rx: 'No hay radiografías cargadas todavía.',
    consentimiento: 'No hay consentimientos informados cargados todavía.',
  }

  const tituloIcono = (archivo) => {
    if (archivo.mime_type?.startsWith('image/')) return '🖼️'
    if (archivo.mime_type === 'application/pdf') return '📄'
    return '📎'
  }

  const formatearTamano = (bytes) => {
    if (!bytes && bytes !== 0) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  const formatearFecha = (fecha) => {
    if (!fecha) return ''
    try {
      return new Date(fecha).toLocaleDateString('es-CL')
    } catch {
      return ''
    }
  }

  const confirmarEliminar = (archivo) => {
    const ok = window.confirm(`¿Eliminar "${archivo.nombre_archivo}"? Esta acción no se puede deshacer.`)
    if (ok) {
      onEliminar(archivo.id)
    }
  }

  if (cargando) {
    return (
      <p className="text-xs text-gray-400 text-center py-8">
        Cargando archivos clínicos…
      </p>
    )
  }

  if (!archivos || archivos.length === 0) {
    return (
      <p className="text-xs text-gray-400 text-center py-8">
        {textosVacios[tipoArchivo] || 'No hay archivos cargados todavía.'}
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {archivos.map((archivo) => (
        <div
          key={archivo.id}
          className="border rounded-xl overflow-hidden bg-gray-50 hover:shadow-md transition-shadow"
        >
          <div className="aspect-video bg-gray-100 flex items-center justify-center">
            <span className="text-4xl" aria-hidden="true">
              {tituloIcono(archivo)}
            </span>
          </div>

          <div className="p-3 space-y-3">
            <div className="min-w-0">
              <p className="text-xs font-bold text-gray-800 truncate" title={archivo.nombre_archivo}>
                {archivo.nombre_archivo}
              </p>
              <p className="text-[10px] text-gray-400">
                {formatearFecha(archivo.created_at)} · {formatearTamano(archivo.tamano_bytes)}
              </p>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold bg-green-100 text-green-800 px-2 py-1 rounded">
                ✓ R2
              </span>

              <div className="flex items-center gap-2">
                {permisos?.puedeVer && (
                  <button
                    type="button"
                    onClick={() => onVer(archivo.id, archivo.mime_type)}
                    className="text-xs font-semibold text-blue-700 hover:text-blue-900"
                    title="Ver archivo"
                  >
                    Ver
                  </button>
                )}

                {permisos?.puedeDescargar && (
                  <button
                    type="button"
                    onClick={() => onDescargar(archivo.id, archivo.nombre_archivo)}
                    className="text-xs font-semibold text-gray-700 hover:text-black"
                    title="Descargar archivo"
                  >
                    Descargar
                  </button>
                )}

                {permisos?.puedeEliminar && (
                  <button
                    type="button"
                    onClick={() => confirmarEliminar(archivo)}
                    className="text-xs font-bold text-gray-400 hover:text-red-600 px-1"
                    title="Eliminar archivo"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
})

ArchivoViewer.displayName = 'ArchivoViewer'
