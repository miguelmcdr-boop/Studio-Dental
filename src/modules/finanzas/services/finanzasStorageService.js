/**
 * Persistencia aislada en LocalStorage para Finanzas, Convenios y Cierres de Caja
 *
 * F2-04c: Integración de validación con movimientoFinancieroSchema antes de
 * persistir movimientos, siguiendo el patrón establecido en
 * pacientesStorageService (F2-04) y agendaStorageService (F2-04b).
 * Rechaza datos malformados antes de escribirlos a localStorage,
 * evitando corrupción silenciosa del almacenamiento.
 *
 * Nota: convenios y cierresCaja aún no tienen esquema de validación (posible
 * tarea derivada futura si se requiere).
 */
import { createLocalStorageRepository } from '../../../services/localStorageRepository'
import { validarListaMovimientos } from '../schemas/movimientoFinancieroSchema'

const STORAGE_KEY_MOVIMIENTOS = 'studio_dental_finanzas_movimientos'
const STORAGE_KEY_CONVENIOS = 'studio_dental_finanzas_convenios'
const STORAGE_KEY_CIERRES = 'studio_dental_finanzas_cierres_caja'

const movimientosRepo = createLocalStorageRepository(STORAGE_KEY_MOVIMIENTOS, [])
const conveniosRepo = createLocalStorageRepository(STORAGE_KEY_CONVENIOS, [])
const cierresRepo = createLocalStorageRepository(STORAGE_KEY_CIERRES, [])

export const finanzasStorageService = {
  // Movimientos (Ingresos / Egresos) — con validación F2-04c
  obtenerMovimientos: (defaults = []) => movimientosRepo.obtener(defaults),

  /**
   * Valida la lista de movimientos con movimientoFinancieroSchema antes de persistir.
   * Si la validación falla, NO escribe en localStorage y retorna false.
   * Si la validación pasa, persiste los datos validados y retorna true.
   *
   * @param {Array} movs - Lista de movimientos a persistir.
   * @returns {boolean} true si se guardó exitosamente, false si la validación falló.
   */
  guardarMovimientos: (movs) => {
    const validacion = validarListaMovimientos(movs)
    if (!validacion.valido) {
      console.error(
        'Error de validación al guardar movimientos financieros (F2-04c):',
        validacion.error
      )
      return false
    }
    return movimientosRepo.guardar(validacion.datos)
  },

  // Convenios e Isapres (sin validación por ahora, posible tarea futura)
  obtenerConvenios: (defaults = []) => conveniosRepo.obtener(defaults),
  guardarConvenios: (convenios) => conveniosRepo.guardar(convenios),

  // Cierres y Arqueos de Caja (sin validación por ahora, posible tarea futura)
  obtenerCierresCaja: () => cierresRepo.obtener([]),
  guardarCierresCaja: (cierres) => cierresRepo.guardar(cierres)
}