import React, { memo, useState } from 'react'
import { ESPECIALIDADES_ODONTOLOGICAS } from './constants/prestacionesConstants'
import { usePrestaciones } from './hooks/usePrestaciones'
import { PrestacionesSummaryCards } from './components/PrestacionesSummaryCards'
import { TablaArancelPrestaciones } from './components/TablaArancelPrestaciones'
import { PaquetesClinicosManager } from './components/PaquetesClinicosManager'
import { ModalNuevaPrestacion } from './components/ModalNuevaPrestacion'
import { ReajusteMasivoModal } from './components/ReajusteMasivoModal'

export const PrestacionesModulo = memo(({ prestaciones: prestacionesProp, setPrestaciones: setPrestacionesProp }) => {
  const [tabActual, setTabActual] = useState('arancel')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [modalReajusteAbierto, setModalReajusteAbierto] = useState(false)
  const [prestacionEditar, setPrestacionEditar] = useState(null)

  const {
    prestaciones,
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
  } = usePrestaciones(prestacionesProp, setPrestacionesProp)

  const handleAbrirNuevo = () => {
    setPrestacionEditar(null)
    setModalAbierto(true)
  }

  const handleAbrirEditar = (prestacion) => {
    setPrestacionEditar(prestacion)
    setModalAbierto(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-gray-900 uppercase tracking-wider">🦷 Arancel de Prestaciones & Paquetes Clínicos</h2>
          <p className="text-xs text-gray-500">Catálogo oficial de procedimientos, convenios y promociones de la clínica.</p>
        </div>

        <div className="flex gap-2">
          {tabActual === 'arancel' && (
            <>
              <button
                onClick={() => setModalReajusteAbierto(true)}
                className="bg-gray-100 text-gray-800 text-xs font-bold px-3 py-2.5 rounded-xl hover:bg-gray-200 transition-colors border"
              >
                📈 Reajuste %
              </button>
              <button
                onClick={handleAbrirNuevo}
                className="bg-black text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-gray-800 transition-colors shadow-xs cursor-pointer"
              >
                + Nueva Prestación
              </button>
            </>
          )}
        </div>
      </div>

      <div className="print:hidden">
        <PrestacionesSummaryCards resumen={resumen} />
      </div>

      <div className="flex gap-2 border-b pb-1 print:hidden text-xs">
        <button
          onClick={() => setTabActual('arancel')}
          className={`px-4 py-2 rounded-xl font-bold transition-all ${
            tabActual === 'arancel' ? 'bg-black text-white shadow-xs' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          📋 Arancel General (Particular / Fonasa)
        </button>

        <button
          onClick={() => setTabActual('paquetes')}
          className={`px-4 py-2 rounded-xl font-bold transition-all ${
            tabActual === 'paquetes' ? 'bg-black text-white shadow-xs' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          🎁 Packs y Promociones Clínicas
        </button>
      </div>

      {tabActual === 'arancel' && (
        <>
          <div className="bg-gray-50 p-4 border border-gray-200 rounded-2xl flex justify-between items-center flex-wrap gap-3 text-xs print:hidden">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="font-semibold text-gray-600">Especialidad:</span>
              <select
                value={especialidadFiltro}
                onChange={(e) => setEspecialidadFiltro(e.target.value)}
                className="p-2 border rounded-xl bg-white font-semibold flex-1 sm:flex-initial"
              >
                <option value="Todas">Todas las especialidades</option>
                {ESPECIALIDADES_ODONTOLOGICAS.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>

            <input
              type="text"
              placeholder="🔍 Buscar por procedimiento o código Fonasa..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="p-2 border rounded-xl bg-white w-full sm:w-64"
            />
          </div>

          <TablaArancelPrestaciones
            prestaciones={prestaciones}
            onEditar={handleAbrirEditar}
            onEliminar={eliminarPrestacion}
          />
        </>
      )}

      {tabActual === 'paquetes' && (
        <PaquetesClinicosManager
          paquetes={paquetes}
          alGuardarPaquete={agregarPaquete}
          alEliminarPaquete={eliminarPaquete}
        />
      )}

      {modalAbierto && (
        <ModalNuevaPrestacion
          prestacionEditar={prestacionEditar}
          alGuardar={agregarOActualizarPrestacion}
          alCerrar={() => setModalAbierto(false)}
        />
      )}

      {modalReajusteAbierto && (
        <ReajusteMasivoModal
          alAplicarReajuste={aplicarReajusteMasivo}
          alCerrar={() => setModalReajusteAbierto(false)}
        />
      )}
    </div>
  )
})

PrestacionesModulo.displayName = 'PrestacionesModulo'