import React, { memo, useEffect } from 'react'

/**
 * Modal para visualizar archivos clínicos (imágenes/PDFs) inline.
 *
 * F7-22 Fase 8:
 * - Evita abrir nueva pestaña (mejor UX)
 * - Renderiza <img> para imágenes
 * - Renderiza <iframe> para PDFs
 * - Cierra con ESC o click fuera
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

  if (!abierto || !blobUrl) return null

  const esImagen = mimeType?.startsWith('image/')
  const esPDF = mimeType === 'application/pdf'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
      onClick={onCerrar}
    >
      <div
        className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="font-bold text-sm text-gray-900 truncate">
            {nombreArchivo}
          </h3>
          <button
            onClick={onCerrar}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold px-2"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center p-4">
          {esImagen && (
            <img
              src={blobUrl}
              alt={nombreArchivo}
              className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
            />
          )}

          {esPDF && (
            <iframe
              src={blobUrl}
              title={nombreArchivo}
              className="w-full h-full min-h-[70vh] rounded-lg shadow-lg"
            />
          )}

          {!esImagen && !esPDF && (
            <div className="text-center text-gray-500">
              <p className="text-6xl mb-4">📄</p>
              <p className="text-sm">
                Vista previa no disponible para este tipo de archivo.
                <br />
                Usa el botón "Descargar" para abrirlo.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

ArchivoModal.displayName = 'ArchivoModal'
