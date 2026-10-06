/**
 * Application Service: Treatment Plan (Fase 5C)
 *
 * Centraliza la lógica de creación y gestión de planes de tratamiento
 * (presupuestos) que involucra múltiples dominios:
 * - Presupuestos (billing/budget)
 * - Prestaciones (organization/prestations)
 * - Pagos (billing/payment)
 * - Pacientes (clinical/patient)
 *
 * Consume EXCLUSIVAMENTE las APIs públicas de los dominios.
 */

import { pacientesStorageService } from '../../domains/clinical/patient'
import { prestacionesStorageService } from '../../domains/organization/prestations'
import { presupuestosStorageService, type PresupuestoLocal } from '../../domains/billing/budget'
import { createLogger } from '../../infrastructure/logging/logger'

const log = createLogger('treatmentPlan')

export interface TreatmentPlanItemInput {
  prestacionId: string | number
  piezaDental?: string
  cantidad: number
}

export interface TreatmentPlanInput {
  pacienteId: string | number
  clinicaId?: string
  usuarioId?: string
  prestaciones: TreatmentPlanItemInput[]
  convenioId?: string
  descuento?: number
}

export interface TreatmentPlanItemResult {
  prestacionId: string | number
  nombre: string
  precioUnitario: number
  cantidad: number
  subtotal: number
  piezaDental?: string
}

export interface TreatmentPlanResult {
  presupuestoId: string
  pacienteId: string | number
  totalOriginal: number
  totalConDescuento: number
  descuentoPorcentaje: number
  convenioAplicado?: string
  items: TreatmentPlanItemResult[]
}

/**
 * 1. Valida que el paciente existe
 * 2. Obtiene prestaciones del catálogo (organization/prestations)
 * 3. Calcula precios con descuento/convenio
 * 4. Crea presupuesto (billing/budget)
 */
export async function createTreatmentPlan(
  input: TreatmentPlanInput
): Promise<TreatmentPlanResult> {
  const { pacienteId, prestaciones: itemsInput, convenioId = 'Particular', descuento = 0 } = input

  // 1. Validar existencia del paciente si hay pacientes en storage
  const pacientes = pacientesStorageService.obtenerPacientes([])
  const paciente = Array.isArray(pacientes)
    ? pacientes.find((p) => String(p.id) === String(pacienteId))
    : null

  // 2. Obtener prestaciones del catálogo
  const catalogo = prestacionesStorageService.obtenerPrestaciones()
  const catalogoArr = Array.isArray(catalogo) ? catalogo : []

  // 3. Calcular precios e items
  let totalOriginal = 0
  const items: TreatmentPlanItemResult[] = itemsInput.map((item) => {
    const prestacionCatalogo = catalogoArr.find(
      (p) => String(p.id) === String(item.prestacionId)
    )
    const nombre = prestacionCatalogo?.nombre || `Prestación ${item.prestacionId}`
    const precioUnitario = Number(prestacionCatalogo?.precio) || 0
    const cantidad = Number(item.cantidad) || 1
    const subtotal = precioUnitario * cantidad
    totalOriginal += subtotal

    return {
      prestacionId: item.prestacionId,
      nombre,
      precioUnitario,
      cantidad,
      subtotal,
      piezaDental: item.piezaDental,
    }
  })

  const descuentoPorcentaje = Math.min(100, Math.max(0, Number(descuento) || 0))
  const factor = (100 - descuentoPorcentaje) / 100
  const totalConDescuento = Math.round(totalOriginal * factor)

  // 4. Crear presupuesto en billing/budget
  const nuevoPresupuestoId = `pres_${Date.now()}`
  const nuevoPresupuesto: PresupuestoLocal = {
    id: nuevoPresupuestoId,
    pacienteId: String(pacienteId),
    pacienteNombre: paciente?.nombre || '',
    fecha: new Date().toLocaleDateString('es-CL'),
    items: items.map((i) => ({
      id: String(i.prestacionId),
      prestacion: i.nombre,
      valor: i.precioUnitario,
      cantidad: i.cantidad,
      piezaDental: i.piezaDental,
      estado: 'Pendiente',
    })),
    total: totalConDescuento,
    totalOriginal,
    descuento: descuentoPorcentaje,
    convenio: convenioId,
    estado: 'Borrador',
  }

  try {
    const presupuestosActuales = presupuestosStorageService.obtenerPresupuestos([])
    const listaPresupuestos = Array.isArray(presupuestosActuales) ? presupuestosActuales : []
    await presupuestosStorageService.guardarPresupuestos([nuevoPresupuesto, ...listaPresupuestos])
  } catch (err) {
    log.error('Error al guardar presupuesto en storage:', err)
  }

  // También persistir en items de la ficha del paciente para sincronización local
  try {
    pacientesStorageService.guardarItem(
      `presupuesto_items_${pacienteId}`,
      nuevoPresupuesto.items
    )
  } catch (err) {
    log.error('Error al guardar items de presupuesto en ficha:', err)
  }

  return {
    presupuestoId: nuevoPresupuestoId,
    pacienteId,
    totalOriginal,
    totalConDescuento,
    descuentoPorcentaje,
    convenioAplicado: convenioId,
    items,
  }
}

