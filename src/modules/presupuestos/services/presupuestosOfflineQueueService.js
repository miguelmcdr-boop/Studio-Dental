/**
 * Servicio de cola offline para presupuestos e items (P1-3).
 *
 * Sigue el patrón transaccional padre-hijo (presupuestos + presupuesto_items)
 * con 4 colas tenant-aware:
 * 1. pendingPresupuestos (presupuestos padre pendientes)
 * 2. pendingPresupuestoItems (items pendientes con presupuestoId)
 * 3. pendingDeletesPresupuestos (IDs de presupuestos a eliminar)
 * 4. pendingDeletesPresupuestoItems (IDs de items a eliminar)
 *
 * Arquitectura:
 * Extraído de presupuestosStorageService.js para respetar el límite
 * arquitectónico constitucional de 462 líneas congeladas.
 */
import { supabase, USE_SUPABASE } from '../../../services/supabaseClient'
import { createTenantRepository } from '../../../services/localStorageRepository'
import { getClinicaActiva } from '../../../services/authService'
import { esUuidValido } from '../../../services/migrations/uuidUtils'
import { migrationStorageService } from '../../../services/migrationStorageService'
import { createLogger } from '../../../services/logger'

const log = createLogger('presupuestosOfflineQueue')

// Repositorios aislados por clínica/tenant
export const pendingPresupuestosRepo = createTenantRepository('studio_dental_presupuestos_pending', [])
export const pendingPresupuestoItemsRepo = createTenantRepository('studio_dental_presupuesto_items_pending', [])
export const pendingDeletesPresupuestosRepo = createTenantRepository('studio_dental_presupuestos_pending_deletes', [])
export const pendingDeletesPresupuestoItemsRepo = createTenantRepository('studio_dental_presupuesto_items_pending_deletes', [])

export const obtenerClinicaId = () => {
  try {
    return getClinicaActiva?.() || null
  } catch {
    return null
  }
}

// ──────────────────────────────────────────────────────────────────
// GETTERS Y SETTERS DE COLAS
// ──────────────────────────────────────────────────────────────────

export const obtenerPendingPresupuestos = () => {
  return pendingPresupuestosRepo.obtener([]) || []
}

export const guardarPendingPresupuestos = (pending) => {
  if (!pending || pending.length === 0) {
    pendingPresupuestosRepo.eliminar()
  } else {
    pendingPresupuestosRepo.guardar(pending)
  }
}

export const obtenerPendingPresupuestoItems = () => {
  return pendingPresupuestoItemsRepo.obtener([]) || []
}

export const guardarPendingPresupuestoItems = (pending) => {
  if (!pending || pending.length === 0) {
    pendingPresupuestoItemsRepo.eliminar()
  } else {
    pendingPresupuestoItemsRepo.guardar(pending)
  }
}

export const obtenerPendingDeletesPresupuestos = () => {
  return pendingDeletesPresupuestosRepo.obtener([]) || []
}

export const guardarPendingDeletesPresupuestos = (ids) => {
  if (!ids || ids.length === 0) {
    return pendingDeletesPresupuestosRepo.eliminar()
  }
  return pendingDeletesPresupuestosRepo.guardar(ids)
}

export const obtenerPendingDeletesPresupuestoItems = () => {
  return pendingDeletesPresupuestoItemsRepo.obtener([]) || []
}

export const guardarPendingDeletesPresupuestoItems = (ids) => {
  if (!ids || ids.length === 0) {
    return pendingDeletesPresupuestoItemsRepo.eliminar()
  }
  return pendingDeletesPresupuestoItemsRepo.guardar(ids)
}

// ──────────────────────────────────────────────────────────────────
// TRANSFORMACIONES PARA SUPABASE
// ──────────────────────────────────────────────────────────────────

export const transformarPresupuestoParaSupabase = (p, userId, clinicaId) => {
  const out = {
    user_id: userId,
    folio: p.folio || `PRES-${Date.now()}`,
    paciente_nombre: p.pacienteNombre || 'Sin nombre',
    paciente_rut: p.pacienteRut || null,
    fecha_emision: p.fechaEmision || new Date().toISOString().split('T')[0],
    convenio: p.convenio || 'Particular',
    monto_total: p.montoTotal || p.total || 0,
    monto_abonado: p.montoAbonado || 0,
    estado: p.estado || 'Emitido',
    observacion: p.observacion || ''
  }

  if (p.pacienteId) {
    if (esUuidValido(p.pacienteId)) {
      out.paciente_id = p.pacienteId
    } else {
      const pacienteUuid = migrationStorageService.obtenerSupabaseId(p.pacienteId)
      out.paciente_id = pacienteUuid || null
    }
  } else {
    out.paciente_id = null
  }

  if (clinicaId) out.clinica_id = clinicaId
  if (esUuidValido(p.id)) out.id = p.id

  return out
}

