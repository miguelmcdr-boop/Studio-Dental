/**
 * Persistencia aislada en LocalStorage para Esterilización (Cargas, Biológicos y Test Diarios)
 */
import { createTenantRepository } from '../../../services/localStorageRepository'

const STORAGE_KEY_CARGAS = 'studio_dental_esterilizacion_cargas'
const STORAGE_KEY_BIOLOGICOS = 'studio_dental_esterilizacion_biologicos'
const STORAGE_KEY_TEST_DIARIOS = 'studio_dental_esterilizacion_test_diarios'

// F7-36 FASE 1 (Commit 1.5d): migrados a createTenantRepository para aislamiento multi-tenant.
// Claves legacy ahora: sd_<clinicaId>_studio_dental_esterilizacion_*
const cargasRepo = createTenantRepository(STORAGE_KEY_CARGAS, undefined)
const biologicosRepo = createTenantRepository(STORAGE_KEY_BIOLOGICOS, undefined)
const testDiariosRepo = createTenantRepository(STORAGE_KEY_TEST_DIARIOS, undefined)

export const esterilizacionStorageService = {
  obtenerCargas: (defaults) => cargasRepo.obtener(defaults),
  guardarCargas: (cargas) => cargasRepo.guardar(cargas),

  obtenerBiologicos: (defaults) => biologicosRepo.obtener(defaults),
  guardarBiologicos: (biologicos) => biologicosRepo.guardar(biologicos),

  obtenerTestDiarios: (defaults) => testDiariosRepo.obtener(defaults),
  guardarTestDiarios: (tests) => testDiariosRepo.guardar(tests)
}