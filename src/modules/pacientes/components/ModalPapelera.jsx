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
export const ModalPapelera = ({ pacientesEliminados, cargando, onRestaurar, onCerrar }) => {
  const [busqueda, setBusqueda] = useState('')
  const [restaurandoId, setRestaurandoId] = useState(null)

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

        {/* Footer */}
        <div className="mt-4 pt-3 border-t text-xs text-gray-500">
          <p>
            💡 Los pacientes eliminados se conservan indefinidamente y pueden ser restaurados por administradores.
            Esta política cumple con la Ley 20.584 sobre conservación de fichas clínicas.
          </p>
        </div>
      </div>
    </div>
  )
}

ModalPapelera.displayName = 'ModalPapelera'
