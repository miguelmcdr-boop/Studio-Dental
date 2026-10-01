/**
 * Utilidades centralizadas de formateo de moneda (Commit G2)
 *
 * Fuente única de verdad para formateo CLP en toda la aplicación.
 * Antes de G2, formatearCLP vivía en finanzas/utils/finanzasCalculations.js
 * y existían 14 implementaciones inline dispersas en 8 módulos.
 */

/**
 * Formatea un monto en pesos chilenos con símbolo y sufijo.
 * @param {number|string} monto - Monto a formatear (se trunca a entero)
 * @returns {string} Ej: "$50.000 CLP"
 */
export const formatearCLP = (monto) => {
  return `$${(parseInt(monto) || 0).toLocaleString('es-CL')} CLP`
}
