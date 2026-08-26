/**
 * Servicio de consolidación de datos cruzados
 */

import { pacientesStorageService } from '../../pacientes'
import { createLogger } from '../../../services/logger.js'

const log = createLogger('reportesStorageService')

export const reportesStorageService = {
  obtenerDatosConsolidados: () => {
    try {
      // Pacientes se lee vía el servicio dueño de esa clave (F1-05: fuente
      // única de verdad). Pagos/presupuestos/citas quedan pendientes del
      // mismo tratamiento en F2-07 (fuera del alcance de esta tarea).
      const pagSaved = localStorage.getItem('studio_dental_pagos_historial_v3') || localStorage.getItem('studio_dental_pagos_historial')
      const presSaved = localStorage.getItem('studio_dental_presupuestos_globales')
      const citasSaved = localStorage.getItem('studio_dental_agenda_citas_v3')

      return {
        pacientes: pacientesStorageService.obtenerPacientes(),
        pagos: pagSaved ? JSON.parse(pagSaved) : [],
        presupuestos: presSaved ? JSON.parse(presSaved) : [],
        citas: citasSaved ? JSON.parse(citasSaved) : []
      }
    } catch (e) {
      log.error('Error al obtener datos consolidados para BI:', e)
      return { pacientes: [], pagos: [], presupuestos: [], citas: [] }
    }
  }
}