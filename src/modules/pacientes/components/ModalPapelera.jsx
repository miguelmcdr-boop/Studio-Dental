import React, { useState, useMemo } from 'react'
import { tiempoRelativo } from '../../../utils/dateUtils'
import { Modal } from '../../../components/ui/Modal'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'

/**
 * Modal de papelera de reciclaje (F6-L).
 *
 * Muestra lista de pacientes eliminados con opción de restaurar.
 * Solo accesible para usuarios con permiso VER_PAPELERA (admin).
 *
 * @param {Object} props
 * @param {Array} props.pacientesEliminados - Lista de pacientes eliminados
 * @param {boolean} props.cargando - Estado de carga
 * @param {Function} props.onRestaurar - Callback para restaurar paciente
 * @param {Function} props.onVaciar - Callback para vaciar papelera
 * @param {Function} props.onCerrar - Callback para cerrar modal
 */
export const ModalPapelera = ({
  pacientesEliminados,
  cargando,
  onRestaurar,
  onVaciar,
  contadorElegibles = 0,
  aniosRetencion = 10,
  puedeVaciar = false,
  onCerrar
}) => {
  const [busqueda, setBusqueda] = useState('')
  const [restaurandoId, setRestaurandoId] = useState(null)
  const [mostrarConfirmacionVaciar, setMostrarConfirmacionVaciar] = useState(false)
  const [textoConfirmacion, setTextoConfirmacion] = useState('')
  const [vaciando, setVaciando] = useState(false)

  const handleVaciar = async () => {
    if (textoConfirmacion !== 'ELIMINAR') return
    setVaciando(true)
    try {
      await onVaciar()
      setMostrarConfirmacionVaciar(false)
      setTextoConfirmacion('')
    } finally {
      setVaciando(false)
    }
  }

  const pacientesFiltrados = useMemo(() => {
    if (!busqueda.trim()) return pacientesEliminados
    const termino = busqueda.toLowerCase()
    return pacientesEliminados.filter(p =>
      p.nombre?.toLowerCase().includes(termino) ||
      p.rut?.toLowerCase().includes(termino)
    )
  }, [pacientesEliminados, busqueda])

  const handleRestaurar = async (pacienteId) => {
    const confirmado = window.confirm(
      '¿Estás seguro de restaurar este paciente?\n\n' +
      'El paciente volverá al directorio activo con toda su ficha clínica.'
    )
    if (!confirmado) return
    setRestaurandoId(pacienteId)
    try {
      await onRestaurar(pacienteId)
    } finally {
      setRestaurandoId(null)
    }
  }

  const conteoTexto = `${pacientesEliminados.length} paciente${pacientesEliminados.length !== 1 ? 's' : ''} eliminado${pacientesEliminados.length !== 1 ? 's' : ''}`

  return (
    <Modal
      isOpen={true}
      onClose={onCerrar}
      size="xl"
      showCloseButton={false}
    >
      {/* Header custom: preserva el botón ✕ visible para el test */}
      <div className="flex justify-between items-center mb-4 border-b dark:border-graphite-700 pb-3">
        <div>
          <h3 className="text-lg font-bold text-graphite-900 dark:text-graphite-50">🗑️ Papelera de Reciclaje</h3>
          <p className="text-xs text-graphite-500 dark:text-graphite-400 mt-1">{conteoTexto}</p>
        </div>
        <button
          onClick={onCerrar}
          className="text-graphite-400 dark:text-graphite-500 hover:text-graphite-900 dark:hover:text-graphite-50 font-bold text-lg"
        >
          ✕
        </button>
      </div>

      {/* Buscador */}
      <div className="mb-4">
        <Input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="🔍 Buscar por nombre o RUT..."
        />
      </div>

      {/* Lista de pacientes */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {cargando ? (
          <div className="text-center py-12">
            <p className="text-graphite-500 dark:text-graphite-400">Cargando papelera...</p>
          </div>
        ) : pacientesFiltrados.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-6xl mb-4">🗑️</p>
            <p className="text-graphite-500 dark:text-graphite-400 text-sm">
              {busqueda
                ? 'No se encontraron pacientes que coincidan con la búsqueda'
                : 'La papelera está vacía'
              }
            </p>
          </div>
        ) : (
          pacientesFiltrados.map(paciente => (
            <div
              key={paciente.id}
              className="p-4 border border-gray-200 dark:border-graphite-700 rounded-xl hover:border-gray-300 dark:hover:border-graphite-600 transition-all bg-gray-50 dark:bg-graphite-800"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gray-300 dark:bg-graphite-700 rounded-full flex items-center justify-center text-lg font-bold text-gray-600 dark:text-gray-300 flex-shrink-0">
                  {paciente.nombre?.charAt(0).toUpperCase() || '?'}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-graphite-900 dark:text-graphite-50 text-sm truncate">
                    {paciente.nombre || 'Sin nombre'}
                  </h4>
                  <p className="text-xs text-graphite-600 dark:text-graphite-400 mt-1">
                    RUT: {paciente.rut || 'Sin RUT'}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-graphite-500 dark:text-graphite-400">
                    <span>📅 Eliminado {tiempoRelativo(paciente.deleted_at)}</span>
                    <span>👤 Por: {paciente.eliminadoPor || 'Usuario desconocido'}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleRestaurar(paciente.id)}
                  disabled={restaurandoId === paciente.id}
                  className="px-4 py-2 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                >
                  {restaurandoId === paciente.id ? 'Restaurando...' : '♻️ Restaurar'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Acciones de administrador */}
      {puedeVaciar && (
        <div className="mt-4 pt-3 border-t dark:border-graphite-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="text-xs text-graphite-500 dark:text-graphite-400 flex-1">
            <p className="mb-1">
              <strong>⚖️ Ley 20.584:</strong> Solo puedes eliminar permanentemente
              pacientes que fueron eliminados de la papelera hace {aniosRetencion}+ años.
            </p>
            <p>
              Pacientes elegibles para purga: <strong>{contadorElegibles}</strong>
            </p>
          </div>
          <button
            onClick={() => setMostrarConfirmacionVaciar(true)}
            disabled={contadorElegibles === 0 || vaciando}
            className="px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            🗑️ Vaciar papelera ({contadorElegibles})
          </button>
        </div>
      )}

      {/* Modal de confirmación doble (anidado nativo, z-[60] sobre el principal) */}
      {mostrarConfirmacionVaciar && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white dark:bg-graphite-800 rounded-2xl p-6 w-full max-w-md border border-red-200 dark:border-red-900 shadow-2xl">
            <h4 className="text-lg font-bold text-red-700 dark:text-red-400 mb-3">⚠️ Eliminación permanente</h4>
            <div className="space-y-3 text-sm text-graphite-700 dark:text-graphite-300">
              <p>
                Vas a eliminar permanentemente <strong>{contadorElegibles} paciente(s)</strong> que
                estuvieron en la papelera por más de {aniosRetencion} años.
              </p>
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-red-800 dark:text-red-300 font-semibold mb-1">⚠️ Esta acción es IRREVERSIBLE:</p>
                <ul className="text-xs text-red-700 dark:text-red-400 space-y-1 list-disc list-inside">
                  <li>Se eliminará toda la ficha clínica (citas, recetas, certificados, etc.)</li>
                  <li>Se eliminarán los archivos adjuntos en Cloudflare R2</li>
                  <li>Se registrará ADMIN_PURGE_PACIENTES en audit_log</li>
                </ul>
              </div>
              <p className="font-semibold">
                Para confirmar, escribe <code className="bg-gray-100 dark:bg-graphite-700 px-2 py-0.5 rounded font-mono text-graphite-900 dark:text-graphite-50">ELIMINAR</code>:
              </p>
              <Input
                type="text"
                value={textoConfirmacion}
                onChange={(e) => setTextoConfirmacion(e.target.value)}
                placeholder="ELIMINAR"
                className="font-mono"
                autoFocus
              />
            </div>
            <div className="flex gap-2 mt-5">
              <Button
                onClick={() => {
                  setMostrarConfirmacionVaciar(false)
                  setTextoConfirmacion('')
                }}
                disabled={vaciando}
                variant="secondary"
                fullWidth
              >
                Cancelar
              </Button>
              <button
                onClick={handleVaciar}
                disabled={textoConfirmacion !== 'ELIMINAR' || vaciando}
                className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {vaciando ? 'Eliminando...' : 'Eliminar permanentemente'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-3 border-t dark:border-graphite-700 text-xs text-graphite-500 dark:text-graphite-400">
        <p>
          💡 Los pacientes eliminados se conservan en la papelera. Solo pueden ser restaurados
          o eliminados permanentemente por administradores según la Ley 20.584.
        </p>
      </div>
    </Modal>
  )
}

ModalPapelera.displayName = 'ModalPapelera'
