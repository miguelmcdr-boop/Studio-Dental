import { useState, useMemo, useCallback } from 'react'
import { CITAS_DEFAULT } from '../constants/agendaConstants'
import { agendaStorageService } from '../services/agendaStorageService'
import { calcularResumenAgenda, verificarDisponibilidadBox } from '../utils/agendaCalculations'

export const useAgenda = () => {
  const [citas, setCitas] = useState(() => 
    agendaStorageService.obtenerCitas(CITAS_DEFAULT)
  )

  const [fechaSeleccionadaIso, setFechaSeleccionadaIso] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [boxFiltro, setBoxFiltro] = useState('Todos')

  const resumen = useMemo(() => calcularResumenAgenda(citas), [citas])

  const citasFiltradas = useMemo(() => {
    return citas.filter(c => {
      const coincideFecha = c.fechaIso === fechaSeleccionadaIso || c.fecha === new Date(fechaSeleccionadaIso + 'T00:00:00').toLocaleDateString('es-CL')
      const coincideBox = boxFiltro === 'Todos' || c.boxId === boxFiltro
      return coincideFecha && coincideBox
    })
  }, [citas, fechaSeleccionadaIso, boxFiltro])

  const agendarOActualizarCita = useCallback((citaData) => {
    // Validar disponibilidad de Box
    const disponible = verificarDisponibilidadBox(
      citas,
      citaData.boxId,
      citaData.fechaIso,
      citaData.horaInicio,
      citaData.id
    )

    if (!disponible && citaData.estado !== 'Bloqueo') {
      const confirmar = window.confirm('⚠️ ADVERTENCIA: El Box o Sillón seleccionado ya tiene una cita agendada en ese rango. ¿Deseas agendar de todas formas?')
      if (!confirmar) return false
    }

    setCitas(prev => {
      let actualizadas = []
      const existe = prev.some(c => String(c.id) === String(citaData.id))

      if (existe) {
        actualizadas = prev.map(c => String(c.id) === String(citaData.id) ? { ...c, ...citaData } : c)
      } else {
        actualizadas = [citaData, ...prev]
      }

      agendaStorageService.guardarCitas(actualizadas)
      return actualizadas
    })

    return true
  }, [citas])

  const cambiarEstadoCita = useCallback((idCita, nuevoEstado) => {
    setCitas(prev => {
      const actualizadas = prev.map(c => {
        if (String(c.id) === String(idCita)) {
          const actualiz = { ...c, estado: nuevoEstado }
          if (nuevoEstado === 'EnEspera' && !c.horaLlegadaEspera) {
            actualiz.horaLlegadaEspera = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
          }
          return actualiz
        }
        return c
      })
      agendaStorageService.guardarCitas(actualizadas)
      return actualizadas
    })
  }, [])

  const eliminarCita = useCallback((idCita) => {
    if (window.confirm('¿Estás seguro de cancelar/eliminar esta cita agendada?')) {
      setCitas(prev => {
        const actualizadas = prev.filter(c => String(c.id) !== String(idCita))
        agendaStorageService.guardarCitas(actualizadas)
        return actualizadas
      })
    }
  }, [])

  return {
    citas: citasFiltradas,
    resumen,
    fechaSeleccionadaIso,
    setFechaSeleccionadaIso,
    boxFiltro,
    setBoxFiltro,
    agendarOActualizarCita,
    cambiarEstadoCita,
    eliminarCita
  }
}