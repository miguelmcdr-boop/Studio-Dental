/**
 * Esquema Zod para validación de reglas de alergias cruzadas.
 * F4-03f-5a / Migración TypeScript
 */
import { z } from 'zod'

/**
 * Familias de alergias disponibles para la matriz.
 * Corresponde a las 16 columnas de la Sección 3 del vademécum v1.1
 */
export const FAMILIAS_ALERGIAS = [
  'penicilina',
  'cefalosporina',
  'lincosamida',
  'macrolido',
  'nitroimidazol',
  'quinolona',
  'tetraciclina',
  'aine',
  'paracetamol',
  'opioide',
  'corticoide',
  'antiseptico',
  'anestesico_amida',
  'anestesico_ester',
  'antifungico_azol',
  'antiviral'
] as const

export type FamiliaAlergia = typeof FAMILIAS_ALERGIAS[number]

/**
 * Niveles de severidad de reactividad cruzada
 */
export const NIVELES_SEVERIDAD = ['critica', 'advertencia', 'sin_relacion'] as const

export type NivelSeveridadAlergia = typeof NIVELES_SEVERIDAD[number]

/**
 * Esquema Zod para validar una regla de alergia cruzada
 */
export const alergiaCruzadaSchema = z.object({
  familia_alergia: z.enum(FAMILIAS_ALERGIAS, {
    message: 'Seleccione una familia de alergia'
  }),
  
  familia_farmaco: z.enum(FAMILIAS_ALERGIAS, {
    message: 'Seleccione una familia de fármaco'
  }),
  
  severidad: z.enum(NIVELES_SEVERIDAD, {
    message: 'Seleccione el nivel de severidad'
  }),
  
  porcentaje_cruzado: z.string().max(20, 'Máximo 20 caracteres').optional().nullable(),
  
  nota_clinica: z.string().max(2000, 'Máximo 2000 caracteres').optional().nullable()
})

export type AlergiaCruzada = z.infer<typeof alergiaCruzadaSchema>

export interface ValidacionAlergiaCruzadaResultado {
  valido: boolean
  errores: Record<string, string>
  datos?: AlergiaCruzada
}

/**
 * Valida datos de alergia cruzada y retorna errores estructurados.
 */
export const validarAlergiaCruzada = (data: unknown): ValidacionAlergiaCruzadaResultado => {
  const resultado = alergiaCruzadaSchema.safeParse(data)
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
