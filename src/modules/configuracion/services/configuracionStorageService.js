/**
 * Servicio de Persistencia y Copias de Seguridad (Backup / Restore)
 *
 * F6-C-e: la configuración de clínica (branding/logo) ahora persiste en la
 * tabla `clinicas` de Supabase cuando VITE_USE_SUPABASE=true. Los parámetros
 * de agenda y el backup/restore siguen en localStorage (no son compartidos
 * entre usuarios de la misma clínica).
 *
 * Migración automática: al primer load con Supabase activo, si el usuario es
 * admin y hay datos en localStorage, se migran a la tabla clinicas.
 */
import { createLocalStorageRepository } from '../../../services/localStorageRepository'
import { supabase, USE_SUPABASE } from '../../../services/supabaseClient'

const KEY_CLINICA = 'studio_dental_config_clinica'
const KEY_PARAMETROS_AGENDA = 'studio_dental_config_agenda'

const clinicaRepo = createLocalStorageRepository(KEY_CLINICA, undefined, { notify: true })
const parametrosAgendaRepo = createLocalStorageRepository(KEY_PARAMETROS_AGENDA, undefined)

// ═══════════════════════════════════════════════════════════════════
// TRANSFORMACIÓN camelCase ↔ snake_case (F6-C-e)
// ═══════════════════════════════════════════════════════════════════

