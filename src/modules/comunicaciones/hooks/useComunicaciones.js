import { useState, useMemo, useCallback } from 'react'
import { PLANTILLAS_DEFAULT, MENSAJES_HISTORIAL_DEFAULT } from '../constants/comunicacionesConstants'
import { comunicacionesStorageService } from '../services/comunicacionesStorageService'
import { calcularResumenComunicaciones } from '../utils/comunicacionesCalculations'

export const useComunicaciones = () => {
  const [plantillas, setPlantillas] = useState(() => 
    comunicacionesStorageService.obtenerPlantillas(PLANTILLAS_DEFAULT)
  )

  const [historial, setHistorial] = useState(() => 
    comunicacionesStorageService.obtenerHistorial(MENSAJES_HISTORIAL_DEFAULT)
  )

  const [busqueda, setBusqueda] = useState('')
  const [canalFiltro, setCanalFiltro] = useState('Todos')
  const [estadoFiltro, setEstadoFiltro] = useState('Todos')

  const resumen = useMemo(() => calcularResumenComunicaciones(historial), [historial])

  const historialFiltrado = useMemo(() => {
    return historial.filter(m => {
      const coincideCanal = canalFiltro === 'Todos' || m.canal === canalFiltro
      const coincideEstado = estadoFiltro === 'Todos' || m.estado === estadoFiltro
      const coincideBusqueda = !busqueda.trim() ||
        m.pacienteNombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        m.mensajeEnviado.toLowerCase().includes(busqueda.toLowerCase())
      return coincideCanal && coincideEstado && coincideBusqueda
    })
  }, [historial, busqueda, canalFiltro, estadoFiltro])

  // 💡 Registrar o Modificar entrada en la Bitácora
  const registrarOActualizarEnvio = useCallback((registroData) => {
    setHistorial(prev => {
      let actualizados = []
      const existe = prev.some(m => String(m.id) === String(registroData.id))

      if (existe) {
        actualizados = prev.map(m => String(m.id) === String(registroData.id) ? { ...m, ...registroData } : m)
      } else {
        actualizados = [registroData, ...prev]
      }

      comunicacionesStorageService.guardarHistorial(actualizados)
      return actualizados
    })
  }, [])

  // 💡 Modificación rápida de estado de confirmación
  const cambiarEstadoConfirmacion = useCallback((idRegistro, nuevoEstado) => {
    setHistorial(prev => {
      const actualizados = prev.map(m => String(m.id) === String(idRegistro) ? { ...m, estado: nuevoEstado } : m)
      comunicacionesStorageService.guardarHistorial(actualizados)
      return actualizados
    })
  }, [])

  const eliminarRegistroBitacora = useCallback((idRegistro) => {
    if (window.confirm('¿Estás seguro de eliminar esta entrada de la bitácora?')) {
      setHistorial(prev => {
        const actualizados = prev.filter(m => String(m.id) !== String(idRegistro))
        comunicacionesStorageService.guardarHistorial(actualizados)
        return actualizados
      })
    }
  }, [])

  const agregarOEditarPlantilla = useCallback((plantillaData) => {
    setPlantillas(prev => {
      let actualizadas = []
      const existe = prev.some(p => String(p.id) === String(plantillaData.id))

      if (existe) {
        actualizadas = prev.map(p => String(p.id) === String(plantillaData.id) ? plantillaData : p)
      } else {
        actualizadas = [{ ...plantillaData, id: Date.now() }, ...prev]
      }

      comunicacionesStorageService.guardarPlantillas(actualizadas)
      return actualizadas
    })
  }, [])

  const eliminarPlantilla = useCallback((idPlantilla) => {
    if (window.confirm('¿Deseas eliminar esta plantilla de mensajes?')) {
      setPlantillas(prev => {
        const actualizadas = prev.filter(p => String(p.id) !== String(idPlantilla))
        comunicacionesStorageService.guardarPlantillas(actualizadas)
        return actualizadas
      })
    }
  }, [])

  return {
    plantillas,
    historial: historialFiltrado,
    resumen,
    busqueda,
    setBusqueda,
    canalFiltro,
    setCanalFiltro,
    estadoFiltro,
    setEstadoFiltro,
    registrarOActualizarEnvio,
    cambiarEstadoConfirmacion,
    eliminarRegistroBitacora,
    agregarOEditarPlantilla,
    eliminarPlantilla
  }
}