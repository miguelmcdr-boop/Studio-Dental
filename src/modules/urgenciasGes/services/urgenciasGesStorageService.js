/**
 * Persistencia en LocalStorage para Urgencias y Notificaciones GES
 */
import { createLocalStorageRepository } from '../../../services/localStorageRepository'

const STORAGE_KEY_GES = 'studio_dental_atenciones_ges_urgencias'
const gesRepo = createLocalStorageRepository(STORAGE_KEY_GES, [])

export const urgenciasGesStorageService = {
  obtenerAtenciones: () => gesRepo.obtener([]),
  guardarAtenciones: (atenciones) => gesRepo.guardar(atenciones)
}