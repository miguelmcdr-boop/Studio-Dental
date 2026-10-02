/**
 * Servicio de cola offline para pagos (P1-3).
 *
 * Sigue el patrón probado de pendingDeletes (P0-1), pendingUploads (P0-2),
 * pendingEvoluciones (P1-3) y pendingPacientes (P1-3).
 *
 * Responsabilidades:
 * - Gestionar la cola local tenant-aware en pendingPagos
 * - Encolar creaciones y registros realizados offline
 * - Procesar la cola con drenaje atómico al restaurar conectividad
 * - Gestionar cola de eliminaciones explícitas en pendingDeletesPagos
 * - Proteger pagos pendientes ante purga en sincronizaciones remotas
 *
 * Arquitectura:
 * Extraído de pagosStorageService.js para respetar el límite
 * arquitectónico constitucional de 321 líneas.
 */
import { supabase, USE_SUPABASE } from '../../../services/supabaseClient'
import { createTenantRepository } from '../../../services/localStorageRepository'
import { getClinicaActiva } from '../../../services/authService'
import { esUuidValido } from '../../../services/migrations/uuidUtils'
import { migrationStorageService } from '../../../services/migrationStorageService'
import { transformarParaSupabase, transformarDesdeSupabase, mergeCamposLocales } from './pagosTransformations'
import type { Pago } from './pagosStorageService'
import { createLogger } from '../../../services/logger'

const log = createLogger('pagosOfflineQueue')

export interface PendingPagoItem {
  id: string | number
  folio?: string
  clinicaId?: string | null
  timestamp?: number
  [key: string]: unknown
}

export type PendingPago = PendingPagoItem | string | number

export interface ProcesarColaPagosResult {
  procesados: number
  fallidos: number
  razon?: string
  offline?: boolean
}

export interface GuardarPagoContext {
  obtenerPagos: () => Pago[]
  actualizarPagosLocal: (pagos: Pago[]) => void
  pagosRepo?: unknown
}

export interface EncolarPagoParams {
  id: string | number
  folio?: string
  clinicaId?: string | null
}

// Cola local aislada por clínica/tenant para registros de pagos pendientes
export const pendingPagosRepo = createTenantRepository<PendingPago[]>('studio_dental_pagos_pending', [])

// Cola local aislada por tenant para registrar eliminaciones pendientes explícitas
const STORAGE_KEY_PAGOS_PENDING_DELETES = 'studio_dental_pagos_pending_deletes'
export const pendingDeletesPagosRepo = createTenantRepository<Array<string | number>>(STORAGE_KEY_PAGOS_PENDING_DELETES, [])

export const obtenerClinicaId = (): string | null => {
  try {
    return getClinicaActiva?.() || null
  } catch {
    return null
  }
}

export const obtenerPendingDeletesPagos = (): Array<string | number> => {
  return pendingDeletesPagosRepo.obtener([]) || []
}

export const guardarPendingDeletesPagos = (ids?: Array<string | number> | null): void => {
  if (!ids || ids.length === 0) {
    pendingDeletesPagosRepo.eliminar()
  } else {
    pendingDeletesPagosRepo.guardar(ids)
  }
}

/**
 * Procesa eliminaciones pendientes explícitas diferidas.
 */
