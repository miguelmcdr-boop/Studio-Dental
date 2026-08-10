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
 */
export const pacienteSchema = z.object({
  id: z.union([z.number(), z.string()]),
  nombre: z.string().trim().min(1, 'El nombre es obligatorio'),
  rut: z.string().trim().min(1, 'El RUT es obligatorio'),

  telefono: z.union([z.string(), z.number()]).optional(),
  edad: z.union([z.string(), z.number()]).optional(),
  prevision: z.string().optional(),
  email: z.string().optional(),
  direccion: z.string().optional(),
  ocupacion: z.string().optional(),
  contactoEmergencia: z.string().optional(),
  peso: z.union([z.string(), z.number()]).optional(),

  // Campos de anamnesis clínica (se completan progresivamente en la Ficha)
  alergias: z.string().optional(),
  enfermedades: z.string().optional(),
  medicamentos: z.string().optional(),
  habitos: z.string().optional(),
  examenExtraoral: z.string().optional(),
  examenIntraoral: z.string().optional(),
  presionArterial: z.string().optional(),
  riesgoCariogenico: z.string().optional(),
  riesgoPeriodontal: z.string().optional(),
  motivoConsulta: z.string().optional(),
  anamnesisProxima: z.string().optional(),

  // Campo de origen "paciente exprés" desde Agenda (F2-02b)
  fechaIngreso: z.string().optional(),
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