export const transformarItemParaSupabase = (item, presupuestoUuid, pacienteUuid, clinicaId) => {
  const itemOut = {
    presupuesto_id: presupuestoUuid || null,
    paciente_id: pacienteUuid || null,
    prestacion_id: item.prestacionId || null,
    prestacion_nombre: item.prestacionNombre || item.nombre || item.prestacion || 'Sin nombre',
    valor: parseInt(item.valor || item.precio || 0),
    convenio: item.convenio || 'Particular',
    estado: item.estado || 'Pendiente'
  }
  if (clinicaId) itemOut.clinica_id = clinicaId
  if (esUuidValido(item.id)) itemOut.id = item.id
  return itemOut
}

// ──────────────────────────────────────────────────────────────────
// ENCOLADO DE OPERACIONES
// ──────────────────────────────────────────────────────────────────

export const encolarPresupuesto = ({ id, folio, clinicaId }) => {
  try {
    const clinicaIdEfectivo = clinicaId || obtenerClinicaId()
    const pending = obtenerPendingPresupuestos()
    const yaEncolado = pending.some((item) =>
      typeof item === 'object' ? item.id === id : item === id
    )
    if (!yaEncolado) {
      pending.push({
        id,
        folio,
        clinicaId: clinicaIdEfectivo,
        timestamp: Date.now()
      })
      guardarPendingPresupuestos(pending)
    }
  } catch (err) {
    log.warn('Error al encolar en pendingPresupuestos:', err?.message || err)
  }
}

export const encolarPresupuestoItem = ({ id, presupuestoId, clinicaId, ...itemData }) => {
  try {
    const clinicaIdEfectivo = clinicaId || obtenerClinicaId()
    const pending = obtenerPendingPresupuestoItems()
    const idx = pending.findIndex((item) =>
      typeof item === 'object' ? item.id === id : item === id
    )
    const entry = {
      id,
      presupuestoId,
      clinicaId: clinicaIdEfectivo,
      ...itemData,
      timestamp: Date.now()
    }
    if (idx >= 0) {
      pending[idx] = entry
    } else {
      pending.push(entry)
    }
    guardarPendingPresupuestoItems(pending)
  } catch (err) {
    log.warn('Error al encolar en pendingPresupuestoItems:', err?.message || err)
  }
}

// ──────────────────────────────────────────────────────────────────
// HELPERS PRINCIPALES DE PERSISTENCIA Y COLA
// ──────────────────────────────────────────────────────────────────

/**
 * Guarda o actualiza un presupuesto padre con sus items (offline-first).
 */
