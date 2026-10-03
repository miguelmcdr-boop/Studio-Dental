/**
 * Utilidades puras de cálculo financiero, cierres de caja y comisiones
 */

// Commit G2: fuente única de verdad movida a src/utils/formatoMoneda.js
// Se re-exporta para mantener retrocompatibilidad con imports existentes
export { formatearCLP } from '../../../utils/formatoMoneda'

export interface MovimientoCalculo {
  monto: number | string
  tipo?: string
  metodoPago?: string
  [key: string]: unknown
}

export interface BalanceFinanzas {
  totalIngresos: number
  totalEgresos: number
  saldoNeto: number
  totalEfectivo: number
  totalTarjetas: number
  totalTransferencias: number
}

export interface BoletaHonorariosResultado {
  bruto: number
  retencion: number
  liquido: number
}

export interface MontoComisionResultado {
  montoEspecialista: number
  clinicaMonto: number
}

export const calcularBalanceFinanzas = (movimientos: readonly MovimientoCalculo[] = []): BalanceFinanzas => {
  let totalIngresos = 0
  let totalEgresos = 0
  let totalEfectivo = 0
  let totalTarjetas = 0
  let totalTransferencias = 0

  movimientos.forEach(m => {
    const monto = parseInt(String(m.monto), 10) || 0
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

export const calcularBoletaHonorarios = (
  valorInput: number | string = 0,
  modo: 'bruto' | 'liquido' | string = 'bruto',
  pctRetencion: number = 13.75
): BoletaHonorariosResultado => {
  const monto = parseFloat(String(valorInput)) || 0
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

export const calcularMontoComision = (
  valorPrestacion: number | string = 0,
  pctComision: number | string = 60
): MontoComisionResultado => {
  const total = parseFloat(String(valorPrestacion)) || 0
  const pct = parseFloat(String(pctComision)) || 0
  const montoEspecialista = Math.round(total * (pct / 100))
  const clinicaMonto = total - montoEspecialista

  return {
    montoEspecialista,
    clinicaMonto
  }
}
