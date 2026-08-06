import { useState, useEffect, useCallback } from 'react'
import { agendaStorageService } from '../services/agendaStorageService'
import { pacientesStorageService } from '../../pacientes/services/pacientesStorageService'
import { obtenerFechaLocalISO } from '../../../utils/dateUtils'

export const useAgenda = (pacientesProp = null) => {
  const [citas, setCitas] = useState([])
  const [pacientes, setPacientes] = useState(pacientesProp || [])
  const [vista, setVista] = useState('box')
  const [fechaSeleccionada, setFechaSeleccionada] = useState(
    obtenerFechaLocalISO()
  )
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

      const pacientesActuales = pacientesStorageService.obtenerPacientes()
      const pacientesActualizados = [nuevoPacienteObj, ...pacientesActuales]

      pacientesStorageService.guardarPacientes(pacientesActualizados)
      setPacientes(pacientesActualizados)

      pacienteFinalId = nuevoPacienteObj.id
    }

    const citaAjustada = { ...nuevaCita, pacienteId: pacienteFinalId }

    setCitas(prev => {
      const existe = prev.some(c => c.id === citaAjustada.id)
      const actualizadas = existe
        ? prev.map(c => c.id === citaAjustada.id ? citaAjustada : c)
        : [...prev, citaAjustada]
      
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

  const enviarWhatsAppConfirmacion = useCallback((cita) => {
    if (!cita) return

    let telefonoRaw = cita.pacienteTelefono || cita.telefono || ''

    if (!telefonoRaw && cita.pacienteId) {
      const pEncontrado = pacientes.find(p => String(p.id) === String(cita.pacienteId))
      if (pEncontrado?.telefono) {
        telefonoRaw = pEncontrado.telefono
      }
    }

    let numLimpio = String(telefonoRaw).replace(/\D/g, '')

    if (!numLimpio) {
      alert(`⚠️ El/la paciente "${cita.pacienteNombre}" no tiene número de teléfono registrado.`)
      return
    }

    if (numLimpio.length === 9 && numLimpio.startsWith('9')) {
      numLimpio = `56${numLimpio}`
    } else if (numLimpio.length === 8) {
      numLimpio = `569${numLimpio}`
    }

    const fechaTxt = cita.fecha ? new Date(cita.fecha + 'T00:00:00').toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' }) : 'su cita'
    const texto = `Hola ${cita.pacienteNombre}, te saludamos de Studio Dental. Confirmamos tu hora para el ${fechaTxt} a las ${cita.horaInicio} hrs en ${cita.boxAsignado || 'Sillón 1'}. Por favor responde 'Confirmar' a este mensaje.`

    cambiarEstadoCita(cita.id, 'Confirmado')
    window.open(`https://wa.me/${numLimpio}?text=${encodeURIComponent(texto)}`, '_blank', 'noopener,noreferrer')
  }, [pacientes, cambiarEstadoCita])

  return {
    citas,
    pacientes,
    vista,
    setVista,
    fechaSeleccionada,
    setFechaSeleccionada,
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