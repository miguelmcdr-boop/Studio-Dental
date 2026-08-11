/**
 * Persistencia aislada en LocalStorage para Inventario
 * Incluye persistencia de las asociaciones tratamiento→material (F2-11/F2-12).
 */
import { createLocalStorageRepository } from '../../../services/localStorageRepository'
import { INSUMOS_POR_PRESTACION_DEFAULT } from '../utils/inventarioCalculations'

const STORAGE_KEY_INVENTARIO = 'studio_dental_inventario_stock'
const STORAGE_KEY_ASOCIACIONES = 'studio_dental_inventario_asociaciones_tratamiento'

const inventarioRepo = createLocalStorageRepository(STORAGE_KEY_INVENTARIO, undefined)
const asociacionesRepo = createLocalStorageRepository(STORAGE_KEY_ASOCIACIONES, INSUMOS_POR_PRESTACION_DEFAULT)

export const inventarioStorageService = {
  obtenerItems: (defaults) => inventarioRepo.obtener(defaults),
  guardarItems: (items) => inventarioRepo.guardar(items),

  // Asociaciones tratamiento→material (F2-11/F2-12).
  // Al obtener por primera vez, usa el diccionario semilla exportado desde inventarioCalculations.js.
  obtenerAsociacionesInsumos: (defaults = INSUMOS_POR_PRESTACION_DEFAULT) => asociacionesRepo.obtener(defaults),
  guardarAsociacionesInsumos: (asociaciones) => asociacionesRepo.guardar(asociaciones)
}