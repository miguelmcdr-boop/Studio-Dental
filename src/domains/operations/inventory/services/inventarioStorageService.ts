/**
 * Persistencia aislada en LocalStorage para Inventario
 * Incluye persistencia de las asociaciones tratamiento→material (F2-11/F2-12).
 */
import { createTenantRepository } from '../../../../services/localStorageRepository'
import { INSUMOS_POR_PRESTACION_DEFAULT } from '../utils/inventarioCalculations'
import type { ItemInventarioDefault } from '../constants/inventarioConstants'

export interface ItemInventario extends Omit<Partial<ItemInventarioDefault>, 'id'> {
  id: number | string
  nombre: string
  categoria: string
  cantidad: number
  minimoCritico: number
  unidad: string
  [key: string]: unknown
}

export interface InsumoAsociado {
  nombreInsumo: string
  cantidad: number
  unidad: string
}

export type AsociacionesInsumos = Record<string, InsumoAsociado[]>

const STORAGE_KEY_INVENTARIO = 'studio_dental_inventario_stock'
const STORAGE_KEY_ASOCIACIONES = 'studio_dental_inventario_asociaciones_tratamiento'

// F7-36 FASE 1 (Commit 1.5d): migrados a createTenantRepository para aislamiento multi-tenant.
// Claves legacy ahora: sd_<clinicaId>_studio_dental_inventario_*
const inventarioRepo = createTenantRepository<ItemInventario[]>(STORAGE_KEY_INVENTARIO, [])
const asociacionesRepo = createTenantRepository<AsociacionesInsumos>(
  STORAGE_KEY_ASOCIACIONES,
  INSUMOS_POR_PRESTACION_DEFAULT as AsociacionesInsumos
)

export const inventarioStorageService = {
  obtenerItems: (defaults?: ItemInventario[]): ItemInventario[] => inventarioRepo.obtener(defaults),
  guardarItems: (items: ItemInventario[]): boolean => inventarioRepo.guardar(items),

  // Asociaciones tratamiento→material (F2-11/F2-12).
  // Al obtener por primera vez, usa el diccionario semilla exportado desde inventarioCalculations.js.
  obtenerAsociacionesInsumos: (
    defaults: AsociacionesInsumos = INSUMOS_POR_PRESTACION_DEFAULT as AsociacionesInsumos
  ): AsociacionesInsumos => asociacionesRepo.obtener(defaults),
  guardarAsociacionesInsumos: (asociaciones: AsociacionesInsumos): boolean => asociacionesRepo.guardar(asociaciones)
}
