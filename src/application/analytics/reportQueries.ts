/**
 * Application Service: reportQueries (Fase 4A-3)
 *
 * Centraliza las consultas de reportes y Business Intelligence (BI),
 * desacoplando el dominio billing/report de las dependencias cruzadas con
 * Pacientes, Agenda, Pagos y Presupuestos.
 * Consume EXCLUSIVAMENTE las APIs públicas de cada dominio.
 */
import {
  pacientesStorageService,
  type Paciente,
} from '../../domains/clinical/patient'
import {
  agendaStorageService,
  type Cita,
} from '../../domains/operations/agenda'
import {
  pagosStorageService,
  type Pago,
} from '../../domains/billing/payment'
import {
  presupuestosStorageService,
  type PresupuestoLocal,
} from '../../domains/billing/budget'

export interface DatosReportesConsolidados {
  pacientes: Paciente[]
  pagos: Pago[]
  presupuestos: PresupuestoLocal[]
  citas: Cita[]
}

export interface ProductividadProfesional {
  profesional: string
  totalCitas: number
  citasCompletadas: number
  montoGenerado: number
}

export interface ItemRankingPrestacion {
  nombre: string
  cantidad: number
  montoTotal: number
  especialidad?: string
}

export interface IngresosPeriodoResumen {
  fechaInicio?: string
  fechaFin?: string
  totalRecaudado: number
  desglosePorMetodo: Record<string, number>
  cantidadTransacciones: number
}

/**
 * Obtiene los datos consolidados de todas las fuentes necesarias para reportes.
 */
export const obtenerDatosConsolidadosReportes = (): DatosReportesConsolidados => {
  try {
    const pacientes = pacientesStorageService.obtenerPacientes([])
    const pagos = pagosStorageService.obtenerPagos([])
    const presupuestos = presupuestosStorageService.obtenerPresupuestos([])
    const citas = agendaStorageService.obtenerCitas([])

    return {
      pacientes: Array.isArray(pacientes) ? pacientes : [],
      pagos: Array.isArray(pagos) ? pagos : [],
      presupuestos: Array.isArray(presupuestos) ? presupuestos : [],
      citas: Array.isArray(citas) ? citas : [],
    }
  } catch {
    return { pacientes: [], pagos: [], presupuestos: [], citas: [] }
  }
}

/**
 * Consulta la productividad agrupada por profesional (doctor asignado en citas).
 */
export const obtenerProductividadPorProfesional = (
  citasInput?: Cita[],
  fechaInicio?: string,
  fechaFin?: string
): ProductividadProfesional[] => {
  const citas = citasInput ?? (agendaStorageService.obtenerCitas([]) || [])
  const mapa: Record<string, ProductividadProfesional> = {}

  citas.forEach((c) => {
    if (fechaInicio && c.fecha < fechaInicio) return
    if (fechaFin && c.fecha > fechaFin) return

    const prof = (c.doctor as string)?.trim() || 'Sin Profesional'
    if (!mapa[prof]) {
      mapa[prof] = {
        profesional: prof,
        totalCitas: 0,
        citasCompletadas: 0,
        montoGenerado: 0,
      }
    }
    mapa[prof].totalCitas++
    if (
      c.estado === 'Completado' ||
      c.estado === 'Atendido' ||
      c.estado === 'Realizado'
    ) {
      mapa[prof].citasCompletadas++
    }
  })

  return Object.values(mapa).sort(
    (a, b) => b.citasCompletadas - a.citasCompletadas
  )
}

/**
 * Ranking de prestaciones más solicitadas y con mayor facturación.
 */
export const obtenerRankingPrestaciones = (
  pacientesInput?: { id: string | number }[],
  limite: number = 7
): ItemRankingPrestacion[] => {
  const pacientes =
    pacientesInput ?? (pacientesStorageService.obtenerPacientes([]) || [])
  const ranking: Record<string, ItemRankingPrestacion> = {}

  pacientes.forEach((p) => {
    try {
      const items = presupuestosStorageService.obtenerItemsPorPaciente(p.id)
      if (Array.isArray(items)) {
        items.forEach(
          (it: {
            prestacion?: string
            valor?: number | string
            precio?: number | string
            especialidad?: string
          }) => {
            const nombre = it.prestacion || 'Consulta General'
            const valor =
              parseFloat(String(it.valor || it.precio || 0)) || 0
            const especialidad = it.especialidad || 'General'

            if (!ranking[nombre]) {
              ranking[nombre] = {
                nombre,
                cantidad: 0,
                montoTotal: 0,
                especialidad,
              }
            }
            ranking[nombre].cantidad++
            ranking[nombre].montoTotal += valor
          }
        )
      }
    } catch {
      // Ignorar error individual de paciente
    }
  })

  return Object.values(ranking)
    .sort((a, b) => b.montoTotal - a.montoTotal)
    .slice(0, limite)
}

/**
 * Consulta agregada de ingresos para un rango de fechas.
 */
export const obtenerIngresosPorPeriodo = (
  fechaInicio?: string,
  fechaFin?: string,
  pagosInput?: Pago[]
): IngresosPeriodoResumen => {
  const pagos = pagosInput ?? (pagosStorageService.obtenerPagos([]) || [])
  const desglosePorMetodo: Record<string, number> = {}
  let totalRecaudado = 0
  let cantidadTransacciones = 0

  pagos.forEach((p) => {
    if (p.estado === 'Anulado') return
    const f = (p.fecha as string) || ''
    if (fechaInicio && f && f < fechaInicio) return
    if (fechaFin && f && f > fechaFin) return

    const monto = parseFloat(String(p.monto || 0)) || 0
    const metodo = (p.metodoPago as string) || 'Efectivo'

    totalRecaudado += monto
    cantidadTransacciones++
    desglosePorMetodo[metodo] = (desglosePorMetodo[metodo] || 0) + monto
  })

  return {
    fechaInicio,
    fechaFin,
    totalRecaudado,
    desglosePorMetodo,
    cantidadTransacciones,
  }
}
