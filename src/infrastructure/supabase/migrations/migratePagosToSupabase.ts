/**
 * Script de migración de pagos de localStorage a Supabase (F4-02c-5).
 *
 * Estrategia:
 * 1. Migra pagos globales de studio_dental_pagos_historial_v3 a tabla `pagos`
 *    con paciente_id = NULL (son pagos sin paciente específico)
 * 2. Migra abonos por paciente de abonos_${pacienteId} a tabla `pagos`
 *    con paciente_id = UUID del paciente
 * 3. Para cada pago/abono:
 *    a. Si ya tiene UUID, se omite
 *    b. Si ya fue migrado (legacyId mapeado), se omite
 *    c. Se convierte a formato Supabase (snake_case)
 *    d. Se inserta en Supabase y se registra el mapeo legacyId → supabaseId
 * 4. Retorna un resumen de la migración
 *
 * Es idempotente: puede ejecutarse múltiples veces sin duplicar pagos.
 */
import { supabase } from '../supabaseClient'
import { pagosStorageService, type Pago } from '../../../domains/billing/payment/services/pagosStorageService'
import { migrationStorageService } from '../../persistence/migrationStorageService'
import { esUuidValido } from './uuidUtils'
import { leerJSON } from '../../storage/localStorageRepository'
import { createLogger } from '../../logging/logger'

const log = createLogger('migratePagosToSupabase')

export interface MigratePagosError {
  pagoId?: string | number
  abonoId?: string | number
  pacienteId?: string | number
  folio?: string
  error: string
}

export interface MigratePagosResult {
  success: boolean
  migrados: number
  abonosMigrados: number
  omitidos: number
  errores: Array<MigratePagosError | string>
}

export interface VerificarPagosPendientesResult {
  totalGlobales: number
  globalesPendientes: number
  globalesYaMigrados: number
}

interface AbonoLegacyItem {
  id: string | number
  folio?: string
  folioComprobante?: string
  monto?: number
  metodoPago?: string
  fecha?: string
  concepto?: string
  descripcion?: string
  [key: string]: unknown
}

interface PagoSupabasePayload {
  user_id: string
  paciente_id: string | null
  folio: string
  monto: number
  metodo_pago: string
  fecha: string
  concepto: string
}

/**
 * Convierte un pago de formato localStorage (camelCase) a formato
 * Supabase (snake_case).
 */
const transformarPagoParaSupabase = (
  pago: Pago | AbonoLegacyItem,
  userId: string,
  pacienteUuid: string | null
): PagoSupabasePayload => {
  return {
    user_id: userId,
    paciente_id: pacienteUuid || null,
    folio: pago.folio || pago.folioComprobante || `PAGO-${Date.now()}`,
    monto: pago.monto || 0,
    metodo_pago: pago.metodoPago || 'Efectivo',
    fecha: pago.fecha || new Date().toISOString().split('T')[0],
    concepto: (pago.concepto || (pago as Record<string, unknown>).descripcion || '') as string
  }
}

/**
 * Ejecuta la migración de pagos de localStorage a Supabase.
 *
 * @param userId - UUID del usuario autenticado en Supabase
 * @returns resumen de migración
 */
