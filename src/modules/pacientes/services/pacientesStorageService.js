import { leerJSON, escribirJSON, createLocalStorageRepository } from '../../../services/localStorageRepository'

const PACIENTES_KEY = 'clinica_lista_pacientes'
const pacientesRepo = createLocalStorageRepository(PACIENTES_KEY, [], { notify: true })

export const pacientesStorageService = {
  // Clave única global para pacientes en la aplicación
  PACIENTES_KEY,

  obtenerPacientes: () => pacientesRepo.obtener([]),

  guardarPacientes: (pacientes) => pacientesRepo.guardar(pacientes),

  obtenerItem: (key, fallback = []) => leerJSON(key, fallback),

  guardarItem: (key, data) => escribirJSON(key, data)
}