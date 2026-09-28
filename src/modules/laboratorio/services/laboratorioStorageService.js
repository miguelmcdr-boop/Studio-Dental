/**
 * Persistencia en LocalStorage para Órdenes y Directorio de Laboratorios
 */
import { createTenantRepository } from '../../../services/localStorageRepository'

const STORAGE_KEY_ORDENES = 'studio_dental_laboratorio_ordenes'
const STORAGE_KEY_LABS = 'studio_dental_laboratorio_directorio'

// F7-36 FASE 1 (Commit 1.5d): migrados a createTenantRepository para aislamiento multi-tenant.
// Claves legacy ahora: sd_<clinicaId>_studio_dental_laboratorio_*
const ordenesRepo = createTenantRepository(STORAGE_KEY_ORDENES, undefined)
const laboratoriosRepo = createTenantRepository(STORAGE_KEY_LABS, undefined)

export const laboratorioStorageService = {
  obtenerOrdenes: (defaults) => ordenesRepo.obtener(defaults),
  guardarOrdenes: (ordenes) => ordenesRepo.guardar(ordenes),

  obtenerLaboratorios: (defaults) => laboratoriosRepo.obtener(defaults),
  guardarLaboratorios: (labs) => laboratoriosRepo.guardar(labs)
}