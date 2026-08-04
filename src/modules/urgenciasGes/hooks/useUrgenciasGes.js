import { useState, useCallback } from 'react'
import { urgenciasGesStorageService } from '../services/urgenciasGesStorageService'
import { generarFolioGes } from '../utils/urgenciasGesCalculations'

export const useUrgenciasGes = () => {
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

  const eliminarAtencion = useCallback((id) => {
    if (window.confirm('¿Deseas eliminar este registro de atención/notificación GES?')) {
      setAtenciones(prev => {
        const actualizadas = prev.filter(a => a.id !== id)
        urgenciasGesStorageService.guardarAtenciones(actualizadas)
        return actualizadas
      })
      if (atencionSeleccionada?.id === id) {
        setAtencionSeleccionada(null)
      }
    }
  }, [atencionSeleccionada])

  return {
    atenciones,
    atencionSeleccionada,
    setAtencionSeleccionada,
    registrarAtencion,
    eliminarAtencion
  }
}