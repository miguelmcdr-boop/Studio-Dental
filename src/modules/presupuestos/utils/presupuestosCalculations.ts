/**
 * Utilidades puras para simulación de cuotas, conversión y métricas
 */

export interface SimulacionCuotasResultado {
  saldoFinanciar: number
  valorCuota: number
  numCuotas: number
}

export interface PresupuestoParaResumen {
  montoTotal?: number | string
  montoAbonado?: number | string
  estado?: string
}

export interface ResumenPresupuestos {
  totalEmitidos: number
  totalCotizado: number
  totalAprobado: number
  totalAbonado: number
  totalPendienteCobro: number
  tasaConversion: number
}

export const generarFolioPresupuesto = (): string => {
  const anio = new Date().getFullYear()
  const random = Math.floor(1000 + Math.random() * 9000)
  return `PRES-${anio}-${random}`
}

export const calcularSimulacionCuotas = (
  montoTotal: unknown = 0,
  pieInicial: unknown = 0,
  numCuotas = 3
): SimulacionCuotasResultado => {
  const saldoFinanciar = Math.max(0, (parseFloat(String(montoTotal)) || 0) - (parseFloat(String(pieInicial)) || 0))
  const valorCuota = numCuotas > 0 ? Math.round(saldoFinanciar / numCuotas) : 0
  return { saldoFinanciar, valorCuota, numCuotas }
}

export const calcularResumenPresupuestos = (presupuestos: PresupuestoParaResumen[] = []): ResumenPresupuestos => {
  let totalCotizado = 0, totalAprobado = 0, totalAbonado = 0, aprobadosCount = 0

  presupuestos.forEach(p => {
    const monto = parseFloat(String(p.montoTotal)) || 0
    const abonado = parseFloat(String(p.montoAbonado)) || 0
    totalCotizado += monto
    totalAbonado += abonado
    if (p.estado === 'Aprobado' || p.estado === 'EnTratamiento') {
      totalAprobado += monto
      aprobadosCount++
    }
  })

  const tasaConversion = presupuestos.length > 0 ? Math.round((aprobadosCount / presupuestos.length) * 100) : 0

  return {
    totalEmitidos: presupuestos.length,
    totalCotizado, totalAprobado, totalAbonado,
    totalPendienteCobro: Math.max(0, totalCotizado - totalAbonado),
    tasaConversion
  }
}
