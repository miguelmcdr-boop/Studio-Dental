/**
 * Utilidades puras para el cálculo de trazabilidad, vencimientos y bioseguridad
 */

export const generarCodigoLoteEsterilizacion = () => {
  const hoy = new Date()
  const yyyy = hoy.getFullYear()
  const mm = String(hoy.getMonth() + 1).padStart(2, '0')
  const dd = String(hoy.getDate()).padStart(2, '0')
  const random = Math.floor(10 + Math.random() * 90)
  return `LOTE-${yyyy}${mm}${dd}-${random}`
}

export const calcularResumenEsterilizacion = (cargas = [], biologicos = [], testDiarios = []) => {
  const hoyStr = new Date().toLocaleDateString('es-CL')
  
  let cargasHoy = 0
  let conformes = 0
  let rechazadas = 0

  cargas.forEach(c => {
    if (c.fecha === hoyStr) cargasHoy++
    if (c.estado === 'Conforme') conformes++
    if (c.estado === 'Rechazado' || c.indicadorQuimico.includes('Fallo')) rechazadas++
  })

  const biologicosPendientes = biologicos.filter(b => b.resultado === 'Pendiente').length
  const testBowieDickHoy = testDiarios.some(t => t.fecha === hoyStr)

  return {
    totalCargas: cargas.length,
    cargasHoy,
    conformes,
    rechazadas,
    biologicosPendientes,
    testBowieDickHoy
  }
}