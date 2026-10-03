/**
 * Persistencia en LocalStorage para Órdenes y Directorio de Laboratorios
 */
import { createTenantRepository } from '../../../services/localStorageRepository'
import type { OrdenLaboratorio, LaboratorioBase } from '../constants/laboratorioConstants'

const STORAGE_KEY_ORDENES = 'studio_dental_laboratorio_ordenes'
const STORAGE_KEY_LABS = 'studio_dental_laboratorio_directorio'

// F7-36 FASE 1 (Commit 1.5d): migrados a createTenantRepository para aislamiento multi-tenant.
// Claves legacy ahora: sd_<clinicaId>_studio_dental_laboratorio_*
const ordenesRepo = createTenantRepository<OrdenLaboratorio[]>(STORAGE_KEY_ORDENES, [])
const laboratoriosRepo = createTenantRepository<LaboratorioBase[]>(STORAGE_KEY_LABS, [])

export const laboratorioStorageService = {
  obtenerOrdenes: (defaults?: OrdenLaboratorio[]): OrdenLaboratorio[] => ordenesRepo.obtener(defaults),
  guardarOrdenes: (ordenes: OrdenLaboratorio[]): boolean => ordenesRepo.guardar(ordenes),

  obtenerLaboratorios: (defaults?: LaboratorioBase[]): LaboratorioBase[] => laboratoriosRepo.obtener(defaults),
  guardarLaboratorios: (labs: LaboratorioBase[]): boolean => laboratoriosRepo.guardar(labs)
}
