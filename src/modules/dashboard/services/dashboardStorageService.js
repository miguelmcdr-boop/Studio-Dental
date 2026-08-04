/**
 * Lectura de datos locales para el Dashboard
 */

export const dashboardStorageService = {
  obtenerDatosDashboard: () => {
    try {
      const citasSaved = localStorage.getItem('clinica_lista_citas')
      const pagosSaved = localStorage.getItem('studio_dental_pagos_historial_v3') || localStorage.getItem('studio_dental_pagos_historial')
      
      return {
        citas: citasSaved ? JSON.parse(citasSaved) : [],
        pagos: pagosSaved ? JSON.parse(pagosSaved) : []
      }
    } catch (e) {
      console.error('Error al leer datos para dashboard:', e)
      return { citas: [], pagos: [] }
    }
  }
}