export const guardarPresupuestoHelper = async (presupuesto, { obtenerPresupuestos, actualizarPresupuestosLocal }) => {
  if (!presupuesto) return null

  const id = presupuesto.id || Date.now()
  const clinicaIdActual = obtenerClinicaId()

  const presupuestoLocal = {
    ...presupuesto,
    id,
    sincronizado: false,
    items: Array.isArray(presupuesto.items) ? [...presupuesto.items] : []
  }

  // 1. Actualizar caché y localStorage de inmediato
  const listado = Array.isArray(obtenerPresupuestos()) ? [...obtenerPresupuestos()] : []
  const idx = listado.findIndex((p) => p.id === id || (presupuesto.folio && p.folio === presupuesto.folio))
  if (idx >= 0) {
    listado[idx] = presupuestoLocal
  } else {
    listado.unshift(presupuestoLocal)
  }
  actualizarPresupuestosLocal(listado)

  // 2. Encolar padre e items
  encolarPresupuesto({
    id,
    folio: presupuestoLocal.folio,
    clinicaId: clinicaIdActual
  })

  if (presupuestoLocal.items.length > 0) {
    for (const item of presupuestoLocal.items) {
      encolarPresupuestoItem({
        id: item.id || Date.now() + Math.random(),
        presupuestoId: id,
        clinicaId: clinicaIdActual,
        ...item
      })
    }
  }

  // 3. Si hay conexión y Supabase disponible, intentar sincronizar de forma transaccional
  if (USE_SUPABASE && supabase) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        let uuidPadre = null
        let padreSubido = false

        const paraSupabase = transformarPresupuestoParaSupabase(presupuestoLocal, user.id, clinicaIdActual)

        if (esUuidValido(presupuestoLocal.id)) {
          const { error: upsertErr } = await supabase
            .from('presupuestos')
            .upsert(paraSupabase, { onConflict: 'id' })
          if (!upsertErr) {
            uuidPadre = presupuestoLocal.id
            padreSubido = true
          }
        } else {
          delete paraSupabase.id
          const { data: insertado, error: insertErr } = await supabase
            .from('presupuestos')
            .insert(paraSupabase)
            .select('id')
            .single()

          if (!insertErr && insertado?.id) {
            uuidPadre = insertado.id
            padreSubido = true
            const oldId = presupuestoLocal.id
            presupuestoLocal.id = uuidPadre
            migrationStorageService.registrarMapeo(oldId, uuidPadre)
          }
        }

        // Si el padre subió con éxito, subir los items y drenar de colas
        if (padreSubido && uuidPadre) {
          presupuestoLocal.sincronizado = true

          // Subir items si existen
          let itemsOk = true
          if (presupuestoLocal.items.length > 0) {
            for (const item of presupuestoLocal.items) {
              const itemParaSupabase = transformarItemParaSupabase(item, uuidPadre, paraSupabase.paciente_id, clinicaIdActual)
              if (!esUuidValido(item.id)) delete itemParaSupabase.id

              const { error: itemErr } = await supabase
                .from('presupuesto_items')
                .upsert(itemParaSupabase, { onConflict: 'id' })

              if (itemErr) {
                itemsOk = false
                log.warn(`Error al subir item de presupuesto ${item.id}:`, itemErr.message)
              }
            }
          }

          // Drenar de colas
          const pendingP = obtenerPendingPresupuestos().filter((p) => {
            const pid = typeof p === 'object' ? p.id : p
            return pid !== id && pid !== uuidPadre
          })
          guardarPendingPresupuestos(pendingP)

          if (itemsOk) {
            const pendingI = obtenerPendingPresupuestoItems().filter((i) => i.presupuestoId !== id && i.presupuestoId !== uuidPadre)
            guardarPendingPresupuestoItems(pendingI)
          }

          // Actualizar caché con datos sincronizados
          const idxFinal = listado.findIndex((p) => p.id === id || p.id === uuidPadre)
          if (idxFinal >= 0) {
            listado[idxFinal] = presupuestoLocal
            actualizarPresupuestosLocal(listado)
          }
        }
      }
    } catch (errSync) {
      log.warn('Fallo al sincronizar presupuesto con Supabase, queda en cola offline:', errSync?.message || errSync)
    }
  }

  return presupuestoLocal
}

/**
 * Guarda o edita un item individual dentro de un presupuesto existente.
 */
export const guardarItemPresupuestoHelper = async (item, { obtenerPresupuestos, actualizarPresupuestosLocal }) => {
  if (!item || !item.presupuestoId) return null

  const clinicaIdActual = obtenerClinicaId()
  const listado = Array.isArray(obtenerPresupuestos()) ? [...obtenerPresupuestos()] : []
  const pIndex = listado.findIndex((p) => p.id === item.presupuestoId)

  if (pIndex >= 0) {
    const padre = { ...listado[pIndex], sincronizado: false }
    const itemsPadre = Array.isArray(padre.items) ? [...padre.items] : []
    const iIndex = itemsPadre.findIndex((i) => i.id === item.id)

    if (iIndex >= 0) {
      itemsPadre[iIndex] = { ...itemsPadre[iIndex], ...item, sincronizado: false }
    } else {
      itemsPadre.push({ ...item, sincronizado: false })
    }
    padre.items = itemsPadre
    listado[pIndex] = padre
    actualizarPresupuestosLocal(listado)
  }

  // Encolar item y marcar padre como pendiente
  encolarPresupuestoItem({
    ...item,
    clinicaId: clinicaIdActual
  })
  encolarPresupuesto({
    id: item.presupuestoId,
    clinicaId: clinicaIdActual
  })

  // Intentar sincronizar si online
  if (USE_SUPABASE && supabase && esUuidValido(item.presupuestoId)) {
    try {
      const itemParaSupabase = transformarItemParaSupabase(item, item.presupuestoId, null, clinicaIdActual)
      if (!esUuidValido(item.id)) delete itemParaSupabase.id

      const { error } = await supabase
        .from('presupuesto_items')
        .upsert(itemParaSupabase, { onConflict: 'id' })

      if (!error) {
        const pendingI = obtenerPendingPresupuestoItems().filter((i) => i.id !== item.id)
        guardarPendingPresupuestoItems(pendingI)
      }
    } catch (e) {
      log.warn('Error al sincronizar item individual, queda en cola:', e)
    }
  }

  return item
}