export const procesarPendingDeletesPagosHelper = async (): Promise<void> => {
  if (!USE_SUPABASE || !supabase) return

  const pendingDeletes = obtenerPendingDeletesPagos()
  if (!Array.isArray(pendingDeletes) || pendingDeletes.length === 0) {
    return
  }

  const exitosos: Array<string | number> = []

  for (const idAEliminar of pendingDeletes) {
    if (!esUuidValido(idAEliminar)) {
      exitosos.push(idAEliminar)
      continue
    }

    try {
      const { error: deleteError } = await supabase
        .from('pagos')
        .delete()
        .eq('id', idAEliminar)

      if (!deleteError) {
        exitosos.push(idAEliminar)
      } else {
        log.warn(`Error al aplicar eliminación diferida a pago ${idAEliminar}:`, deleteError.message)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      log.warn(`Excepción al aplicar eliminación diferida a pago ${idAEliminar}:`, msg)
    }
  }

  if (exitosos.length > 0) {
    const exitososSet = new Set(exitosos)
    const restantes = pendingDeletes.filter((id) => !exitososSet.has(id))
    guardarPendingDeletesPagos(restantes)
  }
}

/**
 * Obtiene la lista de pagos pendientes de sincronizar para la clínica activa.
 */
export const obtenerPendingPagos = (): PendingPago[] => {
  return pendingPagosRepo.obtener([]) || []
}

/**
 * Guarda la lista de pagos pendientes de sincronizar para la clínica activa.
 */
export const guardarPendingPagos = (pending?: PendingPago[] | null): void => {
  if (!pending || pending.length === 0) {
    pendingPagosRepo.eliminar()
  } else {
    pendingPagosRepo.guardar(pending)
  }
}

/**
 * Encola un pago en pendingPagos de forma idempotente.
 */
export const encolarPago = ({ id, folio, clinicaId }: EncolarPagoParams): void => {
  try {
    const clinicaIdEfectivo = clinicaId || obtenerClinicaId()
    const pending = obtenerPendingPagos()
    const yaEncolado = pending.some((item) =>
      typeof item === 'object' && item !== null ? item.id === id : item === id
    )
    if (!yaEncolado) {
      pending.push({
        id,
        folio,
        clinicaId: clinicaIdEfectivo,
        timestamp: Date.now()
      })
      guardarPendingPagos(pending)
    }
  } catch (errQueue: unknown) {
    const msg = errQueue instanceof Error ? errQueue.message : String(errQueue)
    log.warn('Error al encolar en pendingPagos:', msg)
  }
}

/**
 * Registra un pago individual (offline-first).
 */
export const registrarPagoHelper = async (
  pago: Pago,
  { obtenerPagos, actualizarPagosLocal }: GuardarPagoContext
): Promise<Pago | null> => {
  if (!pago) return null

  const id = pago.id || Date.now()
  const clinicaIdActual = obtenerClinicaId()

  const pagoLocal: Pago = {
    ...pago,
    id,
    sincronizado: false
  }

  // 1. Actualizar caché y localStorage inmediatamente (offline-first)
  const listado = Array.isArray(obtenerPagos()) ? [...obtenerPagos()] : []
  const idx = listado.findIndex((p) => p.id === id || (pago.folioComprobante && p.folioComprobante === pago.folioComprobante))
  if (idx >= 0) {
    listado[idx] = pagoLocal
  } else {
    listado.unshift(pagoLocal)
  }
  actualizarPagosLocal(listado)

  // 2. Intentar sincronizar con Supabase
  let subidoExitoso = false
  if (USE_SUPABASE && supabase) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const paraSupabase = {
          ...transformarParaSupabase(pagoLocal),
          user_id: user.id
        }

        if (esUuidValido(pagoLocal.id)) {
          const { error: upsertErr } = await supabase
            .from('pagos')
            .upsert(paraSupabase, { onConflict: 'id' })
          if (!upsertErr) {
            subidoExitoso = true
          } else {
            log.warn('Error al actualizar pago en Supabase:', upsertErr.message)
          }
        } else {
          delete paraSupabase.id
          const { data: insertado, error: insertErr } = await supabase
            .from('pagos')
            .insert(paraSupabase)
            .select('id')
            .single()

          if (!insertErr && insertado?.id) {
            subidoExitoso = true
            const oldId = pagoLocal.id
            pagoLocal.id = insertado.id
            migrationStorageService.registrarMapeo(oldId, insertado.id)
          } else {
            log.warn('Error al insertar pago en Supabase:', insertErr?.message)
          }
        }

        if (subidoExitoso) {
          pagoLocal.sincronizado = true
          const idxFinal = listado.findIndex((p) => p.id === id || p.id === pagoLocal.id)
          if (idxFinal >= 0) {
            listado[idxFinal] = pagoLocal
            actualizarPagosLocal(listado)
          }
        }
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      log.warn('Fallo al sincronizar pago con Supabase, encolando offline:', msg)
    }
  }

  // 3. Si no se subió con éxito, encolar en pendingPagos
  if (!subidoExitoso) {
    encolarPago({
      id,
      folio: pagoLocal.folioComprobante || (pagoLocal.folio as string | undefined),
      clinicaId: clinicaIdActual
    })
  }

  return pagoLocal
}

