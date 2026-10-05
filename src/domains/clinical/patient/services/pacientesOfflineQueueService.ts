/**
 * Servicio de cola offline para pacientes (P1-3).
 *
 * Sigue el patrón probado de pendingDeletes (P0-1), pendingUploads (P0-2)
 * y pendingEvoluciones (P1-3 parcial).
 *
 * Responsabilidades:
 * - Gestionar la cola local tenant-aware en pendingPacientes
 * - Encolar creaciones y ediciones realizadas offline
 * - Procesar la cola con drenaje atómico al restaurar la conectividad
 *
 * Arquitectura:
 * Extraído de pacientesStorageService.js para respetar el límite
 * arquitectónico constitucional de 463 líneas.
 */
import { supabase, USE_SUPABASE } from '../../../../infrastructure/supabase/supabaseClient'
import { createTenantRepository } from '../../../../infrastructure/storage/localStorageRepository'
import { getClinicaActivaSync } from '../../../../infrastructure/auth/authService'
import { esUuidValido } from '../../../../infrastructure/supabase/migrations/uuidUtils'
import { migrationStorageService } from '../../../../infrastructure/persistence/migrationStorageService'
import { transformarParaSupabase, transformarDesdeSupabase } from './pacientesTransformations'
import { validarPaciente, type Paciente } from '../schemas/pacienteSchema'
import { createLogger } from '../../../../infrastructure/logging/logger'

const log = createLogger('pacientesOfflineQueue')

export interface PendingPacienteItem {
  id: string | number
  rut?: string
  clinicaId?: string | null
  timestamp?: number
  [key: string]: unknown
}

export type PendingPaciente = PendingPacienteItem | string | number

export interface ProcesarColaResult {
  procesados: number
  fallidos: number
  razon?: string
  offline?: boolean
}

export interface GuardarPacienteContext {
  obtenerPacientes: () => Paciente[]
  actualizarPacientesLocal: (pacientes: Paciente[]) => void
}

export interface EncolarPacienteParams {
  id: string | number
  rut?: string
  clinicaId?: string | null
}

// Cola local aislada por clínica/tenant para creaciones/ediciones
export const pendingPacientesRepo = createTenantRepository<PendingPaciente[]>('studio_dental_pacientes_pending', [])

// P0-1 / P1-3: Repositorio aislado por tenant para registrar eliminaciones pendientes explícitas
const STORAGE_KEY_PACIENTES_PENDING_DELETES = 'studio_dental_pacientes_pending_deletes'
export const pendingDeletesPacientesRepo = createTenantRepository<string[]>(STORAGE_KEY_PACIENTES_PENDING_DELETES, [])

export const obtenerClinicaId = (): string | null => {
  try {
    return getClinicaActivaSync()
  } catch {
    return null
  }
}

export const obtenerPendingDeletesPacientes = (): string[] => {
  return pendingDeletesPacientesRepo.obtener([]) || []
}

export const guardarPendingDeletesPacientes = (ids?: string[] | null): void => {
  if (!ids || ids.length === 0) {
    pendingDeletesPacientesRepo.eliminar()
  } else {
    pendingDeletesPacientesRepo.guardar(ids)
  }
}

/**
 * Procesa eliminaciones pendientes explícitas (soft-delete vía UPDATE).
 * PROHIBIDO el diff destructivo por ausencia de IDs en memoria.
 */
