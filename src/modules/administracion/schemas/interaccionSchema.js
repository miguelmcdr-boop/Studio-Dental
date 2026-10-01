/**
 * Esquema Zod para validación de interacciones farmacológicas.
 * F4-03f-5b
 */
import { z } from 'zod'

/**
 * Niveles de severidad de interacciones farmacológicas
 */
export const NIVELES_SEVERIDAD_INTERACCION = ['mayor', 'moderada', 'menor']

/**
 * Esquema Zod para validar una interacción farmacológica
 */
export const interaccionSchema = z.object({
  farmaco_a: z.string({
    required_error: 'Ingrese el nombre del fármaco A'
  }).min(2, 'Mínimo 2 caracteres').max(200, 'Máximo 200 caracteres'),
  
  farmaco_b: z.string({
    required_error: 'Ingrese el nombre del fármaco B o grupo'
  }).min(2, 'Mínimo 2 caracteres').max(200, 'Máximo 200 caracteres'),
  
  efecto: z.string({
    required_error: 'Describa el efecto de la interacción'
  }).min(2, 'Mínimo 2 caracteres').max(1000, 'Máximo 1000 caracteres'),
  
  manejo: z.string().max(1000, 'Máximo 1000 caracteres').optional().nullable(),
  
  severidad: z.enum(NIVELES_SEVERIDAD_INTERACCION, {
    required_error: 'Seleccione el nivel de severidad',
    errorMap: () => ({ message: 'Seleccione un nivel válido' })
  }),
  
  activo: z.boolean().default(true)
})

/**
 * Valida datos de interacción farmacológica y retorna errores estructurados.
 * @param {Object} data - Datos del formulario
 * @returns {{valido: boolean, errores: Object, datos?: Object}}
 */
export const validarInteraccion = (data) => {
  const resultado = interaccionSchema.safeParse(data)
  if (resultado.success) {
    return { valido: true, errores: {}, datos: resultado.data }
  }
  
  const errores = {}
  resultado.error.issues.forEach(issue => {
    const campo = issue.path[0]
    errores[campo] = issue.message
  })
  
  return { valido: false, errores }
}