/**
 * Procesa la cola de pagos pendientes con drenaje atómico y aislamiento multi-tenant.
 */
export const procesarColaPagosHelper = async ({
  obtenerPagos,
  actualizarPagosLocal
}: GuardarPagoContext): Promise<ProcesarColaPagosResult> => {
  const clinicaIdActual = obtenerClinicaId()
  if (!clinicaIdActual) {
    return { procesados: 0, fallidos: 0, razon: 'sin-clinica' }
  }

  const pending = obtenerPendingPagos()
  if (!pending || pending.length === 0) {
    await procesarPendingDeletesPagosHelper()
    return { procesados: 0, fallidos: 0 }
  }

  if (!USE_SUPABASE || !supabase) {
    return { procesados: 0, fallidos: 0, offline: true }
  }

  let procesados = 0
  let fallidos = 0
  const procesadosExitososIds: Array<string | number> = []
  const listado = Array.isArray(obtenerPagos()) ? [...obtenerPagos()] : []

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { procesados: 0, fallidos: 0, razon: 'sin-usuario' }
    }

    for (const item of pending) {
      const id = typeof item === 'object' && item !== null ? item.id : item
      const itemFolio = typeof item === 'object' && item !== null ? item.folio : undefined
      const itemClinicaId = typeof item === 'object' && item !== null ? (item.clinicaId || clinicaIdActual) : clinicaIdActual

      // Aislamiento multi-tenant: procesar solo si pertenece a la clínica activa
      if (itemClinicaId !== clinicaIdActual) {
        continue
      }

      try {
        const idx = listado.findIndex((p) => p.id === id || (itemFolio && p.folioComprobante === itemFolio))
        if (idx < 0) {
          // Ya no existe localmente, retirar de la cola
          procesadosExitososIds.push(id)
          continue
        }

        const pagoLocal = listado[idx]
        if (pagoLocal.sincronizado && esUuidValido(pagoLocal.id)) {
          procesadosExitososIds.push(id)
          continue
        }

        const paraSupabase = {
          ...transformarParaSupabase(pagoLocal),
          user_id: user.id
        }

        if (esUuidValido(pagoLocal.id)) {
          const { error: upsertErr } = await supabase
            .from('pagos')
            .upsert(paraSupabase, { onConflict: 'id' })

          if (upsertErr) throw upsertErr

          listado[idx] = { ...pagoLocal, sincronizado: true }
          procesadosExitososIds.push(id)
          procesados++
        } else {
          delete paraSupabase.id
          const { data: insertado, error: insertErr } = await supabase
            .from('pagos')
            .insert(paraSupabase)
            .select('id')
            .single()

          if (insertErr) throw insertErr

          if (insertado?.id) {
            const oldId = pagoLocal.id
            listado[idx] = { ...pagoLocal, id: insertado.id, sincronizado: true }
            migrationStorageService.registrarMapeo(oldId, insertado.id)
            procesadosExitososIds.push(id)
            procesados++
          } else {
            fallidos++
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        log.warn(`Error al procesar pago pendiente ${id}:`, msg)
        fallidos++
      }
    }

    if (procesados > 0) {
      actualizarPagosLocal(listado)
    }

    // Drenaje atómico: solo retirar los exitosamente procesados
    if (procesadosExitososIds.length > 0) {
      const colaRestante = pending.filter((item) => {
        const id = typeof item === 'object' && item !== null ? item.id : item
        return !procesadosExitososIds.includes(id)
      })
      guardarPendingPagos(colaRestante)
    }

    // Procesar eliminaciones explícitas pendientes al restaurar conexión
    await procesarPendingDeletesPagosHelper()
  } catch (errGlobal: unknown) {
    log.error('Error global al procesar cola de pagos:', errGlobal)
    return { procesados, fallidos: fallidos + 1 }
  }

  return { procesados, fallidos }
}

