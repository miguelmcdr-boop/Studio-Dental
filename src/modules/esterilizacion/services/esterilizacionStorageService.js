/**
 * Persistencia aislada en LocalStorage para Esterilización (Cargas, Biológicos y Test Diarios)
 */
import { createLocalStorageRepository } from '../../../services/localStorageRepository'

const STORAGE_KEY_CARGAS = 'studio_dental_esterilizacion_cargas'
const STORAGE_KEY_BIOLOGICOS = 'studio_dental_esterilizacion_biologicos'
const STORAGE_KEY_TEST_DIARIOS = 'studio_dental_esterilizacion_test_diarios'

const cargasRepo = createLocalStorageRepository(STORAGE_KEY_CARGAS, undefined)
const biologicosRepo = createLocalStorageRepository(STORAGE_KEY_BIOLOGICOS, undefined)
const testDiariosRepo = createLocalStorageRepository(STORAGE_KEY_TEST_DIARIOS, undefined)

export const esterilizacionStorageService = {
  obtenerCargas: (defaults) => cargasRepo.obtener(defaults),
  guardarCargas: (cargas) => cargasRepo.guardar(cargas),

  obtenerBiologicos: (defaults) => biologicosRepo.obtener(defaults),
  guardarBiologicos: (biologicos) => biologicosRepo.guardar(biologicos),

  obtenerTestDiarios: (defaults) => testDiariosRepo.obtener(defaults),
  guardarTestDiarios: (tests) => testDiariosRepo.guardar(tests)
}