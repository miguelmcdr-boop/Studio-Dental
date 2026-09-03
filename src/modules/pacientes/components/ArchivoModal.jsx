import React, { memo, useEffect } from 'react'

/**
 * Modal para visualizar archivos clínicos (imágenes/PDFs) inline.
 *
 * F7-22 Fase 8:
 * - Evita abrir nueva pestaña (mejor UX)
 * - Renderiza <img> para imágenes
 * - Renderiza <iframe> para PDFs
 * - Cierra con ESC o click fuera
 * - Diseño responsive (móvil/tablet/desktop)
 */
export const ArchivoModal = memo(({
  abierto,
  blobUrl,
  mimeType,
  nombreArchivo,
  onCerrar,
}) => {
  // Cerrar con tecla ESC
  useEffect(() => {
    if (!abierto) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onCerrar()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [abierto, onCerrar])

  // Prevenir scroll del body cuando el modal está abierto
  useEffect(() => {
    if (abierto) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [abierto])

  if (!abierto || !blobUrl) return null

  const esImagen = mimeType?.startsWith('image/')
  const esPDF = mimeType === 'application/pdf'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-3 sm:p-4 md:p-6"
      onClick={onCerrar}
    >
      <div
        className="bg-white rounded-xl sm:rounded-2xl w-full max-w-[95vw] sm:max-w-3xl md:max-w-5xl lg:max-w-6xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header compacto */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 bg-gray-50">
          <h3 className="font-semibold text-xs sm:text-sm text-gray-900 truncate pr-2" title={nombreArchivo}>
            {nombreArchivo}
          </h3>
          <button
            onClick={onCerrar}
            className="text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors w-8 h-8 flex items-center justify-center flex-shrink-0"
            aria-label="Cerrar"
            title="Cerrar (ESC)"
          >
            <span className="text-xl leading-none">✕</span>
          </button>
        </div>

        {/* Contenido adaptable */}
        <div className="flex-1 overflow-auto bg-gray-900 flex items-center justify-center p-2 sm:p-4">
          {esImagen && (
            <img
              src={blobUrl}
              alt={nombreArchivo}
              className="max-w-full max-h-[calc(90vh-80px)] object-contain rounded-lg shadow-lg"
              draggable={false}
            />
          )}

          {esPDF && (
            <iframe
              src={blobUrl}
              title={nombreArchivo}
              className="w-full h-[70vh] rounded-lg shadow-lg bg-white"
            />
          )}

          {!esImagen && !esPDF && (
            <div className="text-center text-gray-300 p-8">
              <p className="text-5xl mb-4">📄</p>
              <p className="text-sm">
                Vista previa no disponible para este tipo de archivo.
                <br />
                <span className="text-xs text-gray-400">Usa el botón "Descargar" para abrirlo.</span>
              </p>
            </div>
          )}
        </div>

        {/* Footer con hint */}
        <div className="p-2 sm:p-3 border-t border-gray-200 bg-gray-50">
          <p className="text-[10px] sm:text-xs text-gray-500 text-center">
            💡 Tip: presiona <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-[10px] font-mono">ESC</kbd> o haz click fuera para cerrar
          </p>
        </div>
      </div>
    </div>
  )
})

ArchivoModal.displayName = 'ArchivoModal'
