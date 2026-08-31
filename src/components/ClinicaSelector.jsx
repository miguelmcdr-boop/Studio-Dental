import React, { useState, useEffect } from 'react'
import { listarMisClinicas, setClinicaActiva, getClinicaActiva } from '../services/authService'
import { createLogger } from '../services/logger'

const log = createLogger('ClinicaSelector')

/**
 * F7-10: Selector de clínica activa.
 *
 * Lista las clínicas donde el usuario tiene membresía activa y permite
 * cambiar la clínica activa. La selección se persiste en user_metadata
 * y es leída por clinica_actual() server-side.
 *
 * Si el usuario solo tiene 1 clínica, muestra el nombre sin selector (solo informativo).
 * Si tiene múltiples clínicas, muestra un dropdown para cambiar.
 */
export const ClinicaSelector = ({ onCambioClinica }) => {
  const [clinicas, setClinicas] = useState([])
  const [clinicaActiva, setClinicaActivaState] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [cambiando, setCambiando] = useState(false)
  const [error, setError] = useState(null)

  // Cargar clínicas y clínica activa al montar
  useEffect(() => {
    const cargar = async () => {
      setCargando(true)
      setError(null)
      try {
        const [lista, activa] = await Promise.all([
          listarMisClinicas(),
          getClinicaActiva()
        ])

        setClinicas(lista)
        setClinicaActivaState(activa || (lista.length > 0 ? lista[0].clinica_id : null))
      } catch (err) {
        log.error('Error cargando clínicas:', err.message)
        setError('Error cargando clínicas')
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [])

  // Manejar cambio de clínica
  const handleCambio = async (e) => {
    const nuevaClinicaId = e.target.value
    if (nuevaClinicaId === clinicaActiva) return

    setCambiando(true)
    setError(null)

    try {
      const result = await setClinicaActiva(nuevaClinicaId)

      if (result.success) {
        setClinicaActivaState(nuevaClinicaId)
        log.info('Clínica cambiada a:', nuevaClinicaId)
        if (onCambioClinica) {
          onCambioClinica(nuevaClinicaId)
        }
        // Recargar la página para refrescar el JWT y todos los datos
        setTimeout(() => window.location.reload(), 300)
      } else {
        setError(result.error || 'Error al cambiar clínica')
        log.error('Error cambiando clínica:', result.error)
      }
    } catch (err) {
      setError('Error al cambiar clínica')
      log.error('Excepción cambiando clínica:', err.message)
    } finally {
      setCambiando(false)
    }
  }

  // Estados de carga y error
  if (cargando) {
    return (
      <div className="px-2 py-3 mb-4 border-b border-gray-200">
        <div className="text-xs text-gray-500 animate-pulse">Cargando clínica...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-2 py-3 mb-4 border-b border-red-200 bg-red-50">
        <div className="text-xs text-red-600">{error}</div>
      </div>
    )
  }

  if (clinicas.length === 0) {
    return (
      <div className="px-2 py-3 mb-4 border-b border-yellow-200 bg-yellow-50">
        <div className="text-xs text-yellow-700">Sin clínicas asignadas</div>
      </div>
    )
  }

  const clinicaActivaData = clinicas.find(c => c.clinica_id === clinicaActiva)

  // Si solo hay 1 clínica, mostrar sin selector (solo informativo)
  if (clinicas.length === 1) {
    return (
      <div className="px-2 py-3 mb-4 border-b border-gray-200" title="F7-10: Clínica activa">
        <div className="text-xs text-gray-500 mb-1">Clínica</div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-800 truncate">
            {clinicas[0].nombre}
          </span>
        </div>
      </div>
    )
  }

  // Múltiples clínicas: mostrar selector
  return (
    <div className="px-2 py-3 mb-4 border-b border-gray-200">
      <label className="text-xs text-gray-500 block mb-1">Clínica activa</label>
      <select
        value={clinicaActiva || ''}
        onChange={handleCambio}
        disabled={cambiando}
        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {clinicas.map(c => (
          <option key={c.clinica_id} value={c.clinica_id}>
            {c.nombre} ({c.rol})
          </option>
        ))}
      </select>
      {cambiando && (
        <div className="text-xs text-blue-600 mt-1 animate-pulse">Cambiando...</div>
      )}
    </div>
  )
}
