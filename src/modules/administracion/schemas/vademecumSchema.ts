/**
 * Esquemas Zod para validación de formularios del módulo admin vademécum.
 * F4-03f-3 / Migración TypeScript
 * 
 * Tres esquemas principales:
 * - farmacoSchema: para fármacos regulares (tabla vademecum)
 * - urgenciaSchema: para fármacos de urgencia (tabla vademecum_urgencia)
 * - antirresortivoSchema: para MRONJ (tabla vademecum_antirresortivos)
 */
import { z } from 'zod'

// ═══════════════════════════════════════════════════════════════
// ENUMS DE FAMILIAS DISPONIBLES
// ═══════════════════════════════════════════════════════════════
export const FAMILIAS_VADEMECUM = [
  'anestesico_amida',
  'anestesico_ester',
  'anestesico_topico',
  'penicilina',
  'cefalosporina',
  'lincosamida',
  'macrolido',
  'nitroimidazol',
  'quinolona',
  'tetraciclina',
  'aine',
  'cox2',
  'paracetamol',
  'opioide',
  'corticoide',
  'antiseptico',
  'antifungico',
  'antiviral',
  'ansiolitico',
  'antihistaminico',
  'hemostatico',
  'protector_gastrico',
  'preventivo'
] as const

export type FamiliaVademecum = typeof FAMILIAS_VADEMECUM[number]

export const FAMILIAS_ANTIRRESORTIVOS = [
  'bifosfonato_oral',
  'bifosfonato_iv',
  'anti_rankl',
  'antiangiogenico'
] as const

export type FamiliaAntirresortivo = typeof FAMILIAS_ANTIRRESORTIVOS[number]

export const NIVELES_RIESGO_MRONG = ['bajo', 'moderado', 'alto'] as const

export type NivelRiesgoMronj = typeof NIVELES_RIESGO_MRONG[number]

export const VIAS_ADMINISTRACION = [
  'Oral',
  'Sublingual',
  'IM',
  'IV',
  'SC',
  'Inhalatoria',
  'Tópica',
  'Rectal',
  'Intranasal',
  'IV/IM',
  'IM/IV',
  'IV/Rectal',
  'IM/IV/Intranasal'
] as const

export type ViaAdministracion = typeof VIAS_ADMINISTRACION[number]

// ═══════════════════════════════════════════════════════════════
// ESQUEMA: FÁRMACOS REGULARES
// ═══════════════════════════════════════════════════════════════
export const farmacoSchema = z.object({
  numero: z.number({
    required_error: 'El número es obligatorio',
    invalid_type_error: 'El número debe ser un entero'
  }).int('El número debe ser un entero').positive('El número debe ser positivo'),
  
  familia: z.enum(FAMILIAS_VADEMECUM, {
    required_error: 'La familia es obligatoria',
    errorMap: () => ({ message: 'Seleccione una familia válida' })
  }),
  
  nombre_generico: z.string({
    required_error: 'El nombre genérico es obligatorio'
  }).min(2, 'Mínimo 2 caracteres').max(200, 'Máximo 200 caracteres'),
  
  nombre_comercial: z.string().max(200, 'Máximo 200 caracteres').optional().or(z.literal('')),
  
  presentacion: z.string({
    required_error: 'La presentación es obligatoria'
  }).min(2, 'Mínimo 2 caracteres').max(200, 'Máximo 200 caracteres'),
  
  posologia_adulto: z.string({
    required_error: 'La posología adulto es obligatoria'
  }).min(2, 'Mínimo 2 caracteres').max(500, 'Máximo 500 caracteres'),
  
  posologia_pediatrica: z.string().max(500, 'Máximo 500 caracteres').optional().or(z.literal('')),
  
  dosis_max_adulto_mg: z.number().positive().optional().nullable(),
  dosis_max_pediatrica_mg_por_kg: z.number().positive().optional().nullable(),
  contenido_por_unidad_mg: z.number().positive().optional().nullable(),
  volumen_por_unidad_ml: z.number().positive().optional().nullable(),
  concentracion_mg_por_ml: z.number().positive().optional().nullable(),
  
  duracion_dias: z.string().max(100, 'Máximo 100 caracteres').optional().or(z.literal('')),
  
  contraindicaciones: z.string().max(2000, 'Máximo 2000 caracteres').optional().or(z.literal('')),
  
  alergias_cruzadas: z.array(z.string()).optional().default([]),
  
  indicaciones: z.string().max(2000, 'Máximo 2000 caracteres').optional().or(z.literal('')),
  
  requiere_receta: z.boolean().default(true),
  activo: z.boolean().default(true),
  
  notas_especiales: z.string().max(2000, 'Máximo 2000 caracteres').optional().or(z.literal(''))
})

export type Farmaco = z.infer<typeof farmacoSchema>

