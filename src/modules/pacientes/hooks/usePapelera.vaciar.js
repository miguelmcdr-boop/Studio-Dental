import { useCallback, useMemo } from 'react'
import { pacientesStorageService } from '../services/pacientesStorageService'
import { notificationService } from '../../../services/notificationService'
import { createLogger } from '../../../services/logger.js'

const log = createLogger('usePapelera.vaciar')

/**
 * Retención legal de fichas clínicas (Ley 20.584 de Chile).
 * Los pacientes solo pueden purgarse después de 10 años de su eliminación.
 */
const ANIOS_RETENCION = 10

/**
 * Hook dedicado a la purga de pacientes (Feature 1).
 *
 * Responsabilidades:
 * - Calcular pacientes elegibles para purga (10+ años en papelera)
 * - Ejecutar purga vía pacientesStorageService.vaciarPapeleraPacientes
 * - Refrescar papelera y directorio tras purgar
 *
 * @param {Array} pacientesEliminados - Lista completa de pacientes en papelera
 * @param {Function} cargarPapelera - Recarga lista de papelera
 * @param {Function} refrescarPacientes - Recarga directorio de pacientes activos
 */
export const usePapeleraVaciar = (pacientesEliminados, cargarPapelera, refrescarPacientes) => {
  // Calcular pacientes elegibles (eliminados hace 10+ años)
  const elegibles = useMemo(() => {
    const ahora = new Date()
    const limite = new Date()
    limite.setFullYear(ahora.getFullYear() - ANIOS_RETENCION)

    return pacientesEliminados.filter((p) => {
      if (!p.deleted_at) return false
      return new Date(p.deleted_at) <= limite
    })
  }, [pacientesEliminados])

  /**
   * Purga pacientes elegibles de forma permanente.
   * @param {Array<string>} [pacienteIds] - Lista específica a purgar (opcional)
   * @returns {Promise<Object>} { purgados, rechazados, error }
   */
  const vaciar = useCallback(async (pacienteIds = []) => {
    try {
      const ids = pacienteIds.length > 0 
        ? pacienteIds 
        : elegibles.map((p) => p.id)

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
      log.error('Error inesperado al vaciar papelera:', error)
      notificationService.error('Error inesperado al vaciar', { titulo: 'Error' })
      return { purgados: [], rechazados: [], error: error.message }
    }
  }, [elegibles, cargarPapelera, refrescarPacientes])

  return {
    elegibles,
    contadorElegibles: elegibles.length,
    aniosRetencion: ANIOS_RETENCION,
    vaciar,
  }
}
