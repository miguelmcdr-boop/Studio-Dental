import React, { memo, useState } from 'react'
import { calcularTubosAnestesia } from '../../../utils/anestesiaCalc'

export const CalculadoraAnestesiaSection = memo(({ pesoInicial = 70 }) => {
  const [pesoPaciente, setPesoPaciente] = useState(pesoInicial)
  const [tipoAnestesicoCalc, setTipoAnestesicoCalc] = useState('lidocaina')

  const resultadoAnestesia = calcularTubosAnestesia(pesoPaciente, tipoAnestesicoCalc)

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 print:hidden space-y-6">
      <div className="border-b pb-3">
        <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider">Calculadora de Dosis Máxima de Anestesia Local</h3>
        <p className="text-xs text-gray-500">Cálculo de seguridad de miligramos máximos y cantidad máxima de tubos por peso corporal.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Peso del Paciente (Kg)</label>
            <input
              type="number"
              value={pesoPaciente}
              onChange={(e) => setPesoPaciente(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-300 font-bold text-sm"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Tipo de Anestésico Local</label>
            <select
              value={tipoAnestesicoCalc}
              onChange={(e) => setTipoAnestesicoCalc(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-300 font-semibold bg-white"
            >
              <option value="lidocaina">Lidocaína 2% con Epinefrina (36 mg/tubo — Máx 4.4 mg/kg)</option>
              <option value="mepivacaina">Mepivacaína 3% sin vasoconstrictor (54 mg/tubo — Máx 6.6 mg/kg)</option>
              <option value="articaina">Articaína 4% con Epinefrina (72 mg/tubo — Máx 7.0 mg/kg)</option>
              <option value="bupivacaina">Bupivacaína 0.5% con Epinefrina (9 mg/tubo — Máx 1.3 mg/kg)</option>
            </select>
          </div>
        </div>

        <div className="p-6 bg-blue-50 border border-blue-200 rounded-2xl flex flex-col justify-center text-center">
          <span className="text-xs uppercase font-bold text-blue-800 block mb-1">Límite de Seguridad Recomendado</span>
          <span className="text-3xl font-extrabold text-blue-900">{resultadoAnestesia.tubos} Tubos</span>
          <span className="text-xs font-semibold text-blue-700 mt-1">
            Dosis máxima absoluta: {resultadoAnestesia.mgMax} mg
          </span>
        </div>
      </div>
    </div>
  )
})

CalculadoraAnestesiaSection.displayName = 'CalculadoraAnestesiaSection'