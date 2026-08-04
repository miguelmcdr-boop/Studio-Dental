import { useMemo } from 'react'
import { dashboardStorageService } from '../services/dashboardStorageService'
import { calcularResumenJornada } from '../utils/dashboardCalculations'

export const useDashboard = (pacientes = []) => {
  const datosLocales = useMemo(() => dashboardStorageService.obtenerDatosDashboard(), [])

  const resumen = useMemo(() => {
    return calcularResumenJornada(pacientes, datosLocales.citas, datosLocales.pagos)
  }, [pacientes, datosLocales])

  return {
    resumen
  }
}