import { useState, useMemo, useCallback, useEffect } from 'react'
import { ARANCEL_DEFAULT, PAQUETES_CLINICOS_DEFAULT } from '../constants/prestacionesConstants'
import { prestacionesStorageService } from '../services/prestacionesStorageService'
import { calcularResumenArancel } from '../utils/prestacionesCalculations'

export const usePrestaciones = (prestacionesProp, setPrestacionesProp) => {
  const [prestaciones, setPrestaciones] = useState(() => {
    const guardadas = prestacionesStorageService.obtenerPrestaciones(ARANCEL_DEFAULT)
    return guardadas && guardadas.length > 0 ? guardadas : ARANCEL_DEFAULT
  })

  const [paquetes, setPaquetes] = useState(() => 
    prestacionesStorageService.obtenerPaquetes(PAQUETES_CLINICOS_DEFAULT)
  )

  const [busqueda, setBusqueda] = useState('')
  const [especialidadFiltro, setEspecialidadFiltro] = useState('Todas')

  // 💡 Sincronización Global con evento para forzar re-render en FichaPaciente
  const guardarYSincronizarGlobal = useCallback((nuevasPrestaciones) => {
    setPrestaciones(nuevasPrestaciones)
    prestacionesStorageService.guardarPrestaciones(nuevasPrestaciones)
    
    if (setPrestacionesProp) {
      setPrestacionesProp(nuevasPrestaciones)
    }

    // Disparar evento para que la Ficha del Paciente se entere al instante
    window.dispatchEvent(new Event('storage'))
    window.dispatchEvent(new CustomEvent('arancel_actualizado', { detail: nuevasPrestaciones }))
  }, [setPrestacionesProp])

  useEffect(() => {
    if (prestacionesProp && prestacionesProp.length > 0) {
      setPrestaciones(prestacionesProp)
    }
  }, [prestacionesProp])

  const resumen = useMemo(() => calcularResumenArancel(prestaciones), [prestaciones])

  const prestacionesFiltradas = useMemo(() => {
    return prestaciones.filter(p => {
      const coincideEsp = especialidadFiltro === 'Todas' || p.especialidad === especialidadFiltro
      const coincideBusqueda = !busqueda.trim() ||
        (p.nombre && p.nombre.toLowerCase().includes(busqueda.toLowerCase())) ||
        (p.codigoFonasa && p.codigoFonasa.toLowerCase().includes(busqueda.toLowerCase()))
      return coincideEsp && coincideBusqueda
    })
  }, [prestaciones, busqueda, especialidadFiltro])

  const agregarOActualizarPrestacion = useCallback((prestacionData) => {
    let actualizadas = []
    const existe = prestaciones.some(p => p.id === prestacionData.id)

    const valPrecio = parseFloat(prestacionData.precioParticular || prestacionData.precio) || 0

    const prestacionNormalizada = {
      id: prestacionData.id || Date.now(),
      nombre: prestacionData.nombre,
      especialidad: prestacionData.especialidad || 'General',
      precio: valPrecio, // 👈 Clave fundamental para Plan de Tratamiento
      precioParticular: valPrecio,
      precioFonasa: parseFloat(prestacionData.precioFonasa) || 0,
      codigoFonasa: prestacionData.codigoFonasa || ''
    }

    if (existe) {
      actualizadas = prestaciones.map(p => p.id === prestacionData.id ? prestacionNormalizada : p)
    } else {
      actualizadas = [prestacionNormalizada, ...prestaciones]
    }

    guardarYSincronizarGlobal(actualizadas)
  }, [prestaciones, guardarYSincronizarGlobal])

  const eliminarPrestacion = useCallback((id) => {
    if (window.confirm('¿Estás seguro de eliminar este procedimiento del arancel?')) {
      const actualizadas = prestaciones.filter(p => p.id !== id)
      guardarYSincronizarGlobal(actualizadas)
    }
  }, [prestaciones, guardarYSincronizarGlobal])

  const aplicarReajusteMasivo = useCallback((porcentaje) => {
    const factor = 1 + (parseFloat(porcentaje) || 0) / 100
    const actualizadas = prestaciones.map(p => {
      const pParticular = Math.round((parseFloat(p.precioParticular || p.precio) || 0) * factor)
      return {
        ...p,
        precio: pParticular,
        precioParticular: pParticular,
        precioFonasa: Math.round((parseFloat(p.precioFonasa) || 0) * factor)
      }
    })
    guardarYSincronizarGlobal(actualizadas)
  }, [prestaciones, guardarYSincronizarGlobal])

  const agregarPaquete = useCallback((nuevoPack) => {
    const valPrecio = parseFloat(nuevoPack.precioCombo) || 0
    const packNormalizado = {
      id: Date.now(),
      nombre: `🎁 ${nuevoPack.nombre}`,
      especialidad: 'Pack Promocional',
      precio: valPrecio, // 👈 Clave fundamental para Plan de Tratamiento
      precioParticular: valPrecio,
      precioFonasa: valPrecio,
      descripcion: nuevoPack.descripcion,
      ahorroEstimado: nuevoPack.ahorroEstimado
    }

    setPaquetes(prev => {
      const actualizados = [packNormalizado, ...prev]
      prestacionesStorageService.guardarPaquetes(actualizados)
      return actualizados
    })

    // Inyección ininterrumpida al arancel principal
    const actualizadasArancel = [packNormalizado, ...prestaciones]
    guardarYSincronizarGlobal(actualizadasArancel)
  }, [prestaciones, guardarYSincronizarGlobal])

  const eliminarPaquete = useCallback((id) => {
    setPaquetes(prev => {
      const actualizados = prev.filter(p => p.id !== id)
      prestacionesStorageService.guardarPaquetes(actualizados)
      return actualizados
    })

    const actualizadasArancel = prestaciones.filter(p => p.id !== id)
    guardarYSincronizarGlobal(actualizadasArancel)
  }, [prestaciones, guardarYSincronizarGlobal])

  return {
    prestaciones: prestacionesFiltradas,
    paquetes,
    resumen,
    busqueda,
    setBusqueda,
    especialidadFiltro,
    setEspecialidadFiltro,
    agregarOActualizarPrestacion,
    eliminarPrestacion,
    aplicarReajusteMasivo,
    agregarPaquete,
    eliminarPaquete
  }
}