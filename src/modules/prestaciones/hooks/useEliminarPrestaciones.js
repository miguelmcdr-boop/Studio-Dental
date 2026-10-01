/**
 * useEliminarPrestaciones — Hook para eliminar prestaciones y paquetes (F10-C3.9)
 *
 * Extraído de usePrestaciones.js para respetar el límite congelado de 176 líneas.
 *
 * @param {Object} options
 * @param {Array} options.prestaciones - Lista de prestaciones actual
 * @param {Function} options.guardarYSincronizarGlobal - Función de guardado global
 * @param {Function} options.setPaquetes - Setter de paquetes
 * @returns {{ eliminarPrestacion: (id: string) => Promise<void>, eliminarPaquete: (id: string) => Promise<void> }}
 */
import { useCallback } from 'react'
import { prestacionesStorageService } from '../services/prestacionesStorageService'
import { useAppDialog } from '../../../hooks/useAppDialog'

export const useEliminarPrestaciones = ({ prestaciones, guardarYSincronizarGlobal, setPaquetes }) => {
  const { confirm } = useAppDialog()

  const eliminarPrestacion = useCallback(async (id) => {
    const ok = await confirm({
      title: 'Eliminar procedimiento',
      description: '¿Estás seguro de eliminar este procedimiento del arancel?',
      variant: 'danger',
      confirmText: 'Eliminar'
    })
    if (ok) {
      const actualizadas = prestaciones.filter(p => String(p.id) !== String(id))
      guardarYSincronizarGlobal(actualizadas)
    }
  }, [prestaciones, guardarYSincronizarGlobal, confirm])

  const eliminarPaquete = useCallback(async (id) => {
    const ok = await confirm({
      title: 'Eliminar paquete',
      description: '¿Estás seguro de eliminar este paquete o promoción?',
      variant: 'danger',
      confirmText: 'Eliminar'
    })
    if (ok) {
      setPaquetes(prev => {
        const actualizados = prev.filter(p => String(p.id) !== String(id))
        prestacionesStorageService.guardarPaquetes(actualizados)
        return actualizados
      })

      const actualizadasArancel = prestaciones.filter(p => String(p.id) !== String(id))
      guardarYSincronizarGlobal(actualizadasArancel)
    }
  }, [prestaciones, guardarYSincronizarGlobal, setPaquetes, confirm])

  return { eliminarPrestacion, eliminarPaquete }
}
