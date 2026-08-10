import { leerJSON, escribirJSON, createLocalStorageRepository } from '../../../services/localStorageRepository'
import { validarListaPacientes } from '../schemas/pacienteSchema'

const PACIENTES_KEY = 'clinica_lista_pacientes'
const pacientesRepo = createLocalStorageRepository(PACIENTES_KEY, [], { notify: true })

export const pacientesStorageService = {
  // Clave única global para pacientes en la aplicación
  PACIENTES_KEY,

  obtenerPacientes: (defaults = []) => pacientesRepo.obtener(defaults),

  // (F2-04) — valida contra el esquema Zod antes de persistir. Si los datos
  // no cumplen el esquema (ej. un paciente sin nombre o sin rut), NO se
  // guarda silenciosamente: se registra el detalle exacto en consola y se
  // retorna false, igual que el resto de los métodos de este servicio ante
  // un error de storage.
  guardarPacientes: (pacientes) => {
    const { valido, datos, error } = validarListaPacientes(pacientes)
    if (!valido) {
      console.error('Validación de esquema falló al guardar pacientes — datos NO persistidos:', error.issues)
      return false
    }
    return pacientesRepo.guardar(datos)
  },

  obtenerItem: (key, fallback = []) => leerJSON(key, fallback),

  guardarItem: (key, data) => escribirJSON(key, data)
}