/**
 * Servicio de consolidación de datos cruzados para reportes BI
 *
 * F7-36 FASE 1 (Commit 1.5f): Reescrito para usar servicios públicos
 * en lugar de leer localStorage directo. Esto:
 *   1. Corrige bug silencioso: las claves legacy studio_dental_* ya fueron
 *      migradas a tenant-aware en commits 1.5b y 1.5c
 *   2. Hereda automáticamente el aislamiento multi-tenant de los servicios
 *   3. Reduce acoplamiento: si cambia la lógica interna de un servicio,
 *      reportesStorageService se actualiza solo
 *
 * Fuente única de verdad: cada storage service es dueño de sus claves.
 */

import { pacientesStorageService } from '../../pacientes/services/pacientesStorageService'
import { pagosStorageService } from '../../pagos/services/pagosStorageService'
import { presupuestosStorageService } from '../../presupuestos/services/presupuestosStorageService'
import { agendaStorageService } from '../../agenda/services/agendaStorageService'
import { createLogger } from '../../../services/logger.js'

const log = createLogger('reportesStorageService')

export const reportesStorageService = {
  /**
   * Obtiene datos consolidados de las 4 fuentes principales para reportes BI.
   * Usa los servicios públicos (tenant-aware) en lugar de leer localStorage directo.
   *
   * @returns {Object} { pacientes, pagos, presupuestos, citas }
   */
  obtenerDatosConsolidados: () => {
    try {
      return {
        pacientes: pacientesStorageService.obtenerPacientes(),
        pagos: pagosStorageService.obtenerPagos(),
        presupuestos: presupuestosStorageService.obtenerPresupuestos(),
        citas: agendaStorageService.obtenerCitas(),
      }
    } catch (e) {
      log.error('Error al obtener datos consolidados para BI:', e)
      return { pacientes: [], pagos: [], presupuestos: [], citas: [] }
    }
  },
}
