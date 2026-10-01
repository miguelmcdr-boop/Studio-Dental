/**
 * Utilidades puras para simulación de cuotas, conversión y métricas
 */

export const generarFolioPresupuesto = () => {
  const anio = new Date().getFullYear()
  const random = Math.floor(1000 + Math.random() * 9000)
  return `PRES-${anio}-${random}`
}

export const calcularSimulacionCuotas = (montoTotal = 0, pieInicial = 0, numCuotas = 3) => {
  const saldoFinanciar = Math.max(0, parseFloat(montoTotal) - parseFloat(pieInicial))
  const valorCuota = numCuotas > 0 ? Math.round(saldoFinanciar / numCuotas) : 0

  return {
    saldoFinanciar,
    valorCuota,
    numCuotas
  }
}

export const calcularResumenPresupuestos = (presupuestos = []) => {
  let totalCotizado = 0
  let totalAprobado = 0
  let totalAbonado = 0
  let aprobadosCount = 0

  presupuestos.forEach(p => {
    const monto = parseFloat(p.montoTotal) || 0
    const abonado = parseFloat(p.montoAbonado) || 0

    totalCotizado += monto
    totalAbonado += abonado

    if (p.estado === 'Aprobado' || p.estado === 'EnTratamiento') {
      totalAprobado += monto
      aprobadosCount++
    }
  })

  const tasaConversion = presupuestos.length > 0
    ? Math.round((aprobadosCount / presupuestos.length) * 100)
    : 0

  return {
    totalEmitidos: presupuestos.length,
    totalCotizado,
    totalAprobado,
    totalAbonado,
    totalPendienteCobro: Math.max(0, totalCotizado - totalAbonado),
    tasaConversion
  }
}