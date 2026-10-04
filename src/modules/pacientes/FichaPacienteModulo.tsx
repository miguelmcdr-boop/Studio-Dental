import React, { memo, useState, useEffect } from 'react'
import { Trash2, Pencil, AlertTriangle } from 'lucide-react'
import { TABS_FICHA_PACIENTE } from './constants/pacientesConstants'
import { useFichaPaciente } from './hooks/useFichaPaciente'

// Subcomponentes Internos
import { TimelineClinicoWidget } from './components/TimelineClinicoWidget'
import { AnamnesisSection } from './components/AnamnesisSection'
import { BitacoraSection, type BitacoraNotaItem } from './components/BitacoraSection'
import { PresupuestoSection } from './components/PresupuestoSection'
import { RecetasSection } from './components/RecetasSection'
import { PostOperatorioSection } from './components/PostOperatorioSection'
import { CertificadosSection } from './components/CertificadosSection'
import { ConsentimientosSection } from './components/ConsentimientosSection'
import { CalculadoraAnestesiaSection } from './components/CalculadoraAnestesiaSection'
import { AdjuntosSection } from './components/AdjuntosSection'
import { ModalEditarPaciente } from './components/ModalEditarPaciente'
import { PacienteNavigator } from './components/PacienteNavigator' // F7-26
import { ResumenClinicoHeader } from './components/ResumenClinicoHeader' // F7-26
import { useMetricasClinicas } from './hooks/useMetricasClinicas' // F7-26

// Especialidades Externas (Módulos Encapsulados)
import { OdontogramaModulo } from '../odontograma'
import { PeriodontogramaModulo } from '../periodontograma'
import { QuirurgicoModulo } from '../quirurgico'
import { OdontopediatriaModulo } from '../../domains/specialty/peds'
import { SmileDesignModulo } from '../../domains/specialty/dsd'
import { ErrorBoundary } from '../../components/ErrorBoundary' // F6-01

// Stores de Zustand
import { useSesionStore } from '../../store/sesionStore'
import { usePrestacionesStore } from '../../store/prestacionesStore'
import type { Paciente } from './schemas/pacienteSchema'
import type { PrestacionArancel } from './hooks/usePresupuesto'
import type { OdontogramaData } from '../odontograma/hooks/useOdontograma'
import type { UseNavegacionClinicaReturn } from './hooks/useNavegacionClinica'
import type { RecetaTimeline } from './components/TimelineClinicoWidget'

export interface UserProfileStoreRef {
  nombreCompleto?: string
  rut?: string
  especialidad?: string
  rol?: string
  [key: string]: unknown
}

export interface FichaPacienteModuloProps {
  paciente: Paciente
  alActualizarPaciente: (pacienteActualizado: Partial<Paciente> & { [key: string]: unknown }) => void
  alEliminarPaciente: (id: string | number) => void
  alVolver: () => void
  navegacionClinica?: Partial<UseNavegacionClinicaReturn>
}

