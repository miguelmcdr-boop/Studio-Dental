/**
 * Motor de Cálculos Financieros y Liquidaciones
 */

/**
 * Aplica el porcentaje de descuento del convenio al precio base de la prestación
 */
export const calcularPrecioConConvenio = (precioBase, PorcentajeDescuento) => {
  const base = parseInt(precioBase, 10) || 0
  const desc = parseFloat(PorcentajeDescuento) || 0
  if (base <= 0) return 0
  if (desc <= 0) return base
  
  const montoDescuento = Math.round(base * (desc / 100))
  return Math.max(0, base - montoDescuento)
}

/**
 * Calcula la liquidación de honorarios para un especialista
 */
export const calcularLiquidacionEspecialista = (totalRealizado, porcentajeEspecialista, costoMateriales = 0) => {
  const total = parseInt(totalRealizado, 10) || 0
  const pct = parseFloat(porcentajeEspecialista) || 50
  const mat = parseInt(costoMateriales, 10) || 0

  const baseLiquidable = Math.max(0, total - mat)
  const pagoEspecialista = Math.round(baseLiquidable * (pct / 100))
  const margenClinica = total - pagoEspecialista

  return {
    totalRealizado: total,
    costoMateriales: mat,
    baseLiquidable,
    pagoEspecialista,
    margenClinica,
    pctEspecialista: pct,
    pctClinica: 100 - pct
  }
}