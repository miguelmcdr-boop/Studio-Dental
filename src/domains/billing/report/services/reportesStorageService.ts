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

import { pacientesStorageService } from '../../../../modules/pacientes/services/pacientesStorageService'
import { pagosStorageService } from '../../../../modules/pagos/services/pagosStorageService'
import { presupuestosStorageService } from '../../../../modules/presupuestos/services/presupuestosStorageService'
import { agendaStorageService } from '../../../../modules/agenda/services/agendaStorageService'
import { createLogger } from '../../../../services/logger'
import type { Paciente } from '../../../../modules/pacientes/schemas/pacienteSchema'
import type { Cita } from '../../../../modules/agenda/schemas/citaSchema'
import type { Presupuesto } from '../../../../modules/presupuestos/schemas/presupuestoSchema'

const log = createLogger('reportesStorageService')

export interface DatosConsolidadosBI {
  pacientes: Paciente[]
  pagos: ReturnType<typeof pagosStorageService.obtenerPagos>
  presupuestos: Presupuesto[]
  citas: Cita[]
}

export const reportesStorageService = {
  /**
   * Obtiene datos consolidados de las 4 fuentes principales para reportes BI.
   * Usa los servicios públicos (tenant-aware) en lugar de leer localStorage directo.
   */
  obtenerDatosConsolidados: (): DatosConsolidadosBI => {
    try {
      return {
        pacientes: pacientesStorageService.obtenerPacientes() as Paciente[],
        pagos: pagosStorageService.obtenerPagos(),
        presupuestos: presupuestosStorageService.obtenerPresupuestos() as Presupuesto[],
        citas: agendaStorageService.obtenerCitas() as Cita[],
      }
    } catch (e: unknown) {
      log.error('Error al obtener datos consolidados para BI:', e)
      return { pacientes: [], pagos: [], presupuestos: [], citas: [] }
    }
  },
}
