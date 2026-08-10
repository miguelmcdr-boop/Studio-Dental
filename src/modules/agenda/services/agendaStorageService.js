/**
 * Persistencia en LocalStorage para Agenda Multi-Box (v3.0.0 Enterprise)
 */
import { createLocalStorageRepository } from '../../../services/localStorageRepository'

const STORAGE_KEY_AGENDA = 'studio_dental_agenda_citas_v3'
const citasRepo = createLocalStorageRepository(STORAGE_KEY_AGENDA, [], { notify: true })

export const agendaStorageService = {
  obtenerCitas: (defaults = []) => citasRepo.obtener(defaults),
  guardarCitas: (citas) => citasRepo.guardar(citas)
}