export const FichaPacienteModulo: React.FC<FichaPacienteModuloProps> = memo(({
  paciente,
  alActualizarPaciente,
  alEliminarPaciente,
  alVolver,
  navegacionClinica, // F7-26: navegación entre pacientes
}) => {
  const userProfile = useSesionStore((state: { userProfile?: UserProfileStoreRef | null }) => state.userProfile)
  const prestacionesArancel = usePrestacionesStore((state: { prestacionesArancel: PrestacionArancel[] }) => state.prestacionesArancel)
  const [mostrarEditarDatos, setMostrarEditarDatos] = useState<boolean>(false)

  const {
    tabActiva,
    setTabActiva,
    odontogramaInicial,
    odontogramaEvolucion,
    guardarInicial,
    guardarEvolucion,
    fichaData,
    handleFichaChange,
    itemsPresupuesto,
    setItemsPresupuesto,
    abonos,
    setAbonos,
    recetas,
    setRecetas,
    evolucionesNotas,
    setEvolucionesNotas,
    certificados,
    setCertificados,
    totalPresupuesto,
    totalAbonado,
    saldoPendiente
  } = useFichaPaciente(paciente, alActualizarPaciente)

  // F7-26: KPIs del paciente para ResumenClinicoHeader
  const metricasClinicas = useMetricasClinicas({
    paciente,
    evolucionesNotas,
    itemsPresupuesto,
    abonos,
  })

  // F7-26 Pulido P1/P2: handler de click-to-navigate desde KPIs y Timeline
  const handleNavegarTab = (tab: string): void => {
    setTabActiva(tab)
  }

  // F7-26 Pulido P3: reset de tabActiva al cambiar de paciente vía PacienteNavigator
  useEffect(() => {
    if (navegacionClinica && navegacionClinica.indiceActual !== undefined && paciente?.id) {
      setTabActiva('Ficha Clínica')
    }
  }, [paciente?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div role="main" aria-label={`Ficha clínica de ${paciente.nombre}`}>
      {/* F7-26: Navegador de pacientes (si hay datos de navegación) */}
      {navegacionClinica && (navegacionClinica.total ?? 0) > 0 && typeof navegacionClinica.anterior === 'function' && typeof navegacionClinica.siguiente === 'function' && (
        <PacienteNavigator
          indiceActual={navegacionClinica.indiceActual ?? 0}
          total={navegacionClinica.total ?? 0}
          hayAnterior={Boolean(navegacionClinica.hayAnterior)}
          haySiguiente={Boolean(navegacionClinica.haySiguiente)}
          anterior={navegacionClinica.anterior}
          siguiente={navegacionClinica.siguiente}
        />
      )}

      {/* Botones Volver / Eliminar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 print:hidden">
        <button onClick={alVolver} className="text-xs font-semibold text-gray-500 dark:text-graphite-400 hover:text-black flex items-center gap-1 cursor-pointer">
          ← Volver a la lista de pacientes
        </button>

        <button
          onClick={() => alEliminarPaciente(paciente.id)}
          className="text-xs font-semibold text-red-600 hover:text-red-800 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg cursor-pointer"
        >
          <span className="inline-flex items-center gap-1"><Trash2 size={12} />Eliminar Paciente</span>
        </button>
      </div>

      {/* F7-26: Resumen clínico con KPIs */}
      <ResumenClinicoHeader metricas={metricasClinicas} onNavegarTab={handleNavegarTab} />

      {/* Banner de Datos Principales del Paciente */}
      <div className="bg-surface border border-surface rounded-2xl p-4 sm:p-6 mb-6 flex flex-col lg:flex-row justify-between items-start gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-graphite-50 surgical:text-black">{paciente.nombre}</h2>
            <button
              onClick={() => setMostrarEditarDatos(true)}
              className="text-xs bg-graphite-50 dark:bg-graphite-950 surgical:bg-white border border-surface text-graphite-800 dark:text-graphite-200 surgical:text-black font-semibold px-2.5 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-graphite-800 cursor-pointer"
            >
              <span className="inline-flex items-center gap-1"><Pencil size={12} />Editar Datos</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-1 text-xs text-gray-600 dark:text-graphite-400 surgical:text-graphite-700 mt-3 tabular-nums">
            <p><span className="font-semibold text-gray-800 dark:text-graphite-100 surgical:text-black">RUT:</span> {paciente.rut}</p>
            <p><span className="font-semibold text-gray-800 dark:text-graphite-100 surgical:text-black">Edad:</span> {paciente.edad ? String(paciente.edad) : 'N/I'} años</p>
            <p><span className="font-semibold text-gray-800 dark:text-graphite-100 surgical:text-black">Teléfono:</span> {paciente.telefono ? String(paciente.telefono) : 'N/I'}</p>
            <p><span className="font-semibold text-gray-800 dark:text-graphite-100 surgical:text-black">Correo:</span> {paciente.email || 'N/I'}</p>
            <p><span className="font-semibold text-gray-800 dark:text-graphite-100 surgical:text-black">Ocupación:</span> {paciente.ocupacion || 'N/I'}</p>
            <p><span className="font-semibold text-gray-800 dark:text-graphite-100 surgical:text-black">Previsión:</span> {paciente.prevision || 'Particular'}</p>
            <p><span className="font-semibold text-gray-800 dark:text-graphite-100 surgical:text-black">Presión Arterial:</span> {fichaData.presionArterial || 'No registrada'}</p>
            <p><span className="font-semibold text-gray-800 dark:text-graphite-100 surgical:text-black">Contacto Emergencia:</span> {paciente.contactoEmergencia || 'N/I'}</p>
          </div>
        </div>

        <div className="bg-clinical-error/10 text-clinical-error dark:text-red-300 border border-clinical-error/20 dark:border-red-400/30 surgical:bg-white surgical:text-black surgical:border-graphite-600 px-3 py-2 rounded-xl text-xs font-semibold w-full lg:w-auto" role="alert" aria-live="polite">
          <span className="inline-flex items-center gap-1"><AlertTriangle size={12} />Alertas: {fichaData.alergias || 'Sin alergias registradas'}</span>
        </div>
      </div>

      {/* Navegación por Pestañas */}
      <div className="flex gap-2 border-b border-surface mb-6 overflow-x-auto print:hidden" role="tablist" aria-label="Secciones de la ficha clínica">
        {TABS_FICHA_PACIENTE.map(tab => (
          <button
            key={tab}
            onClick={() => setTabActiva(tab)}
            role="tab"
            aria-selected={tabActiva === tab}
            aria-controls={`panel-${tab.replace(/\s+/g, '-')}`}
            className={`px-3 sm:px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer rounded-t-lg ${tabActiva === tab ? 'bg-gold-light text-champagne-700 border-primary dark:bg-surface dark:text-gold-satin dark:border-gold-satin surgical:bg-white surgical:text-black surgical:border-black' : 'border-transparent text-gray-500 dark:text-graphite-400 hover:text-gray-800 dark:hover:text-graphite-200'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Renderizado de Secciones */}
      {tabActiva === 'Línea de Tiempo' && (
        <TimelineClinicoWidget
          evolucionesNotas={evolucionesNotas}
          itemsPresupuesto={itemsPresupuesto}
          recetas={recetas as RecetaTimeline[]}
          certificados={certificados}
          onNavegarTab={handleNavegarTab}
        />
      )}

      {tabActiva === 'Ficha Clínica' && (
        <div className="space-y-6 print:hidden">
          <AnamnesisSection fichaData={fichaData} handleFichaChange={handleFichaChange} />
          <BitacoraSection pacienteId={paciente.id} evolucionesNotas={evolucionesNotas as BitacoraNotaItem[]} setEvolucionesNotas={setEvolucionesNotas as React.Dispatch<React.SetStateAction<BitacoraNotaItem[]>>} />
        </div>
      )}

      {tabActiva === 'Odontograma Inicial' && (
        <div className="print:hidden text-base scale-100 transition-all">
          <ErrorBoundary modulo="odontograma-inicial" onReset={alVolver}>
            <OdontogramaModulo
              odontograma={odontogramaInicial as OdontogramaData}
              odontogramaComparar={odontogramaEvolucion as OdontogramaData}
              guardarOdontograma={guardarInicial as (odonto: OdontogramaData) => void}
            />
          </ErrorBoundary>
        </div>
      )}

      {tabActiva === 'Odontograma Evolución' && (
        <div className="print:hidden text-base scale-100 transition-all">
          <ErrorBoundary modulo="odontograma-evolucion" onReset={alVolver}>
            <OdontogramaModulo
              odontograma={odontogramaEvolucion as OdontogramaData}
              odontogramaComparar={odontogramaInicial as OdontogramaData}
              guardarOdontograma={guardarEvolucion as (odonto: OdontogramaData) => void}
              esEvolucion={true}
            />
          </ErrorBoundary>
        </div>
      )}

      {tabActiva === 'Plan de Tratamiento' && (
        <PresupuestoSection
          paciente={paciente}
          userProfile={userProfile}
          prestacionesProp={prestacionesArancel}
          itemsPresupuesto={itemsPresupuesto}
          setItemsPresupuesto={setItemsPresupuesto}
          abonos={abonos}
          setAbonos={setAbonos}
          odontogramaInicial={odontogramaInicial as Record<string | number, unknown>}
          totalPresupuesto={totalPresupuesto}
          totalAbonado={totalAbonado}
          saldoPendiente={saldoPendiente}
          evolucionesNotas={evolucionesNotas}
          setEvolucionesNotas={setEvolucionesNotas}
        />
      )}

      {tabActiva === 'Consentimientos' && (
        <ConsentimientosSection
          paciente={paciente}
          userProfile={userProfile}
        />
      )}

      {tabActiva === 'Periodontograma' && (
        <div className="print:hidden">
          <ErrorBoundary modulo="periodontograma" onReset={alVolver}>
            <PeriodontogramaModulo pacienteId={paciente.id} />
          </ErrorBoundary>
        </div>
      )}

      {tabActiva === 'Endodoncia & Implantes' && (
        <div className="print:hidden">
          <QuirurgicoModulo pacienteId={paciente.id} />
        </div>
      )}

      {tabActiva === 'Odontopediatría' && (
        <div className="print:hidden">
          <OdontopediatriaModulo pacienteId={paciente.id} />
        </div>
      )}

      {tabActiva === 'Diseño de Sonrisa (DSD)' && (
        <div className="print:hidden">
          <SmileDesignModulo pacienteId={paciente.id} />
        </div>
      )}

      {tabActiva === 'Recetas Médicas' && (
        <RecetasSection
          paciente={paciente}
          userProfile={userProfile}
          alergiasPaciente={fichaData.alergias}
          recetas={recetas}
          setRecetas={setRecetas}
        />
      )}

      {tabActiva === 'Indicaciones PostOp' && (
        <PostOperatorioSection paciente={paciente} userProfile={userProfile} />
      )}

      {tabActiva === 'Calculadora Anestesia' && (
        <CalculadoraAnestesiaSection paciente={paciente} />
      )}

      {tabActiva === 'Certificados' && (
        <CertificadosSection
          paciente={paciente}
          userProfile={userProfile}
          certificados={certificados}
          setCertificados={setCertificados}
        />
      )}

      {(tabActiva === 'Fotografías Clínicas' || tabActiva === 'Radiografías') && (
        <AdjuntosSection tabActiva={tabActiva} pacienteId={String(paciente.id)} />
      )}

      {mostrarEditarDatos && (
        <ModalEditarPaciente
          paciente={paciente}
          alGuardar={alActualizarPaciente}
          alCerrar={() => setMostrarEditarDatos(false)}
        />
      )}
    </div>
  )
})

FichaPacienteModulo.displayName = 'FichaPacienteModulo'
