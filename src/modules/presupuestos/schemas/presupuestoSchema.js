import { z } from 'zod'

/**
 * Esquema de validación de presupuesto (F2-04e — MASTER_ROADMAP).
 * Sigue el patrón establecido en `pacienteSchema.js` (F2-04),
 * `citaSchema.js` (F2-04b), `movimientoFinancieroSchema.js` (F2-04c)
 * y `prestacionSchema.js` (F2-04d).
 *
 * Campos obligatorios (mínimos para identificar un presupuesto):
 * - `id`: identificador único (number para directos, string "paciente_X" para consolidados)
 * - `folio`: identificador legible (ej: "P-001" o "PRES-PAC-1")
 * - `pacienteNombre`: nombre del paciente asociado
 * - `estado`: estado del ciclo de vida del presupuesto
 *
 * Campos opcionales (pueden faltar según el origen):
 * - `pacienteId`, `pacienteRut`: identificación del paciente
 * - `fechaEmision`: fecha de creación (ISO date)
 * - `convenio`: 'Particular', 'Fonasa', etc.
 * - `montoTotal` / `total`: monto total (dos nombres según origen)
 * - `montoAbonado`: monto ya pagado
 * - `items`: array de prestaciones del presupuesto
 * - `observacion`: notas adicionales
 *
 * `.passthrough()` deliberado: permite que el objeto presupuesto crezca con
 * campos adicionales (ej: descuentos, recordatorios, profesional responsable)
 * sin romper guardados legítimos. El objetivo es atrapar corrupción real
 * (campos obligatorios ausentes) — no restringir la forma exacta del objeto.
 */
export const presupuestoSchema = z.object({
  // Campos obligatorios (identificación mínima)
  id: z.union([z.number(), z.string()]),
  folio: z.string().trim().min(1, 'El folio del presupuesto es obligatorio'),
  pacienteNombre: z.string().trim().min(1, 'El nombre del paciente es obligatorio'),
  estado: z.string().trim().min(1, 'El estado del presupuesto es obligatorio'),

  // Campos opcionales (pueden faltar según origen)
  pacienteId: z.union([z.number(), z.string()]).optional(),
  pacienteRut: z.string().optional(),
  fechaEmision: z.string().optional(),
  convenio: z.string().optional(),
  montoTotal: z.number().optional(),
  total: z.number().optional(),
  montoAbonado: z.number().optional(),
  items: z.array(z.any()).optional(),
  observacion: z.string().optional(),
}).passthrough()

export const listaPresupuestosSchema = z.array(presupuestoSchema)

/**
 * Valida un arreglo de presupuestos. No lanza excepción — retorna un
 * resultado explícito para que el llamador decida qué hacer, evitando que
 * un dato corrupto tumbe la app entera con una excepción no capturada a
 * mitad de un guardado (Cap. V.2 Constitución).
 *
 * @param {Array} presupuestos - Array de objetos presupuesto a validar.
 * @returns {{ valido: boolean, datos: Array|null, error: import('zod').ZodError|null }}
 */
export const validarListaPresupuestos = (presupuestos) => {
  const resultado = listaPresupuestosSchema.safeParse(presupuestos)
  if (resultado.success) {
    return { valido: true, datos: resultado.data, error: null }
  }
  return { valido: false, datos: null, error: resultado.error }
}