/**
 * Elimina un presupuesto completo y sus items asociados.
 */
export const eliminarPresupuestoHelper = async (presupuestoId, { obtenerPresupuestos, actualizarPresupuestosLocal }) => {
  const actuales = obtenerPresupuestos() || []
  const target = actuales.find((p) => String(p.id) === String(presupuestoId))
  const actualizados = actuales.filter((p) => String(p.id) !== String(presupuestoId))
  actualizarPresupuestosLocal(actualizados)

  // Encolar en pendingDeletesPresupuestos
  const pendingDelP = obtenerPendingDeletesPresupuestos()
  if (!pendingDelP.includes(presupuestoId)) {
    guardarPendingDeletesPresupuestos([...pendingDelP, presupuestoId])
  }

  // Encolar items asociados en pendingDeletesPresupuestoItems
  if (target?.items && Array.isArray(target.items)) {
    const pendingDelI = obtenerPendingDeletesPresupuestoItems()
    const itemIds = target.items.map((i) => i.id).filter(Boolean)
    const nuevos = itemIds.filter((id) => !pendingDelI.includes(id))
    if (nuevos.length > 0) {
      guardarPendingDeletesPresupuestoItems([...pendingDelI, ...nuevos])
    }
  }

  // Si Supabase está disponible y es UUID, intentar borrado físico inmediato
  if (USE_SUPABASE && supabase && esUuidValido(presupuestoId)) {
    try {
      const { error } = await supabase
        .from('presupuestos')
        .delete()
        .eq('id', presupuestoId)

      if (!error) {
        const restantesP = obtenerPendingDeletesPresupuestos().filter((id) => id !== presupuestoId)
        guardarPendingDeletesPresupuestos(restantesP)
      }
    } catch (err) {
      log.warn('Error al eliminar presupuesto remoto, queda en cola de deletes:', err)
    }
  }

  return true
}

/**
 * Elimina un item individual de un presupuesto.
 */
export const eliminarItemPresupuestoHelper = async (itemId, presupuestoId, { obtenerPresupuestos, actualizarPresupuestosLocal }) => {
  const actuales = obtenerPresupuestos() || []
  const pIndex = actuales.findIndex((p) => String(p.id) === String(presupuestoId))

  if (pIndex >= 0) {
    const padre = { ...actuales[pIndex] }
    if (Array.isArray(padre.items)) {
      padre.items = padre.items.filter((i) => String(i.id) !== String(itemId))
    }
    actuales[pIndex] = padre
    actualizarPresupuestosLocal(actuales)
  }

  // Encolar en pendingDeletesPresupuestoItems
  const pendingDelI = obtenerPendingDeletesPresupuestoItems()
  if (!pendingDelI.includes(itemId)) {
    guardarPendingDeletesPresupuestoItems([...pendingDelI, itemId])
  }

  // Si Supabase disponible, intentar borrar
  if (USE_SUPABASE && supabase && esUuidValido(itemId)) {
    try {
      const { error } = await supabase
        .from('presupuesto_items')
        .delete()
        .eq('id', itemId)

      if (!error) {
        const restantes = obtenerPendingDeletesPresupuestoItems().filter((id) => id !== itemId)
        guardarPendingDeletesPresupuestoItems(restantes)
      }
    } catch (err) {
      log.warn('Error al eliminar item en Supabase, queda en cola:', err)
    }
  }

  return true
}

/**
 * Procesa eliminaciones pendientes en Supabase (DELETE físico).
 */
