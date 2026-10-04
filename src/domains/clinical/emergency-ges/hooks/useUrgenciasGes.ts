import { useState, useCallback } from 'react'
import {
  urgenciasGesStorageService,
  type AtencionGes
} from '../services/urgenciasGesStorageService'
import { generarFolioGes } from '../utils/urgenciasGesCalculations'
import { useAppDialog } from '../../../../hooks/useAppDialog'

export interface UseUrgenciasGesReturn {
  atenciones: AtencionGes[]
  atencionSeleccionada: AtencionGes | null
  setAtencionSeleccionada: React.Dispatch<React.SetStateAction<AtencionGes | null>>
  registrarAtencion: (nuevaAtencion: Partial<AtencionGes>) => AtencionGes
  eliminarAtencion: (id: string | number) => Promise<void>
}

export const useUrgenciasGes = (): UseUrgenciasGesReturn => {
  const { confirm } = useAppDialog()
  const [atenciones, setAtenciones] = useState<AtencionGes[]>(() =>
    urgenciasGesStorageService.obtenerAtenciones()
  )
  const [atencionSeleccionada, setAtencionSeleccionada] =
    useState<AtencionGes | null>(null)

  const registrarAtencion = useCallback(
    (nuevaAtencion: Partial<AtencionGes>): AtencionGes => {
      const atencionCompleta: AtencionGes = {
        ...nuevaAtencion,
        id: Date.now(),
        folio: generarFolioGes(),
        fechaCreacion: new Date().toLocaleDateString('es-CL')
      }

      setAtenciones(prev => {
        const actualizadas = [atencionCompleta, ...prev]
        urgenciasGesStorageService.guardarAtenciones(actualizadas)
        return actualizadas
      })

      setAtencionSeleccionada(atencionCompleta)
      return atencionCompleta
    },
    []
  )

  const eliminarAtencion = useCallback(
    async (id: string | number) => {
      const ok = await confirm({
        title: 'Eliminar atención GES',
        description:
          '¿Deseas eliminar este registro de atención/notificación GES?',
        variant: 'danger',
        confirmText: 'Eliminar'
      })
      if (ok) {
        setAtenciones(prev => {
          const actualizadas = prev.filter(a => a.id !== id)
          urgenciasGesStorageService.guardarAtenciones(actualizadas)
          return actualizadas
        })
        if (atencionSeleccionada?.id === id) {
          setAtencionSeleccionada(null)
        }
      }
    },
    [atencionSeleccionada, confirm]
  )

  return {
    atenciones,
    atencionSeleccionada,
    setAtencionSeleccionada,
    registrarAtencion,
    eliminarAtencion
  }
}
