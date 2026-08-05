/**
 * Utilidades puras de cálculo financiero, cierres de caja y comisiones
 */

export const formatearCLP = (monto) => {
  return `$${(parseInt(monto) || 0).toLocaleString('es-CL')} CLP`
}

export const calcularBalanceFinanzas = (movimientos = []) => {
  let totalIngresos = 0
  let totalEgresos = 0
  let totalEfectivo = 0
  let totalTarjetas = 0
  let totalTransferencias = 0

  movimientos.forEach(m => {
    const monto = parseInt(m.monto) || 0
    const tipo = (m.tipo || '').toLowerCase()

    if (tipo === 'ingreso') {
      totalIngresos += monto
      if (m.metodoPago === 'Efectivo') totalEfectivo += monto
      else if (m.metodoPago === 'Débito' || m.metodoPago === 'Crédito') totalTarjetas += monto
      else if (m.metodoPago === 'Transferencia') totalTransferencias += monto
    } else if (tipo === 'egreso') {
      totalEgresos += monto
      if (m.metodoPago === 'Efectivo') totalEfectivo -= monto
    }
  })

  return {
    totalIngresos,
    totalEgresos,
    saldoNeto: totalIngresos - totalEgresos,
    totalEfectivo,
    totalTarjetas,
    totalTransferencias
  }
}

// Alias para mantener compatibilidad con componentes que llamen a calcularBalanceCaja
export const calcularBalanceCaja = calcularBalanceFinanzas

export const calcularBoletaHonorarios = (valorInput = 0, modo = 'bruto', pctRetencion = 13.75) => {
  const monto = parseFloat(valorInput) || 0
  const tasa = pctRetencion / 100

  if (modo === 'bruto') {
    const bruto = monto
    const retencion = Math.round(bruto * tasa)
    const liquido = Math.round(bruto - retencion)
    return { bruto, retencion, liquido }
  } else {
    const bruto = Math.round(monto / (1 - tasa))
    const retencion = Math.round(bruto * tasa)
    const liquido = Math.round(bruto - retencion)
    return { bruto, retencion, liquido }
  }
}

export const calcularMontoComision = (valorPrestacion = 0, pctComision = 60) => {
  const total = parseFloat(valorPrestacion) || 0
  const pct = parseFloat(pctComision) || 0
  const montoEspecialista = Math.round(total * (pct / 100))
  const clinicaMonto = total - montoEspecialista

  return {
    montoEspecialista,
    clinicaMonto
  }
}