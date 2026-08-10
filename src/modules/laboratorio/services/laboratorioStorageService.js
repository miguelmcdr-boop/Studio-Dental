/**
 * Persistencia en LocalStorage para Órdenes y Directorio de Laboratorios
 */
import { createLocalStorageRepository } from '../../../services/localStorageRepository'

const STORAGE_KEY_ORDENES = 'studio_dental_laboratorio_ordenes'
const STORAGE_KEY_LABS = 'studio_dental_laboratorio_directorio'

const ordenesRepo = createLocalStorageRepository(STORAGE_KEY_ORDENES, undefined)
const laboratoriosRepo = createLocalStorageRepository(STORAGE_KEY_LABS, undefined)

export const laboratorioStorageService = {
  obtenerOrdenes: (defaults) => ordenesRepo.obtener(defaults),
  guardarOrdenes: (ordenes) => ordenesRepo.guardar(ordenes),

  obtenerLaboratorios: (defaults) => laboratoriosRepo.obtener(defaults),
  guardarLaboratorios: (labs) => laboratoriosRepo.guardar(labs)
}