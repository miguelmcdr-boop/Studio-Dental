import { useState, useMemo, useCallback, useEffect } from 'react'
import { ARANCEL_DEFAULT, PAQUETES_CLINICOS_DEFAULT } from '../constants/prestacionesConstants'
import { prestacionesStorageService } from '../services/prestacionesStorageService'
import { calcularResumenArancel } from '../utils/prestacionesCalculations'

export const usePrestaciones = (prestacionesProp, setPrestacionesProp) => {
  const [prestaciones, setPrestaciones] = useState(() => {
    const guardadas = prestacionesStorageService.obtenerPrestaciones(ARANCEL_DEFAULT)
    return (guardadas && guardadas.length > 0 ? guardadas : ARANCEL_DEFAULT).map(p => ({
      ...p,
      precio: parseFloat(p.precio ?? p.precioParticular) || 0,
      precioParticular: parseFloat(p.precioParticular ?? p.precio) || 0
    }))
  })

  const [paquetes, setPaquetes] = useState(() => 
    prestacionesStorageService.obtenerPaquetes(PAQUETES_CLINICOS_DEFAULT)
  )

  const [busqueda, setBusqueda] = useState('')
  const [especialidadFiltro, setEspecialidadFiltro] = useState('Todas')

  // 💡 Sincronizador global reactivo
  const guardarYSincronizarGlobal = useCallback((nuevasPrestaciones) => {
    const normalizadas = nuevasPrestaciones.map(p => ({
      ...p,
      precio: parseFloat(p.precio ?? p.precioParticular) || 0,
      precioParticular: parseFloat(p.precioParticular ?? p.precio) || 0
    }))

    setPrestaciones(normalizadas)
    prestacionesStorageService.guardarPrestaciones(normalizadas)
    
    if (setPrestacionesProp) {
      setPrestacionesProp(normalizadas)
    }

    window.dispatchEvent(new Event('storage'))
    window.dispatchEvent(new CustomEvent('arancel_actualizado', { detail: normalizadas }))
  }, [setPrestacionesProp])

  useEffect(() => {
    if (prestacionesProp && prestacionesProp.length > 0) {
      setPrestaciones(prestacionesProp.map(p => ({
        ...p,
        precio: parseFloat(p.precio ?? p.precioParticular) || 0,
        precioParticular: parseFloat(p.precioParticular ?? p.precio) || 0
      })))
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
    const existe = prestaciones.some(p => String(p.id) === String(prestacionData.id))

    const valPrecio = parseFloat(prestacionData.precioParticular ?? prestacionData.precio) || 0

    const prestacionNormalizada = {
      id: prestacionData.id || Date.now(),
      nombre: prestacionData.nombre,
      especialidad: prestacionData.especialidad || 'General',
      precio: valPrecio,
      precioParticular: valPrecio,
      precioFonasa: parseFloat(prestacionData.precioFonasa) || 0,
      codigoFonasa: prestacionData.codigoFonasa || ''
    }

    if (existe) {
      actualizadas = prestaciones.map(p => String(p.id) === String(prestacionData.id) ? prestacionNormalizada : p)
    } else {
      actualizadas = [prestacionNormalizada, ...prestaciones]
    }

    guardarYSincronizarGlobal(actualizadas)
  }, [prestaciones, guardarYSincronizarGlobal])

  const eliminarPrestacion = useCallback((id) => {
    if (window.confirm('¿Estás seguro de eliminar este procedimiento del arancel?')) {
      const actualizadas = prestaciones.filter(p => String(p.id) !== String(id))
      guardarYSincronizarGlobal(actualizadas)
    }
  }, [prestaciones, guardarYSincronizarGlobal])

  const aplicarReajusteMasivo = useCallback((porcentaje) => {
    const factor = 1 + (parseFloat(porcentaje) || 0) / 100
    const actualizadas = prestaciones.map(p => {
      const pParticular = Math.round((parseFloat(p.precioParticular ?? p.precio) || 0) * factor)
      return {
        ...p,
        precio: pParticular,
        precioParticular: pParticular,
        precioFonasa: Math.round((parseFloat(p.precioFonasa) || 0) * factor)
      }
    })
    guardarYSincronizarGlobal(actualizadas)
  }, [prestaciones, guardarYSincronizarGlobal])

  // 💡 Crear o Editar Paquetes Promocionales
  const agregarOEditarPaquete = useCallback((nuevoPack) => {
    const valPrecio = typeof nuevoPack.precioCombo === 'number'
      ? nuevoPack.precioCombo
      : parseFloat(String(nuevoPack.precioCombo).replace(/[^0-9]/g, '')) || 0

    const packId = nuevoPack.id || Date.now()
    const nombreLimpio = nuevoPack.nombre.startsWith('🎁') ? nuevoPack.nombre : `🎁 ${nuevoPack.nombre}`

    const packNormalizado = {
      id: packId,
      nombre: nombreLimpio,
      especialidad: 'Pack Promocional',
      precio: valPrecio,
      precioParticular: valPrecio,
      precioFonasa: valPrecio,
      precioCombo: valPrecio,
      descripcion: nuevoPack.descripcion,
      ahorroEstimado: nuevoPack.ahorroEstimado
    }

    setPaquetes(prev => {
      const existe = prev.some(p => String(p.id) === String(packId))
      const actualizados = existe
        ? prev.map(p => String(p.id) === String(packId) ? packNormalizado : p)
        : [packNormalizado, ...prev]
      prestacionesStorageService.guardarPaquetes(actualizados)
      return actualizados
    })

    // Sincronizar en el catálogo de arancel general para Plan de Tratamiento
    const existeEnArancel = prestaciones.some(p => String(p.id) === String(packId))
    const actualizadasArancel = existeEnArancel
      ? prestaciones.map(p => String(p.id) === String(packId) ? packNormalizado : p)
      : [packNormalizado, ...prestaciones]

    guardarYSincronizarGlobal(actualizadasArancel)
  }, [prestaciones, guardarYSincronizarGlobal])

  const eliminarPaquete = useCallback((id) => {
    if (window.confirm('¿Estás seguro de eliminar este paquete o promoción?')) {
      setPaquetes(prev => {
        const actualizados = prev.filter(p => String(p.id) !== String(id))
        prestacionesStorageService.guardarPaquetes(actualizados)
        return actualizados
      })

      const actualizadasArancel = prestaciones.filter(p => String(p.id) !== String(id))
      guardarYSincronizarGlobal(actualizadasArancel)
    }
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
    agregarPaquete: agregarOEditarPaquete,
    eliminarPaquete
  }
}