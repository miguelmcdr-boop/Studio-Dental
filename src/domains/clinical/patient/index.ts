export {
  pacientesStorageService,
  guardarPaciente,
  procesarColaPacientes
} from './services/pacientesStorageService'
export {
  evolucionesStorageService,
  type EvolucionClinicaLocal,
} from './services/evolucionesStorageService'
export type { Paciente } from './schemas/pacienteSchema'
export { FichaPacienteModulo as FichaPaciente } from './FichaPacienteModulo'
export { DirectorioPacientes } from './components/DirectorioPacientes'