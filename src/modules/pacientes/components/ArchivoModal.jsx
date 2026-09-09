/**
 * Modal para visualizar archivos clínicos (imágenes/PDFs) inline.
 * Migrado a <Modal> base (F7-25)
 *
 * F7-22 Fase 8:
 * - Evita abrir nueva pestaña (mejor UX)
 * - Renderiza <img> para imágenes
 * - Renderiza <iframe> para PDFs
 * - Diseño responsive (móvil/tablet/desktop)
 */
import React, { memo } from 'react'
import { Modal } from '../../../components/ui/Modal'

export const ArchivoModal = memo(({
  abierto,
  blobUrl,
  mimeType,
  nombreArchivo,
  onCerrar,
}) => {
  if (!abierto || !blobUrl) return null

  const esImagen = mimeType?.startsWith('image/')
  const esPDF = mimeType === 'application/pdf'

  return (
    <Modal
      isOpen={abierto}
      onClose={onCerrar}
      title={nombreArchivo}
      size="full"
    >
      {/* Contenido adaptable */}
      <div className="flex-1 overflow-auto bg-gray-900 dark:bg-graphite-950 flex items-center justify-center p-2 sm:p-4 -mx-6 -mb-6 rounded-b-xl">
        {esImagen && (
          <img
            src={blobUrl}
            alt={nombreArchivo}
            className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
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
          <div className="text-center text-gray-300 dark:text-graphite-400 p-8">
            <p className="text-5xl mb-4">📄</p>
            <p className="text-sm">
              Vista previa no disponible para este tipo de archivo.
              <br />
              <span className="text-xs text-gray-400 dark:text-graphite-500">Usa el botón "Descargar" para abrirlo.</span>
            </p>
          </div>
        )}
      </div>

      {/* Footer con hint */}
      <div className="p-2 sm:p-3 border-t border-gray-200 dark:border-graphite-700 bg-gray-50 dark:bg-graphite-900 -mx-6 -mb-6 rounded-b-xl mt-4">
        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-graphite-400 text-center">
          💡 Tip: presiona <kbd className="px-1.5 py-0.5 bg-white dark:bg-graphite-800 border border-gray-300 dark:border-graphite-600 rounded text-[10px] font-mono">ESC</kbd> o haz click fuera para cerrar
        </p>
      </div>
    </Modal>
  )
})

ArchivoModal.displayName = 'ArchivoModal'