export const procesarPendingDeletesPresupuestosHelper = async () => {
  if (!USE_SUPABASE || !supabase) return

  // 1. Eliminar presupuestos padre
  const pendingDelP = obtenerPendingDeletesPresupuestos()
  if (Array.isArray(pendingDelP) && pendingDelP.length > 0) {
    const exitososP = []
    for (const id of pendingDelP) {
      if (!esUuidValido(id)) {
        exitososP.push(id)
        continue
      }
      try {
        const { error } = await supabase.from('presupuestos').delete().eq('id', id)
        if (!error) exitososP.push(id)
      } catch (err) {
        log.warn(`Error al ejecutar delete de presupuesto ${id}:`, err)
      }
    }
    if (exitososP.length > 0) {
      const setExitosos = new Set(exitososP)
      guardarPendingDeletesPresupuestos(pendingDelP.filter((id) => !setExitosos.has(id)))
    }
  }

  // 2. Eliminar items individuales
  const pendingDelI = obtenerPendingDeletesPresupuestoItems()
  if (Array.isArray(pendingDelI) && pendingDelI.length > 0) {
    const exitososI = []
    for (const id of pendingDelI) {
      if (!esUuidValido(id)) {
        exitososI.push(id)
        continue
      }
      try {
        const { error } = await supabase.from('presupuesto_items').delete().eq('id', id)
        if (!error) exitososI.push(id)
      } catch (err) {
        log.warn(`Error al ejecutar delete de item ${id}:`, err)
      }
    }
    if (exitososI.length > 0) {
      const setExitosos = new Set(exitososI)
      guardarPendingDeletesPresupuestoItems(pendingDelI.filter((id) => !setExitosos.has(id)))
    }
  }
}

/**
 * Procesa la cola de presupuestos e items pendientes con orden transaccional:
 * Padre primero -> items hijos después.
 */
export const procesarColaPresupuestosHelper = async ({ obtenerPresupuestos, actualizarPresupuestosLocal }) => {
  const clinicaIdActual = obtenerClinicaId()
  if (!clinicaIdActual) {
    return { procesados: 0, fallidos: 0, razon: 'sin-clinica' }
  }

  const pending = obtenerPendingPresupuestos()
  if (!pending || pending.length === 0) {
    await procesarPendingDeletesPresupuestosHelper()
    return { procesados: 0, fallidos: 0 }
  }

  if (!USE_SUPABASE || !supabase) {
    return { procesados: 0, fallidos: 0, offline: true }
  }

  let procesados = 0
  let fallidos = 0
  const procesadosExitososIds = []
  const listado = Array.isArray(obtenerPresupuestos()) ? [...obtenerPresupuestos()] : []
  const pendingItems = obtenerPendingPresupuestoItems()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { procesados: 0, fallidos: 0, razon: 'sin-usuario' }
    }

    for (const item of pending) {
      const id = typeof item === 'object' ? item.id : item
      const itemClinicaId = item.clinicaId || clinicaIdActual

      // Aislamiento multi-tenant: procesar solo clínica activa
      if (itemClinicaId !== clinicaIdActual) {
        continue
      }

      try {
        const idx = listado.findIndex((p) => p.id === id || (item.folio && p.folio === item.folio))
        if (idx < 0) {
          // Ya no existe localmente, retirar de la cola
          procesadosExitososIds.push(id)
          continue
        }

        const pLocal = listado[idx]
        const paraSupabase = transformarPresupuestoParaSupabase(pLocal, user.id, clinicaIdActual)

        let uuidPadre = null

        // 1. Subir presupuesto padre primero
        if (esUuidValido(pLocal.id)) {
          const { error: upsertErr } = await supabase
            .from('presupuestos')
            .upsert(paraSupabase, { onConflict: 'id' })

          if (upsertErr) throw upsertErr
          uuidPadre = pLocal.id
        } else {
          delete paraSupabase.id
          const { data: insertado, error: insertErr } = await supabase
            .from('presupuestos')
            .insert(paraSupabase)
            .select('id')
            .single()

          if (insertErr) throw insertErr
          if (!insertado?.id) throw new Error('No se obtuvo UUID del presupuesto padre insertado')

          uuidPadre = insertado.id
          const oldId = pLocal.id
          pLocal.id = uuidPadre
          migrationStorageService.registrarMapeo(oldId, uuidPadre)
        }

        // Si el padre fue exitoso, marcar como sincronizado
        pLocal.sincronizado = true
        listado[idx] = pLocal
        procesadosExitososIds.push(id)
        procesados++

        // 2. Transaccional: Buscar items asociados en pendingPresupuestoItems y subirlos
        const itemsDeEstePadre = pendingItems.filter((i) => i.presupuestoId === id || i.presupuestoId === uuidPadre)
        const itemsExitososIds = []

        if (itemsDeEstePadre.length > 0) {
          for (const itemPending of itemsDeEstePadre) {
            try {
              const itemParaSupabase = transformarItemParaSupabase(itemPending, uuidPadre, paraSupabase.paciente_id, clinicaIdActual)
              if (!esUuidValido(itemPending.id)) delete itemParaSupabase.id

              const { error: itemErr } = await supabase
                .from('presupuesto_items')
                .upsert(itemParaSupabase, { onConflict: 'id' })

              if (!itemErr) {
                itemsExitososIds.push(itemPending.id)
              } else {
                log.warn(`Error al subir item ${itemPending.id}:`, itemErr.message)
              }
            } catch (errItem) {
              log.warn(`Excepción al subir item ${itemPending.id}:`, errItem)
            }
          }

          if (itemsExitososIds.length > 0) {
            const restantes = pendingItems.filter((i) => !itemsExitososIds.includes(i.id))
            guardarPendingPresupuestoItems(restantes)
          }
        }
      } catch (errPadre) {
        log.warn(`Fallo al procesar presupuesto padre ${id} (items no se subirán):`, errPadre?.message || errPadre)
        fallidos++
      }
    }

    if (procesados > 0) {
      actualizarPresupuestosLocal(listado)
    }

    // Drenaje atómico: retirar solo exitosos
    if (procesadosExitososIds.length > 0) {
      const colaRestante = pending.filter((item) => {
        const id = typeof item === 'object' ? item.id : item
        return !procesadosExitososIds.includes(id)
      })
      guardarPendingPresupuestos(colaRestante)
    }

    // Procesar eliminaciones pendientes
    await procesarPendingDeletesPresupuestosHelper()
  } catch (errGlobal) {
    log.error('Error global al procesar cola de presupuestos:', errGlobal)
    return { procesados, fallidos: fallidos + 1 }
  }

  return { procesados, fallidos }
}

