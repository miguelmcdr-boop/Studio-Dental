import React, { memo, useState, useEffect } from 'react'
import { ArcadaSuperior } from './components/ArcadaSuperior'
import { ArcadaInferior } from './components/ArcadaInferior'
import { HeaderPeriodontal } from './components/HeaderPeriodontal'
import { GraficoPerfilLongitudinal } from './components/GraficoPerfilLongitudinal'
import { ClasificacionAAPCard } from './components/ClasificacionAAPCard'
import { calcularIndicesPeriodontales } from './utils/periodontalCalculations'
import { pacientesStorageService } from '../pacientes/services/pacientesStorageService'
// F2-07b: acceso centralizado vía servicio (antes localStorage directo)
import { periodontogramaStorageService } from './services/periodontogramaStorageService'

export const PeriodontogramaModulo = memo(({ pacienteId }) => {
  const [periodontoData, setPeriodontoData] = useState(() => {
    const saved = periodontogramaStorageService.obtenerPeriodontogramaDePaciente(pacienteId, {})
    return saved
  })

  const [periodontoControl, setPeriodontoControl] = useState(() => {
    const saved = periodontogramaStorageService.obtenerControlDePaciente(pacienteId, {})
    return saved
  })

  const [modoComparativoReeval, setModoComparativoReeval] = useState(false)
  const [factoresRiesgo, setFactoresRiesgo] = useState({ fumador: false, diabetes: false })

  const [indices, setIndices] = useState({
    sitiosTotales: 0,
    sitiosRegistrados: 0,
    sitiosSinRegistrar: 0,
    porcentajeSangrado: 0,
    indiceOLeary: 0,
    maxSondaje: 0,
    diagnosticoSugerido: 'Salud Periodontal',
    gradoAAP: 'Grado A',
    colorEtapa: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    diagnosticoConcluyente: true
  })

  useEffect(() => {
    const targetData = modoComparativoReeval ? periodontoControl : periodontoData
    const res = calcularIndicesPeriodontales(targetData, factoresRiesgo)
    setIndices(res)
  }, [periodontoData, periodontoControl, modoComparativoReeval, factoresRiesgo])

  // F6-D-3: Auto-guardado cuando cambian los datos (patrón odontograma)
  // Esto asegura que los cambios se persistan incluso si el usuario no hace clic en "Guardar"
  useEffect(() => {
    if (!pacienteId) return

    // Persistir periodontoData automáticamente
    if (periodontoData && Object.keys(periodontoData).length > 0) {
      periodontogramaStorageService.guardarPeriodontogramaDePaciente(pacienteId, periodontoData)
        .catch(err => console.warn('[PeriodontogramaModulo] Error guardando periodontograma:', err))
    }
  }, [periodontoData, pacienteId])

  useEffect(() => {
    if (!pacienteId) return

    // Persistir periodontoControl automáticamente
    if (periodontoControl && Object.keys(periodontoControl).length > 0) {
      periodontogramaStorageService.guardarControlDePaciente(pacienteId, periodontoControl)
        .catch(err => console.warn('[PeriodontogramaModulo] Error guardando control:', err))
    }
  }, [periodontoControl, pacienteId])

  const handleGuardarPeriodontograma = () => {
    const dataToSave = modoComparativoReeval ? periodontoControl : periodontoData

    if (modoComparativoReeval) {
      periodontogramaStorageService.guardarControlDePaciente(pacienteId, dataToSave)
    } else {
      periodontogramaStorageService.guardarPeriodontogramaDePaciente(pacienteId, dataToSave)
    }

    // Cohesión Clínica: Auto-escribano en la Bitácora
    const evolucionesPrevias = pacientesStorageService.obtenerItem(`evoluciones_notas_${pacienteId}`, [])
    const fechaHora = new Date().toLocaleDateString('es-CL') + ' ' + new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })

    const notaPeriodontal = {
      id: Date.now(),
      fecha: fechaHora,
      texto: `🩸 EXAMEN PERIODONTAL (${modoComparativoReeval ? 'REEVALUACIÓN' : 'INICIAL'}): O'Leary: ${indices.indiceOLeary}% | BOP%: ${indices.porcentajeSangrado}% | Sondaje Máx: ${indices.maxSondaje}mm | ${indices.diagnosticoSugerido} (${indices.gradoAAP})`
    }

    const evolucionesActualizadas = [notaPeriodontal, ...evolucionesPrevias]
    pacientesStorageService.guardarItem(`evoluciones_notas_${pacienteId}`, evolucionesActualizadas)

    alert(`✅ Periodontograma (${modoComparativoReeval ? 'Reevaluación' : 'Inicial'}) guardado y evolucionado en la Bitácora.`)
  }

  return (
    <div className="space-y-6">
      {/* Barra de Control */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h3 className="text-base font-bold text-gray-900 uppercase tracking-wider">🩸 Periodontograma Clínico & Sondaje AAP</h3>
          <p className="text-xs text-gray-500">Evaluación de profundidades de bolsa, recesiones, CAL y sangrado al sondaje (BOP).</p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setModoComparativoReeval(!modoComparativoReeval)}
            className={`text-xs font-bold px-3.5 py-2.5 rounded-xl border transition-all cursor-pointer ${
              modoComparativoReeval ? 'bg-purple-700 text-white border-purple-800' : 'bg-purple-50 text-purple-900 border-purple-300'
            }`}
          >
            🔄 {modoComparativoReeval ? 'Modo: Reevaluación / Control (Activo)' : 'Cambiar a Reevaluación / Control'}
          </button>

          <button
            type="button"
            onClick={handleGuardarPeriodontograma}
            className="bg-black text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-gray-800 transition-colors shadow-xs cursor-pointer"
          >
            💾 Guardar Periodontograma
          </button>
        </div>
      </div>

      <HeaderPeriodontal indices={indices} />

      <ClasificacionAAPCard
        indices={indices}
        factoresRiesgo={factoresRiesgo}
        setFactoresRiesgo={setFactoresRiesgo}
      />

      <GraficoPerfilLongitudinal
        periodontoData={modoComparativoReeval ? periodontoControl : periodontoData}
      />

      {/* Matriz de Piezas */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 space-y-6 overflow-x-auto">
        <div>
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 text-center">Arcada Superior (Maxilar)</h4>
          <ArcadaSuperior
            periodontoData={modoComparativoReeval ? periodontoControl : periodontoData}
            setPeriodontoData={modoComparativoReeval ? setPeriodontoControl : setPeriodontoData}
          />
        </div>

        <div className="border-t border-gray-300 my-4"></div>

        <div>
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 text-center">Arcada Inferior (Mandíbula)</h4>
          <ArcadaInferior
            periodontoData={modoComparativoReeval ? periodontoControl : periodontoData}
            setPeriodontoData={modoComparativoReeval ? setPeriodontoControl : setPeriodontoData}
          />
        </div>
      </div>
    </div>
  )
})

PeriodontogramaModulo.displayName = 'PeriodontogramaModulo'