/**
 * Esquema Zod para validación de reglas de alergias cruzadas.
 * F4-03f-5a
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
]

/**
 * Niveles de severidad de reactividad cruzada
 */
export const NIVELES_SEVERIDAD = ['critica', 'advertencia', 'sin_relacion']

/**
 * Esquema Zod para validar una regla de alergia cruzada
 */
export const alergiaCruzadaSchema = z.object({
  familia_alergia: z.enum(FAMILIAS_ALERGIAS, {
    required_error: 'Seleccione una familia de alergia',
    errorMap: () => ({ message: 'Seleccione una familia válida' })
  }),
  
  familia_farmaco: z.enum(FAMILIAS_ALERGIAS, {
    required_error: 'Seleccione una familia de fármaco',
    errorMap: () => ({ message: 'Seleccione una familia válida' })
  }),
  
  severidad: z.enum(NIVELES_SEVERIDAD, {
    required_error: 'Seleccione el nivel de severidad',
    errorMap: () => ({ message: 'Seleccione un nivel válido' })
  }),
  
  porcentaje_cruzado: z.string().max(20, 'Máximo 20 caracteres').optional().nullable(),
  
  nota_clinica: z.string().max(2000, 'Máximo 2000 caracteres').optional().nullable()
})

/**
 * Valida datos de alergia cruzada y retorna errores estructurados.
 * @param {Object} data - Datos del formulario
 * @returns {{valido: boolean, errores: Object, datos?: Object}}
 */
export const validarAlergiaCruzada = (data) => {
  const resultado = alergiaCruzadaSchema.safeParse(data)
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