// ═══════════════════════════════════════════════════════════════
// ESQUEMA: FÁRMACOS DE URGENCIA
// ═══════════════════════════════════════════════════════════════
export const urgenciaSchema = z.object({
  numero: z.number({
    required_error: 'El número es obligatorio',
    invalid_type_error: 'El número debe ser un entero'
  }).int('El número debe ser un entero').positive('El número debe ser positivo'),
  
  nombre_generico: z.string({
    required_error: 'El nombre genérico es obligatorio'
  }).min(2, 'Mínimo 2 caracteres').max(200, 'Máximo 200 caracteres'),
  
  concentracion: z.string().max(100, 'Máximo 100 caracteres').optional().or(z.literal('')),
  
  presentacion: z.string({
    required_error: 'La presentación es obligatoria'
  }).min(2, 'Mínimo 2 caracteres').max(200, 'Máximo 200 caracteres'),
  
  indicacion: z.string({
    required_error: 'La indicación es obligatoria'
  }).min(2, 'Mínimo 2 caracteres').max(500, 'Máximo 500 caracteres'),
  
  posologia_adulto: z.string().max(500, 'Máximo 500 caracteres').optional().or(z.literal('')),
  posologia_pediatrica: z.string().max(500, 'Máximo 500 caracteres').optional().or(z.literal('')),
  
  via_administracion: z.enum(VIAS_ADMINISTRACION, {
    required_error: 'La vía de administración es obligatoria',
    errorMap: () => ({ message: 'Seleccione una vía válida' })
  }),
  
  advertencias: z.string().max(2000, 'Máximo 2000 caracteres').optional().or(z.literal('')),
  
  activo: z.boolean().default(true)
})

export type FarmacoUrgencia = z.infer<typeof urgenciaSchema>

// ═══════════════════════════════════════════════════════════════
// ESQUEMA: ANTIRRESORTIVOS (MRONJ)
// ═══════════════════════════════════════════════════════════════
export const antirresortivoSchema = z.object({
  numero: z.number({
    required_error: 'El número es obligatorio',
    invalid_type_error: 'El número debe ser un entero'
  }).int('El número debe ser un entero').positive('El número debe ser positivo'),
  
  nombre_generico: z.string({
    required_error: 'El nombre genérico es obligatorio'
  }).min(2, 'Mínimo 2 caracteres').max(200, 'Máximo 200 caracteres'),
  
  familia: z.enum(FAMILIAS_ANTIRRESORTIVOS, {
    required_error: 'La familia es obligatoria',
    errorMap: () => ({ message: 'Seleccione una familia válida' })
  }),
  
  via_administracion: z.string().max(100, 'Máximo 100 caracteres').optional().or(z.literal('')),
  
  dosis_habitual: z.string().max(200, 'Máximo 200 caracteres').optional().or(z.literal('')),
  
  indicacion: z.string({
    required_error: 'La indicación es obligatoria'
  }).min(2, 'Mínimo 2 caracteres').max(500, 'Máximo 500 caracteres'),
  
  riesgo_mronj: z.enum(NIVELES_RIESGO_MRONG, {
    required_error: 'El nivel de riesgo MRONJ es obligatorio',
    errorMap: () => ({ message: 'Seleccione un nivel de riesgo válido' })
  }),
  
  manejo_odontologico: z.string({
    required_error: 'El manejo odontológico es obligatorio'
  }).min(2, 'Mínimo 2 caracteres').max(2000, 'Máximo 2000 caracteres'),
  
  activo: z.boolean().default(true)
})

export type Antirresortivo = z.infer<typeof antirresortivoSchema>

// ═══════════════════════════════════════════════════════════════
// HELPERS DE VALIDACIÓN
// ═══════════════════════════════════════════════════════════════

export interface ValidacionFarmacoResultado {
  valido: boolean
  errores: Record<string, string>
  datos?: Farmaco
}

export interface ValidacionUrgenciaResultado {
  valido: boolean
  errores: Record<string, string>
  datos?: FarmacoUrgencia
}

export interface ValidacionAntirresortivoResultado {
  valido: boolean
  errores: Record<string, string>
  datos?: Antirresortivo
}

/**
 * Valida datos de fármaco regular y retorna errores estructurados.
 */
export const validarFarmaco = (data: unknown): ValidacionFarmacoResultado => {
  const resultado = farmacoSchema.safeParse(data)
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

/**
 * Valida datos de fármaco de urgencia.
 */
export const validarUrgencia = (data: unknown): ValidacionUrgenciaResultado => {
  const resultado = urgenciaSchema.safeParse(data)
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

/**
 * Valida datos de antirresortivo.
 */
export const validarAntirresortivo = (data: unknown): ValidacionAntirresortivoResultado => {
  const resultado = antirresortivoSchema.safeParse(data)
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
