/**
 * Persistencia en LocalStorage para Urgencias y Notificaciones GES
 */
import { createTenantRepository } from '../../../services/localStorageRepository'

const STORAGE_KEY_GES = 'studio_dental_atenciones_ges_urgencias'
// F7-36 FASE 1 (Commit 1.5d): migrado a createTenantRepository para aislamiento multi-tenant.
// Clave legacy ahora: sd_<clinicaId>_studio_dental_atenciones_ges_urgencias
const gesRepo = createTenantRepository(STORAGE_KEY_GES, [])

export const urgenciasGesStorageService = {
  obtenerAtenciones: () => gesRepo.obtener([]),
  guardarAtenciones: (atenciones) => gesRepo.guardar(atenciones)
}