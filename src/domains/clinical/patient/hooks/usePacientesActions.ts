import { useState } from 'react'
import { deletePatient } from '../../../../application/patients'
import { createLogger } from '../../../../services/logger'
import { useAppDialog } from '../../../../hooks/useAppDialog'
import type { Paciente } from '../schemas/pacienteSchema'

const log = createLogger('usePacientesActions')

export interface UsePacientesActionsReturn {
  handleEliminarPaciente: (idPaciente: string | number) => Promise<boolean>
  eliminando: boolean
}

/**
 * Hook para acciones sobre pacientes (crear, editar, eliminar).
 * Extraído de App.jsx para respetar límite arquitectónico (F6-F).
 *
 * Refactorizado en Fase 4B-2: actúa como un wrapper delgado que maneja el
 * estado de UI (loading, confirmación, error) y delega la orquestación de
 * eliminación en cascada al Application Service `deletePatient`.
 *
 * @param pacientes - Lista actual de pacientes
 * @param setPacientes - Setter de pacientes
 * @param pacienteSeleccionado - Paciente actualmente seleccionado
 * @param setPacienteSeleccionado - Setter de paciente seleccionado
 */
export const usePacientesActions = (
  pacientes: Paciente[] = [],
  setPacientes: (pacientes: Paciente[]) => void,
  pacienteSeleccionado?: Paciente | null,
  setPacienteSeleccionado?: (paciente: Paciente | null) => void
): UsePacientesActionsReturn => {
  const [eliminando, setEliminando] = useState<boolean>(false)
  const { confirm, alert: dialogAlert } = useAppDialog()

  /**
   * F6-F: Soft delete de paciente vía Application Service.
   */
  const handleEliminarPaciente = async (idPaciente: string | number): Promise<boolean> => {
    if (eliminando) return false

    const confirmado = await confirm({
      title: 'Eliminar paciente',
      description: '¿Estás seguro de eliminar este paciente? El paciente se archivará y podrá ser restaurado por un administrador.',
      variant: 'danger',
      confirmText: 'Eliminar'
    })

    if (!confirmado) return false

    setEliminando(true)

    try {
      const resultado = await deletePatient({ pacienteId: idPaciente })

      if (resultado.success) {
        // Actualizar lista local (paciente desaparece de la vista normal)
        const nuevaLista = pacientes.filter(p => String(p.id) !== String(idPaciente))
        setPacientes(nuevaLista)

        // Limpiar selección si era el paciente eliminado
        if (pacienteSeleccionado && String(pacienteSeleccionado.id) === String(idPaciente)) {
          if (setPacienteSeleccionado) {
            setPacienteSeleccionado(null)
          }
        }

        log.info(`[F6-F] Paciente ${idPaciente} eliminado (soft delete)`)
        return true
      } else {
        const esInesperado = Boolean(resultado.isUnexpected)
        log.error('[F6-F] Error al eliminar paciente:', resultado.error)
        await dialogAlert({
          title: esInesperado ? 'Error inesperado' : 'Error al eliminar',
          description: resultado.error || 'No se pudo eliminar el paciente. Intenta de nuevo.',
          variant: 'error',
          confirmText: 'Entendido'
        })
        return false
      }
    } catch (e) {
      log.error('[F6-F] Excepción al eliminar paciente:', e)
      await dialogAlert({
        title: 'Error inesperado',
        description: 'Error inesperado al eliminar paciente.',
        variant: 'error',
        confirmText: 'Entendido'
      })
      return false
    } finally {
      setEliminando(false)
    }
  }

  return {
    handleEliminarPaciente,
    eliminando
  }
}
