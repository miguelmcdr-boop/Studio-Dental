import React, { memo, useState } from 'react'
import { METODOS_PAGO_GOLD } from './constants/pagosConstants'
import { usePagos } from './hooks/usePagos'
import { PagosSummaryCards } from './components/PagosSummaryCards'
import { TablaHistorialPagos } from './components/TablaHistorialPagos'
import { ModalNuevoPago } from './components/ModalNuevoPago'
import { ComprobantePagoImprimible } from './components/ComprobantePagoImprimible'

export const PagosModulo = memo(({ pacientes = [], userProfile }) => {
  const [modalAbierto, setModalAbierto] = useState(false)
  const [pagoEditar, setPagoEditar] = useState(null)
  const [comprobanteVer, setComprobanteVer] = useState(null)

  const {
    pagos,
    resumen,
    busqueda,
    setBusqueda,
    metodoFiltro,
    setMetodoFiltro,
    estadoFiltro,
    setEstadoFiltro,
    agregarOActualizarPago,
    anularPago
  } = usePagos()

  const handleAbrirNuevo = () => {
    setPagoEditar(null)
    setModalAbierto(true)
  }

  const handleAbrirEditar = (pago) => {
    setPagoEditar(pago)
    setModalAbierto(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-gray-900 uppercase tracking-wider">💳 Control de Pagos, Recaudación & DTE</h2>
          <p className="text-xs text-gray-500">Gestión de ingresos por caja, boletas de honorarios, bonos I-Med e imputación a tratamientos.</p>
        </div>

        <button
          onClick={handleAbrirNuevo}
          className="bg-black text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-gray-800 transition-colors shadow-xs cursor-pointer"
        >
          + Registrar Pago / Recibo
        </button>
      </div>

      <div className="print:hidden">
        <PagosSummaryCards resumen={resumen} />
      </div>

      {comprobanteVer ? (
        <ComprobantePagoImprimible
          pago={comprobanteVer}
          userProfile={userProfile}
          alCerrar={() => setComprobanteVer(null)}
        />
      ) : (
        <>
          <div className="bg-gray-50 p-4 border border-gray-200 rounded-2xl flex justify-between items-center flex-wrap gap-3 text-xs print:hidden">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="font-semibold text-gray-600">Medio:</span>
              <select
                value={metodoFiltro}
                onChange={(e) => setMetodoFiltro(e.target.value)}
                className="p-2 border rounded-xl bg-white font-semibold flex-1 sm:flex-initial"
              >
                <option value="Todos">Todos los métodos</option>
                {METODOS_PAGO_GOLD.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
              </select>

              <span className="font-semibold text-gray-600 ml-2">Estado:</span>
              <select
                value={estadoFiltro}
                onChange={(e) => setEstadoFiltro(e.target.value)}
                className="p-2 border rounded-xl bg-white font-semibold"
              >
                <option value="Todos">Todos</option>
                <option value="Emitido">🟢 Vigentes</option>
                <option value="Anulado">🔴 Anulados</option>
              </select>
            </div>

            <input
              type="text"
              placeholder="🔍 Buscar por recibo, DTE, paciente o RUT..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="p-2 border rounded-xl bg-white w-full sm:w-64"
            />
          </div>

          <TablaHistorialPagos
            pagos={pagos}
            onVerComprobante={setComprobanteVer}
            onEditar={handleAbrirEditar}
            onAnular={anularPago}
          />
        </>
      )}

      {modalAbierto && (
        <ModalNuevoPago
          pagoEditar={pagoEditar}
          pacientes={pacientes}
          userProfile={userProfile}
          alGuardar={agregarOActualizarPago}
          alCerrar={() => setModalAbierto(false)}
        />
      )}
    </div>
  )
})

PagosModulo.displayName = 'PagosModulo'