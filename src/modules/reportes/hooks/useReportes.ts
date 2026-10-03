import { useState, useMemo } from 'react'
import {
  reportesStorageService,
  type DatosConsolidadosBI
} from '../services/reportesStorageService'
import { calcularEstadisticasAvanzadas } from '../utils/reportesCalculations'
import type { Paciente } from '../../pacientes/schemas/pacienteSchema'

export interface MetricasReportes {
  totalPacientes: number
  totalRecaudado: number
  totalPresupuestado: number
  totalProcedimientos: number
  tasaConversionPresupuestos: number
  ticketPromedio: number
  topPrestaciones: { nombre: string; cantidad: number; montoTotal: number; [key: string]: unknown }[]
  desgloseEspecialidad: Record<string, number>
  recaudacionPorMetodo: Record<string, number>
  [key: string]: unknown
}

export interface UseReportesReturn {
  periodoSeleccionado: string
  setPeriodoSeleccionado: React.Dispatch<React.SetStateAction<string>>
  metricas: MetricasReportes
}

export const useReportes = (
  pacientesProps: (Paciente | { id: string | number; [key: string]: unknown })[] = []
): UseReportesReturn => {
  const [periodoSeleccionado, setPeriodoSeleccionado] =
    useState<string>('este_mes')

  const datosConsolidados = useMemo<DatosConsolidadosBI>(() => {
    const loc = reportesStorageService.obtenerDatosConsolidados()
    return {
      pacientes:
        pacientesProps.length > 0
          ? (pacientesProps as Paciente[])
          : loc.pacientes,
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
    ) as MetricasReportes
  }, [datosConsolidados])

  return {
    periodoSeleccionado,
    setPeriodoSeleccionado,
    metricas
  }
}
