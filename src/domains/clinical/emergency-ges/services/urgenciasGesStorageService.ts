/**
 * Persistencia en LocalStorage para Urgencias y Notificaciones GES
 */
import { createTenantRepository } from '../../../../services/localStorageRepository'

export interface AtencionGes {
  id?: string | number
  folio?: string
  fechaCreacion?: string
  pacienteId?: string | number
  pacienteNombre?: string
  pacienteRut?: string
  pacientePrevision?: string
  triageId?: string
  triageNombre?: string
  patologiaGesId?: string
  patologiaNombre?: string
  patologiaCodigo?: string
  diagnostico?: string
  indicacionesTratamiento?: string
  aceptaAtencion?: boolean
  categoriaTriage?: string
  patologiaGes?: string
  [key: string]: unknown
}

const STORAGE_KEY_GES = 'studio_dental_atenciones_ges_urgencias'
// F7-36 FASE 1 (Commit 1.5d): migrado a createTenantRepository para aislamiento multi-tenant.
// Clave legacy ahora: sd_<clinicaId>_studio_dental_atenciones_ges_urgencias
const gesRepo = createTenantRepository<AtencionGes[]>(STORAGE_KEY_GES, [])

export const urgenciasGesStorageService = {
  obtenerAtenciones: (): AtencionGes[] => gesRepo.obtener([]) || [],
  guardarAtenciones: (atenciones: AtencionGes[]): boolean => gesRepo.guardar(atenciones)
}
