/**
 * Esquema Zod para validación de manejo perioperatorio de anticoagulantes.
 * F4-03f-5c / Migración TypeScript
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

export type Anticoagulante = z.infer<typeof anticoagulanteSchema>

export interface ValidacionAnticoagulanteResultado {
  valido: boolean
  errores: Record<string, string>
  datos?: Anticoagulante
}

/**
 * Valida datos de manejo de anticoagulantes y retorna errores estructurados.
 */
export const validarAnticoagulante = (data: unknown): ValidacionAnticoagulanteResultado => {
  const resultado = anticoagulanteSchema.safeParse(data)
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
