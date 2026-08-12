/**
 * Persistencia en LocalStorage para Agenda Multi-Box (v3.0.0 Enterprise)
 *
 * F2-04b: Integración de validación con citaSchema antes de persistir,
 * siguiendo el patrón establecido en pacientesStorageService (F2-04).
 * Rechaza datos malformados antes de escribirlos a localStorage,
 * evitando corrupción silenciosa del almacenamiento.
 */
import { createLocalStorageRepository } from '../../../services/localStorageRepository'
import { validarListaCitas } from '../schemas/citaSchema'

const STORAGE_KEY_AGENDA = 'studio_dental_agenda_citas_v3'
const citasRepo = createLocalStorageRepository(STORAGE_KEY_AGENDA, [], { notify: true })

export const agendaStorageService = {
  obtenerCitas: (defaults = []) => citasRepo.obtener(defaults),

  /**
   * Valida la lista de citas con citaSchema antes de persistir.
   * Si la validación falla, NO escribe en localStorage y retorna false.
   * Si la validación pasa, persiste los datos validados y retorna true.
   *
   * @param {Array} citas - Lista de citas a persistir.
   * @returns {boolean} true si se guardó exitosamente, false si la validación falló.
   */
  guardarCitas: (citas) => {
    const validacion = validarListaCitas(citas)
    if (!validacion.valido) {
      console.error(
        'Error de validación al guardar citas (F2-04b):',
        validacion.error
      )
      return false
    }
    return citasRepo.guardar(validacion.datos)
  }
}