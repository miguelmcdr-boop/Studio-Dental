/**
 * useCalculadoraBoletas — Hook para liquidador de honorarios (F10-C3.10)
 *
 * Extraído de CalculadoraBoletas.jsx para respetar el límite constitucional
 * de 250 líneas por archivo JSX.
 *
 * @param {Object} options
 * @param {Function} options.alRegistrarGastoHonorario - Callback para registrar gasto
 * @returns {Object} Estado, setters, cálculos y handler
 */
import { useState } from 'react'
import { PORCENTAJE_RETENCION_HONORARIOS_DEFAULT } from '../constants/finanzasConstants'
import { calcularBoletaHonorarios, calcularMontoComision, formatearCLP } from '../utils/finanzasCalculations'
import { useAppDialog } from '../../../hooks/useAppDialog'

export const useCalculadoraBoletas = ({ alRegistrarGastoHonorario }) => {
  const { alert: dialogAlert } = useAppDialog()

  // ═══════════════════════════════════════════════════════════════════
  // ESTADO
  // ═══════════════════════════════════════════════════════════════════
  const [usarPorcentajePrestacion, setUsarPorcentajePrestacion] = useState(true)
  const [nombrePrestacion, setNombrePrestacion] = useState('')
  const [valorPrestacion, setValorPrestacion] = useState('')
  const [pctComisionEspecialista, setPctComisionEspecialista] = useState(60)
  const [montoDirecto, setMontoDirecto] = useState('')
  const [modoCalculo, setModoCalculo] = useState('liquido')
  const [pctRetencion, setPctRetencion] = useState(PORCENTAJE_RETENCION_HONORARIOS_DEFAULT)
  const [nombreEspecialista, setNombreEspecialidad] = useState('')
  const [especialidad, setEspecialidad] = useState('')

  // ═══════════════════════════════════════════════════════════════════
  // CÁLCULOS DERIVADOS
  // ═══════════════════════════════════════════════════════════════════
  const valPrestacionNum = parseFloat(valorPrestacion) || 0
  const comisionInfo = calcularMontoComision(valPrestacionNum, pctComisionEspecialista)
  const montoBaseParaBoleta = usarPorcentajePrestacion
    ? comisionInfo.montoEspecialista
    : (parseFloat(montoDirecto) || 0)
  const resultado = calcularBoletaHonorarios(montoBaseParaBoleta, modoCalculo, pctRetencion)

  // ═══════════════════════════════════════════════════════════════════
  // HANDLER: cargar a gastos
  // ═══════════════════════════════════════════════════════════════════
  const handleCargarAGastos = async () => {
    if (!resultado.liquido || resultado.liquido <= 0) return

    const detalleTexto = usarPorcentajePrestacion
      ? `Honorario (${pctComisionEspecialista}% de ${nombrePrestacion || 'Prestación'} ${formatearCLP(valPrestacionNum)}): ${nombreEspecialista || 'Dr.'} (${especialidad || 'Especialista'}) — Boleta Bruta: ${formatearCLP(resultado.bruto)}, Retención SII (${pctRetencion}%): ${formatearCLP(resultado.retencion)}`
      : `Pago Honorarios: ${nombreEspecialista || 'Especialista'} (${especialidad || 'Dental'}) — Boleta Bruta: ${formatearCLP(resultado.bruto)}, Retención SII (${pctRetencion}%): ${formatearCLP(resultado.retencion)}`

    const nuevoGasto = {
      id: Date.now(),
      fecha: new Date().toLocaleDateString('es-CL'),
      tipo: 'egreso',
      monto: resultado.liquido,
      categoria: 'Pago Honorarios Especialista',
      metodoPago: 'Transferencia',
      detalle: detalleTexto
    }

    if (alRegistrarGastoHonorario) {
      alRegistrarGastoHonorario(nuevoGasto)
      await dialogAlert({
        title: 'Pago registrado',
        description: 'Pago de honorarios registrado exitosamente en el Flujo de Caja.',
        variant: 'success',
        confirmText: 'Entendido'
      })
      // Reset de campos
      setValorPrestacion('')
      setMontoDirecto('')
      setNombrePrestacion('')
      setNombreEspecialidad('')
      setEspecialidad('')
    }
  }

  return {
    // Estado
    usarPorcentajePrestacion,
    setUsarPorcentajePrestacion,
    nombrePrestacion,
    setNombrePrestacion,
    valorPrestacion,
    setValorPrestacion,
    pctComisionEspecialista,
    setPctComisionEspecialista,
    montoDirecto,
    setMontoDirecto,
    modoCalculo,
    setModoCalculo,
    pctRetencion,
    setPctRetencion,
    nombreEspecialista,
    setNombreEspecialidad,
    especialidad,
    setEspecialidad,
    // Cálculos
    valPrestacionNum,
    comisionInfo,
    resultado,
    // Handler
    handleCargarAGastos,
    // Utilidades (passthrough para el componente)
    formatearCLP,
  }
}