export const procesarPendingDeletesPacientesHelper = async (): Promise<void> => {
  if (!USE_SUPABASE || !supabase) return

  const pendingDeletes = obtenerPendingDeletesPacientes()
  if (!Array.isArray(pendingDeletes) || pendingDeletes.length === 0) {
    return
  }

  const exitosos: string[] = []
  const timestampEliminacion = new Date().toISOString()

  for (const idAEliminar of pendingDeletes) {
    if (!esUuidValido(idAEliminar)) {
      exitosos.push(idAEliminar)
      continue
    }

    try {
      const { error: updateError } = await supabase
        .from('pacientes')
        .update({ deleted_at: timestampEliminacion })
        .eq('id', idAEliminar)
        .is('deleted_at', null)

      if (!updateError) {
        exitosos.push(idAEliminar)
      } else {
        log.warn(`Error al aplicar soft-delete a paciente ${idAEliminar}:`, updateError.message)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      log.warn(`Excepción al aplicar soft-delete a paciente ${idAEliminar}:`, msg)
    }
  }

  if (exitosos.length > 0) {
    const exitososSet = new Set(exitosos)
    const restantes = pendingDeletes.filter(id => !exitososSet.has(id))
    guardarPendingDeletesPacientes(restantes)
  }
}

/**
 * Obtiene la lista de pacientes pendientes de sincronizar para la clínica activa.
 */
export const obtenerPendingPacientes = (): PendingPaciente[] => {
  return pendingPacientesRepo.obtener([]) || []
}

/**
 * Guarda la lista de pacientes pendientes de sincronizar para la clínica activa.
 */
export const guardarPendingPacientes = (pending?: PendingPaciente[] | null): void => {
  if (!pending || pending.length === 0) {
    pendingPacientesRepo.eliminar()
  } else {
    pendingPacientesRepo.guardar(pending)
  }
}

/**
 * Encola un paciente en pendingPacientes de forma idempotente.
 */
export const encolarPaciente = ({ id, rut, clinicaId }: EncolarPacienteParams): void => {
  try {
    const clinicaIdEfectivo = clinicaId || obtenerClinicaId()
    const pending = obtenerPendingPacientes()
    const yaEncolado = pending.some((item) =>
      typeof item === 'object' && item !== null ? item.id === id : item === id
    )
    if (!yaEncolado) {
      pending.push({
        id,
        rut,
        clinicaId: clinicaIdEfectivo,
        timestamp: Date.now()
      })
      guardarPendingPacientes(pending)
    }
  } catch (errQueue: unknown) {
    const msg = errQueue instanceof Error ? errQueue.message : String(errQueue)
    log.warn('Error al encolar en pendingPacientes:', msg)
  }
}

/**
 * Guarda o actualiza un paciente individual (offline-first).
 */
export const guardarPacienteHelper = async (
  paciente: Paciente,
  { obtenerPacientes, actualizarPacientesLocal }: GuardarPacienteContext
): Promise<Paciente | null> => {
  if (!paciente) return null

  const id = paciente.id || Date.now()
  const clinicaIdActual = obtenerClinicaId()

  const pacienteLocal: Paciente = {
    ...paciente,
    id,
    sincronizado: false
  }

  // 1. Validar con esquema Zod
  const { valido, error } = validarPaciente(pacienteLocal)
  if (!valido) {
    log.error('Error de validación al guardar paciente:', error)
    return null
  }

  // 2. Actualizar caché y localStorage inmediatamente (offline-first)
  const listado = Array.isArray(obtenerPacientes()) ? [...obtenerPacientes()] : []
  const idx = listado.findIndex((p) => p.id === id || (paciente.rut && p.rut === paciente.rut))
  if (idx >= 0) {
    listado[idx] = pacienteLocal
  } else {
    listado.unshift(pacienteLocal)
  }
  actualizarPacientesLocal(listado)

  // 3. Intentar sincronizar con Supabase
  let subidoExitoso = false
  if (USE_SUPABASE && supabase) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const paraSupabase: Record<string, unknown> = {
          ...transformarParaSupabase(pacienteLocal),
          user_id: user.id
        }

        if (esUuidValido(pacienteLocal.id)) {
          const { error: upsertErr } = await supabase
            .from('pacientes')
            .upsert(paraSupabase, { onConflict: 'id' })
          if (!upsertErr) {
            subidoExitoso = true
          } else {
            log.warn('Error al actualizar paciente en Supabase:', upsertErr.message)
          }
        } else {
          delete paraSupabase.id
          const { data: insertado, error: insertErr } = await supabase
            .from('pacientes')
            .insert(paraSupabase)
            .select('id')
            .single()

          if (!insertErr && insertado?.id) {
            subidoExitoso = true
            const oldId = pacienteLocal.id
            pacienteLocal.id = insertado.id
            migrationStorageService.registrarMapeo(oldId, insertado.id)
          } else {
            log.warn('Error al insertar paciente en Supabase:', insertErr?.message)
          }
        }

        if (subidoExitoso) {
          pacienteLocal.sincronizado = true
          const idxFinal = listado.findIndex((p) => p.id === id || p.id === pacienteLocal.id)
          if (idxFinal >= 0) {
            listado[idxFinal] = pacienteLocal
            actualizarPacientesLocal(listado)
          }
        }
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      log.warn('Fallo al sincronizar paciente con Supabase, encolando offline:', msg)
    }
  }

  // 4. Si no se subió con éxito, encolar en pendingPacientes
  if (!subidoExitoso) {
    encolarPaciente({
      id,
      rut: pacienteLocal.rut,
      clinicaId: clinicaIdActual
    })
  }

  return pacienteLocal
}

