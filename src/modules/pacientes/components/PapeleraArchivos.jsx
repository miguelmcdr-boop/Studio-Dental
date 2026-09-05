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
  onVaciar,
  puedeVaciar = false,
  permisos,
}) => {
  const [abierto, setAbierto] = useState(false)
  const [restaurandoId, setRestaurandoId] = useState(null)
  const [mostrarConfirmacionVaciar, setMostrarConfirmacionVaciar] = useState(false)
  const [textoConfirmacion, setTextoConfirmacion] = useState('')
  const [vaciando, setVaciando] = useState(false)

  const handleVaciar = async () => {
    if (textoConfirmacion !== 'VACIAR') return
    setVaciando(true)
    try {
      await onVaciar()
      setMostrarConfirmacionVaciar(false)
      setTextoConfirmacion('')
    } finally {
      setVaciando(false)
    }
  }

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
      {/* Header colapsable (div + role="button" para permitir botón anidado "Vaciar") */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setAbierto(!abierto)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setAbierto(!abierto) }}
        className="w-full flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🗑️</span>
          <span className="font-semibold text-sm text-gray-800">
            Papelera de Reciclaje
          </span>
          <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
            {archivosEliminados.length} archivo{archivosEliminados.length !== 1 ? 's' : ''}
          </span>
          {puedeVaciar && archivosEliminados.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setMostrarConfirmacionVaciar(true)
              }}
              className="text-xs text-red-600 hover:text-red-800 font-semibold px-2 py-0.5 rounded border border-red-300 hover:bg-red-50 transition-colors"
            >
              🗑️ Vaciar papelera
            </button>
          )}
        </div>
        <span className="text-gray-500 text-sm">
          {abierto ? '▲ Ocultar' : '▼ Mostrar'}
        </span>
      </div>

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

      {/* Modal de confirmación para vaciar papelera */}
      {mostrarConfirmacionVaciar && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md border border-red-200 shadow-2xl">
            <h4 className="text-lg font-bold text-red-700 mb-3">
              ⚠️ Vaciar papelera de archivos
            </h4>
            <div className="space-y-3 text-sm text-gray-700">
              <p>
                Vas a eliminar permanentemente <strong>{archivosEliminados.length} archivo(s)</strong> de la papelera.
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 font-semibold mb-1">
                  ⚠️ Esta acción es IRREVERSIBLE:
                </p>
                <ul className="text-xs text-red-700 space-y-1 list-disc list-inside">
                  <li>Se eliminarán los archivos de Cloudflare R2</li>
                  <li>Se liberará espacio de almacenamiento</li>
                  <li>Se registrará ADMIN_PURGE_ARCHIVOS en audit_log</li>
                </ul>
              </div>
              <p className="font-semibold">
                Para confirmar, escribe <code className="bg-gray-100 px-2 py-0.5 rounded font-mono">VACIAR</code>:
              </p>
              <input
                type="text"
                value={textoConfirmacion}
                onChange={(e) => setTextoConfirmacion(e.target.value)}
                placeholder="VACIAR"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 text-sm font-mono"
                autoFocus
              />
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => {
                  setMostrarConfirmacionVaciar(false)
                  setTextoConfirmacion('')
                }}
                disabled={vaciando}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 text-sm font-semibold rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleVaciar}
                disabled={textoConfirmacion !== 'VACIAR' || vaciando}
                className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {vaciando ? 'Vaciando...' : 'Vaciar papelera'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

PapeleraArchivos.displayName = 'PapeleraArchivos'
