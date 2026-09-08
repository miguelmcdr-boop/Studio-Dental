import React, { memo, useState } from 'react'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { EQUIPOS_AUTOCLAVE } from './constants/esterilizacionConstants'
import { useEsterilizacion } from './hooks/useEsterilizacion'
import { EsterilizacionSummaryCards } from './components/EsterilizacionSummaryCards'
import { TablaCargasEsterilizacion } from './components/TablaCargasEsterilizacion'
import { ControlBiologicoSection } from './components/ControlBiologicoSection'
import { TestDiariosSection } from './components/TestDiariosSection'
import { LibroSeremiSection } from './components/LibroSeremiSection'
import { ModalNuevaCarga } from './components/ModalNuevaCarga'
import { TicketTrazabilidad } from './components/TicketTrazabilidad'
import { useSesionStore } from '../../store/sesionStore'

export const EsterilizacionModulo = memo(() => {
  // (F2-02) — userProfile ya no llega como prop desde App.jsx: se lee directo del store.
  const userProfile = useSesionStore((state) => state.userProfile)

  const [tabActual, setTabActual] = useState('cargas') // 'cargas' | 'biologico' | 'test' | 'libro'
  const [modalAbierto, setModalAbierto] = useState(false)
  const [cargaImprimir, setCargaImprimir] = useState(null)

  const {
    cargas,
    cargasTotales,
    biologicos,
    testDiarios,
    resumen,
    busqueda,
    setBusqueda,
    equipoFiltro,
    setEquipoFiltro,
    agregarCarga,
    eliminarCarga,
    agregarBiologico,
    actualizarResultadoBiologico,
    agregarTestDiario
  } = useEsterilizacion()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-gray-900 uppercase tracking-wider">🧼 Central de Esterilización & Bioseguridad SEREMI</h2>
          <p className="text-xs text-gray-500">Control de cargas, trazabilidad, incubación de ampollas y Libro Folia Oficial.</p>
        </div>

        {tabActual === 'cargas' && (
          <Button
            onClick={() => setModalAbierto(true)}
            variant="primary"
            size="sm"
          >
            + Registrar Ciclo Autoclave
          </Button>
        )}
      </div>

      <div className="print:hidden">
        <EsterilizacionSummaryCards resumen={resumen} />
      </div>

      <div className="flex gap-2 border-b pb-1 print:hidden text-xs">
        <Button
          onClick={() => setTabActual('cargas')}
          variant={tabActual === 'cargas' ? 'primary' : 'secondary'}
          size="sm"
        >
          🏷️ Cargas y Trazabilidad
        </Button>

        <Button
          onClick={() => setTabActual('biologico')}
          variant={tabActual === 'biologico' ? 'primary' : 'secondary'}
          size="sm"
        >
          🧬 Control Biológico (Ampollas)
        </Button>

        <Button
          onClick={() => setTabActual('test')}
          variant={tabActual === 'test' ? 'primary' : 'secondary'}
          size="sm"
        >
          🛠️ Test Bowie-Dick / Fugas
        </Button>

        <Button
          onClick={() => setTabActual('libro')}
          variant={tabActual === 'libro' ? 'primary' : 'secondary'}
          size="sm"
        >
          📖 Libro Oficial SEREMI
        </Button>
      </div>

      {tabActual === 'cargas' && (
        cargaImprimir ? (
          <TicketTrazabilidad carga={cargaImprimir} alCerrar={() => setCargaImprimir(null)} />
        ) : (
          <>
            <div className="bg-gray-50 p-4 border border-gray-200 rounded-2xl flex justify-between items-center flex-wrap gap-3 text-xs print:hidden">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="font-semibold text-gray-600">Autoclave:</span>
                <select
                  value={equipoFiltro}
                  onChange={(e) => setEquipoFiltro(e.target.value)}
                  className="p-2 border rounded-xl bg-white font-semibold flex-1 sm:flex-initial"
                >
                  <option value="Todos">Todos los autoclaves</option>
                  {EQUIPOS_AUTOCLAVE.map(eq => <option key={eq} value={eq}>{eq}</option>)}
                </select>
              </div>

              <Input
                type="text"
                placeholder="🔍 Buscar lote, contenido u operador..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full sm:w-64"
              />
            </div>

            <TablaCargasEsterilizacion
              cargas={cargas}
              onSeleccionarImprimir={setCargaImprimir}
              onEliminar={eliminarCarga}
            />
          </>
        )
      )}

      {tabActual === 'biologico' && (
        <ControlBiologicoSection
          biologicos={biologicos}
          alAgregar={agregarBiologico}
          alActualizarResultado={actualizarResultadoBiologico}
        />
      )}

      {tabActual === 'test' && (
        <TestDiariosSection
          testDiarios={testDiarios}
          alAgregarTest={agregarTestDiario}
        />
      )}

      {tabActual === 'libro' && (
        <LibroSeremiSection
          cargas={cargasTotales}
          biologicos={biologicos}
          userProfile={userProfile}
        />
      )}

      {modalAbierto && (
        <ModalNuevaCarga
          userProfile={userProfile}
          alGuardar={agregarCarga}
          alCerrar={() => setModalAbierto(false)}
        />
      )}
    </div>
  )
})

EsterilizacionModulo.displayName = 'EsterilizacionModulo'