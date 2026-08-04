/**
 * Utilidades para verificación de disponibilidad de Box y tiempos
 */

export const verificarDisponibilidadBox = (citas = [], boxId, fechaIso, horaInicio, idExcluir = null) => {
  return !citas.some(c => {
    if (idExcluir && String(c.id) === String(idExcluir)) return false
    if (c.boxId !== boxId || c.fechaIso !== fechaIso || c.estado === 'NoAsiste') return false

    // Detección de solapamiento
    return (horaInicio >= c.horaInicio && horaInicio < c.horaFin)
  })
}

export const calcularResumenAgenda = (citas = []) => {
  const hoyIso = new Date().toISOString().split('T')[0]
  const citasHoy = citas.filter(c => c.fechaIso === hoyIso || c.fecha === new Date().toLocaleDateString('es-CL'))

  let agendadosCount = 0
  let enEsperaCount = 0
  let enSillonCount = 0
  let finalizadosCount = 0

  citasHoy.forEach(c => {
    if (c.estado === 'Agendado') agendadosCount++
    if (c.estado === 'EnEspera') enEsperaCount++
    if (c.estado === 'EnSillon') enSillonCount++
    if (c.estado === 'Finalizado') finalizadosCount++
  })

  return {
    totalHoy: citasHoy.length,
    agendadosCount,
    enEsperaCount,
    enSillonCount,
    finalizadosCount,
    citasHoy
  }
}