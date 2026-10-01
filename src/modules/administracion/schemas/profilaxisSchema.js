/**
 * Esquema Zod para validación de protocolos de profilaxis endocarditis.
 * F4-03f-5c
 */
import { z } from 'zod'

export const profilaxisSchema = z.object({
  situacion: z.string({
    required_error: 'La situación clínica es obligatoria'
  }).min(2, 'Mínimo 2 caracteres').max(200, 'Máximo 200 caracteres'),
  
  farmaco: z.string({
    required_error: 'El fármaco es obligatorio'
  }).min(2, 'Mínimo 2 caracteres').max(200, 'Máximo 200 caracteres'),
  
  dosis_adulto: z.string({
    required_error: 'La dosis adulto es obligatoria'
  }).min(2, 'Mínimo 2 caracteres').max(200, 'Máximo 200 caracteres'),
  
  dosis_pediatrica: z.string().max(200, 'Máximo 200 caracteres').optional().nullable(),
  
  nota: z.string().max(1000, 'Máximo 1000 caracteres').optional().nullable(),
  
  activo: z.boolean().default(true)
})

/**
 * Valida datos de protocolo de profilaxis y retorna errores estructurados.
 * @param {Object} data - Datos del formulario
 * @returns {{valido: boolean, errores: Object, datos?: Object}}
 */
export const validarProfilaxis = (data) => {
  const resultado = profilaxisSchema.safeParse(data)
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
