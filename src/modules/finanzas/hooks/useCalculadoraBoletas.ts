/**
 * useCalculadoraBoletas — Hook para liquidador de honorarios (F10-C3.10)
 *
 * Extraído de CalculadoraBoletas.jsx para respetar el límite constitucional
 * de 250 líneas por archivo JSX.
 */
import { useState } from 'react'
import type React from 'react'
import { PORCENTAJE_RETENCION_HONORARIOS_DEFAULT } from '../constants/finanzasConstants'
import { calcularBoletaHonorarios, calcularMontoComision, formatearCLP } from '../utils/finanzasCalculations'
import { useAppDialog } from '../../../hooks/useAppDialog'

export interface BoletaCalculada {
  bruto: number
  retencion: number
  liquido: number
}

export interface ComisionCalculada {
  montoEspecialista: number
  clinicaMonto: number
}

export interface MovimientoGastoHonorario {
  id: number
  fecha: string
  tipo: string
  monto: number
  categoria: string
  metodoPago: string
  detalle: string
  [key: string]: unknown
}

export interface UseCalculadoraBoletasOptions {
  alRegistrarGastoHonorario?: (gasto: MovimientoGastoHonorario) => void
}

export interface UseCalculadoraBoletasReturn {
  usarPorcentajePrestacion: boolean
  setUsarPorcentajePrestacion: React.Dispatch<React.SetStateAction<boolean>>
  nombrePrestacion: string
  setNombrePrestacion: React.Dispatch<React.SetStateAction<string>>
  valorPrestacion: string
  setValorPrestacion: React.Dispatch<React.SetStateAction<string>>
  pctComisionEspecialista: number
  setPctComisionEspecialista: React.Dispatch<React.SetStateAction<number>>
  montoDirecto: string
  setMontoDirecto: React.Dispatch<React.SetStateAction<string>>
  modoCalculo: string
  setModoCalculo: React.Dispatch<React.SetStateAction<string>>
  pctRetencion: number
  setPctRetencion: React.Dispatch<React.SetStateAction<number>>
  nombreEspecialista: string
  setNombreEspecialidad: React.Dispatch<React.SetStateAction<string>>
  especialidad: string
  setEspecialidad: React.Dispatch<React.SetStateAction<string>>
  valPrestacionNum: number
  comisionInfo: ComisionCalculada
  resultado: BoletaCalculada
  handleCargarAGastos: () => Promise<void>
  formatearCLP: (monto: number) => string
}

export const useCalculadoraBoletas = ({ alRegistrarGastoHonorario }: UseCalculadoraBoletasOptions = {}): UseCalculadoraBoletasReturn => {
  const { alert: dialogAlert } = useAppDialog()

  // ═══════════════════════════════════════════════════════════════════
  // ESTADO
  // ═══════════════════════════════════════════════════════════════════
  const [usarPorcentajePrestacion, setUsarPorcentajePrestacion] = useState<boolean>(true)
  const [nombrePrestacion, setNombrePrestacion] = useState<string>('')
  const [valorPrestacion, setValorPrestacion] = useState<string>('')
  const [pctComisionEspecialista, setPctComisionEspecialista] = useState<number>(60)
  const [montoDirecto, setMontoDirecto] = useState<string>('')
  const [modoCalculo, setModoCalculo] = useState<string>('liquido')
  const [pctRetencion, setPctRetencion] = useState<number>(PORCENTAJE_RETENCION_HONORARIOS_DEFAULT)
  const [nombreEspecialista, setNombreEspecialidad] = useState<string>('')
  const [especialidad, setEspecialidad] = useState<string>('')

  // ═══════════════════════════════════════════════════════════════════
  // CÁLCULOS DERIVADOS
  // ═══════════════════════════════════════════════════════════════════
  const valPrestacionNum = parseFloat(valorPrestacion) || 0
  const comisionInfo: ComisionCalculada = calcularMontoComision(valPrestacionNum, pctComisionEspecialista)
  const montoBaseParaBoleta = usarPorcentajePrestacion
    ? comisionInfo.montoEspecialista
    : (parseFloat(montoDirecto) || 0)
  const resultado: BoletaCalculada = calcularBoletaHonorarios(montoBaseParaBoleta, modoCalculo, pctRetencion)

  // ═══════════════════════════════════════════════════════════════════
  // HANDLER: cargar a gastos
  // ═══════════════════════════════════════════════════════════════════
  const handleCargarAGastos = async (): Promise<void> => {
    if (!resultado.liquido || resultado.liquido <= 0) return

    const detalleTexto = usarPorcentajePrestacion
      ? `Honorario (${pctComisionEspecialista}% de ${nombrePrestacion || 'Prestación'} ${formatearCLP(valPrestacionNum)}): ${nombreEspecialista || 'Dr.'} (${especialidad || 'Especialista'}) — Boleta Bruta: ${formatearCLP(resultado.bruto)}, Retención SII (${pctRetencion}%): ${formatearCLP(resultado.retencion)}`
      : `Pago Honorarios: ${nombreEspecialista || 'Especialista'} (${especialidad || 'Dental'}) — Boleta Bruta: ${formatearCLP(resultado.bruto)}, Retención SII (${pctRetencion}%): ${formatearCLP(resultado.retencion)}`

    const nuevoGasto: MovimientoGastoHonorario = {
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
