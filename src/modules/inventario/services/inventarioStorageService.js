/**
 * Persistencia aislada en LocalStorage para Inventario
 */
import { createLocalStorageRepository } from '../../../services/localStorageRepository'

const STORAGE_KEY_INVENTARIO = 'studio_dental_inventario_stock'
const inventarioRepo = createLocalStorageRepository(STORAGE_KEY_INVENTARIO, undefined)

export const inventarioStorageService = {
  obtenerItems: (defaults) => inventarioRepo.obtener(defaults),
  guardarItems: (items) => inventarioRepo.guardar(items)
}