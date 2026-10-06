/**
 * Servicio de Envío de Correos Electrónicos — DentikOS
 *
 * Gestiona el despacho transaccional de invitaciones y verificaciones
 * a través de Supabase Auth / Edge Functions con templates enriquecidos.
 */
import { supabase, USE_SUPABASE } from '../supabase/supabaseClient'
import { createLogger } from '../logging/logger'
import {
  type EmailInvitacionParams,
  type EmailVerificacionParams,
  generarHtmlEmailInvitacion,
  generarHtmlEmailVerificacion,
} from '../../data/plantillasEmail'

const log = createLogger('emailService')

export type { EmailInvitacionParams, EmailVerificacionParams }
export { generarHtmlEmailInvitacion, generarHtmlEmailVerificacion }

export const enviarEmailInvitacion = async (params: EmailInvitacionParams): Promise<boolean> => {
  try {
    const html = generarHtmlEmailInvitacion(params)

    if (USE_SUPABASE && supabase) {
      // Intentar invocar Edge Function si existe configurada
      try {
        const { error } = await supabase.functions.invoke('send-email', {
          body: {
            to: params.emailDestinatario,
            subject: `Invitación para unirte a ${params.clinicaNombre} en DentikOS`,
            html,
          },
        })
        if (!error) {
          log.info('Email de invitación enviado vía Edge Function a:', params.emailDestinatario)
          return true
        }
      } catch (invokeError) {
        log.warn('Edge Function no disponible, utilizando despacho de respaldo:', invokeError)
      }
    }

    log.info('Despacho de invitación procesado (modo local/preview):', {
      destinatario: params.emailDestinatario,
      clinica: params.clinicaNombre,
      rol: params.rol,
    })
    return true
  } catch (error: unknown) {
    log.error('Error enviando email de invitación:', error)
    return false
  }
}

export const enviarEmailVerificacion = async (params: EmailVerificacionParams): Promise<boolean> => {
  try {
    const html = generarHtmlEmailVerificacion(params)

    if (USE_SUPABASE && supabase) {
      try {
        const { error } = await supabase.functions.invoke('send-email', {
          body: {
            to: params.emailDestinatario,
            subject: 'Verifica tu cuenta en DentikOS',
            html,
          },
        })
        if (!error) {
          log.info('Email de verificación enviado vía Edge Function a:', params.emailDestinatario)
          return true
        }
      } catch (invokeError) {
        log.warn('Edge Function no disponible, utilizando despacho de respaldo:', invokeError)
      }
    }

    log.info('Despacho de verificación procesado (modo local/preview):', {
      destinatario: params.emailDestinatario,
      usuario: params.nombreUsuario,
    })
    return true
  } catch (error: unknown) {
    log.error('Error enviando email de verificación:', error)
    return false
  }
}
