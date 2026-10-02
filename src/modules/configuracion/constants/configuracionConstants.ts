/**
 * Constantes y Configuración por Defecto
 */

export interface ClinicaConfig {
  nombreClinica: string
  razonSocial: string
  rutClinica: string
  direccion: string
  ciudad: string
  telefono: string
  emailContacto: string
  eslogan: string
  logoUrl: string
}

export interface ParametrosAgendaConfig {
  duracionBloqueMinutos: number
  horaInicio: string
  horaFin: string
  diasLaborales: string[]
}

export const CLINICA_DEFAULT: ClinicaConfig = {
  nombreClinica: 'DentikOS',
  razonSocial: 'Sociedad Odontológica DentikOS SpA',
  rutClinica: '77.854.320-K',
  direccion: "Av. Libertador Bernardo O'Higgins 1449, Oficina 602",
  ciudad: 'Santiago, Chile',
  telefono: '+56 9 8765 4321',
  emailContacto: 'contacto@dentikos.cl',
  eslogan: 'Odontología de Alta Precisión & Estética Dental',
  logoUrl: ''
}

export const PARAMETROS_AGENDA_DEFAULT: ParametrosAgendaConfig = {
  duracionBloqueMinutos: 30,
  horaInicio: '08:30',
  horaFin: '19:30',
  diasLaborales: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
}

export const TRAMOS_DURACION: readonly number[] = [15, 20, 30, 45, 60]
