import React, { memo, useState } from 'react'
import { TABS_FICHA_PACIENTE } from './constants/pacientesConstants'
import { useFichaPaciente } from './hooks/useFichaPaciente'

// Subcomponentes Internos
import { TimelineClinicoWidget } from './components/TimelineClinicoWidget'
import { AnamnesisSection } from './components/AnamnesisSection'
import { BitacoraSection } from './components/BitacoraSection'
import { PresupuestoSection } from './components/PresupuestoSection'
import { RecetasSection } from './components/RecetasSection'
import { PostOperatorioSection } from './components/PostOperatorioSection'
import { CertificadosSection } from './components/CertificadosSection'
import { ConsentimientosSection } from './components/ConsentimientosSection'
import { CalculadoraAnestesiaSection } from './components/CalculadoraAnestesiaSection'
import { AdjuntosSection } from './components/AdjuntosSection'
import { ModalEditarPaciente } from './components/ModalEditarPaciente'

// Especialidades Externas (Módulos Encapsulados)
import { OdontogramaModulo } from '../odontograma'
import { PeriodontogramaModulo } from '../periodontograma'
import { QuirurgicoModulo } from '../quirurgico'
import { OdontopediatriaModulo } from '../odontopediatria'
import { SmileDesignModulo } from '../dsd'

// --- CORRECCIÓN: Faltaban estas dos importaciones de los Stores de Zustand ---
import { useSesionStore } from '../../store/sesionStore'
import { usePrestacionesStore } from '../../store/prestacionesStore'
// ---------------------------------------------------------------------------

export const FichaPacienteModulo = memo(({
  paciente,
  alActualizarPaciente,
  alEliminarPaciente,
  alVolver
}) => {
  // (F2-02) — Ahora los stores sí están correctamente importados arriba
  const userProfile = useSesionStore((state) => state.userProfile)
  const prestacionesArancel = usePrestacionesStore((state) => state.prestacionesArancel)
  
  const [mostrarEditarDatos, setMostrarEditarDatos] = useState(false)

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

  return (
    <div>
      {/* Botones Volver / Eliminar */}
      <div className="flex justify-between items-center mb-4 print:hidden">
        <button onClick={alVolver} className="text-xs font-semibold text-gray-500 hover:text-black flex items-center gap-1 cursor-pointer">
          ← Volver a la lista de pacientes
        </button>

        <button
          onClick={() => alEliminarPaciente(paciente.id)}
          className="text-xs font-semibold text-red-600 hover:text-red-800 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg cursor-pointer"
        >
          🗑️ Eliminar Paciente
        </button>
      </div>

      {/* Banner de Datos Principales del Paciente */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 mb-6 flex justify-between items-start print:hidden">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900">{paciente.nombre}</h2>
            <button
              onClick={() => setMostrarEditarDatos(true)}
              className="text-xs bg-white border border-gray-300 font-semibold px-2.5 py-1 rounded-lg hover:bg-gray-100 cursor-pointer"
            >
              ✏️ Editar Datos
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-1 text-xs text-gray-600 mt-3">
            <p><span className="font-semibold text-gray-800">RUT:</span> {paciente.rut}</p>
            <p><span className="font-semibold text-gray-800">Edad:</span> {paciente.edad} años</p>
            <p><span className="font-semibold text-gray-800">Teléfono:</span> {paciente.telefono || 'N/I'}</p>
            <p><span className="font-semibold text-gray-800">Correo:</span> {paciente.email || 'N/I'}</p>
            <p><span className="font-semibold text-gray-800">Ocupación:</span> {paciente.ocupacion || 'N/I'}</p>
            <p><span className="font-semibold text-gray-800">Previsión:</span> {paciente.prevision || 'Particular'}</p>
            <p><span className="font-semibold text-gray-800">Presión Arterial:</span> {fichaData.presionArterial || 'No registrada'}</p>
            <p><span className="font-semibold text-gray-800">Contacto Emergencia:</span> {paciente.contactoEmergencia || 'N/I'}</p>
          </div>
        </div>

        <div className="bg-red-50 text-red-700 border border-red-200 px-3 py-2 rounded-xl text-xs font-semibold">
          ⚠️ Alertas: {fichaData.alergias || 'Sin alergias registradas'}
        </div>
      </div>

      {/* Navegación por Pestañas */}
      <div className="flex gap-2 border-b border-gray-200 mb-6 overflow-x-auto print:hidden">
        {TABS_FICHA_PACIENTE.map(tab => (
          <button
            key={tab}
            onClick={() => setTabActiva(tab)}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              tabActiva === tab ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
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
          recetas={recetas}
          certificados={certificados}
        />
      )}

      {tabActiva === 'Ficha Clínica' && (
        <div className="space-y-6 print:hidden">
          <AnamnesisSection fichaData={fichaData} handleFichaChange={handleFichaChange} />
          <BitacoraSection pacienteId={paciente.id} evolucionesNotas={evolucionesNotas} setEvolucionesNotas={setEvolucionesNotas} />
        </div>
      )}

      {tabActiva === 'Odontograma Inicial' && (
        <div className="print:hidden text-base scale-100 transition-all">
          <OdontogramaModulo
            odontograma={odontogramaInicial}
            odontogramaComparar={odontogramaEvolucion}
            guardarOdontograma={guardarInicial}
          />
        </div>
      )}

      {tabActiva === 'Odontograma Evolución' && (
        <div className="print:hidden text-base scale-100 transition-all">
          <OdontogramaModulo
            odontograma={odontogramaEvolucion}
            odontogramaComparar={odontogramaInicial}
            guardarOdontograma={guardarEvolucion}
            esEvolucion={true}
          />
        </div>
      )}

      {tabActiva === 'Plan de Tratamiento' && (
        <PresupuestoSection
          paciente={paciente}
          userProfile={userProfile}
          prestacionesArancel={prestacionesArancel}
          itemsPresupuesto={itemsPresupuesto}
          setItemsPresupuesto={setItemsPresupuesto}
          abonos={abonos}
          setAbonos={setAbonos}
          odontogramaInicial={odontogramaInicial}
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
          <PeriodontogramaModulo pacienteId={paciente.id} />
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
        <CalculadoraAnestesiaSection pesoInicial={paciente.peso} />
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
        <AdjuntosSection tabActiva={tabActiva} pacienteId={paciente.id} />
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