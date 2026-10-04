import { useState, useEffect, useCallback } from 'react'
import type React from 'react'
import { agendaStorageService } from '../services/agendaStorageService'
import { generarCitasRecurrencia } from '../../../../utils/recurrenciaUtils'
import { pacientesStorageService } from '../../../../modules/pacientes/services/pacientesStorageService'
import { usePacientesStore } from '../../../../store/pacientesStore'
import { obtenerFechaLocalISO } from '../../../../utils/dateUtils'
import { useWhatsAppConfirmacion, type CitaWhatsAppRef } from './useWhatsAppConfirmacion'
import type { Cita } from '../schemas/citaSchema'
import type { Paciente } from '../../../../modules/pacientes/schemas/pacienteSchema'

export interface UseAgendaReturn {
  citas: Cita[]
  pacientes: Paciente[]
  vista: string
  setVista: (vista: string) => void
  fechaSeleccionada: string
  setFechaSeleccionada: (fecha: string) => void
  boxFiltro: string
  setBoxFiltro: (box: string) => void
  doctorFiltro: string
  setDoctorFiltro: (doc: string) => void
  irAHoy: () => void
  modalNuevaCitaAbierto: boolean
  setModalNuevaCitaAbierto: React.Dispatch<React.SetStateAction<boolean>>
  modalNuevoBloqueoAbierto: boolean
  setModalNuevoBloqueoAbierto: React.Dispatch<React.SetStateAction<boolean>>
  guardarCita: (nuevaCita: Cita | (CitaWhatsAppRef & { id: string | number; fecha: string; horaInicio: string; estado: string }), crearFichaSiExpress?: boolean) => void
  eliminarCita: (citaId: string | number) => void
  cambiarEstadoCita: (citaId: string | number, nuevoEstado: string) => void
  enviarWhatsAppConfirmacion: (cita: Cita | CitaWhatsAppRef) => Promise<void>
}

export const useAgenda = (pacientesProp: Paciente[] | null = null): UseAgendaReturn => {
  const [citas, setCitas] = useState<Cita[]>([])
  const [pacientes, setPacientes] = useState<Paciente[]>(pacientesProp || [])
  const [vista, setVista] = useState<string>('box')
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>(
    obtenerFechaLocalISO()
  )
  const [boxFiltro, setBoxFiltro] = useState<string>('Todos')
  const [doctorFiltro, setDoctorFiltro] = useState<string>('Todos')
  const [modalNuevaCitaAbierto, setModalNuevaCitaAbierto] = useState<boolean>(false)
  const [modalNuevoBloqueoAbierto, setModalNuevoBloqueoAbierto] = useState<boolean>(false)

  // Cargar citas y pacientes de forma reactiva
  const cargarDatos = useCallback((): void => {
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

  const irAHoy = useCallback((): void => {
    setFechaSeleccionada(obtenerFechaLocalISO())
  }, [])

  // Guardar cita + auto-creación de ficha clínica si es registro Express
  const guardarCita = useCallback((nuevaCita: Cita | (CitaWhatsAppRef & { id: string | number; fecha: string; horaInicio: string; estado: string }), crearFichaSiExpress: boolean = false): void => {
    let pacienteFinalId = nuevaCita.pacienteId

    if (crearFichaSiExpress && (!nuevaCita.pacienteId || String(nuevaCita.pacienteId).startsWith('express_'))) {
      const nuevoPacienteObj: Paciente = {
        id: Date.now(),
        nombre: (nuevaCita.pacienteNombre as string) || 'Paciente Express',
        telefono: String(nuevaCita.pacienteTelefono || ''),
        rut: String(nuevaCita.pacienteRut || ''),
        email: '',
        prevision: 'Particular',
        alergias: '',
        motivoConsulta: (nuevaCita.trataMiento as string) || 'Agendado desde Agenda Multi-Box',
        fechaIngreso: obtenerFechaLocalISO()
      } as unknown as Paciente

      // (F2-02b) — pasar por el store global
      const pacientesActualesGlobal = (usePacientesStore.getState() as { pacientes: Paciente[] }).pacientes
      const pacientesActualizados = [nuevoPacienteObj, ...pacientesActualesGlobal]

      ;(usePacientesStore.getState() as { setPacientes: (p: Paciente[]) => void }).setPacientes(pacientesActualizados)
      setPacientes(pacientesActualizados)

      pacienteFinalId = nuevoPacienteObj.id
    }

    const citaAjustada = { ...nuevaCita, pacienteId: pacienteFinalId } as Cita

    setCitas(prev => {
      const existe = prev.some(c => c.id === citaAjustada.id)
      // F7-27: Generar citas recurrentes si aplica
      const citasRecurrencia = (!existe && citaAjustada.recurrencia && citaAjustada.recurrencia !== 'ninguna')
        ? (generarCitasRecurrencia(citaAjustada, 10) as unknown as Cita[])
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

  const eliminarCita = useCallback((citaId: string | number): void => {
    setCitas(prev => {
      const actualizadas = prev.filter(c => c.id !== citaId)
      if (agendaStorageService?.eliminarCita) {
        agendaStorageService.eliminarCita(citaId)
      } else if (agendaStorageService?.guardarCitas) {
        agendaStorageService.guardarCitas(actualizadas)
      }
      return actualizadas
    })
  }, [])

  const cambiarEstadoCita = useCallback((citaId: string | number, nuevoEstado: string): void => {
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
