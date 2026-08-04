import React, { memo, useState } from 'react'
import { useFinanzas } from './hooks/useFinanzas'
import { BalanceCajaCards } from './components/BalanceCajaCards'
import { TablaMovimientos } from './components/TablaMovimientos'
import { ModalNuevoMovimiento } from './components/ModalNuevoMovimiento'
import { ConveniosManager } from './components/ConveniosManager'
import { CalculadoraBoletas } from './components/CalculadoraBoletas'
import { ArqueoCajaDiario } from './components/ArqueoCajaDiario'
import { CuentasPendientes } from './components/CuentasPendientes'
import { finanzasStorageService } from './services/finanzasStorageService'

export const FinanzasModulo = memo(({ pacientes = [] }) => {
  const [modalAbierto, setModalAbierto] = useState(false)
  const [tabFinanzas, setTabFinanzas] = useState('caja') // 'caja' | 'arqueo' | 'boletas' | 'pendientes' | 'convenios'
  const [cierresCaja, setCierresCaja] = useState(() => finanzasStorageService.obtenerCierresCaja())

  const {
    movimientos,
    convenios,
    balance,
    filtroTipo,
    setFiltroTipo,
    agregarMovimiento,
    eliminarMovimiento,
    actualizarDescuentoConvenio
  } = useFinanzas()

  const handleCerrarCaja = (nuevoCierre) => {
    const actualizados = [nuevoCierre, ...cierresCaja]
    setCierresCaja(actualizados)
    finanzasStorageService.guardarCierresCaja(actualizados)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 uppercase tracking-wider">💰 Gestión Financiera & Caja Chica</h2>
          <p className="text-xs text-gray-500">Flujo de caja, arqueo diario, honorarios y cobranzas.</p>
        </div>

        {tabFinanzas === 'caja' && (
          <button
            onClick={() => setModalAbierto(true)}
            className="bg-black text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-gray-800 transition-colors shadow-xs cursor-pointer"
          >
            + Registrar Ingreso / Gasto
          </button>
        )}
      </div>

      <div className="flex gap-2 border-b pb-1 text-xs overflow-x-auto">
        <button
          onClick={() => setTabFinanzas('caja')}
          className={`px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
            tabFinanzas === 'caja' ? 'bg-black text-white shadow-xs' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          💵 Flujo de Caja
        </button>

        <button
          onClick={() => setTabFinanzas('arqueo')}
          className={`px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
            tabFinanzas === 'arqueo' ? 'bg-black text-white shadow-xs' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          🔒 Arqueo & Cierre Diario
        </button>

        <button
          onClick={() => setTabFinanzas('boletas')}
          className={`px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
            tabFinanzas === 'boletas' ? 'bg-black text-white shadow-xs' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          🧾 Liquidador Especialistas
        </button>

        <button
          onClick={() => setTabFinanzas('pendientes')}
          className={`px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
            tabFinanzas === 'pendientes' ? 'bg-black text-white shadow-xs' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          📊 Cuentas & Morosidad
        </button>

        <button
          onClick={() => setTabFinanzas('convenios')}
          className={`px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
            tabFinanzas === 'convenios' ? 'bg-black text-white shadow-xs' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          🏷️ Convenios e Isapres
        </button>
      </div>

      {tabFinanzas === 'caja' && (
        <div className="space-y-6">
          <BalanceCajaCards balance={balance} />

          <div className="flex justify-between items-center border-b pb-2 text-xs">
            <h4 className="font-bold text-gray-800 uppercase tracking-wider">Historial de Transacciones</h4>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="px-3 py-1.5 border rounded-xl bg-white font-semibold"
            >
              <option value="todos">Todos los movimientos</option>
              <option value="ingreso">🟢 Solo Ingresos</option>
              <option value="egreso">🔴 Solo Egresos</option>
            </select>
          </div>

          <TablaMovimientos movimientos={movimientos} onEliminar={eliminarMovimiento} />
        </div>
      )}

      {tabFinanzas === 'arqueo' && (
        <ArqueoCajaDiario
          balance={balance}
          alCerrarCaja={handleCerrarCaja}
          cierresAnteriores={cierresCaja}
        />
      )}

      {tabFinanzas === 'boletas' && (
        <CalculadoraBoletas alRegistrarGastoHonorario={agregarMovimiento} />
      )}

      {tabFinanzas === 'pendientes' && (
        <CuentasPendientes pacientes={pacientes} />
      )}

      {tabFinanzas === 'convenios' && (
        <ConveniosManager convenios={convenios} onActualizarDescuento={actualizarDescuentoConvenio} />
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