export const migratePagosToSupabase = async (userId: string): Promise<MigratePagosResult> => {
  if (!supabase) {
    return {
      success: false,
      migrados: 0,
      abonosMigrados: 0,
      omitidos: 0,
      errores: ['Supabase no configurado']
    }
  }

  if (!userId) {
    return {
      success: false,
      migrados: 0,
      abonosMigrados: 0,
      omitidos: 0,
      errores: ['userId requerido para la migración']
    }
  }

  const resultado: MigratePagosResult = {
    success: true,
    migrados: 0,
    abonosMigrados: 0,
    omitidos: 0,
    errores: []
  }

  // ═══════════════════════════════════════════════════
  // PASO 1: Migrar pagos globales (sin paciente específico)
  // ═══════════════════════════════════════════════════
  const pagosGlobales = pagosStorageService.obtenerPagos([])
  
  for (const pago of pagosGlobales) {
    try {
      // Si ya tiene UUID, omitir (ya está en Supabase)
      if (esUuidValido(pago.id)) {
        resultado.omitidos++
        continue
      }

      // Si ya fue migrado (legacyId mapeado a UUID), omitir
      if (migrationStorageService.yaFueMigrado(pago.id)) {
        resultado.omitidos++
        continue
      }

      // Transformar a formato Supabase (paciente_id = NULL para pagos globales)
      const pagoSupabase = transformarPagoParaSupabase(pago, userId, null)

      // Insertar en Supabase
      const { data, error } = await supabase
        .from('pagos')
        .insert(pagoSupabase)
        .select('id')
        .single()

      if (error) {
        resultado.errores.push({
          pagoId: pago.id,
          folio: pago.folio,
          error: error.message
        })
        continue
      }

      // Registrar mapeo legacyId → supabaseId
      migrationStorageService.registrarMapeo(pago.id, data.id)
      resultado.migrados++
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error)
      resultado.errores.push({
        pagoId: pago.id,
        folio: pago.folio,
        error: msg
      })
    }
  }

  // ═══════════════════════════════════════════════════
  // PASO 2: Migrar abonos por paciente
  // ═══════════════════════════════════════════════════
  log.info('[migratePagos] Buscando abonos por paciente...')
  
  // Obtener todos los pacientes migrados para buscar sus abonos
  const { data: pacientes } = await supabase
    .from('pacientes')
    .select('id')

  if (Array.isArray(pacientes)) {
    for (const paciente of pacientes) {
      try {
        // Buscar el legacyId de este paciente
        const legacyId = migrationStorageService.obtenerLegacyId(paciente.id)
        if (!legacyId) continue

        // Leer abonos de localStorage usando el legacyId
        const abonos = leerJSON<AbonoLegacyItem[]>(`abonos_${legacyId}`, [])
        if (!Array.isArray(abonos) || abonos.length === 0) continue

        log.info(`[migratePagos] Migrando ${abonos.length} abonos del paciente ${legacyId}...`)

        for (const abono of abonos) {
          try {
            // Si el abono ya tiene UUID, omitir
            if (esUuidValido(abono.id)) continue

            // Si ya fue migrado, omitir
            if (migrationStorageService.yaFueMigrado(abono.id)) continue

            const abonoSupabase = transformarPagoParaSupabase(abono, userId, paciente.id)

            const { data: insertado, error: abonoError } = await supabase
              .from('pagos')
              .insert(abonoSupabase)
              .select('id')
              .single()

            if (abonoError) {
              log.error(`[migratePagos] Error al migrar abono:`, abonoError.message)
              resultado.errores.push({
                abonoId: abono.id,
                pacienteId: legacyId,
                error: abonoError.message
              })
              continue
            }

            // Registrar mapeo legacyId → supabaseId
            migrationStorageService.registrarMapeo(abono.id, insertado.id)
            resultado.abonosMigrados++
          } catch (abonoException: unknown) {
            const msg = abonoException instanceof Error ? abonoException.message : String(abonoException)
            log.error(`[migratePagos] Excepción al migrar abono:`, msg)
            resultado.errores.push({
              abonoId: abono.id,
              pacienteId: legacyId,
              error: msg
            })
          }
        }
      } catch (pacienteException: unknown) {
        const msg = pacienteException instanceof Error ? pacienteException.message : String(pacienteException)
        log.error(`[migratePagos] Error procesando paciente ${paciente.id}:`, msg)
      }
    }
  }

  return resultado
}

/**
 * Verifica si hay pagos pendientes de migrar.
 */
export const verificarPagosPendientes = (): VerificarPagosPendientesResult => {
  const pagosGlobales = pagosStorageService.obtenerPagos([])
  let globalesYaMigrados = 0

  for (const pago of pagosGlobales) {
    if (esUuidValido(pago.id)) {
      globalesYaMigrados++
      continue
    }
    if (migrationStorageService.yaFueMigrado(pago.id)) {
      globalesYaMigrados++
    }
  }

  return {
    totalGlobales: pagosGlobales.length,
    globalesPendientes: pagosGlobales.length - globalesYaMigrados,
    globalesYaMigrados
  }
}
