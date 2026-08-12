import { z } from 'zod'

/**
 * Esquema de validación de cita (F2-04b — MASTER_ROADMAP).
 * Sigue el patrón establecido en `pacienteSchema.js` (F2-04).
 *
 * Campos obligatorios:
 * - `id`: identificador único (number o string, ej: Date.now() o "express_timestamp")
 * - `fecha`: fecha de la cita en formato ISO local "YYYY-MM-DD"
 * - `horaInicio`: hora de inicio en formato "HH:MM"
 * - `estado`: estado del ciclo de vida de la cita
 *
 * Campos opcionales:
 * - `pacienteId`: ID del paciente (puede faltar en bloqueos o citas sin paciente)
 * - `pacienteNombre`, `pacienteTelefono`, `pacienteRut`: datos del paciente
 *   (críticos en "paciente exprés" creado desde Agenda, F2-02b)
 * - `trataMiento`: motivo del tratamiento
 * - `boxAsignado`: box o sillón donde se atiende
 * - `horaInicioAtencion`: timestamp ISO cuando la cita pasa a "En Sillón"
 *
 * `.passthrough()` deliberado: igual que `pacienteSchema`, permite que el
 * objeto cita crezca con campos adicionales (ej: notas del profesional,
 * recordatorios enviados) sin romper guardados legítimos. El objetivo es
 * atrapar corrupción real (campos obligatorios ausentes) — no restringir
 * la forma exacta del objeto.
 */
export const citaSchema = z.object({
  // Campos obligatorios
  id: z.union([z.number(), z.string()]),
  fecha: z.string().trim().min(1, 'La fecha de la cita es obligatoria'),
  horaInicio: z.string().trim().min(1, 'La hora de inicio es obligatoria'),
  estado: z.string().trim().min(1, 'El estado de la cita es obligatorio'),

  // Datos del paciente (opcionales, pero comunes)
  pacienteId: z.union([z.number(), z.string()]).optional(),
  pacienteNombre: z.string().optional(),
  pacienteTelefono: z.union([z.string(), z.number()]).optional(),
  pacienteRut: z.string().optional(),

  // Detalles de la cita
  trataMiento: z.string().optional(),
  boxAsignado: z.string().optional(),
  horaInicioAtencion: z.string().optional(),
}).passthrough()

export const listaCitasSchema = z.array(citaSchema)

/**
 * Valida un arreglo de citas. No lanza excepción — retorna un resultado
 * explícito para que el llamador decida qué hacer, evitando que un dato
 * corrupto tumbe la app entera con una excepción no capturada a mitad de
 * un guardado (Cap. V.2 Constitución: nunca fallar en silencio, pero
 * tampoco de forma descontrolada).
 *
 * @param {Array} citas - Array de objetos cita a validar.
 * @returns {{ valido: boolean, datos: Array|null, error: import('zod').ZodError|null }}
 */
export const validarListaCitas = (citas) => {
  const resultado = listaCitasSchema.safeParse(citas)
  if (resultado.success) {
    return { valido: true, datos: resultado.data, error: null }
  }
  return { valido: false, datos: null, error: resultado.error }
}