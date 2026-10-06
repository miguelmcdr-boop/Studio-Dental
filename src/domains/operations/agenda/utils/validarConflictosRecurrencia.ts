/**
 * confirmarConflictosRecurrencia — Valida conflictos de horario para múltiples citas
 */
import { confirmarConDialogo, ConfirmDialogFn } from './confirmarConDialogo'

export interface ConflictoRecurrenciaDetalle {
  fecha?: string
  horaInicio?: string
  pacienteNombre?: string
  boxAsignado?: string
  [key: string]: unknown
}

export interface ResultadoValidacionRecurrencia {
  valido: boolean
  conflictos: ConflictoRecurrenciaDetalle[]
}

export type ValidarRecurrenciaFn = (cita: Record<string, unknown>, existentes: unknown[]) => ResultadoValidacionRecurrencia

export const confirmarConflictosRecurrencia = async (
  citasAGuardar: Record<string, unknown>[],
  citasExistentes: unknown[],
  validarFn: ValidarRecurrenciaFn,
  confirmFn: ConfirmDialogFn | null = null
): Promise<boolean> => {
  const todosLosConflictos: Array<{ fecha?: string; hora?: string; paciente?: string; box?: string }> = []
  citasAGuardar.forEach((cita) => {
    const resultado = validarFn(cita, citasExistentes)
    if (!resultado.valido) {
      (resultado.conflictos || []).forEach((conflicto) => {
        todosLosConflictos.push({
          fecha: conflicto.fecha, hora: conflicto.horaInicio,
          paciente: conflicto.pacienteNombre, box: conflicto.boxAsignado
        })
      })
    }
  })

  if (todosLosConflictos.length === 0) return true

  const mensaje = `Se detectaron ${todosLosConflictos.length} conflicto(s) de horario:\n\n` +
    todosLosConflictos.slice(0, 5).map(c => `• ${c.fecha} a las ${c.hora} - ${c.paciente} (${c.box})`).join('\n') +
    (todosLosConflictos.length > 5 ? `\n...y ${todosLosConflictos.length - 5} más` : '') +
    '\n\n¿Deseas continuar de todos modos?'

  return await confirmarConDialogo(mensaje, confirmFn)
}
