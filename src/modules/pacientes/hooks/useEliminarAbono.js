/**
 * useEliminarAbono — Hook para eliminar abonos de un paciente (F10-C3.4)
 *
 * Extraído de usePresupuestoForm.js para respetar el límite constitucional de 150 líneas.
 *
 * @param {Object} options
 * @param {Array} options.abonos - Lista de abonos actual
 * @param {Function} options.setAbonos - Setter de abonos
 * @param {Object} options.paciente - Paciente al que pertenecen los abonos
 * @returns {{ handleEliminarAbono: (idAbono: string) => Promise<void> }}
 */
import { useCallback } from 'react'
import { pacientesStorageService } from '../services/pacientesStorageService'
import { useAppDialog } from '../../../hooks/useAppDialog'

export const useEliminarAbono = ({ abonos, setAbonos, paciente }) => {
  const { confirm } = useAppDialog()

  const handleEliminarAbono = useCallback(async (idAbono) => {
    const ok = await confirm({
      title: 'Eliminar abono',
      description: '¿Deseas eliminar este registro de abono ingresado?',
      variant: 'danger',
      confirmText: 'Eliminar'
    })
    if (!ok) return
    const actualizados = abonos.filter(a => a.id !== idAbono)
    setAbonos(actualizados)
    pacientesStorageService.guardarItem(`abonos_${paciente.id}`, actualizados)
  }, [abonos, setAbonos, paciente, confirm])

  return { handleEliminarAbono }
}
