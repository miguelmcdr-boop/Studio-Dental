import { useState, useEffect, useCallback } from 'react'
import { agendaStorageService } from '../services/agendaStorageService'
import { pacientesStorageService } from '../../pacientes/services/pacientesStorageService'

export const useAgenda = () => {
  const [citas, setCitas] = useState([])
  const [pacientes, setPacientes] = useState([])
  const [vista, setVista] = useState('box')
  const [fechaSeleccionada, setFechaSeleccionada] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [modalNuevaCitaAbierto, setModalNuevaCitaAbierto] = useState(false)
  const [modalNuevoBloqueoAbierto, setModalNuevoBloqueoAbierto] = useState(false)

  // Cargar citas y la lista real de pacientes usando la clave 'pacientes_data'
  const cargarDatos = useCallback(() => {
    const citasGuardadas = agendaStorageService.obtenerCitas ? agendaStorageService.obtenerCitas() : []
    
    // Sincronización oficial con el módulo de Pacientes
    const pacientesGuardados = pacientesStorageService.obtenerItem
      ? pacientesStorageService.obtenerItem('pacientes_data', [])
      : []

    setCitas(citasGuardadas || [])
    setPacientes(pacientesGuardados || [])
  }, [])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  const irAHoy = useCallback(() => {
    setFechaSeleccionada(new Date().toISOString().split('T')[0])
  }, [])

  const guardarCita = useCallback((nuevaCita) => {
    setCitas(prev => {
      const existe = prev.some(c => c.id === nuevaCita.id)
      const actualizadas = existe
        ? prev.map(c => c.id === nuevaCita.id ? nuevaCita : c)
        : [...prev, nuevaCita]
      
      if (agendaStorageService.guardarCitas) {
        agendaStorageService.guardarCitas(actualizadas)
      }
      return actualizadas
    })
    setModalNuevaCitaAbierto(false)
    setModalNuevoBloqueoAbierto(false)
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
      if (agendaStorageService.guardarCitas) {
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
      alert(`⚠️ El/la paciente "${cita.pacienteNombre}" no tiene número de teléfono registrado en su ficha.`)
      return
    }

    if (numLimpio.length === 9 && numLimpio.startsWith('9')) {
      numLimpio = `56${numLimpio}`
    } else if (numLimpio.length === 8) {
      numLimpio = `569${numLimpio}`
    }

    const fechaTxt = cita.fecha ? new Date(cita.fecha + 'T00:00:00').toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' }) : 'su cita'
    const texto = `Hola ${cita.pacienteNombre}, te saludamos de Studio Dental. Confirmamos tu hora para el ${fechaTxt} a las ${cita.horaInicio} hrs en ${cita.boxAsignado || 'Sillón 1'}. Responde 'Confirmar' a este mensaje.`

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
    cambiarEstadoCita,
    enviarWhatsAppConfirmacion
  }
}