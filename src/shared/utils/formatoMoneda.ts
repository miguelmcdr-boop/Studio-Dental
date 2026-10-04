/**
 * Utilidades centralizadas de formateo de moneda (Commit G2 / Migración TypeScript)
 *
 * Fuente única de verdad para formateo CLP en toda la aplicación.
 */

/**
 * Tipo aceptado para montos monetarios (número, string numérico, nulo o indefinido).
 */
export type MontoMoneda = number | string | null | undefined

/**
 * Formatea un monto en pesos chilenos con símbolo '$' y sufijo 'CLP'.
 * Trunca decimales (CLP no utiliza centavos) y retorna '$0 CLP' ante valores inválidos.
 *
 * @param monto - Monto a formatear
 * @returns Cadena formateada, ej: "$50.000 CLP"
 */
export const formatearCLP = (monto: MontoMoneda): string => {
  const num = parseInt(String(monto), 10)
  return `$${(isNaN(num) ? 0 : num).toLocaleString('es-CL')} CLP`
}
