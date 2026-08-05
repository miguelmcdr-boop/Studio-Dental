import React, { memo, useState, useEffect } from 'react'
import { ArcadaSuperior } from './components/ArcadaSuperior'
import { ArcadaInferior } from './components/ArcadaInferior'
import { HeaderPeriodontal } from './components/HeaderPeriodontal'
import { calcularIndicesPeriodontales } from './utils/periodontalCalculations'
import { pacientesStorageService } from '../pacientes/services/pacientesStorageService'

export const PeriodontogramaModulo = memo(({ pacienteId }) => {
  const [periodontoData, setPeriodontoData] = useState(() => {
    const saved = localStorage.getItem(`periodontograma_${pacienteId}`)
    return saved ? JSON.parse(saved) : {}
  })

  const [indices, setIndices] = useState({
    porcentajeSangrado: 0,
    indiceOLeary: 0,
    maxSondaje: 0,
    diagnosticoSugerido: 'Salud Periodontal'
  })

  useEffect(() => {
    const res = calcularIndicesPeriodontales(periodontoData)
    setIndices(res)
  }, [periodontoData])

  const handleGuardarPeriodontograma = () => {
    localStorage.setItem(`periodontograma_${pacienteId}`, JSON.stringify(periodontoData))

    // 💡 COHESIÓN CLÍNICA: Escribir en la Bitácora de Evoluciones del paciente
    const evolucionesPrevias = pacientesStorageService.obtenerItem(`evoluciones_notas_${pacienteId}`, [])
    const fechaHora = new Date().toLocaleDateString('es-CL') + ' ' + new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })

    const notaPeriodontal = {
      id: Date.now(),
      fecha: fechaHora,
      texto: `🩺 EXAMEN PERIODONTAL REGISTRADO: Placa O'Leary: ${indices.indiceOLeary}% | Sangrado al Sondaje: ${indices.porcentajeSangrado}% | Sondaje Máx: ${indices.maxSondaje}mm | Diagnóstico Sugerido: ${indices.diagnosticoSugerido}`
    }

    const evolucionesActualizadas = [notaPeriodontal, ...evolucionesPrevias]
    pacientesStorageService.guardarItem(`evoluciones_notas_${pacienteId}`, evolucionesActualizadas)

    alert('✅ Periodontograma guardado correctamente y registrado en la Bitácora del paciente.')
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h3 className="text-base font-bold text-gray-900 uppercase tracking-wider">🩸 Periodontograma Clínico & Sondaje</h3>
          <p className="text-xs text-gray-500">Registro de profundidad de bolsa, margen gingival, sangrado e índice de O'Leary.</p>
        </div>

        <button
          onClick={handleGuardarPeriodontograma}
          className="bg-black text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-gray-800 transition-colors shadow-xs"
        >
          💾 Guardar Periodontograma & Auto-Evolucionar
        </button>
      </div>

      <HeaderPeriodontal indices={indices} />

      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 space-y-6 overflow-x-auto">
        <div>
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 text-center">Arcada Superior (Maxilar)</h4>
          <ArcadaSuperior periodontoData={periodontoData} setPeriodontoData={setPeriodontoData} />
        </div>

        <div className="border-t border-gray-300 my-4"></div>

        <div>
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 text-center">Arcada Inferior (Mandíbula)</h4>
          <ArcadaInferior periodontoData={periodontoData} setPeriodontoData={setPeriodontoData} />
        </div>
      </div>
    </div>
  )
})

PeriodontogramaModulo.displayName = 'PeriodontogramaModulo'