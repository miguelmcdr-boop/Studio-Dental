/**
 * Cálculos rápidos para la jornada diaria
 */

export const calcularResumenJornada = (pacientes = [], citas = [], pagos = []) => {
  const hoyStr = new Date().toLocaleDateString('es-CL')
  
  // Filtrar citas agendadas para hoy
  const citasHoy = citas.filter(c => c.fecha === hoyStr || c.fechaIso === new Date().toISOString().split('T')[0])
  
  // Sumar ingresos del día
  const recaudacionHoy = pagos
    .filter(p => p.fecha === hoyStr && p.estado !== 'Anulado')
    .reduce((acc, curr) => acc + (parseFloat(curr.monto) || 0), 0)

  return {
    totalPacientes: pacientes.length,
    citasHoyCount: citasHoy.length,
    recaudacionHoy,
    citasHoy
  }
}