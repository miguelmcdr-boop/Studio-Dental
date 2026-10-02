/**
 * Persistencia aislada en LocalStorage para Esterilización (Cargas, Biológicos y Test Diarios)
 */
import { createTenantRepository } from '../../../services/localStorageRepository'
import type {
  CargaEsterilizacion,
  PruebaBiologica,
  TestBowieDick
} from '../constants/esterilizacionConstants'

const STORAGE_KEY_CARGAS = 'studio_dental_esterilizacion_cargas'
const STORAGE_KEY_BIOLOGICOS = 'studio_dental_esterilizacion_biologicos'
const STORAGE_KEY_TEST_DIARIOS = 'studio_dental_esterilizacion_test_diarios'

// F7-36 FASE 1 (Commit 1.5d): migrados a createTenantRepository para aislamiento multi-tenant.
// Claves legacy ahora: sd_<clinicaId>_studio_dental_esterilizacion_*
const cargasRepo = createTenantRepository<CargaEsterilizacion[]>(STORAGE_KEY_CARGAS, [])
const biologicosRepo = createTenantRepository<PruebaBiologica[]>(STORAGE_KEY_BIOLOGICOS, [])
const testDiariosRepo = createTenantRepository<TestBowieDick[]>(STORAGE_KEY_TEST_DIARIOS, [])

export const esterilizacionStorageService = {
  obtenerCargas: (defaults?: CargaEsterilizacion[]): CargaEsterilizacion[] => cargasRepo.obtener(defaults),
  guardarCargas: (cargas: CargaEsterilizacion[]): void => cargasRepo.guardar(cargas),

  obtenerBiologicos: (defaults?: PruebaBiologica[]): PruebaBiologica[] => biologicosRepo.obtener(defaults),
  guardarBiologicos: (biologicos: PruebaBiologica[]): void => biologicosRepo.guardar(biologicos),

  obtenerTestDiarios: (defaults?: TestBowieDick[]): TestBowieDick[] => testDiariosRepo.obtener(defaults),
  guardarTestDiarios: (tests: TestBowieDick[]): void => testDiariosRepo.guardar(tests)
}
