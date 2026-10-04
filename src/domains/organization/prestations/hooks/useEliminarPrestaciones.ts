import { useCallback } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import {
  prestacionesStorageService,
  type Prestacion,
  type PaqueteClinico
} from '../services/prestacionesStorageService'
import { useAppDialog } from '../../../../hooks/useAppDialog'

export interface UseEliminarPrestacionesOptions {
  prestaciones: Prestacion[]
  guardarYSincronizarGlobal: (nuevasPrestaciones: Prestacion[]) => void
  setPaquetes: Dispatch<SetStateAction<PaqueteClinico[]>>
}

export interface UseEliminarPrestacionesReturn {
  eliminarPrestacion: (id: number | string) => Promise<void>
  eliminarPaquete: (id: number | string) => Promise<void>
}

export const useEliminarPrestaciones = ({
  prestaciones,
  guardarYSincronizarGlobal,
  setPaquetes
}: UseEliminarPrestacionesOptions): UseEliminarPrestacionesReturn => {
  const { confirm } = useAppDialog()

  const eliminarPrestacion = useCallback(
    async (id: number | string) => {
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
    },
    [prestaciones, guardarYSincronizarGlobal, confirm]
  )

  const eliminarPaquete = useCallback(
    async (id: number | string) => {
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

        const actualizadasArancel = prestaciones.filter(
          p => String(p.id) !== String(id)
        )
        guardarYSincronizarGlobal(actualizadasArancel)
      }
    },
    [prestaciones, guardarYSincronizarGlobal, setPaquetes, confirm]
  )

  return { eliminarPrestacion, eliminarPaquete }
}
