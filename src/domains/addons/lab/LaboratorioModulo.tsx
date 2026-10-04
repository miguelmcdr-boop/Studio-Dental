import React, { memo, useState } from 'react'
import { FlaskConical, ClipboardList, Folder } from 'lucide-react'
import { Icon } from '../../../shared/ui/Icon'
import { ETAPAS_LABORATORIO, type OrdenLaboratorio } from './constants/laboratorioConstants'
import { useLaboratorio } from './hooks/useLaboratorio'
import { LaboratorioSummaryCards } from './components/LaboratorioSummaryCards'
import { TablaOrdenesLaboratorio } from './components/TablaOrdenesLaboratorio'
import { DirectorioLaboratorios } from './components/DirectorioLaboratorios'
import { ModalNuevaOrden, type PacienteParaLab } from './components/ModalNuevaOrden'
import { OrdenImprimible, type UserProfileLab } from './components/OrdenImprimible'
import { usePacientesStore } from '../../../app/stores/pacientesStore'
import { useSesionStore } from '../../../app/stores/sesionStore'

type TabLaboratorio = 'ordenes' | 'directorio'

export const LaboratorioModulo: React.FC = memo(() => {
  // (F2-02) — pacientes y userProfile ya no llegan como prop desde App.jsx: se leen directo de los stores.
  const pacientes = usePacientesStore((state: { pacientes: PacienteParaLab[] }) => state.pacientes)
  const userProfile = useSesionStore((state: { userProfile: UserProfileLab | null }) => state.userProfile)

  const [tabActual, setTabActual] = useState<TabLaboratorio>('ordenes')
  const [modalAbierto, setModalAbierto] = useState<boolean>(false)
  const [ordenImprimir, setOrdenImprimir] = useState<OrdenLaboratorio | null>(null)

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
          <h2 className="text-xl font-bold text-gray-900 dark:text-graphite-50 uppercase tracking-wider flex items-center gap-2">
            <Icon icon={FlaskConical} size="md" />
            Control de Trabajos de Laboratorio Dental
          </h2>
          <p className="text-xs text-gray-500 dark:text-graphite-400">
            Gestión de etapas prótesicas, proveedores y tarifarios por laboratorio.
          </p>
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

      <div className="flex gap-2 border-b border-gray-200 dark:border-graphite-700 pb-1 print:hidden text-xs">
        <button
          onClick={() => setTabActual('ordenes')}
          className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
            tabActual === 'ordenes'
              ? 'bg-black text-white shadow-xs'
              : 'bg-gray-100 dark:bg-graphite-800 text-gray-600 dark:text-graphite-400 hover:bg-gray-200'
          }`}
        >
          <span className="inline-flex items-center gap-1">
            <ClipboardList size={12} />
            Órdenes de Trabajo Activas
          </span>
        </button>

        <button
          onClick={() => setTabActual('directorio')}
          className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
            tabActual === 'directorio'
              ? 'bg-black text-white shadow-xs'
              : 'bg-gray-100 dark:bg-graphite-800 text-gray-600 dark:text-graphite-400 hover:bg-gray-200'
          }`}
        >
          <span className="inline-flex items-center gap-1">
            <Folder size={12} />
            Directorio y Tarifarios de Labs
          </span>
        </button>
      </div>

      {tabActual === 'ordenes' &&
        (ordenImprimir ? (
          <OrdenImprimible
            orden={ordenImprimir}
            userProfile={userProfile}
            alCerrar={() => setOrdenImprimir(null)}
          />
        ) : (
          <>
            <div className="bg-gray-50 dark:bg-graphite-800 p-4 border border-gray-200 dark:border-graphite-700 rounded-2xl flex justify-between items-center flex-wrap gap-3 text-xs print:hidden">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="font-semibold text-gray-600 dark:text-graphite-400">Etapa:</span>
                <select
                  value={etapaFiltro}
                  onChange={(e) => setEtapaFiltro(e.target.value)}
                  className="p-2 border border-gray-300 dark:border-graphite-600 rounded-xl bg-white dark:bg-graphite-800 font-semibold flex-1 sm:flex-initial"
                >
                  <option value="Todas">Todas las etapas</option>
                  {ETAPAS_LABORATORIO.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <input
                type="text"
                placeholder="Buscar orden, paciente o trabajo..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="p-2 border border-gray-300 dark:border-graphite-600 rounded-xl bg-white dark:bg-graphite-800 w-full sm:w-64"
              />
            </div>

            <TablaOrdenesLaboratorio
              ordenes={ordenes}
              onActualizarEtapa={actualizarEtapaOrden}
              onCambiarPago={cambiarEstadoPagoOrden}
              onSeleccionarImprimir={setOrdenImprimir}
              onEliminar={(id) => void eliminarOrden(id)}
            />
          </>
        ))}

      {tabActual === 'directorio' && (
        <DirectorioLaboratorios
          laboratorios={laboratorios}
          alGuardarLab={guardarOActualizarLaboratorio}
          alEliminarLab={(id) => void eliminarLaboratorio(id)}
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
export default LaboratorioModulo