const CAMEL_TO_SNAKE_MAP = {
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

const SNAKE_TO_CAMEL_MAP = Object.fromEntries(
  Object.entries(CAMEL_TO_SNAKE_MAP).map(([camel, snake]) => [snake, camel])
)

const transformarDesdeSupabase = (filaDb) => {
  if (!filaDb) return null
  const resultado = {}
  for (const [claveDb, valor] of Object.entries(filaDb)) {
    if (claveDb === 'id' || claveDb === 'created_at' || claveDb === 'updated_at') continue
    const claveJs = SNAKE_TO_CAMEL_MAP[claveDb] || claveDb
    resultado[claveJs] = valor ?? ''
  }
  return resultado
}

const transformarParaSupabase = (datosJs) => {
  if (!datosJs) return null
  const resultado = {}
  for (const [claveJs, valor] of Object.entries(datosJs)) {
    const claveDb = CAMEL_TO_SNAKE_MAP[claveJs]
    if (claveDb && valor !== undefined) {
      resultado[claveDb] = valor === '' ? null : valor
    }
  }
  return resultado
}

// ═══════════════════════════════════════════════════════════════════
// API SUPABASE (F6-C-e)
// ═══════════════════════════════════════════════════════════════════

/**
 * Obtiene la configuración de la clínica desde Supabase usando el clinicaId
 * del usuario actual. Retorna null si Supabase no está configurado, si no hay
 * sesión, o si el usuario no tiene clinicaId.
 */
const obtenerClinicaDesdeSupabase = async (clinicaId) => {
  if (!USE_SUPABASE || !supabase || !clinicaId) return null

  try {
    const { data, error } = await supabase
      .from('clinicas')
      .select('*')
      .eq('id', clinicaId)
      .maybeSingle()

    if (error) {
      console.warn('[configuracionStorageService] Error leyendo clínica desde Supabase:', error.message)
      return null
    }

    return transformarDesdeSupabase(data)
  } catch (e) {
    console.error('[configuracionStorageService] Excepción leyendo clínica:', e)
    return null
  }
}

/**
 * Guarda la configuración de la clínica en Supabase. Solo el admin puede
 * escribir (RLS: admin_actualiza_su_clinica). Retorna boolean de éxito.
 */
const guardarClinicaEnSupabase = async (clinicaId, datos) => {
  if (!USE_SUPABASE || !supabase || !clinicaId) return false

  try {
    const paraInsert = transformarParaSupabase(datos)
    const { error } = await supabase
      .from('clinicas')
      .update(paraInsert)
      .eq('id', clinicaId)

    if (error) {
      console.error('[configuracionStorageService] Error guardando clínica en Supabase:', error.message)
      return false
    }

    return true
  } catch (e) {
    console.error('[configuracionStorageService] Excepción guardando clínica:', e)
    return false
  }
}

/**
 * Migra datos desde localStorage a la tabla clinicas de Supabase (una sola vez).
 * Solo se ejecuta si:
 * - Supabase está activo
 * - El usuario tiene clinicaId
 * - Hay datos en localStorage
 * - La fila en Supabase está vacía (no tiene nombre)
 *
 * Retorna true si se migró, false si no había nada que migrar.
 */
const migrarClinicaASupabase = async (clinicaId) => {
  if (!USE_SUPABASE || !supabase || !clinicaId) return false

  try {
    const datosLocal = clinicaRepo.obtener(undefined)
    if (!datosLocal || !datosLocal.nombreClinica) return false

    const { data: existente } = await supabase
      .from('clinicas')
      .select('nombre')
      .eq('id', clinicaId)
      .maybeSingle()

    if (existente?.nombre) return false // Ya tiene datos, no sobrescribir

    const ok = await guardarClinicaEnSupabase(clinicaId, datosLocal)
    if (ok) {
      console.log('[configuracionStorageService] Datos de clínica migrados a Supabase')
    }
    return ok
  } catch (e) {
    console.error('[configuracionStorageService] Error migrando clínica:', e)
    return false
  }
}

// ═══════════════════════════════════════════════════════════════════
// API PÚBLICA (mantiene compatibilidad con useConfiguracion.js)
// ═══════════════════════════════════════════════════════════════════

export const configuracionStorageService = {
  // SÍNCRONO: lee desde localStorage (caché rápida para uso en useState inicial)
  obtenerClinica: (defaults) => clinicaRepo.obtener(defaults),

  // SÍNCRONO: escribe en localStorage (caché local).
  // Para persistir en Supabase usar guardarClinicaCompleta (async).
  guardarClinica: (datos) => clinicaRepo.guardar(datos),

  // ASYNC: guarda en Supabase + actualiza caché en localStorage.
  // Usar desde useConfiguracion cuando el admin guarda el formulario.
  guardarClinicaCompleta: async (clinicaId, datos) => {
    // Actualizar caché local primero (UX optimista)
    clinicaRepo.guardar(datos)
    // Persistir en Supabase (silenciosamente si falla)
    await guardarClinicaEnSupabase(clinicaId, datos)
  },

  // ASYNC: lee desde Supabase y actualiza caché en localStorage.
  // Usar desde useConfiguracion al montar el módulo.
  sincronizarClinicaDesdeSupabase: async (clinicaId) => {
    const datos = await obtenerClinicaDesdeSupabase(clinicaId)
    if (datos) {
      clinicaRepo.guardar(datos)
    }
    return datos
  },

  // ASYNC: migra datos desde localStorage a Supabase (una sola vez).
  // Usar desde useConfiguracion al primer load si es admin.
  migrarClinicaSiNecesario: migrarClinicaASupabase,

  obtenerParametrosAgenda: (defaults) => parametrosAgendaRepo.obtener(defaults),
  guardarParametrosAgenda: (parametros) => parametrosAgendaRepo.guardar(parametros),

  // Backup/restore completo: opera sobre TODA la base de LocalStorage, no
  // sobre una clave individual — no encaja en el patrón de repositorio de
  // clave fija y se deja fuera del alcance de F2-03 intencionalmente.
  exportarBaseDeDatosCompleta: () => {
    const backupObj = {
      versionSystem: '3.0.0',
      fechaExportacion: new Date().toISOString(),
      localStorageData: {}
    }

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      backupObj.localStorageData[key] = localStorage.getItem(key)
    }

    return backupObj
  },

  importarBaseDeDatosCompleta: (jsonBackup) => {
    if (!jsonBackup || !jsonBackup.localStorageData) {
      throw new Error('El archivo de respaldo no tiene un formato válido de Studio Dental OS.')
    }

    localStorage.clear()
    Object.entries(jsonBackup.localStorageData).forEach(([key, val]) => {
      localStorage.setItem(key, val)
    })
    window.dispatchEvent(new Event('storage'))
  },

  // Limpieza total de la base de datos local (F2-07 — migración desde RespaldoDatosSection.jsx).
  limpiarBaseDeDatosCompleta: () => {
    try {
      localStorage.clear()
      window.dispatchEvent(new Event('storage'))
      return true
    } catch (e) {
      console.error('Error al limpiar base de datos:', e)
      return false
    }
  }
}