/**
 * Procesa la cola de pacientes pendientes con drenaje atómico y fail-closed.
 */
export const procesarColaPacientesHelper = async ({
  obtenerPacientes,
  actualizarPacientesLocal
}: GuardarPacienteContext): Promise<ProcesarColaResult> => {
  const clinicaIdActual = obtenerClinicaId()
  if (!clinicaIdActual) {
    return { procesados: 0, fallidos: 0, razon: 'sin-clinica' }
  }

  const pending = obtenerPendingPacientes()
  if (!pending || pending.length === 0) {
    return { procesados: 0, fallidos: 0 }
  }

  if (!USE_SUPABASE || !supabase) {
    return { procesados: 0, fallidos: 0, offline: true }
  }

  let procesados = 0
  let fallidos = 0
  const procesadosExitososIds: Array<string | number> = []
  const listado = Array.isArray(obtenerPacientes()) ? [...obtenerPacientes()] : []

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { procesados: 0, fallidos: 0, razon: 'sin-usuario' }
    }

    for (const item of pending) {
      const id = typeof item === 'object' && item !== null ? item.id : item
      const itemRut = typeof item === 'object' && item !== null ? item.rut : undefined
      const itemClinicaId: string | null = typeof item === 'object' && item !== null ? (item.clinicaId || clinicaIdActual) : clinicaIdActual

      // Aislamiento multi-tenant: procesar solo si pertenece a la clínica activa
      if (itemClinicaId !== clinicaIdActual) {
        continue
      }

      try {
        const idx = listado.findIndex((p) => p.id === id || (itemRut && p.rut === itemRut))
        if (idx < 0) {
          // Ya no existe localmente, retirar de la cola
          procesadosExitososIds.push(id)
          continue
        }

        const pacLocal = listado[idx]
        if (pacLocal.sincronizado && esUuidValido(pacLocal.id)) {
          procesadosExitososIds.push(id)
          continue
        }

        const paraSupabase: Record<string, unknown> = {
          ...transformarParaSupabase(pacLocal),
          user_id: user.id
        }

        if (esUuidValido(pacLocal.id)) {
          const { error: upsertErr } = await supabase
            .from('pacientes')
            .upsert(paraSupabase, { onConflict: 'id' })

          if (upsertErr) throw upsertErr

          listado[idx] = { ...pacLocal, sincronizado: true }
          procesadosExitososIds.push(id)
          procesados++
        } else {
          delete paraSupabase.id
          const { data: insertado, error: insertErr } = await supabase
            .from('pacientes')
            .insert(paraSupabase)
            .select('id')
            .single()

          if (insertErr) throw insertErr

          if (insertado?.id) {
            const oldId = pacLocal.id
            listado[idx] = { ...pacLocal, id: insertado.id, sincronizado: true }
            migrationStorageService.registrarMapeo(oldId, insertado.id)
            procesadosExitososIds.push(id)
            procesados++
          } else {
            fallidos++
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        log.warn(`Error al procesar paciente pendiente ${id}:`, msg)
        fallidos++
      }
    }

    if (procesados > 0) {
      actualizarPacientesLocal(listado)
    }

    // Drenaje atómico: solo retirar los exitosamente procesados
    if (procesadosExitososIds.length > 0) {
      const colaRestante = pending.filter((item) => {
        const id = typeof item === 'object' && item !== null ? item.id : item
        return !procesadosExitososIds.includes(id)
      })
      guardarPendingPacientes(colaRestante)
    }

    // P0-1 / P1-3: Procesar eliminaciones explícitas pendientes al restaurar conexión
    await procesarPendingDeletesPacientesHelper()
  } catch (errGlobal: unknown) {
    log.error('Error global al procesar cola de pacientes:', errGlobal)
    return { procesados, fallidos: fallidos + 1 }
  }

  return { procesados, fallidos }
}

