/**
 * Esquema Zod para validación de manejo perioperatorio de anticoagulantes.
 * F4-03f-5c
 */
import { z } from 'zod'

export const anticoagulanteSchema = z.object({
  farmaco_o_grupo: z.string({
    required_error: 'El fármaco o grupo es obligatorio'
  }).min(2, 'Mínimo 2 caracteres').max(200, 'Máximo 200 caracteres'),
  
  recomendacion: z.string({
    required_error: 'La recomendación es obligatoria'
  }).min(2, 'Mínimo 2 caracteres').max(1000, 'Máximo 1000 caracteres'),
  
  medidas_hemostasia: z.string().max(1000, 'Máximo 1000 caracteres').optional().nullable(),
  
  activo: z.boolean().default(true)
})

/**
 * Valida datos de manejo de anticoagulantes y retorna errores estructurados.
 * @param {Object} data - Datos del formulario
 * @returns {{valido: boolean, errores: Object, datos?: Object}}
 */
export const validarAnticoagulante = (data) => {
  const resultado = anticoagulanteSchema.safeParse(data)
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
