/**
 * Persistencia aislada en LocalStorage para Arancel y Paquetes Clínicos
 */
import { createLocalStorageRepository } from '../../../services/localStorageRepository'

const STORAGE_KEY_ARANCEL = 'clinica_arancel_prestaciones'
const STORAGE_KEY_PAQUETES = 'clinica_paquetes_clinicos_promos'

const arancelRepo = createLocalStorageRepository(STORAGE_KEY_ARANCEL, undefined)
const paquetesRepo = createLocalStorageRepository(STORAGE_KEY_PAQUETES, undefined)

export const prestacionesStorageService = {
  obtenerPrestaciones: (defaults) => arancelRepo.obtener(defaults),
  guardarPrestaciones: (prestaciones) => arancelRepo.guardar(prestaciones),

  obtenerPaquetes: (defaults) => paquetesRepo.obtener(defaults),
  guardarPaquetes: (paquetes) => paquetesRepo.guardar(paquetes)
}