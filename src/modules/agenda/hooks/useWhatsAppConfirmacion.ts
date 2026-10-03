/**
 * useWhatsAppConfirmacion — Hook para enviar confirmación por WhatsApp (F10-C3.3)
 *
 * Extraído de useAgenda.js para respetar el límite congelado de allowlist.
 *
 * Comportamiento:
 * - Obtiene el teléfono de la cita o del paciente asociado
 * - Si no hay teléfono → muestra <ConfirmDialog> warning y no abre WhatsApp
 * - Si hay teléfono → normaliza el número y abre wa.me en nueva pestaña
 * - Antes de abrir → cambia estado de la cita a "Confirmado" (vía callback)
 */
import { useCallback } from 'react'
import { useAppDialog } from '../../../hooks/useAppDialog'
import type { Cita } from '../schemas/citaSchema'
import type { Paciente } from '../../pacientes/schemas/pacienteSchema'

export interface CitaWhatsAppRef {
  id?: string | number
  fecha?: string
  horaInicio?: string
  boxAsignado?: string
  pacienteId?: string | number
  pacienteNombre?: string
  pacienteTelefono?: string | number
  telefono?: string | number
  [key: string]: unknown
}

export interface UseWhatsAppConfirmacionOptions {
  pacientes?: Paciente[]
  alCambiarEstado?: (citaId: string | number, nuevoEstado: string) => void
}

export interface UseWhatsAppConfirmacionReturn {
  enviarWhatsAppConfirmacion: (cita: Cita | CitaWhatsAppRef) => Promise<void>
}

export const useWhatsAppConfirmacion = ({
  pacientes = [],
  alCambiarEstado
}: UseWhatsAppConfirmacionOptions = {}): UseWhatsAppConfirmacionReturn => {
  const { alert: dialogAlert } = useAppDialog()

  const enviarWhatsAppConfirmacion = useCallback(async (cita?: Cita | CitaWhatsAppRef | null): Promise<void> => {
    if (!cita) return

    let telefonoRaw = (cita as CitaWhatsAppRef).pacienteTelefono || (cita as CitaWhatsAppRef).telefono || ''

    if (!telefonoRaw && cita.pacienteId) {
      const pEncontrado = pacientes.find(p => String(p.id) === String(cita.pacienteId))
      if (pEncontrado?.telefono) {
        telefonoRaw = pEncontrado.telefono
      }
    }

    let numLimpio = String(telefonoRaw).replace(/\D/g, '')

    if (!numLimpio) {
      await dialogAlert({
        title: 'Sin teléfono registrado',
        description: `El/la paciente "${cita.pacienteNombre || 'Desconocido'}" no tiene número de teléfono registrado.`,
        variant: 'warning',
        confirmText: 'Entendido'
      })
      return
    }

    if (numLimpio.length === 9 && numLimpio.startsWith('9')) {
      numLimpio = `56${numLimpio}`
    } else if (numLimpio.length === 8) {
      numLimpio = `569${numLimpio}`
    }

    // Cambiar estado a Confirmado antes de abrir WhatsApp
    if (alCambiarEstado && cita.id !== undefined) {
      alCambiarEstado(cita.id, 'Confirmado')
    }

    const fechaTxt = cita.fecha ? new Date(cita.fecha + 'T00:00:00').toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' }) : 'su cita'
    const mensaje = `Hola ${cita.pacienteNombre || 'Paciente'}, te saludamos de DentikOS. Confirmamos tu hora para el ${fechaTxt} a las ${cita.horaInicio || ''} hrs en ${cita.boxAsignado || 'Sillón 1'}. Por favor responde 'Confirmar' a este mensaje.`
    const url = `https://wa.me/${numLimpio}?text=${encodeURIComponent(mensaje)}`
    window.open(url, '_blank')
  }, [pacientes, alCambiarEstado, dialogAlert])

  return { enviarWhatsAppConfirmacion }
}
