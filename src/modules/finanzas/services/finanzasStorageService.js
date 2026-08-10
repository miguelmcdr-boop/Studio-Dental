/**
 * Persistencia aislada en LocalStorage para Finanzas, Convenios y Cierres de Caja
 */
import { createLocalStorageRepository } from '../../../services/localStorageRepository'

const STORAGE_KEY_MOVIMIENTOS = 'studio_dental_finanzas_movimientos'
const STORAGE_KEY_CONVENIOS = 'studio_dental_finanzas_convenios'
const STORAGE_KEY_CIERRES = 'studio_dental_finanzas_cierres_caja'

const movimientosRepo = createLocalStorageRepository(STORAGE_KEY_MOVIMIENTOS, [])
const conveniosRepo = createLocalStorageRepository(STORAGE_KEY_CONVENIOS, [])
const cierresRepo = createLocalStorageRepository(STORAGE_KEY_CIERRES, [])

export const finanzasStorageService = {
  // Movimientos (Ingresos / Egresos)
  obtenerMovimientos: (defaults = []) => movimientosRepo.obtener(defaults),
  guardarMovimientos: (movs) => movimientosRepo.guardar(movs),

  // Convenios e Isapres
  obtenerConvenios: (defaults = []) => conveniosRepo.obtener(defaults),
  guardarConvenios: (convenios) => conveniosRepo.guardar(convenios),

  // Cierres y Arqueos de Caja
  obtenerCierresCaja: () => cierresRepo.obtener([]),
  guardarCierresCaja: (cierres) => cierresRepo.guardar(cierres)
}