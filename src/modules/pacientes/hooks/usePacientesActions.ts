import { useState } from 'react'
import { pacientesStorageService } from '../services/pacientesStorageService'
import { odontogramaStorageService } from '../../odontograma/services/odontogramaStorageService'
import { presupuestosStorageService } from '../../../domains/billing/budget/services/presupuestosStorageService'
import { eliminarAbonosDePaciente } from '../../pagos/services/pagosAbonosLegacyService'
import { eliminarTodosPorPaciente as eliminarAdjuntosDelPaciente } from '../../../services/adjuntosStorageService'
import { createLogger } from '../../../services/logger'
import { useAppDialog } from '../../../hooks/useAppDialog'
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
   * F6-F: Soft delete de paciente.
   * Marca deleted_at en Supabase (trigger trg_pacientes_audit registra automáticamente en audit_log).
   * Paciente queda oculto pero reversible por admin.
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
      // F6-F: soft delete en Supabase (marca deleted_at)
      const eliminado = await pacientesStorageService.eliminarPaciente(idPaciente)

      if (eliminado) {
        // Actualizar lista local (paciente desaparece de la vista normal)
        const nuevaLista = pacientes.filter(p => String(p.id) !== String(idPaciente))
        setPacientes(nuevaLista)

        // Limpiar selección si era el paciente eliminado
        if (pacienteSeleccionado && String(pacienteSeleccionado.id) === String(idPaciente)) {
          if (setPacienteSeleccionado) {
            setPacienteSeleccionado(null)
          }
        }

        // Eliminar datos clínicos relacionados de localStorage (caché local)
        // F6-D: estos datos ahora viven en Supabase, pero limpiamos caché local
        odontogramaStorageService.eliminarOdontogramasDePaciente(idPaciente)
        pacientesStorageService.eliminarEvolucionesDePaciente(idPaciente)
        presupuestosStorageService.eliminarItemsDePaciente(idPaciente)
        eliminarAbonosDePaciente(idPaciente)
        pacientesStorageService.eliminarRecetasDePaciente(idPaciente)

        // Los adjuntos clínicos viven en Supabase Storage + IndexedDB (F6-E).
        // La eliminación es asíncrona; se registra el error si falla.
        eliminarAdjuntosDelPaciente(idPaciente).catch((e: unknown) => {
          log.error('No se pudieron eliminar adjuntos IndexedDB:', e)
        })

        log.info(`[F6-F] Paciente ${idPaciente} eliminado (soft delete)`)
        return true
      } else {
        log.error('[F6-F] Error al eliminar paciente (soft delete falló)')
        await dialogAlert({
          title: 'Error al eliminar',
          description: 'No se pudo eliminar el paciente. Intenta de nuevo.',
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
