import { useState, useMemo } from 'react'
import { reportesStorageService } from '../services/reportesStorageService'
import { calcularEstadisticasAvanzadas } from '../utils/reportesCalculations'

export const useReportes = (pacientesProps = []) => {
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState('este_mes')

  const datosConsolidados = useMemo(() => {
    const loc = reportesStorageService.obtenerDatosConsolidados()
    return {
      pacientes: pacientesProps.length > 0 ? pacientesProps : loc.pacientes,
      pagos: loc.pagos,
      presupuestos: loc.presupuestos,
      citas: loc.citas
    }
  }, [pacientesProps])

  const metricas = useMemo(() => {
    return calcularEstadisticasAvanzadas(
      datosConsolidados.pacientes,
      datosConsolidados.pagos,
      datosConsolidados.presupuestos,
      datosConsolidados.citas
    )
  }, [datosConsolidados])

  return {
    periodoSeleccionado,
    setPeriodoSeleccionado,
    metricas
  }
}