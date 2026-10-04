/**
 * Esquema Zod para validación de interacciones farmacológicas.
 * F4-03f-5b / Migración TypeScript
 */
import { z } from 'zod'

/**
 * Niveles de severidad de interacciones farmacológicas
 */
export const NIVELES_SEVERIDAD_INTERACCION = ['mayor', 'moderada', 'menor'] as const

export type NivelSeveridadInteraccion = typeof NIVELES_SEVERIDAD_INTERACCION[number]

/**
 * Esquema Zod para validar una interacción farmacológica
 */
export const interaccionSchema = z.object({
  farmaco_a: z.string({
    message: 'Ingrese el nombre del fármaco A'
  }).min(2, 'Mínimo 2 caracteres').max(200, 'Máximo 200 caracteres'),
  
  farmaco_b: z.string({
    message: 'Ingrese el nombre del fármaco B o grupo'
  }).min(2, 'Mínimo 2 caracteres').max(200, 'Máximo 200 caracteres'),
  
  efecto: z.string({
    message: 'Describa el efecto de la interacción'
  }).min(2, 'Mínimo 2 caracteres').max(1000, 'Máximo 1000 caracteres'),
  
  manejo: z.string().max(1000, 'Máximo 1000 caracteres').optional().nullable(),
  
  severidad: z.enum(NIVELES_SEVERIDAD_INTERACCION, {
    message: 'Seleccione el nivel de severidad'
  }),
  
  activo: z.boolean().default(true)
})

export type Interaccion = z.infer<typeof interaccionSchema>

export interface ValidacionInteraccionResultado {
  valido: boolean
  errores: Record<string, string>
  datos?: Interaccion
}

/**
 * Valida datos de interacción farmacológica y retorna errores estructurados.
 */
export const validarInteraccion = (data: unknown): ValidacionInteraccionResultado => {
  const resultado = interaccionSchema.safeParse(data)
  if (resultado.success) {
    return { valido: true, errores: {}, datos: resultado.data }
  }
  
  const errores: Record<string, string> = {}
  resultado.error.issues.forEach(issue => {
    const campo = String(issue.path[0])
    errores[campo] = issue.message
  })
  
  return { valido: false, errores }
}
