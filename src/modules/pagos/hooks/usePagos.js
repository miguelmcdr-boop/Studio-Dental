import { useState, useMemo, useCallback } from 'react'
import { PAGOS_DEFAULT } from '../constants/pagosConstants'
import { pagosStorageService } from '../services/pagosStorageService'
import { exportarAuditoriaPagosXLSX } from '../services/pagosExportService'
import { calcularResumenRecaudacion } from '../utils/pagosCalculations'
import { useAppDialog } from '../../../hooks/useAppDialog'
import { useSesionStore } from '../../../store/sesionStore'

export const usePagos = () => {
  const { confirm, alert } = useAppDialog()
  const userProfile = useSesionStore((state) => state.userProfile)
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

  const anularPago = useCallback(async (idPago, motivoAnulacion) => {
    const ok = await confirm({
      title: 'Anular comprobante de pago',
      description: '¿Estás seguro de anular este comprobante de pago? El registro quedará guardado en auditoría.',
      variant: 'danger',
      confirmText: 'Anular'
    })
    if (ok) {
      setPagos(prev => {
        const actualizados = prev.map(p => {
          if (String(p.id) === String(idPago)) {
            // Propagar anulación al Plan de Tratamiento (Commit C)
            if (p.pacienteId) {
              pagosStorageService.removerAbonoDeFichaPaciente(p.pacienteId, p.id)
            }
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
  }, [confirm])

  const purgarPago = useCallback(async (idPago, motivo) => {
    if (!motivo || motivo.trim().length < 10) {
      await alert({ title: 'Motivo inválido', description: 'El motivo debe tener al menos 10 caracteres.', variant: 'warning', confirmText: 'Entendido' })
      return false
    }
    // Obtener el pago antes de purgar para conocer pacienteId
    const pagoAPurgar = pagos.find(p => String(p.id) === String(idPago))
    const ok = pagosStorageService.purgarPago(idPago, motivo, userProfile?.email || 'desconocido')
    if (ok) {
      // Propagar purga al Plan de Tratamiento (Commit C)
      if (pagoAPurgar?.pacienteId) {
        pagosStorageService.removerAbonoDeFichaPaciente(pagoAPurgar.pacienteId, idPago)
      }
      setPagos(prev => prev.filter(p => String(p.id) !== String(idPago)))
      await alert({
        title: 'Pago purgado',
        description: 'El pago fue eliminado definitivamente del sistema. La acción quedó registrada en auditoría.',
        variant: 'success',
        confirmText: 'Entendido'
      })
      return true
    }
    await alert({
      title: 'Error al purgar',
      description: 'No se encontró el pago en el sistema.',
      variant: 'error',
      confirmText: 'Entendido'
    })
    return false
  }, [alert, userProfile, pagos])

  const exportarAuditoria = useCallback(async () => {
    const todos = pagosStorageService.obtenerPagosParaAuditoria()
    const resultado = await exportarAuditoriaPagosXLSX(todos)
    if (resultado.ok) {
      await alert({
        title: 'Auditoría exportada',
        description: `Se exportaron ${resultado.total} pagos (vigentes + anulados) a ${resultado.nombreArchivo}.`,
        variant: 'success',
        confirmText: 'Entendido'
      })
    } else {
      await alert({
        title: 'Error al exportar',
        description: 'No se pudo generar el archivo CSV.',
        variant: 'error',
        confirmText: 'Entendido'
      })
    }
  }, [alert])

  return {
    pagos: pagosFiltrados,
    todosLosPagos: pagos,
    resumen,
    busqueda,
    setBusqueda,
    metodoFiltro,
    setMetodoFiltro,
    estadoFiltro,
    setEstadoFiltro,
    agregarOActualizarPago,
    anularPago,
    purgarPago,
    exportarAuditoria
  }
}