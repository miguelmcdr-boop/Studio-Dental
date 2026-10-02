/**
 * validarConflictoCitaUnica — Valida conflictos para una cita única
 */
import { confirmarConDialogo, ConfirmDialogFn } from './confirmarConDialogo'

export interface ConflictoCitaDetalle {
  fecha?: string
  horaInicio?: string
  pacienteNombre?: string
  boxAsignado?: string
  [key: string]: unknown
}

export interface ResultadoValidacionCita {
  valido: boolean
  conflictos: ConflictoCitaDetalle[]
}

export type ValidarCitaFn = (cita: unknown, existentes: unknown[]) => ResultadoValidacionCita

export const validarConflictoCitaUnica = async (
  citaUnica: unknown,
  citasExistentes: unknown[],
  validarFn: ValidarCitaFn,
  confirmFn: ConfirmDialogFn | null = null
): Promise<boolean> => {
  const resultado = validarFn(citaUnica, citasExistentes)
  if (resultado.valido) return true

  const conflictos = resultado.conflictos || []
  const mensaje = `Conflicto de horario detectado:\n\n` +
    conflictos.map(c => `• ${c.fecha} a las ${c.horaInicio} - ${c.pacienteNombre} (${c.boxAsignado})`).join('\n') +
    '\n\n¿Deseas continuar de todos modos?'

  return await confirmarConDialogo(mensaje, confirmFn)
}
