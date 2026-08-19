import { z } from 'zod'

/**
 * Esquema de validación del paciente (F2-04 — MASTER_ROADMAP).
 * Primer caso de aplicación de Zod en el proyecto, según el plan acordado.
 *
 * Solo `id`, `nombre` y `rut` son estrictamente obligatorios: son los únicos
 * campos de los que depende el resto del sistema (búsqueda, navegación a la
 * ficha, eliminación bidireccional). El resto son campos que se completan de
 * forma progresiva durante la atención clínica (anamnesis, datos de
 * contacto) y no deben bloquear un guardado si todavía no están.
 *
 * `.passthrough()` deliberado: `useFichaPaciente.js` mezcla campos de
 * anamnesis directamente en el objeto paciente (línea `{...paciente,
 * ...nuevaFicha}`), y el objeto crece con el tiempo. Rechazar campos no
 * catalogados rompería guardados legítimos. El objetivo de este esquema es
 * atrapar corrupción real de datos (campo obligatorio ausente, tipo
 * incorrecto) — no restringir la forma exacta del objeto.
 *
 * F3-06: agregado campo `notas` (opcional) como parte de la migración v1 → v2.
 */
export const pacienteSchema = z.object({
  id: z.union([z.number(), z.string()]),
  nombre: z.string().trim().min(1, 'El nombre es obligatorio'),
  rut: z.string().trim().min(1, 'El RUT es obligatorio'),

  telefono: z.union([z.string(), z.number()]).nullable().optional(),
  edad: z.union([z.string(), z.number()]).nullable().optional(),
  prevision: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  direccion: z.string().nullable().optional(),
  ocupacion: z.string().nullable().optional(),
  contactoEmergencia: z.string().nullable().optional(),
  peso: z.union([z.string(), z.number()]).nullable().optional(),

  // Campos de anamnesis clínica (se completan progresivamente en la Ficha)
  alergias: z.string().nullable().optional(),
  enfermedades: z.string().nullable().optional(),
  medicamentos: z.string().nullable().optional(),
  habitos: z.string().nullable().optional(),
  examenExtraoral: z.string().nullable().optional(),
  examenIntraoral: z.string().nullable().optional(),
  presionArterial: z.string().nullable().optional(),
  riesgoCariogenico: z.string().nullable().optional(),
  riesgoPeriodontal: z.string().nullable().optional(),
  motivoConsulta: z.string().nullable().optional(),
  anamnesisProxima: z.string().nullable().optional(),

  // Campo de origen "paciente exprés" desde Agenda (F2-02b)
  fechaIngreso: z.string().nullable().optional(),

  // F3-06: campo agregado en migración v1 → v2
  notas: z.string().nullable().optional()
}).passthrough()

export const listaPacientesSchema = z.array(pacienteSchema)

/**
 * Valida un arreglo de pacientes. No lanza excepción — retorna un resultado
 * explícito para que el llamador decida qué hacer, evitando que un dato
 * corrupto tumbe la app entera con una excepción no capturada a mitad de un
 * guardado (Cap. V.2 Constitución: nunca fallar en silencio, pero tampoco
 * de forma descontrolada).
 * @param {Array} pacientes
 * @returns {{ valido: boolean, datos: Array|null, error: import('zod').ZodError|null }}
 */
export const validarListaPacientes = (pacientes) => {
  const resultado = listaPacientesSchema.safeParse(pacientes)
  if (resultado.success) {
    return { valido: true, datos: resultado.data, error: null }
  }
  return { valido: false, datos: null, error: resultado.error }
}