/**
 * Servicio de consolidación de datos cruzados
 */

export const reportesStorageService = {
  obtenerDatosConsolidados: () => {
    try {
      const pacSaved = localStorage.getItem('clinica_lista_pacientes')
      const pagSaved = localStorage.getItem('studio_dental_pagos_historial_v3') || localStorage.getItem('studio_dental_pagos_historial')
      const presSaved = localStorage.getItem('studio_dental_presupuestos_globales')
      const citasSaved = localStorage.getItem('studio_dental_agenda_citas_v3')

      return {
        pacientes: pacSaved ? JSON.parse(pacSaved) : [],
        pagos: pagSaved ? JSON.parse(pagSaved) : [],
        presupuestos: presSaved ? JSON.parse(presSaved) : [],
        citas: citasSaved ? JSON.parse(citasSaved) : []
      }
    } catch (e) {
      console.error('Error al obtener datos consolidados para BI:', e)
      return { pacientes: [], pagos: [], presupuestos: [], citas: [] }
    }
  }
}