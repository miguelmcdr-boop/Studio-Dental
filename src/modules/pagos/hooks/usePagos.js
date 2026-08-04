import { useState, useMemo, useCallback } from 'react'
import { PAGOS_DEFAULT } from '../constants/pagosConstants'
import { pagosStorageService } from '../services/pagosStorageService'
import { calcularResumenRecaudacion } from '../utils/pagosCalculations'

export const usePagos = () => {
  const [pagos, setPagos] = useState(() => 
    pagosStorageService.obtenerPagos(PAGOS_DEFAULT)
  )

  const [busqueda, setBusqueda] = useState('')
  const [metodoFiltro, setMetodoFiltro] = useState('Todos')
  const [estadoFiltro, setEstadoFiltro] = useState('Todos')

  const resumen = useMemo(() => calcularResumenRecaudacion(pagos), [pagos])

  const pagosFiltrados = useMemo(() => {
    return pagos.filter(p => {
      const coincideMetodo = metodoFiltro === 'Todos' || p.metodoPago === metodoFiltro
      const coincideEstado = estadoFiltro === 'Todos' || p.estado === estadoFiltro
      const coincideBusqueda = !busqueda.trim() ||
        p.folioComprobante.toLowerCase().includes(busqueda.toLowerCase()) ||
        (p.folioDTE && p.folioDTE.toLowerCase().includes(busqueda.toLowerCase())) ||
        p.pacienteNombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.pacienteRut.includes(busqueda)
      return coincideMetodo && coincideEstado && coincideBusqueda
    })
  }, [pagos, busqueda, metodoFiltro, estadoFiltro])

  const agregarOActualizarPago = useCallback((pagoData) => {
    setPagos(prev => {
      let actualizados = []
      const existe = prev.some(p => String(p.id) === String(pagoData.id))

      if (existe) {
        actualizados = prev.map(p => String(p.id) === String(pagoData.id) ? { ...p, ...pagoData } : p)
      } else {
        actualizados = [pagoData, ...prev]
      }

      pagosStorageService.guardarPagos(actualizados)
      pagosStorageService.sincronizarAbonoConFichaPaciente(pagoData.pacienteId, pagoData)
      return actualizados
    })
  }, [])

  const anularPago = useCallback((idPago, motivoAnulacion) => {
    if (window.confirm('¿Estás seguro de anular este comprobante de pago? El registro quedará guardado en auditoría.')) {
      setPagos(prev => {
        const actualizados = prev.map(p => {
          if (String(p.id) === String(idPago)) {
            return {
              ...p,
              estado: 'Anulado',
              motivoAnulacion: motivoAnulacion || 'Anulado por usuario',
              fechaAnulacion: new Date().toLocaleDateString('es-CL')
            }
          }
          return p
        })
        pagosStorageService.guardarPagos(actualizados)
        return actualizados
      })
    }
  }, [])

  return {
    pagos: pagosFiltrados,
    resumen,
    busqueda,
    setBusqueda,
    metodoFiltro,
    setMetodoFiltro,
    estadoFiltro,
    setEstadoFiltro,
    agregarOActualizarPago,
    anularPago
  }
}