import { useState } from 'react'
import { pacientesStorageService } from '../services/pacientesStorageService'
import { odontogramaStorageService } from '../../odontograma/services/odontogramaStorageService'
import { presupuestosStorageService } from '../../presupuestos/services/presupuestosStorageService'
import { pagosStorageService } from '../../pagos/services/pagosStorageService'
import { eliminarTodosPorPaciente as eliminarAdjuntosDelPaciente } from '../../../services/adjuntosStorageService'

/**
 * Hook para acciones sobre pacientes (crear, editar, eliminar).
 * Extraído de App.jsx para respetar límite arquitectónico (F6-F).
 * 
 * @param {Array} pacientes - Lista actual de pacientes
 * @param {Function} setPacientes - Setter de pacientes
 * @param {Object} pacienteSeleccionado - Paciente actualmente seleccionado
 * @param {Function} setPacienteSeleccionado - Setter de paciente seleccionado
 */
export const usePacientesActions = (pacientes, setPacientes, pacienteSeleccionado, setPacienteSeleccionado) => {
  const [eliminando, setEliminando] = useState(false)

  /**
   * F6-F: Soft delete de paciente.
   * Marca deleted_at en Supabase (trigger trg_pacientes_audit registra automáticamente en audit_log).
   * Paciente queda oculto pero reversible por admin.
   */
  const handleEliminarPaciente = async (idPaciente) => {
    if (eliminando) return

    const confirmado = window.confirm(
      '¿Estás seguro de eliminar este paciente?\n\n' +
      'El paciente se archivará y podrá ser restaurado por un administrador.'
    )

    if (!confirmado) return

    setEliminando(true)

    try {
      // F6-F: soft delete en Supabase (marca deleted_at)
      const eliminado = await pacientesStorageService.eliminarPaciente(idPaciente)

      if (eliminado) {
        // Actualizar lista local (paciente desaparece de la vista normal)
        const nuevaLista = pacientes.filter(p => p.id !== idPaciente)
        setPacientes(nuevaLista)

        // Limpiar selección si era el paciente eliminado
        if (pacienteSeleccionado?.id === idPaciente) {
          setPacienteSeleccionado(null)
        }

        // Eliminar datos clínicos relacionados de localStorage (caché local)
        // F6-D: estos datos ahora viven en Supabase, pero limpiamos caché local
        odontogramaStorageService.eliminarOdontogramasDePaciente(idPaciente)
        pacientesStorageService.eliminarEvolucionesDePaciente(idPaciente)
        presupuestosStorageService.eliminarItemsDePaciente(idPaciente)
        pagosStorageService.eliminarAbonosDePaciente(idPaciente)
        pacientesStorageService.eliminarRecetasDePaciente(idPaciente)

        // Los adjuntos clínicos viven en Supabase Storage + IndexedDB (F6-E).
        // La eliminación es asíncrona; se registra el error si falla.
        eliminarAdjuntosDelPaciente(idPaciente).catch((e) => {
          console.error('[usePacientesActions] No se pudieron eliminar adjuntos IndexedDB:', e)
        })

        console.log(`[F6-F] Paciente ${idPaciente} eliminado (soft delete)`)
      } else {
        console.error('[F6-F] Error al eliminar paciente (soft delete falló)')
        alert('No se pudo eliminar el paciente. Intenta de nuevo.')
      }
    } catch (e) {
      console.error('[F6-F] Excepción al eliminar paciente:', e)
      alert('Error inesperado al eliminar paciente.')
    } finally {
      setEliminando(false)
    }
  }

  return {
    handleEliminarPaciente,
    eliminando
  }
}
