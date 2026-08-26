/**
 * Persistencia aislada en LocalStorage para Arancel y Paquetes Clínicos
 *
 * F2-04d: Integración de validación con prestacionSchema antes de persistir
 * el arancel, siguiendo el patrón establecido en pacientesStorageService (F2-04),
 * agendaStorageService (F2-04b) y finanzasStorageService (F2-04c).
 * Rechaza datos malformados antes de escribirlos a localStorage,
 * evitando corrupción silenciosa del arancel.
 *
 * Nota: paquetes aún no tiene esquema de validación (posible tarea derivada
 * futura si se requiere).
 */
import { createLocalStorageRepository } from '../../../services/localStorageRepository'
import { validarListaPrestaciones } from '../schemas/prestacionSchema'
import { createLogger } from '../../../services/logger.js'

const log = createLogger('prestacionesStorageService')

const STORAGE_KEY_ARANCEL = 'clinica_arancel_prestaciones'
const STORAGE_KEY_PAQUETES = 'clinica_paquetes_clinicos_promos'

const arancelRepo = createLocalStorageRepository(STORAGE_KEY_ARANCEL, undefined)
const paquetesRepo = createLocalStorageRepository(STORAGE_KEY_PAQUETES, undefined)

export const prestacionesStorageService = {
  // Arancel — con validación F2-04d
  obtenerPrestaciones: (defaults) => arancelRepo.obtener(defaults),

  /**
   * Valida la lista de prestaciones con prestacionSchema antes de persistir.
   * Si la validación falla, NO escribe en localStorage y retorna false.
   * Si la validación pasa, persiste los datos validados y retorna true.
   *
   * @param {Array} prestaciones - Lista de prestaciones a persistir.
   * @returns {boolean} true si se guardó exitosamente, false si la validación falló.
   */
  guardarPrestaciones: (prestaciones) => {
    // Si es undefined o null, permite guardar (caso inicial sin arancel)
    if (prestaciones == null) {
      return arancelRepo.guardar(prestaciones)
    }
    const validacion = validarListaPrestaciones(prestaciones)
    if (!validacion.valido) {
      log.error(
        'Error de validación al guardar arancel de prestaciones (F2-04d):',
        validacion.error
      )
      return false
    }
    return arancelRepo.guardar(validacion.datos)
  },

  // Paquetes clínicos (sin validación por ahora, posible tarea futura)
  obtenerPaquetes: (defaults) => paquetesRepo.obtener(defaults),
  guardarPaquetes: (paquetes) => paquetesRepo.guardar(paquetes)
}