/**
 * Refresca pacientes desde Supabase protegiendo pacientes locales offline (P1-3).
 */
export const sincronizarPacientesDesdeSupabaseHelper = async ({
  obtenerPacientes,
  actualizarPacientesLocal
}: GuardarPacienteContext): Promise<Paciente[]> => {
  log.info('Iniciando sincronización desde Supabase...')

  if (!USE_SUPABASE || !supabase) {
    log.info('Supabase no configurado, retornando caché')
    return obtenerPacientes()
  }

  try {
    const clinicaIdActual = obtenerClinicaId()
    const localesActuales = obtenerPacientes() || []
    const pending = obtenerPendingPacientes()
    const pendingDelTenant = pending.filter((p) =>
      typeof p === 'object' && p !== null ? (!p.clinicaId || p.clinicaId === clinicaIdActual) : true
    )

    const idsPendientes = new Set(
      pendingDelTenant.map((p) => (typeof p === 'object' && p !== null ? p.id : p))
    )
    const rutsPendientes = new Set(
      pendingDelTenant
        .map((p) => (typeof p === 'object' && p !== null ? p.rut : null))
        .filter((r): r is string => Boolean(r))
    )

    const protegidosLocales = localesActuales.filter(
      (p) => idsPendientes.has(p.id) || (p.rut && rutsPendientes.has(p.rut)) || p.sincronizado === false
    )

    // F6-F: filtrar pacientes eliminados (soft delete)
    const { data, error } = await supabase
      .from('pacientes')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) {
      log.warn('Error al sincronizar desde Supabase:', error.message)
      return obtenerPacientes()
    }

    if (!Array.isArray(data)) return obtenerPacientes()

    // F6-C-f: NO usar caché como fallback si Supabase retorna vacío sin error,
    // EXCEPTO para aquellos pacientes locales con operaciones pendientes en este tenant.
    if (data.length === 0) {
      log.info('Supabase retornó vacío para este tenant')
    }

    const remotos = (data.map(transformarDesdeSupabase).filter(Boolean) as Paciente[]).map((p) => ({
      ...p,
      sincronizado: true
    }))

    // Fusionar remotos con protegidos locales que no existan en Supabase
    const idsRemotos = new Set(remotos.map((p) => p.id))
    const rutsRemotos = new Set(remotos.map((p) => p.rut).filter((r): r is string => Boolean(r)))

    const fusionados = [...remotos]
    for (const prot of protegidosLocales) {
      if (!idsRemotos.has(prot.id) && (!prot.rut || !rutsRemotos.has(prot.rut))) {
        fusionados.unshift({ ...prot, sincronizado: false })
      }
    }

    log.info(`Actualizando caché con ${fusionados.length} pacientes (${protegidosLocales.length} offline preservados)`)
    actualizarPacientesLocal(fusionados)

    return fusionados
  } catch (error: unknown) {
    log.error('Excepción al sincronizar desde Supabase:', error)
    return obtenerPacientes()
  }
}