/**
 * Refresca presupuestos desde Supabase protegiendo presupuestos locales pendientes.
 */
export const sincronizarPresupuestosDesdeSupabaseHelper = async ({ obtenerPresupuestos, actualizarPresupuestosLocal, presupuestosRepo }) => {
  log.info('Iniciando sincronización de presupuestos desde Supabase...')

  if (!USE_SUPABASE || !supabase) {
    log.info('Supabase no configurado, retornando caché')
    return obtenerPresupuestos()
  }

  try {
    const clinicaIdActual = obtenerClinicaId()
    const localesActuales = obtenerPresupuestos() || []
    const pending = obtenerPendingPresupuestos()
    const pendingDelTenant = pending.filter((p) => !p.clinicaId || p.clinicaId === clinicaIdActual)

    const idsPendientes = new Set(pendingDelTenant.map((p) => (typeof p === 'object' ? p.id : p)))
    const foliosPendientes = new Set(pendingDelTenant.map((p) => (typeof p === 'object' ? p.folio : null)).filter(Boolean))

    const protegidosLocales = localesActuales.filter(
      (p) => idsPendientes.has(p.id) || (p.folio && foliosPendientes.has(p.folio)) || p.sincronizado === false
    )

    const { data, error } = await supabase
      .from('presupuestos')
      .select('*')
      .order('fecha_emision', { ascending: false })

    if (error) {
      log.warn('Error al sincronizar presupuestos desde Supabase:', error.message)
      return localesActuales
    }

    if (!Array.isArray(data)) return localesActuales

    // Mapeo básico snake_case -> camelCase
    const desdeSupabase = data.map((p) => ({
      id: p.id,
      folio: p.folio,
      pacienteId: p.paciente_id,
      pacienteNombre: p.paciente_nombre,
      pacienteRut: p.paciente_rut,
      fechaEmision: p.fecha_emision,
      convenio: p.convenio,
      montoTotal: p.monto_total,
      montoAbonado: p.monto_abonado,
      estado: p.estado,
      observacion: p.observacion,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      sincronizado: true
    }))

    // Preservar presupuestos locales que aún no están en Supabase
    const idsRemotos = new Set(desdeSupabase.map((p) => p.id))
    const foliosRemotos = new Set(desdeSupabase.map((p) => p.folio).filter(Boolean))

    const protegidosNoPresentes = protegidosLocales.filter(
      (p) => !idsRemotos.has(p.id) && (!p.folio || !foliosRemotos.has(p.folio))
    )

    const listaFinal = [...protegidosNoPresentes, ...desdeSupabase]
    actualizarPresupuestosLocal(listaFinal)
    return listaFinal
  } catch (error) {
    log.error('Excepción al sincronizar presupuestos desde Supabase:', error)
    return obtenerPresupuestos()
  }
}
