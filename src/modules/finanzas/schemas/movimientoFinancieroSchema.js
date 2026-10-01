import { z } from 'zod'

/**
 * Esquema de validación de movimiento financiero (F2-04c — MASTER_ROADMAP).
 * Sigue el patrón establecido en `pacienteSchema.js` (F2-04) y `citaSchema.js` (F2-04b).
 *
 * Campos obligatorios:
 * - `id`: identificador único (number o string)
 * - `fecha`: fecha del movimiento (string, formato DD/MM/YYYY o YYYY-MM-DD)
 * - `tipo`: 'Ingreso' o 'Egreso'
 * - `categoria`: descripción/categoría del movimiento
 * - `monto`: valor numérico (positivo para ingresos, negativo para egresos)
 * - `metodoPago`: método de pago utilizado
 *
 * Campos opcionales:
 * - `pacienteNombre`: nombre del paciente asociado (si aplica)
 * - `origen`: módulo de origen ('Pagos', 'Presupuestos', 'Manual')
 *
 * `.passthrough()` deliberado: permite que el objeto movimiento crezca con
 * campos adicionales (ej: notas, referencias) sin romper guardados legítimos.
 * El objetivo es atrapar corrupción real (campos obligatorios ausentes) —
 * no restringir la forma exacta del objeto.
 */
export const movimientoFinancieroSchema = z.object({
  // Campos obligatorios
  id: z.union([z.number(), z.string()]),
  fecha: z.string().trim().min(1, 'La fecha del movimiento es obligatoria'),
  tipo: z.string().trim().min(1, 'El tipo de movimiento es obligatorio'),
  categoria: z.string().trim().min(1, 'La categoría es obligatoria'),
  monto: z.number({ required_error: 'El monto es obligatorio' }),
  metodoPago: z.string().trim().min(1, 'El método de pago es obligatorio'),

  // Campos opcionales
  pacienteNombre: z.string().optional(),
  origen: z.string().optional(),
}).passthrough()

export const listaMovimientosSchema = z.array(movimientoFinancieroSchema)

/**
 * Valida un arreglo de movimientos financieros. No lanza excepción — retorna
 * un resultado explícito para que el llamador decida qué hacer, evitando que
 * un dato corrupto tumbe la app entera con una excepción no capturada a mitad
 * de un guardado (Cap. V.2 Constitución: nunca fallar en silencio, pero
 * tampoco de forma descontrolada).
 *
 * @param {Array} movimientos - Array de objetos movimiento a validar.
 * @returns {{ valido: boolean, datos: Array|null, error: import('zod').ZodError|null }}
 */
export const validarListaMovimientos = (movimientos) => {
  const resultado = listaMovimientosSchema.safeParse(movimientos)
  if (resultado.success) {
    return { valido: true, datos: resultado.data, error: null }
  }
  return { valido: false, datos: null, error: resultado.error }
}