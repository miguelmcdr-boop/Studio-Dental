import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  calcularResumenJornada,
  calcularMetricasAvanzadas
} from '../utils/dashboardCalculations'
import { agendaStorageService } from '../../agenda'
import { pagosStorageService } from '../../pagos/services/pagosStorageService'
import { obtenerAbonosPorPaciente } from '../../pagos/services/pagosAbonosLegacyService'
import { presupuestosStorageService } from '../../presupuestos/services/presupuestosStorageService'
import { createLogger } from '../../../services/logger'
import type { Paciente } from '../../pacientes/schemas/pacienteSchema'
import type { Cita } from '../../agenda/schemas/citaSchema'
import type { Pago } from '../../pagos/services/pagosStorageService'
import type { PresupuestoLocal } from '../../presupuestos/services/presupuestosStorageService'

const log = createLogger('useDashboard')

export interface ResumenJornada {
  totalPacientes: number
  citasHoyCount: number
  recaudacionHoy: number
  citasHoy: Cita[]
  enEspera: Cita[]
  enAtencion: Cita[]
  finalizadas: Cita[]
  tasaOcupacionAgenda: number
  montoTotalCotizado: number
  montoTotalAceptado: number
  tasaConversionPresupuestos: number
  proyeccionMensual: number
}

export interface TendenciaCita {
  fecha: string
  citas: number
}

export interface MetricasAvanzadasDashboard {
  tendenciaCitas7Dias: TendenciaCita[]
  tendenciaCitas30Dias: TendenciaCita[]
  alertas: unknown
  tareas: unknown
}

export interface UseDashboardReturn {
  resumen: ResumenJornada
  metricasAvanzadas: MetricasAvanzadasDashboard
  refrescar: () => void
}

export const useDashboard = (
  pacientes: (Paciente | { id: string | number; [key: string]: unknown })[] = []
): UseDashboardReturn => {
  const [citas, setCitas] = useState<Cita[]>([])
  const [pagos, setPagos] = useState<Pago[]>([])
  const [presupuestos, setPresupuestos] = useState<PresupuestoLocal[]>([])
  const [evoluciones] = useState<unknown[]>([])
  const [recetas] = useState<unknown[]>([])
  const [certificados] = useState<unknown[]>([])

  const cargarDatos = useCallback(() => {
    try {
      // Cargar datos desde servicios (F2-07a)
      const citasStorage = agendaStorageService.obtenerCitas([])
      const pagosStorage = pagosStorageService.obtenerPagos([])
      const presupuestosStorage =
        presupuestosStorageService.obtenerPresupuestos([])

      // Recolectar abonos de presupuestos individuales para sumar a pagos (vía pagosStorageService, F2-07a)
      const abonosGlobales: Pago[] = []
      pacientes.forEach(p => {
        const abonosPac = obtenerAbonosPorPaciente(p.id)
        if (Array.isArray(abonosPac)) {
          abonosPac.forEach(a => abonosGlobales.push(a as unknown as Pago))
        }
      })

      setCitas(Array.isArray(citasStorage) ? citasStorage : [])
      setPagos([
        ...(Array.isArray(pagosStorage) ? pagosStorage : []),
        ...abonosGlobales
      ])
      setPresupuestos(
        Array.isArray(presupuestosStorage) ? presupuestosStorage : []
      )
    } catch (e) {
      log.error('Error al cargar datos en Dashboard:', e)
    }
  }, [pacientes])

  useEffect(() => {
    cargarDatos()

    window.addEventListener('storage', cargarDatos)
    window.addEventListener('arancel_actualizado', cargarDatos)
    return () => {
      window.removeEventListener('storage', cargarDatos)
      window.removeEventListener('arancel_actualizado', cargarDatos)
    }
  }, [cargarDatos])

  const resumen = useMemo(() => {
    return calcularResumenJornada(
      pacientes,
      citas,
      pagos,
      presupuestos
    ) as ResumenJornada
  }, [pacientes, citas, pagos, presupuestos])

  const metricasAvanzadas = useMemo(() => {
    return calcularMetricasAvanzadas(
      citas,
      pagos,
      presupuestos,
      evoluciones,
      recetas,
      certificados
    ) as MetricasAvanzadasDashboard
  }, [citas, pagos, presupuestos, evoluciones, recetas, certificados])

  return {
    resumen,
    metricasAvanzadas,
    refrescar: cargarDatos
  }
}
