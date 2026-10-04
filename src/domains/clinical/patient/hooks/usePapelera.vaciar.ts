import { useCallback, useMemo } from 'react'
import { pacientesStorageService } from '../services/pacientesStorageService'
import type { PurgeResult } from '../services/pacientesSoftDeleteService'
import { notificationService } from '../../../../services/notificationService'
import { createLogger } from '../../../../services/logger'

const log = createLogger('usePapelera.vaciar')

/**
 * Retención legal de fichas clínicas (Ley 20.584 de Chile).
 * Los pacientes solo pueden purgarse después de 10 años de su eliminación.
 */
export const ANIOS_RETENCION = 10

export interface PacienteEliminado {
  id: string | number
  nombre?: string
  rut?: string
  deleted_at?: string | null
  eliminadoPor?: string
  [key: string]: unknown
}

export interface UsePapeleraVaciarReturn {
  elegibles: PacienteEliminado[]
  contadorElegibles: number
  aniosRetencion: number
  vaciar: (pacienteIds?: (string | number)[]) => Promise<PurgeResult>
}

/**
 * Hook dedicado a la purga de pacientes (Feature 1).
 *
 * Responsabilidades:
 * - Calcular pacientes elegibles para purga (10+ años en papelera)
 * - Ejecutar purga vía pacientesStorageService.vaciarPapeleraPacientes
 * - Refrescar papelera y directorio tras purgar
 *
 * @param pacientesEliminados - Lista completa de pacientes en papelera
 * @param cargarPapelera - Recarga lista de papelera
 * @param refrescarPacientes - Recarga directorio de pacientes activos
 */
export const usePapeleraVaciar = (
  pacientesEliminados: PacienteEliminado[],
  cargarPapelera: () => Promise<void> | void,
  refrescarPacientes: () => Promise<void> | void
): UsePapeleraVaciarReturn => {
  // Calcular pacientes elegibles (eliminados hace 10+ años)
  const elegibles = useMemo(() => {
    const ahora = new Date()
    const limite = new Date()
    limite.setFullYear(ahora.getFullYear() - ANIOS_RETENCION)

    return (pacientesEliminados || []).filter((p) => {
      if (!p.deleted_at) return false
      return new Date(p.deleted_at) <= limite
    })
  }, [pacientesEliminados])

  /**
   * Purga pacientes elegibles de forma permanente.
   * @param [pacienteIds] - Lista específica a purgar (opcional)
   * @returns {Promise<PurgeResult>} { purgados, rechazados, error }
   */
  const vaciar = useCallback(async (pacienteIds: (string | number)[] = []): Promise<PurgeResult> => {
    try {
      const ids = pacienteIds.length > 0 
        ? pacienteIds.map(String)
        : elegibles.map((p) => String(p.id))

      if (ids.length === 0) {
        notificationService.error('No hay pacientes elegibles para purgar', { 
          titulo: 'Sin datos' 
        })
        return { purgados: [], rechazados: [] }
      }

      const resultado = await pacientesStorageService.vaciarPapeleraPacientes(ids)

      if (resultado.error) {
        notificationService.error(resultado.error, { titulo: 'Error al vaciar papelera' })
        return resultado
      }

      if (resultado.purgados.length > 0) {
        notificationService.success(
          `${resultado.purgados.length} paciente(s) eliminados permanentemente`, 
          { titulo: 'Papelera vaciada' }
        )
      }

      if (resultado.rechazados.length > 0) {
        log.warn('Pacientes rechazados en purga:', resultado.rechazados)
      }

      await cargarPapelera()
      await refrescarPacientes()

      return resultado
    } catch (error) {
      const err = error as Error
      log.error('Error inesperado al vaciar papelera:', err)
      notificationService.error('Error inesperado al vaciar', { titulo: 'Error' })
      return { purgados: [], rechazados: [], error: err.message }
    }
  }, [elegibles, cargarPapelera, refrescarPacientes])

  return {
    elegibles,
    contadorElegibles: elegibles.length,
    aniosRetencion: ANIOS_RETENCION,
    vaciar,
  }
}
