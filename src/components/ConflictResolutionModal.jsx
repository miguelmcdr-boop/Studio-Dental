import React, { useState, useEffect, useRef } from 'react'

/**
 * Modal de resolución de conflictos de edición (F5-04).
 *
 * Muestra ambas versiones (local y remota) de un registro conflictivo
 * y permite al usuario elegir cuál conservar.
 *
 * Props:
 * - titulo: string (ej: "Conflicto al guardar paciente")
 * - versionLocal: object (datos del usuario actual)
 * - versionRemota: object (datos en Supabase)
 * - camposComparar: array de strings (campos a mostrar en diff)
 * - alResolver: function(decision) → 'local' | 'remote' | 'cancel'
 * - alCerrar: function() → cierra sin resolver
 *
 * Uso:
 *   <ConflictResolutionModal
 *     titulo="Conflicto al guardar paciente"
 *     versionLocal={pacienteLocal}
 *     versionRemota={pacienteRemoto}
 *     camposComparar={['nombre', 'telefono', 'email', 'alergias']}
 *     alResolver={(decision) => handleResolution(decision)}
 *     alCerrar={() => setShowModal(false)}
 *   />
 */
export const ConflictResolutionModal = ({
  titulo = 'Conflicto de edición detectado',
  versionLocal,
  versionRemota,
  camposComparar = [],
  alResolver,
  alCerrar
}) => {
  const [resolviendo, setResolviendo] = useState(false)
  const modalRef = useRef(null)

  // Accesibilidad (F6-04): trampa de foco y cierre con ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cerrar con ESC
      if (e.key === 'Escape') {
        e.preventDefault()
        alCerrar()
        return
      }

      // Trampa de foco con Tab
      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]

        if (e.shiftKey && document.activeElement === firstElement) {
          // Shift+Tab en primer elemento: ir al ultimo
          e.preventDefault()
          lastElement.focus()
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          // Tab en ultimo elemento: ir al primero
          e.preventDefault()
          firstElement.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    // Enfocar el primer boton al abrir el modal
    if (modalRef.current) {
      const firstButton = modalRef.current.querySelector('button')
      if (firstButton) firstButton.focus()
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [alCerrar])

  const handleResolver = async (decision) => {
    if (resolviendo) return
    setResolviendo(true)
    try {
      await alResolver(decision)
    } finally {
      setResolviendo(false)
    }
  }

  const formatearValor = (valor) => {
    if (valor === null || valor === undefined) return '—'
    if (typeof valor === 'object') return JSON.stringify(valor)
    return String(valor)
  }

  const sonDiferentes = (campo) => {
    const valorLocal = versionLocal?.[campo]
    const valorRemoto = versionRemota?.[campo]
    return formatearValor(valorLocal) !== formatearValor(valorRemoto)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="conflict-modal-title"
      ref={modalRef}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="text-yellow-600 text-2xl">⚠️</div>
            <div>
              <h2 id="conflict-modal-title" className="text-lg font-semibold text-yellow-900">{titulo}</h2>
              <p className="text-sm text-yellow-700 mt-1">
                Otro usuario modificó este registro mientras lo editabas. Elige qué versión conservar.
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Versión local */}
            <div className="border border-blue-200 rounded-lg overflow-hidden">
              <div className="bg-blue-50 px-4 py-2 border-b border-blue-200">
                <h3 className="font-semibold text-blue-900">📝 Tu versión</h3>
                <p className="text-xs text-blue-700">Los cambios que hiciste</p>
              </div>
              <div className="p-4 space-y-2">
                {camposComparar.map((campo) => {
                  const diferente = sonDiferentes(campo)
                  return (
                    <div
                      key={campo}
                      className={`p-2 rounded ${diferente ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'}`}
                    >
                      <div className="text-xs font-semibold text-gray-600 uppercase">
                        {campo.replace(/_/g, ' ')}
                      </div>
                      <div className={`text-sm mt-1 ${diferente ? 'text-yellow-900 font-medium' : 'text-gray-700'}`}>
                        {formatearValor(versionLocal?.[campo])}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Versión remota */}
            <div className="border border-purple-200 rounded-lg overflow-hidden">
              <div className="bg-purple-50 px-4 py-2 border-b border-purple-200">
                <h3 className="font-semibold text-purple-900">🌐 Versión del servidor</h3>
                <p className="text-xs text-purple-700">
                  Actualizada por otro usuario
                  {versionRemota?.updated_at && ` (${new Date(versionRemota.updated_at).toLocaleString()})`}
                </p>
              </div>
              <div className="p-4 space-y-2">
                {camposComparar.map((campo) => {
                  const diferente = sonDiferentes(campo)
                  return (
                    <div
                      key={campo}
                      className={`p-2 rounded ${diferente ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'}`}
                    >
                      <div className="text-xs font-semibold text-gray-600 uppercase">
                        {campo.replace(/_/g, ' ')}
                      </div>
                      <div className={`text-sm mt-1 ${diferente ? 'text-yellow-900 font-medium' : 'text-gray-700'}`}>
                        {formatearValor(versionRemota?.[campo])}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-between items-center gap-3">
          <button
            onClick={alCerrar}
            disabled={resolviendo}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded disabled:opacity-50"
          >
            Cancelar
          </button>
          <div className="flex gap-3">
            <button
              onClick={() => handleResolver('remote')}
              disabled={resolviendo}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
            >
              🌐 Usar versión del servidor
            </button>
            <button
              onClick={() => handleResolver('local')}
              disabled={resolviendo}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              📝 Mantener mi versión
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
