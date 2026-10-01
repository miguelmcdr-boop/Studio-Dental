import { useState, useEffect, useCallback } from 'react'
import { agendaStorageService } from '../services/agendaStorageService'
import { generarCitasRecurrencia } from '../../../utils/recurrenciaUtils'
import { pacientesStorageService } from '../../pacientes/services/pacientesStorageService'
import { usePacientesStore } from '../../../store/pacientesStore'
import { obtenerFechaLocalISO } from '../../../utils/dateUtils'
import { useWhatsAppConfirmacion } from './useWhatsAppConfirmacion'

export const useAgenda = (pacientesProp = null) => {
  const [citas, setCitas] = useState([])
  const [pacientes, setPacientes] = useState(pacientesProp || [])
  const [vista, setVista] = useState('box')
  const [fechaSeleccionada, setFechaSeleccionada] = useState(
    obtenerFechaLocalISO()
  )
  const [boxFiltro, setBoxFiltro] = useState('Todos')
  const [doctorFiltro, setDoctorFiltro] = useState('Todos')
  const [modalNuevaCitaAbierto, setModalNuevaCitaAbierto] = useState(false)
  const [modalNuevoBloqueoAbierto, setModalNuevoBloqueoAbierto] = useState(false)

  // Cargar citas y pacientes de forma reactiva
  const cargarDatos = useCallback(() => {
    const citasGuardadas = agendaStorageService?.obtenerCitas ? agendaStorageService.obtenerCitas() : []
    
    // Si App.jsx envió la lista por props, se priorizan las props
    const pacientesGuardados = pacientesProp || pacientesStorageService.obtenerPacientes()

    setCitas(citasGuardadas || [])
    setPacientes(pacientesGuardados || [])
  }, [pacientesProp])

  useEffect(() => {
    cargarDatos()
    window.addEventListener('storage', cargarDatos)
    return () => window.removeEventListener('storage', cargarDatos)
  }, [cargarDatos])

  useEffect(() => {
    if (pacientesProp) {
      setPacientes(pacientesProp)
    }
  }, [pacientesProp])

  const irAHoy = useCallback(() => {
    setFechaSeleccionada(obtenerFechaLocalISO())
  }, [])

  // Guardar cita + auto-creación de ficha clínica si es registro Express
  const guardarCita = useCallback((nuevaCita, crearFichaSiExpress = false) => {
    let pacienteFinalId = nuevaCita.pacienteId

    if (crearFichaSiExpress && (!nuevaCita.pacienteId || String(nuevaCita.pacienteId).startsWith('express_'))) {
      const nuevoPacienteObj = {
        id: Date.now(),
        nombre: nuevaCita.pacienteNombre,
        telefono: nuevaCita.pacienteTelefono || '',
        rut: nuevaCita.pacienteRut || '',
        email: '',
        prevision: 'Particular',
        alergias: '',
        motivoConsulta: nuevaCita.trataMiento || 'Agendado desde Agenda Multi-Box',
        fechaIngreso: obtenerFechaLocalISO()
      }

      // (F2-02b) — antes escribía directo a pacientesStorageService y a un
      // estado local aislado de este hook, sin pasar por el store global:
      // el paciente exprés no aparecía en el resto de la app (Directorio,
      // Dashboard) hasta refrescar la página. Ahora pasa por el store, que
      // persiste y notifica a todos los consumidores al instante.
      const pacientesActualesGlobal = usePacientesStore.getState().pacientes
      const pacientesActualizados = [nuevoPacienteObj, ...pacientesActualesGlobal]

      usePacientesStore.getState().setPacientes(pacientesActualizados)
      setPacientes(pacientesActualizados)

      pacienteFinalId = nuevoPacienteObj.id
    }

    const citaAjustada = { ...nuevaCita, pacienteId: pacienteFinalId }

    setCitas(prev => {
      const existe = prev.some(c => c.id === citaAjustada.id)
      // F7-27: Generar citas recurrentes si aplica
    const citasRecurrencia = (!existe && citaAjustada.recurrencia && citaAjustada.recurrencia !== 'ninguna')
      ? generarCitasRecurrencia(citaAjustada, 10)
      : []

    const actualizadas = existe
        ? prev.map(c => c.id === citaAjustada.id ? citaAjustada : c)
        : [...prev, citaAjustada, ...citasRecurrencia]
      
      if (agendaStorageService?.guardarCitas) {
        agendaStorageService.guardarCitas(actualizadas)
      }
      return actualizadas
    })

    setModalNuevaCitaAbierto(false)
    setModalNuevoBloqueoAbierto(false)
  }, [])

  const eliminarCita = useCallback((citaId) => {
    setCitas(prev => {
      const actualizadas = prev.filter(c => c.id !== citaId)
      if (agendaStorageService?.guardarCitas) {
        agendaStorageService.guardarCitas(actualizadas)
      }
      return actualizadas
    })
  }, [])

  const cambiarEstadoCita = useCallback((citaId, nuevoEstado) => {
    setCitas(prev => {
      const actualizadas = prev.map(c => {
        if (c.id === citaId) {
          return {
            ...c,
            estado: nuevoEstado,
            horaInicioAtencion: nuevoEstado === 'En Sillón' ? new Date().toISOString() : c.horaInicioAtencion
          }
        }
        return c
      })
      if (agendaStorageService?.guardarCitas) {
        agendaStorageService.guardarCitas(actualizadas)
      }
      return actualizadas
    })
  }, [])


  const { enviarWhatsAppConfirmacion } = useWhatsAppConfirmacion({
    pacientes,
    alCambiarEstado: cambiarEstadoCita,
  })

  return {
    citas,
    pacientes,
    vista,
    setVista,
    fechaSeleccionada,
    setFechaSeleccionada,
    boxFiltro,
    setBoxFiltro,
    doctorFiltro,
    setDoctorFiltro,
    irAHoy,
    modalNuevaCitaAbierto,
    setModalNuevaCitaAbierto,
    modalNuevoBloqueoAbierto,
    setModalNuevoBloqueoAbierto,
    guardarCita,
    eliminarCita,
    cambiarEstadoCita,
    enviarWhatsAppConfirmacion
  }
}