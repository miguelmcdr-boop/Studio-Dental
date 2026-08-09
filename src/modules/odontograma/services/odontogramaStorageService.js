/**
 * Servicio de Persistencia Offline para Odontogramas
 */
import { leerJSON, escribirJSON } from '../../../services/localStorageRepository'

export const odontogramaStorageService = {
  obtenerOdontograma: (key, fallback = {}) => leerJSON(key, fallback),

  guardarOdontograma: (key, data) => escribirJSON(key, data)
}