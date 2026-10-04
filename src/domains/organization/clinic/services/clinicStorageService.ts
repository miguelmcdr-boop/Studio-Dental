/**
 * Servicio de Persistencia de Configuración de Clínica (Branding / Logo)
 *
 * Persiste en la tabla `clinicas` de Supabase cuando VITE_USE_SUPABASE=true
 * y en localStorage multi-tenant como caché optimista rápida.
 */
import { createTenantRepository } from '../../../../services/localStorageRepository'
import { supabase, USE_SUPABASE } from '../../../../services/supabaseClient'
import { createLogger } from '../../../../services/logger'

const log = createLogger('clinicStorageService')

export const KEY_CLINICA = 'studio_dental_config_clinica'

export interface DatosClinicaConfig {
  nombreClinica?: string
  razonSocial?: string
  rutClinica?: string
  telefono?: string
  emailContacto?: string
  direccion?: string
  ciudad?: string
  logoUrl?: string
  colorPrimario?: string
  colorSecundario?: string
  [key: string]: unknown
}

export interface ClinicStorageServiceAPI {
  obtenerClinica: (defaults?: DatosClinicaConfig) => DatosClinicaConfig | undefined
  guardarClinica: (datos: DatosClinicaConfig) => void
  guardarClinicaCompleta: (clinicaId: string, datos: DatosClinicaConfig) => Promise<void>
  sincronizarClinicaDesdeSupabase: (clinicaId: string) => Promise<DatosClinicaConfig | null>
  migrarClinicaSiNecesario: (clinicaId: string) => Promise<boolean>
}

const clinicaRepo = createTenantRepository<DatosClinicaConfig | undefined>(KEY_CLINICA, undefined, { notify: true })

const CAMEL_TO_SNAKE_MAP: Record<string, string> = {
  nombreClinica: 'nombre',
  razonSocial: 'razon_social',
  rutClinica: 'rut_empresa',
  telefono: 'telefono',
  emailContacto: 'email_contacto',
  direccion: 'direccion',
  ciudad: 'ciudad',
  logoUrl: 'logo_url',
  colorPrimario: 'color_primario',
  colorSecundario: 'color_secundario',
}

const SNAKE_TO_CAMEL_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(CAMEL_TO_SNAKE_MAP).map(([camel, snake]) => [snake, camel])
)

const transformarDesdeSupabase = (filaDb?: Record<string, unknown> | null): DatosClinicaConfig | null => {
  if (!filaDb) return null
  const resultado: DatosClinicaConfig = {}
  for (const [claveDb, valor] of Object.entries(filaDb)) {
    if (claveDb === 'id' || claveDb === 'created_at' || claveDb === 'updated_at') continue
    const claveJs = SNAKE_TO_CAMEL_MAP[claveDb] || claveDb
    resultado[claveJs] = valor ?? ''
  }
  return resultado
}

const transformarParaSupabase = (datosJs?: DatosClinicaConfig | null): Record<string, unknown> | null => {
  if (!datosJs) return null
  const resultado: Record<string, unknown> = {}
  for (const [claveJs, valor] of Object.entries(datosJs)) {
    const claveDb = CAMEL_TO_SNAKE_MAP[claveJs]
    if (claveDb && valor !== undefined) {
      resultado[claveDb] = valor === '' ? null : valor
    }
  }
  return resultado
}

const obtenerClinicaDesdeSupabase = async (clinicaId?: string | null): Promise<DatosClinicaConfig | null> => {
  if (!USE_SUPABASE || !supabase || !clinicaId) return null

  try {
    const { data, error } = await supabase
      .from('clinicas')
      .select('*')
      .eq('id', clinicaId)
      .maybeSingle()

    if (error) {
      log.warn('Error leyendo clínica desde Supabase:', error.message)
      return null
    }

    return transformarDesdeSupabase(data as Record<string, unknown> | null)
  } catch (e: unknown) {
    log.error('Excepción leyendo clínica:', e)
    return null
  }
}

const guardarClinicaEnSupabase = async (clinicaId: string, datos: DatosClinicaConfig): Promise<boolean> => {
  if (!USE_SUPABASE || !supabase || !clinicaId) return false

  try {
    const paraInsert = transformarParaSupabase(datos)
    if (!paraInsert) return false

    const { error } = await supabase
      .from('clinicas')
      .update(paraInsert)
      .eq('id', clinicaId)

    if (error) {
      log.error('Error guardando clínica en Supabase:', error.message)
      return false
    }

    return true
  } catch (e: unknown) {
    log.error('Excepción guardando clínica:', e)
    return false
  }
}

const migrarClinicaASupabase = async (clinicaId: string): Promise<boolean> => {
  if (!USE_SUPABASE || !supabase || !clinicaId) return false

  try {
    const datosLocal = clinicaRepo.obtener(undefined)
    if (!datosLocal || !datosLocal.nombreClinica) return false

    const { data: existente } = await supabase
      .from('clinicas')
      .select('nombre')
      .eq('id', clinicaId)
      .maybeSingle()

    if (existente?.nombre) return false

    const ok = await guardarClinicaEnSupabase(clinicaId, datosLocal)
    if (ok) {
      log.info('Datos de clínica migrados a Supabase')
    }
    return ok
  } catch (e: unknown) {
    log.error('Error migrando clínica:', e)
    return false
  }
}

export const clinicStorageService: ClinicStorageServiceAPI = {
  obtenerClinica: (defaults) => clinicaRepo.obtener(defaults),

  guardarClinica: (datos) => clinicaRepo.guardar(datos),

  guardarClinicaCompleta: async (clinicaId, datos) => {
    clinicaRepo.guardar(datos)
    await guardarClinicaEnSupabase(clinicaId, datos)
  },

  sincronizarClinicaDesdeSupabase: async (clinicaId) => {
    const datos = await obtenerClinicaDesdeSupabase(clinicaId)
    if (datos) {
      clinicaRepo.guardar(datos)
    }
    return datos
  },

  migrarClinicaSiNecesario: migrarClinicaASupabase
}

// Alias para compatibilidad con código existente
export const configuracionStorageService = clinicStorageService
