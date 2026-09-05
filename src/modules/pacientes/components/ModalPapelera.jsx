import React, { useState, useMemo } from 'react'
import { tiempoRelativo } from '../../../utils/dateUtils'

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

  // Filtrar pacientes por nombre o RUT
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

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 print:hidden">
      <div className="bg-white rounded-2xl p-6 w-full max-w-3xl border border-gray-200 shadow-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-4 border-b pb-3">
          <div>
            <h3 className="text-lg font-bold text-gray-900">🗑️ Papelera de Reciclaje</h3>
            <p className="text-xs text-gray-500 mt-1">
              {pacientesEliminados.length} paciente{pacientesEliminados.length !== 1 ? 's' : ''} eliminado{pacientesEliminados.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button 
            onClick={onCerrar} 
            className="text-gray-400 hover:text-black font-bold text-lg"
          >
            ✕
          </button>
        </div>

        {/* Buscador */}
        <div className="mb-4">
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="🔍 Buscar por nombre o RUT..."
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-black text-sm text-gray-800 shadow-sm"
          />
        </div>

        {/* Lista de pacientes */}
        <div className="flex-1 overflow-y-auto space-y-3">
          {cargando ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Cargando papelera...</p>
            </div>
          ) : pacientesFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-6xl mb-4">🗑️</p>
              <p className="text-gray-500 text-sm">
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
                className="p-4 border border-gray-200 rounded-xl hover:border-gray-300 transition-all bg-gray-50"
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-lg font-bold text-gray-600 flex-shrink-0">
                    {paciente.nombre?.charAt(0).toUpperCase() || '?'}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 text-sm truncate">
                      {paciente.nombre || 'Sin nombre'}
                    </h4>
                    <p className="text-xs text-gray-600 mt-1">
                      RUT: {paciente.rut || 'Sin RUT'}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                      <span>
                        📅 Eliminado {tiempoRelativo(paciente.deleted_at)}
                      </span>
                      <span>
                        👤 Por: {paciente.eliminadoPor || 'Usuario desconocido'}
                      </span>
                    </div>
                  </div>

                  {/* Botón restaurar */}
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
          <div className="mt-4 pt-3 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="text-xs text-gray-500 flex-1">
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

        {/* Modal de confirmación doble */}
        {mostrarConfirmacionVaciar && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60]">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md border border-red-200 shadow-2xl">
              <h4 className="text-lg font-bold text-red-700 mb-3">⚠️ Eliminación permanente</h4>
              <div className="space-y-3 text-sm text-gray-700">
                <p>
                  Vas a eliminar permanentemente <strong>{contadorElegibles} paciente(s)</strong> que 
                  estuvieron en la papelera por más de {aniosRetencion} años.
                </p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-800 font-semibold mb-1">
                    ⚠️ Esta acción es IRREVERSIBLE:
                  </p>
                  <ul className="text-xs text-red-700 space-y-1 list-disc list-inside">
                    <li>Se eliminará toda la ficha clínica (citas, recetas, certificados, etc.)</li>
                    <li>Se eliminarán los archivos adjuntos en Cloudflare R2</li>
                    <li>Se registrará ADMIN_PURGE_PACIENTES en audit_log</li>
                  </ul>
                </div>
                <p className="font-semibold">
                  Para confirmar, escribe <code className="bg-gray-100 px-2 py-0.5 rounded font-mono">ELIMINAR</code>:
                </p>
                <input
                  type="text"
                  value={textoConfirmacion}
                  onChange={(e) => setTextoConfirmacion(e.target.value)}
                  placeholder="ELIMINAR"
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
        <div className="mt-4 pt-3 border-t text-xs text-gray-500">
          <p>
            💡 Los pacientes eliminados se conservan en la papelera. Solo pueden ser restaurados
            o eliminados permanentemente por administradores según la Ley 20.584.
          </p>
        </div>
      </div>
    </div>
  )
}

ModalPapelera.displayName = 'ModalPapelera'
