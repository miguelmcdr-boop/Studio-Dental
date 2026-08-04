/**
 * Cálculos financieros, estadísticas de agenda y agregaciones para BI
 */

export const calcularEstadisticasAvanzadas = (pacientes = [], pagos = [], presupuestos = [], citas = []) => {
  let totalRecaudado = 0
  let totalPresupuestado = 0
  let presupuestosAprobadosCount = 0

  // 1. Cálculos de Pagos y Recaudación
  const recaudacionPorMetodo = {}
  pagos.forEach(p => {
    if (p.estado === 'Anulado') return
    const monto = parseFloat(p.monto) || 0
    totalRecaudado += monto

    const metodo = p.metodoPago || 'Efectivo'
    recaudacionPorMetodo[metodo] = (recaudacionPorMetodo[metodo] || 0) + monto
  })

  // 2. Cálculos de Presupuestos y Conversión
  presupuestos.forEach(p => {
    const total = parseFloat(p.montoTotal) || 0
    totalPresupuestado += total
    if (p.estado === 'Aprobado' || p.estado === 'EnTratamiento') {
      presupuestosAprobadosCount++
    }
  })

  const tasaConversionPresupuestos = presupuestos.length > 0 
    ? Math.round((presupuestosAprobadosCount / presupuestos.length) * 100) 
    : 0

  // 3. Desglose de Tratamientos por Paciente
  let totalProcedimientos = 0
  const rankingPrestaciones = {}
  const desgloseEspecialidad = {}

  pacientes.forEach(p => {
    try {
      const itemsSaved = localStorage.getItem(`presupuesto_items_${p.id}`)
      if (itemsSaved) {
        const items = JSON.parse(itemsSaved)
        items.forEach(it => {
          totalProcedimientos++
          const nombre = it.prestacion || 'Consulta General'
          const valor = parseFloat(it.valor) || 0
          const especialidad = it.especialidad || 'General'

          if (!rankingPrestaciones[nombre]) {
            rankingPrestaciones[nombre] = { cantidad: 0, montoTotal: 0 }
          }
          rankingPrestaciones[nombre].cantidad++
          rankingPrestaciones[nombre].montoTotal += valor

          desgloseEspecialidad[especialidad] = (desgloseEspecialidad[especialidad] || 0) + valor
        })
      }
    } catch (e) {
      console.error(e)
    }
  })

  const topPrestaciones = Object.entries(rankingPrestaciones)
    .map(([nombre, datos]) => ({ nombre, ...datos }))
    .sort((a, b) => b.montoTotal - a.montoTotal)
    .slice(0, 7)

  // 4. Indicadores Clave
  const ticketPromedio = pacientes.length > 0 ? Math.round(totalRecaudado / pacientes.length) : 0

  return {
    totalPacientes: pacientes.length,
    totalRecaudado,
    totalPresupuestado,
    totalProcedimientos,
    tasaConversionPresupuestos,
    ticketPromedio,
    topPrestaciones,
    desgloseEspecialidad,
    recaudacionPorMetodo
  }
}