/**
 * Persistencia aislada para Comunicaciones, Bitácora y Plantillas
 */
import { createLocalStorageRepository } from '../../../services/localStorageRepository'

const STORAGE_KEY_PLANTILLAS = 'studio_dental_comunicaciones_plantillas_v3'
const STORAGE_KEY_HISTORIAL = 'studio_dental_comunicaciones_historial_v3'

const plantillasRepo = createLocalStorageRepository(STORAGE_KEY_PLANTILLAS, [])
const historialRepo = createLocalStorageRepository(STORAGE_KEY_HISTORIAL, [])

export const comunicacionesStorageService = {
  obtenerPlantillas: (defaults = []) => plantillasRepo.obtener(defaults),
  guardarPlantillas: (plantillas) => plantillasRepo.guardar(plantillas),

  obtenerHistorial: (defaults = []) => historialRepo.obtener(defaults),
  guardarHistorial: (historial) => historialRepo.guardar(historial)
}