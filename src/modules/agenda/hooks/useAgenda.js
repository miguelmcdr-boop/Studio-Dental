import { useState, useMemo, useCallback } from 'react'
import { agendaStorageService } from '../services/agendaStorageService'
import { obtenerFechaHoyISO } from '../utils/agendaCalculations'

export const useAgenda = () => {
  const [citas, setCitas] = useState(() => agendaStorageService.obtenerCitas())
  const [fechaSeleccionada, setFechaSeleccionada] = useState(obtenerFechaHoyISO())
  const [boxFiltro, setBoxFiltro] = useState('Todos')
  const [busquedaPaciente, setBusquedaPaciente] = useState('')

  const citasFiltradas = useMemo(() => {
    return citas.filter(c => {
      const coincideFecha = c.fecha === fechaSeleccionada
      const coincideBox = boxFiltro === 'Todos' || c.box === boxFiltro
      const coincidePaciente = !busquedaPaciente.trim() || 
        c.pacienteNombre.toLowerCase().includes(busquedaPaciente.toLowerCase()) ||
        c.pacienteRut.toLowerCase().includes(busquedaPaciente.toLowerCase())
      
      return coincideFecha && coincideBox && coincidePaciente
    }).sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
  }, [citas, fechaSeleccionada, boxFiltro, busquedaPaciente])

  const agregarCita = useCallback((nuevaCita) => {
    setCitas(prev => {
      const actualizadas = [nuevaCita, ...prev]
      agendaStorageService.guardarCitas(actualizadas)
      return actualizadas
    })
  }, [])

  const actualizarEstadoCita = useCallback((citaId, nuevoEstado) => {
    setCitas(prev => {
      const actualizadas = prev.map(c => c.id === citaId ? { ...c, estado: nuevoEstado } : c)
      agendaStorageService.guardarCitas(actualizadas)
      return actualizadas
    })
  }, [])

  const eliminarCita = useCallback((citaId) => {
    if (window.confirm('¿Deseas eliminar esta cita agendada?')) {
      setCitas(prev => {
        const actualizadas = prev.filter(c => c.id !== citaId)
        agendaStorageService.guardarCitas(actualizadas)
        return actualizadas
      })
    }
  }, [])

  return {
    citasFiltradas,
    fechaSeleccionada,
    setFechaSeleccionada,
    boxFiltro,
    setBoxFiltro,
    busquedaPaciente,
    setBusquedaPaciente,
    agregarCita,
    actualizarEstadoCita,
    eliminarCita
  }
}