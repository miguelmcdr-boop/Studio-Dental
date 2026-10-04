/**
 * Persistencia aislada para Comunicaciones, Bitácora y Plantillas
 */
import { createTenantRepository } from '../../../../services/localStorageRepository'
import type {
  PlantillaComunicacion,
  MensajeHistorial
} from '../constants/comunicacionesConstants'

const STORAGE_KEY_PLANTILLAS = 'studio_dental_comunicaciones_plantillas_v3'
const STORAGE_KEY_HISTORIAL = 'studio_dental_comunicaciones_historial_v3'

// F7-36 FASE 1 (Commit 1.5e): migrados a createTenantRepository para aislamiento multi-tenant.
// Claves legacy ahora: sd_<clinicaId>_studio_dental_comunicaciones_*
const plantillasRepo = createTenantRepository<PlantillaComunicacion[]>(STORAGE_KEY_PLANTILLAS, [])
const historialRepo = createTenantRepository<MensajeHistorial[]>(STORAGE_KEY_HISTORIAL, [])

/**
 * Migración C4-Fase2: Limpia emojis de nombres de plantillas existentes en localStorage
 * Se ejecuta una sola vez al cargar las plantillas
 */
const limpiarEmojisDePlantillas = (plantillas: PlantillaComunicacion[] = []): PlantillaComunicacion[] => {
  const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu
  return plantillas.map(pl => ({
    ...pl,
    nombre: pl.nombre ? pl.nombre.replace(emojiRegex, '').trim() : pl.nombre
  }))
}

export const comunicacionesStorageService = {
  obtenerPlantillas: (defaults: PlantillaComunicacion[] = []): PlantillaComunicacion[] => {
    const plantillas = plantillasRepo.obtener(defaults)
    // Migración C4: limpiar emojis de datos existentes
    const plantillasLimpias = limpiarEmojisDePlantillas(plantillas)
    // Guardar las plantillas limpias si había emojis
    if (JSON.stringify(plantillas) !== JSON.stringify(plantillasLimpias)) {
      plantillasRepo.guardar(plantillasLimpias)
    }
    return plantillasLimpias
  },
  guardarPlantillas: (plantillas: PlantillaComunicacion[]): boolean => plantillasRepo.guardar(plantillas),

  obtenerHistorial: (defaults: MensajeHistorial[] = []): MensajeHistorial[] => historialRepo.obtener(defaults),
  guardarHistorial: (historial: MensajeHistorial[]): boolean => historialRepo.guardar(historial)
}