/**
 * Refresca pagos desde Supabase protegiendo pagos locales offline (P1-3).
 */
export const sincronizarPagosDesdeSupabaseHelper = async ({
  obtenerPagos,
  actualizarPagosLocal
}: GuardarPagoContext): Promise<Pago[]> => {
  log.info('Iniciando sincronización de pagos desde Supabase...')

  if (!USE_SUPABASE || !supabase) {
    log.info('Supabase no configurado, retornando caché')
    return obtenerPagos()
  }

  try {
    const clinicaIdActual = obtenerClinicaId()
    const localesActuales = obtenerPagos() || []
    const pending = obtenerPendingPagos()
    const pendingDelTenant = pending.filter((p) =>
      typeof p === 'object' && p !== null ? (!p.clinicaId || p.clinicaId === clinicaIdActual) : true
    )

    const idsPendientes = new Set(
      pendingDelTenant.map((p) => (typeof p === 'object' && p !== null ? p.id : p))
    )
    const foliosPendientes = new Set(
      pendingDelTenant
        .map((p) => (typeof p === 'object' && p !== null ? p.folio : null))
        .filter((f): f is string => Boolean(f))
    )

    const protegidosLocales = localesActuales.filter(
      (p) => idsPendientes.has(p.id) || (p.folioComprobante && foliosPendientes.has(p.folioComprobante)) || p.sincronizado === false
    )

    const { data, error } = await supabase
      .from('pagos')
      .select('*')
      .order('fecha', { ascending: false })

    if (error) {
      log.warn('Error al sincronizar pagos desde Supabase:', error.message)
      return localesActuales
    }

    if (!Array.isArray(data)) return localesActuales

    const desdeSupabaseTransformados = (data.map(transformarDesdeSupabase).filter(Boolean) as Pago[])
    const combinados = mergeCamposLocales(desdeSupabaseTransformados, localesActuales)

    // Fusionar respetando los pagos offline protegidos que aún no están en Supabase
    const idsRemotos = new Set(combinados.map((p) => p.id))
    const foliosRemotos = new Set(combinados.map((p) => p.folioComprobante).filter((f): f is string => Boolean(f)))

    const protegidosNoPresentes = protegidosLocales.filter(
      (p) => !idsRemotos.has(p.id) && (!p.folioComprobante || !foliosRemotos.has(p.folioComprobante))
    )

    const listaFinal = [...protegidosNoPresentes, ...combinados]
    actualizarPagosLocal(listaFinal)
    return listaFinal
  } catch (error: unknown) {
    log.error('Excepción al sincronizar pagos desde Supabase:', error)
    return obtenerPagos()
  }
}

/**
 * Elimina un pago encolando su ID para soft-delete o eliminación remota diferida.
 */
export const eliminarPagoHelper = async (
  pagoId: string | number,
  { obtenerPagos, actualizarPagosLocal }: GuardarPagoContext
): Promise<boolean> => {
  const actuales = obtenerPagos() || []
  const actualizados = actuales.filter((p) => String(p.id) !== String(pagoId))
  actualizarPagosLocal(actualizados)

  // Encolar ID en pendingDeletesPagos
  const pendingDeletes = obtenerPendingDeletesPagos()
  if (!pendingDeletes.includes(pagoId)) {
    guardarPendingDeletesPagos([...pendingDeletes, pagoId])
  }

  if (USE_SUPABASE && supabase && esUuidValido(pagoId)) {
    try {
      const { error } = await supabase.from('pagos').delete().eq('id', pagoId)
      if (!error) {
        const restantes = obtenerPendingDeletesPagos().filter((id) => id !== pagoId)
        guardarPendingDeletesPagos(restantes)
      } else {
        log.warn('Error al eliminar pago en Supabase, queda en cola:', error.message)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      log.warn('Excepción al eliminar pago en Supabase, queda en cola:', msg)
    }
  }

  return true
}
