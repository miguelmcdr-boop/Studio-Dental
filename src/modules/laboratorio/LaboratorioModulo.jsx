import React, { memo, useState } from 'react'
import { ETAPAS_LABORATORIO } from './constants/laboratorioConstants'
import { useLaboratorio } from './hooks/useLaboratorio'
import { LaboratorioSummaryCards } from './components/LaboratorioSummaryCards'
import { TablaOrdenesLaboratorio } from './components/TablaOrdenesLaboratorio'
import { DirectorioLaboratorios } from './components/DirectorioLaboratorios'
import { ModalNuevaOrden } from './components/ModalNuevaOrden'
import { OrdenImprimible } from './components/OrdenImprimible'

export const LaboratorioModulo = memo(({ pacientes = [], userProfile }) => {
  const [tabActual, setTabActual] = useState('ordenes') // 'ordenes' | 'directorio'
  const [modalAbierto, setModalAbierto] = useState(false)
  const [ordenImprimir, setOrdenImprimir] = useState(null)

  const {
    ordenes,
    laboratorios,
    resumen,
    busqueda,
    setBusqueda,
    etapaFiltro,
    setEtapaFiltro,
    agregarOrden,
    actualizarEtapaOrden,
    cambiarEstadoPagoOrden,
    eliminarOrden,
    guardarOActualizarLaboratorio,
    eliminarLaboratorio
  } = useLaboratorio()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-gray-900 uppercase tracking-wider">🧪 Control de Trabajos de Laboratorio Dental</h2>
          <p className="text-xs text-gray-500">Gestión de etapas prótesicas, proveedores y tarifarios por laboratorio.</p>
        </div>

        {tabActual === 'ordenes' && (
          <button
            onClick={() => setModalAbierto(true)}
            className="bg-black text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-gray-800 transition-colors shadow-xs cursor-pointer"
          >
            + Nueva Orden de Trabajo
          </button>
        )}
      </div>

      <div className="print:hidden">
        <LaboratorioSummaryCards resumen={resumen} />
      </div>

      <div className="flex gap-2 border-b pb-1 print:hidden text-xs">
        <button
          onClick={() => setTabActual('ordenes')}
          className={`px-4 py-2 rounded-xl font-bold transition-all ${
            tabActual === 'ordenes' ? 'bg-black text-white shadow-xs' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          📋 Órdenes de Trabajo Activas
        </button>

        <button
          onClick={() => setTabActual('directorio')}
          className={`px-4 py-2 rounded-xl font-bold transition-all ${
            tabActual === 'directorio' ? 'bg-black text-white shadow-xs' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          📂 Directorio y Tarifarios de Labs
        </button>
      </div>

      {tabActual === 'ordenes' && (
        ordenImprimir ? (
          <OrdenImprimible
            orden={ordenImprimir}
            userProfile={userProfile}
            alCerrar={() => setOrdenImprimir(null)}
          />
        ) : (
          <>
            <div className="bg-gray-50 p-4 border border-gray-200 rounded-2xl flex justify-between items-center flex-wrap gap-3 text-xs print:hidden">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="font-semibold text-gray-600">Etapa:</span>
                <select
                  value={etapaFiltro}
                  onChange={(e) => setEtapaFiltro(e.target.value)}
                  className="p-2 border rounded-xl bg-white font-semibold flex-1 sm:flex-initial"
                >
                  <option value="Todas">Todas las etapas</option>
                  {ETAPAS_LABORATORIO.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </select>
              </div>

              <input
                type="text"
                placeholder="🔍 Buscar orden, paciente o trabajo..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="p-2 border rounded-xl bg-white w-full sm:w-64"
              />
            </div>

            <TablaOrdenesLaboratorio
              ordenes={ordenes}
              onActualizarEtapa={actualizarEtapaOrden}
              onCambiarPago={cambiarEstadoPagoOrden}
              onSeleccionarImprimir={setOrdenImprimir}
              onEliminar={eliminarOrden}
            />
          </>
        )
      )}

      {tabActual === 'directorio' && (
        <DirectorioLaboratorios
          laboratorios={laboratorios}
          alGuardarLab={guardarOActualizarLaboratorio}
          alEliminarLab={eliminarLaboratorio}
        />
      )}

      {modalAbierto && (
        <ModalNuevaOrden
          pacientes={pacientes}
          laboratorios={laboratorios}
          alGuardar={agregarOrden}
          alCerrar={() => setModalAbierto(false)}
        />
      )}
    </div>
  )
})

LaboratorioModulo.displayName = 'LaboratorioModulo'