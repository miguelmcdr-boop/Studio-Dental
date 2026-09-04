import React, { memo, useState } from 'react'

/**
 * Sección colapsable de papelera de archivos clínicos.
 *
 * F7-31 Fase 6: muestra archivos eliminados con opción de restaurar.
 *
 * Características:
 * - Colapsable (oculto por defecto para no saturar UI)
 * - Lista archivos eliminados con metadata (nombre, fecha, tamaño, categoría)
 * - Botón "Restaurar" para cada archivo
 * - Solo visible para usuarios con permisos de eliminación (admin/dentista)
 * - Diseño consistente con ArchivoViewer
 *
 * @param {Array} archivosEliminados — lista de archivos en papelera
 * @param {boolean} cargando — estado de carga
 * @param {Function} onRestaurar — callback para restaurar archivo
 * @param {Object} permisos — permisos del usuario
 */
export const PapeleraArchivos = memo(({
  archivosEliminados,
  cargando,
  onRestaurar,
  permisos,
}) => {
  const [abierto, setAbierto] = useState(false)
  const [restaurandoId, setRestaurandoId] = useState(null)

  // Solo mostrar si hay permisos de eliminación
  if (!permisos.puedeEliminar) return null

  const handleRestaurar = async (archivoId) => {
    const confirmado = window.confirm(
      '¿Estás seguro de restaurar este archivo?\n\n' +
      'El archivo volverá a la lista de archivos activos.'
    )

    if (!confirmado) return

    setRestaurandoId(archivoId)
    try {
      await onRestaurar(archivoId)
    } finally {
      setRestaurandoId(null)
    }
  }

  const formatearFecha = (fecha) => {
    if (!fecha) return ''
    try {
      return new Date(fecha).toLocaleDateString('es-CL')
    } catch {
      return ''
    }
  }

  const formatearTamano = (bytes) => {
    if (!bytes && bytes !== 0) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  const tituloCategoria = (categoria) => {
    if (categoria === 'foto_clinica' || categoria === 'foto_intraoral') return '️'
    if (categoria === 'radiografia') return '🩻'
    if (categoria === 'pdf') return '📄'
    return '📎'
  }

  return (
    <div className="mt-6">
      {/* Header colapsable */}
      <button
        onClick={() => setAbierto(!abierto)}
        className="w-full flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🗑️</span>
          <span className="font-semibold text-sm text-gray-800">
            Papelera de Reciclaje
          </span>
          <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
            {archivosEliminados.length} archivo{archivosEliminados.length !== 1 ? 's' : ''}
          </span>
        </div>
        <span className="text-gray-500 text-sm">
          {abierto ? '▲ Ocultar' : '▼ Mostrar'}
        </span>
      </button>

      {/* Contenido colapsable */}
      {abierto && (
        <div className="mt-3 bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          {cargando ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              Cargando papelera...
            </div>
          ) : archivosEliminados.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              La papelera está vacía.
            </div>
          ) : (
            <div className="space-y-2">
              {archivosEliminados.map((archivo) => (
                <div
                  key={archivo.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-2xl flex-shrink-0">
                      {tituloCategoria(archivo.categoria)}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">
                        {archivo.nombre_archivo}
                      </p>
                      <p className="text-xs text-gray-500">
                        Eliminado el {formatearFecha(archivo.deleted_at)} · {formatearTamano(archivo.tamano_bytes)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRestaurar(archivo.id)}
                    disabled={restaurandoId === archivo.id}
                    className="ml-3 px-3 py-1.5 bg-black text-white text-xs font-semibold rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                  >
                    {restaurandoId === archivo.id ? 'Restaurando...' : '♻️ Restaurar'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
})

PapeleraArchivos.displayName = 'PapeleraArchivos'
