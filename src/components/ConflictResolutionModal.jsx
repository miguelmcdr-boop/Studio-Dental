/**
 * Modal de resolución de conflictos de edición (F5-04).
 * Migrado a <Modal> base (F7-25)
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
import React, { useState } from 'react'
import { Button } from './ui/Button'
import { Globe, PenLine } from 'lucide-react'
import { Icon } from './Icon'
import { Modal } from './ui/Modal'

export const ConflictResolutionModal = ({
  titulo = 'Conflicto de edición detectado',
  versionLocal,
  versionRemota,
  camposComparar = [],
  alResolver,
  alCerrar
}) => {
  const [resolviendo, setResolviendo] = useState(false)

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
    <Modal
      isOpen={true}
      onClose={alCerrar}
      title={`⚠️ ${titulo}`}
      size="xl"
      closeOnOverlayClick={!resolviendo}
      closeOnEscape={!resolviendo}
    >
      {/* Banner de advertencia */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
        <p className="text-sm text-yellow-900 dark:text-yellow-200">
          Otro usuario modificó este registro mientras lo editabas. Elige qué versión conservar.
        </p>
      </div>

      {/* Content */}
      <div className="grid grid-cols-2 gap-6 mb-4">
        {/* Versión local */}
        <div className="border border-blue-200 dark:border-blue-800 rounded-lg overflow-hidden">
          <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2 border-b border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-graphite-900 dark:text-graphite-100 flex items-center gap-2">
              <Icon icon={PenLine} size="xs"/> Tu versión
            </h3>
            <p className="text-xs text-blue-700 dark:text-blue-300">Los cambios que hiciste</p>
          </div>
          <div className="p-4 space-y-2">
            {camposComparar.map((campo) => {
              const diferente = sonDiferentes(campo)
              return (
                <div
                  key={campo}
                  className={`p-2 rounded ${
                    diferente 
                      ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800' 
                      : 'bg-gray-50 dark:bg-graphite-800'
                  }`}
                >
                  <div className="text-xs font-semibold text-gray-600 dark:text-graphite-400 uppercase">
                    {campo.replace(/_/g, ' ')}
                  </div>
                  <div className={`text-sm mt-1 ${
                    diferente 
                      ? 'text-yellow-900 dark:text-yellow-200 font-medium' 
                      : 'text-gray-700 dark:text-graphite-300'
                  }`}>
                    {formatearValor(versionLocal?.[campo])}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Versión remota */}
        <div className="border border-purple-200 dark:border-purple-800 rounded-lg overflow-hidden">
          <div className="bg-purple-50 dark:bg-purple-900/20 px-4 py-2 border-b border-purple-200 dark:border-purple-800">
            <h3 className="font-semibold text-graphite-900 dark:text-graphite-100 flex items-center gap-2">
              <Icon icon={Globe} size="xs" /> Versión del servidor
            </h3>
            <p className="text-xs text-purple-700 dark:text-purple-300">
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
                  className={`p-2 rounded ${
                    diferente 
                      ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800' 
                      : 'bg-gray-50 dark:bg-graphite-800'
                  }`}
                >
                  <div className="text-xs font-semibold text-gray-600 dark:text-graphite-400 uppercase">
                    {campo.replace(/_/g, ' ')}
                  </div>
                  <div className={`text-sm mt-1 ${
                    diferente 
                      ? 'text-yellow-900 dark:text-yellow-200 font-medium' 
                      : 'text-gray-700 dark:text-graphite-300'
                  }`}>
                    {formatearValor(versionRemota?.[campo])}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center gap-3 pt-4 border-t dark:border-graphite-700">
        <Button
          variant="ghost"
          onClick={alCerrar}
          disabled={resolviendo}
        >
          Cancelar
        </Button>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            icon={Globe}
            onClick={() => handleResolver('remote')}
            disabled={resolviendo}
          >
            Usar versión del servidor
          </Button>
          <Button
            variant="primary"
            icon={PenLine}
            onClick={() => handleResolver('local')}
            disabled={resolviendo}
          >
            Mantener mi versión
          </Button>
        </div>
      </div>
    </Modal>
  )
}