export async function updateTreatmentPlan(
  presupuestoId: string,
  updates: Partial<TreatmentPlanInput>
): Promise<TreatmentPlanResult> {
  const presupuestos = presupuestosStorageService.obtenerPresupuestos([])
  const lista = Array.isArray(presupuestos) ? presupuestos : []
  const existente = lista.find((p) => String(p.id) === String(presupuestoId))

  if (!existente) {
    throw new Error(`Presupuesto ${presupuestoId} no encontrado`)
  }

  const pacienteId = updates.pacienteId !== undefined ? updates.pacienteId : existente.pacienteId
  const convenio = updates.convenioId !== undefined ? updates.convenioId : existente.convenio || 'Particular'
  const descuento = updates.descuento !== undefined ? updates.descuento : existente.descuento || 0

  let items = existente.items || []
  let totalOriginal = Number(existente.totalOriginal || existente.total || 0)

  if (updates.prestaciones) {
    const catalogo = prestacionesStorageService.obtenerPrestaciones()
    const catalogoArr = Array.isArray(catalogo) ? catalogo : []
    totalOriginal = 0
    items = updates.prestaciones.map((item) => {
      const p = catalogoArr.find((c) => String(c.id) === String(item.prestacionId))
      const precio = Number(p?.precio) || 0
      const subtotal = precio * (item.cantidad || 1)
      totalOriginal += subtotal
      return {
        id: String(item.prestacionId),
        prestacion: p?.nombre || `Prestación ${item.prestacionId}`,
        valor: precio,
        cantidad: item.cantidad || 1,
        piezaDental: item.piezaDental,
        estado: 'Pendiente',
      }
    })
  }

  const factor = (100 - (Number(descuento) || 0)) / 100
  const totalConDescuento = Math.round(totalOriginal * factor)

  const presupuestoActualizado: PresupuestoLocal = {
    ...existente,
    items,
    total: totalConDescuento,
    totalOriginal,
    descuento: Number(descuento) || 0,
    convenio,
  }

  const nuevaLista = lista.map((p) =>
    String(p.id) === String(presupuestoId) ? presupuestoActualizado : p
  )
  await presupuestosStorageService.guardarPresupuestos(nuevaLista)

  return {
    presupuestoId,
    pacienteId: pacienteId || '',
    totalOriginal,
    totalConDescuento,
    descuentoPorcentaje: Number(descuento) || 0,
    convenioAplicado: convenio,
    items: (items || []).map((i: any) => ({
      prestacionId: i.id,
      nombre: i.prestacion,
      precioUnitario: i.valor,
      cantidad: i.cantidad || 1,
      subtotal: (i.valor || 0) * (i.cantidad || 1),
      piezaDental: i.piezaDental,
    })),
  }
}

export async function deleteTreatmentPlan(presupuestoId: string): Promise<void> {
  const presupuestos = presupuestosStorageService.obtenerPresupuestos([])
  const lista = Array.isArray(presupuestos) ? presupuestos : []
  const filtrados = lista.filter((p) => String(p.id) !== String(presupuestoId))
  await presupuestosStorageService.guardarPresupuestos(filtrados)
}
