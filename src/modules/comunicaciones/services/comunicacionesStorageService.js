/**
 * Persistencia aislada para Comunicaciones, Bitácora y Plantillas
 */
import { createLocalStorageRepository } from '../../../services/localStorageRepository'

const STORAGE_KEY_PLANTILLAS = 'studio_dental_comunicaciones_plantillas_v3'
const STORAGE_KEY_HISTORIAL = 'studio_dental_comunicaciones_historial_v3'

const plantillasRepo = createLocalStorageRepository(STORAGE_KEY_PLANTILLAS, [])
const historialRepo = createLocalStorageRepository(STORAGE_KEY_HISTORIAL, [])

/**
 * Migración C4-Fase2: Limpia emojis de nombres de plantillas existentes en localStorage
 * Se ejecuta una sola vez al cargar las plantillas
 */
const limpiarEmojisDePlantillas = (plantillas = []) => {
  const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu
  return plantillas.map(pl => ({
    ...pl,
    nombre: pl.nombre ? pl.nombre.replace(emojiRegex, '').trim() : pl.nombre
  }))
}

export const comunicacionesStorageService = {
  obtenerPlantillas: (defaults = []) => {
    const plantillas = plantillasRepo.obtener(defaults)
    // Migración C4: limpiar emojis de datos existentes
    const plantillasLimpias = limpiarEmojisDePlantillas(plantillas)
    // Guardar las plantillas limpias si había emojis
    if (JSON.stringify(plantillas) !== JSON.stringify(plantillasLimpias)) {
      plantillasRepo.guardar(plantillasLimpias)
    }
    return plantillasLimpias
  },
  guardarPlantillas: (plantillas) => plantillasRepo.guardar(plantillas),

  obtenerHistorial: (defaults = []) => historialRepo.obtener(defaults),
  guardarHistorial: (historial) => historialRepo.guardar(historial)
}