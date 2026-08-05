/**
 * Analítica avanzada y cálculos para el Dashboard World-Class
 */

export const calcularResumenJornada = (pacientes = [], citas = [], pagos = [], presupuestos = []) => {
  const hoyStr = new Date().toLocaleDateString('es-CL')
  const hoyIso = new Date().toISOString().split('T')[0]

  // 1. Filtrar citas de hoy
  const citasHoy = citas.filter(c => c.fecha === hoyStr || c.fechaIso === hoyIso)
  
  // 2. Pacientes en Sala de Espera y en Atención
  const enEspera = citasHoy.filter(c => c.estado === 'EnEspera' || c.estado === 'En Espera')
  const enAtencion = citasHoy.filter(c => c.estado === 'EnAtencion' || c.estado === 'En Atención' || c.estado === 'Atendiendo')
  const finalizadas = citasHoy.filter(c => c.estado === 'Completado' || c.estado === 'Atendido' || c.estado === 'Realizado')

  // 3. Tasa de ocupación de la jornada (40 bloques de 30 min asumidos por día en boxes)
  const capacidadDiariaSillones = 16 // Ejemplo 2 boxes x 8 horas
  const tasaOcupacionAgenda = capacidadDiariaSillones > 0 
    ? Math.min(100, Math.round((citasHoy.length / capacidadDiariaSillones) * 100))
    : 0

  // 4. Sumar ingresos recaudados hoy
  const recaudacionHoy = pagos
    .filter(p => p.fecha === hoyStr && p.estado !== 'Anulado')
    .reduce((acc, curr) => acc + (parseFloat(curr.monto) || 0), 0)

  // 5. Métricas de Conversión de Presupuestos
  let montoTotalCotizado = 0
  let montoTotalAceptado = 0
  let cantidadAceptados = 0

  presupuestos.forEach(p => {
    const total = parseFloat(p.total) || 0
    montoTotalCotizado += total
    if (p.estado === 'Aceptado' || p.estado === 'En Proceso' || p.estado === 'Finalizado') {
      montoTotalAceptado += total
      cantidadAceptados++
    }
  })

  const tasaConversionPresupuestos = presupuestos.length > 0
    ? Math.round((cantidadAceptados / presupuestos.length) * 100)
    : 0

  // 6. Proyección Mensual (Días hábiles promedio ~22)
  const diaDelMes = new Date().getDate()
  const acumuladoMes = pagos
    .filter(p => p.estado !== 'Anulado')
    .reduce((acc, curr) => acc + (parseFloat(curr.monto) || 0), 0)
  
  const proyeccionMensual = diaDelMes > 0 ? Math.round((acumuladoMes / diaDelMes) * 22) : recaudacionHoy * 22

  return {
    totalPacientes: pacientes.length,
    citasHoyCount: citasHoy.length,
    recaudacionHoy,
    citasHoy,
    enEspera,
    enAtencion,
    finalizadas,
    tasaOcupacionAgenda,
    montoTotalCotizado,
    montoTotalAceptado,
    tasaConversionPresupuestos,
    proyeccionMensual
  }
}