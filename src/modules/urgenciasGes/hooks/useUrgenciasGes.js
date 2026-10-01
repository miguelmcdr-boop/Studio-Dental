import { useState, useCallback } from 'react'
import { urgenciasGesStorageService } from '../services/urgenciasGesStorageService'
import { generarFolioGes } from '../utils/urgenciasGesCalculations'
import { useAppDialog } from '../../../hooks/useAppDialog'

export const useUrgenciasGes = () => {
  const { confirm } = useAppDialog()
  const [atenciones, setAtenciones] = useState(() => urgenciasGesStorageService.obtenerAtenciones())
  const [atencionSeleccionada, setAtencionSeleccionada] = useState(null)

  const registrarAtencion = useCallback((nuevaAtencion) => {
    const atencionCompleta = {
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
  }, [])

  const eliminarAtencion = useCallback(async (id) => {
    const ok = await confirm({
      title: 'Eliminar atención GES',
      description: '¿Deseas eliminar este registro de atención/notificación GES?',
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
  }, [atencionSeleccionada, confirm])

  return {
    atenciones,
    atencionSeleccionada,
    setAtencionSeleccionada,
    registrarAtencion,
    eliminarAtencion
  }
}