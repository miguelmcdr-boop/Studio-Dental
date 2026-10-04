/**
 * Application Service: deletePatient (Fase 4B-2)
 *
 * Coordina la eliminación en cascada (soft delete) de un paciente y todos sus datos clínicos asociados:
 * 1. Validar permisos del usuario (RBAC)
 * 2. Eliminar evoluciones clínicas
 * 3. Eliminar recetas
 * 4. Eliminar certificados
 * 5. Eliminar consentimientos
 * 6. Eliminar adjuntos (Supabase Storage / R2 + IndexedDB)
 * 7. Eliminar odontograma
 * 8. Eliminar periodontograma
 * 9. Eliminar presupuestos y abonos
 * 10. Eliminar al paciente (soft delete en BD con trigger de auditoría)
 * 11. Registrar en audit log
 *
 * Consume EXCLUSIVAMENTE las APIs públicas de los dominios correspondientes.
 */
import { pacientesStorageService } from '../../domains/clinical/patient'
import { odontogramaStorageService } from '../../domains/clinical/odontogram'
import { periodontogramaStorageService } from '../../domains/specialty/perio'
import { presupuestosStorageService } from '../../domains/billing/budget'
import { eliminarAbonosDePaciente } from '../../domains/billing/payment'
import { eliminarTodosPorPaciente as eliminarAdjuntosDelPaciente } from '../../services/adjuntosStorageService'
import { puedeAcceder } from '../../services/rbacService'
import { PERMISOS } from '../../constants/rbacConstants'
import { createLogger } from '../../services/logger'

const log = createLogger('deletePatient')

export interface DeletePatientOptions {
  pacienteId: string | number
  userRole?: string | null
  userEmail?: string | null
}

export interface DeletePatientResult {
  success: boolean
  error?: string
  isUnexpected?: boolean
}

/**
 * Orquesta la eliminación en cascada de un paciente.
 */
export const deletePatient = async ({
  pacienteId,
  userRole,
  userEmail,
}: DeletePatientOptions): Promise<DeletePatientResult> => {
  if (!pacienteId) {
    return {
      success: false,
      error: 'ID de paciente inválido o no proporcionado.',
    }
  }

  // 1. Validar permisos del usuario si se especificó rol
  if (userRole && !puedeAcceder(userRole, PERMISOS.ELIMINAR_PACIENTES)) {
    log.warn(
      `[deletePatient] Usuario con rol "${userRole}" intentó eliminar paciente ${pacienteId} sin autorización.`
    )
    return {
      success: false,
      error: 'No tienes permisos suficientes para eliminar pacientes.',
    }
  }

  try {
    // 10. Eliminar al paciente (soft delete en Supabase/almacenamiento)
    const eliminado = await pacientesStorageService.eliminarPaciente(pacienteId)

    if (!eliminado) {
      log.error(`[deletePatient] Error al ejecutar soft delete del paciente ${pacienteId}`)
      return {
        success: false,
        error: 'No se pudo eliminar el paciente. Intenta nuevamente.',
      }
    }

    // 2-9. Limpieza en cascada de datos clínicos relacionados de la caché local y almacenamiento asociado
    try {
      // 2. Eliminar evoluciones clínicas
      pacientesStorageService.eliminarEvolucionesDePaciente(pacienteId)

      // 3. Eliminar recetas
      pacientesStorageService.eliminarRecetasDePaciente(pacienteId)

      // 4. Eliminar certificados
      pacientesStorageService.eliminarItem(`certificados_${pacienteId}`)

      // 5. Eliminar consentimientos
      pacientesStorageService.eliminarItem(`consentimientos_${pacienteId}`)

      // 7. Eliminar odontograma
      odontogramaStorageService.eliminarOdontogramasDePaciente(pacienteId)

      // 8. Eliminar periodontograma
      periodontogramaStorageService.eliminarDatosDePaciente(pacienteId)

      // 9. Eliminar presupuestos y abonos
      presupuestosStorageService.eliminarItemsDePaciente(pacienteId)
      eliminarAbonosDePaciente(pacienteId)

      // 6. Eliminar adjuntos (IndexedDB + Storage)
      eliminarAdjuntosDelPaciente(pacienteId).catch((e: unknown) => {
        log.error('[deletePatient] Error al eliminar adjuntos asociados:', e)
      })
    } catch (cleanupErr) {
      log.warn('[deletePatient] Advertencia durante limpieza de datos asociados:', cleanupErr)
    }

    // 11. Registrar en audit log
    log.info(
      `[AuditLog] [deletePatient] Paciente ${pacienteId} eliminado (soft delete) por ${userEmail || userRole || 'sistema'}`
    )

    return {
      success: true,
    }
  } catch (error) {
    log.error(`[deletePatient] Excepción durante eliminación del paciente ${pacienteId}:`, error)
    return {
      success: false,
      error: 'Error inesperado durante la eliminación del paciente.',
      isUnexpected: true,
    }
  }
}
