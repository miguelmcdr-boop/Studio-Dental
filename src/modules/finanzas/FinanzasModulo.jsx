import React, { memo, useState } from 'react'
import { useFinanzas } from './hooks/useFinanzas'
import { BalanceCajaCards } from './components/BalanceCajaCards'
import { ArqueoCajaDiario } from './components/ArqueoCajaDiario'
import { TablaMovimientos } from './components/TablaMovimientos'
import { ModalNuevoMovimiento } from './components/ModalNuevoMovimiento'
import { CuentasPendientes } from './components/CuentasPendientes'
import { ConveniosManager } from './components/ConveniosManager'
import { CalculadoraBoletas } from './components/CalculadoraBoletas'
import { usePacientesStore } from '../../store/pacientesStore'
import { useSesionStore } from '../../store/sesionStore'

export const FinanzasModulo = memo(() => {
  // (F2-02) — pacientes y userProfile ya no llegan como prop desde App.jsx: se leen directo de los stores.
  const pacientes = usePacientesStore((state) => state.pacientes)
  const userProfile = useSesionStore((state) => state.userProfile)

  const [tabActiva, setTabActiva] = useState('Arqueo de Caja')
  const [modalAbierto, setModalAbierto] = useState(false)

  const {
    movimientos,
    transaccionesDiaArqueo,
    fechaArqueo,
    setFechaArqueo,
    balanceGlobal,
    agregarMovimiento,
    eliminarMovimiento,
    convenios,
    actualizarDescuentoConvenio
  } = useFinanzas(pacientes)

  const TABS = [
    'Arqueo de Caja',
    'Historial Global de Movimientos',
    'Cuentas Pendientes',
    'Convenios',
    'Calculadora de Boletas'
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-gray-900 uppercase tracking-wider">💰 Control Financiero & Arqueo de Caja</h2>
          <p className="text-xs text-gray-500">Gestión de ingresos, egresos, arqueos diarios y balances contables de la clínica.</p>
        </div>

        <button
          onClick={() => setModalAbierto(true)}
          className="bg-black text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-gray-800 transition-colors shadow-xs cursor-pointer"
        >
          + Registrar Ingreso / Egreso Manual
        </button>
      </div>

      <div className="print:hidden">
        <BalanceCajaCards balance={balanceGlobal} />
      </div>

      {/* Navegación por Pestañas */}
      <div className="flex gap-2 border-b border-gray-200 print:hidden flex-wrap">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setTabActiva(tab)}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              tabActiva === tab ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Renderizado de Pestañas */}
      {tabActiva === 'Arqueo de Caja' && (
        <ArqueoCajaDiario
          transaccionesDia={transaccionesDiaArqueo}
          fechaArqueo={fechaArqueo}
          setFechaArqueo={setFechaArqueo}
          userProfile={userProfile}
        />
      )}

      {tabActiva === 'Historial Global de Movimientos' && (
        <div className="print:hidden">
          <TablaMovimientos movimientos={movimientos} onEliminar={eliminarMovimiento} />
        </div>
      )}

      {tabActiva === 'Cuentas Pendientes' && (
        <div className="print:hidden">
          <CuentasPendientes pacientes={pacientes} />
        </div>
      )}

      {tabActiva === 'Convenios' && (
        <div className="print:hidden">
          <ConveniosManager
            convenios={convenios}
            onActualizarDescuento={actualizarDescuentoConvenio}
          />
        </div>
      )}

      {tabActiva === 'Calculadora de Boletas' && (
        <div className="print:hidden">
          <CalculadoraBoletas alRegistrarGastoHonorario={agregarMovimiento} />
        </div>
      )}

      {modalAbierto && (
        <ModalNuevoMovimiento
          alGuardar={agregarMovimiento}
          alCerrar={() => setModalAbierto(false)}
        />
      )}
    </div>
  )
})

FinanzasModulo.displayName = 'FinanzasModulo'