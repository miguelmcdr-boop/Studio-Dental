/**
 * Cálculos tributarios, comisiones bancarias e imputaciones
 */

export const generarFolioRecibo = () => {
  const anio = new Date().getFullYear()
  const random = Math.floor(1000 + Math.random() * 9000)
  return `REC-${anio}-${random}`
}

export const calcularResumenRecaudacion = (pagos = []) => {
  const hoyStr = new Date().toLocaleDateString('es-CL')
  let recaudadoHoy = 0
  let totalRecaudado = 0
  let totalBoletasHonorarios = 0
  let totalBonoIMed = 0
  let totalTarjetasPOS = 0
  let totalAnulados = 0

  pagos.forEach(p => {
    const monto = parseFloat(p.monto) || 0

    if (p.estado === 'Anulado') {
      totalAnulados += monto
      return
    }

    totalRecaudado += monto

    if (p.fecha === hoyStr) {
      recaudadoHoy += monto
    }

    if (p.tipoDTE === 'boleta_honorarios') totalBoletasHonorarios += monto
    if (p.tipoDTE === 'bono_imed') totalBonoIMed += monto
    if (p.metodoPago === 'Débito' || p.metodoPago === 'Crédito') totalTarjetasPOS += monto
  })

  return {
    totalTransacciones: pagos.length,
    recaudadoHoy,
    totalRecaudado,
    totalBoletasHonorarios,
    totalBonoIMed,
    totalTarjetasPOS,
    totalAnulados
  }
}