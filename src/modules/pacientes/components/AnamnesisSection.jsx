import React, { memo, useState } from 'react'
import { DIAGNOSTICOS_CIE10 } from '../../../data/plantillas'

export const AnamnesisSection = memo(({ fichaData, handleFichaChange }) => {
  const [sugerenciasCie, setSugerenciasCie] = useState([])

  const handleMotivoChange = (e) => {
    const valor = e.target.value
    handleFichaChange('motivoConsulta', valor)
    if (valor.trim().length > 1) {
      const coincidencias = DIAGNOSTICOS_CIE10.filter(d => d.toLowerCase().includes(valor.toLowerCase()))
      setSugerenciasCie(coincidencias)
    } else {
      setSugerenciasCie([])
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6 text-xs text-gray-700 shadow-sm">
      <div className="border-b pb-2 flex justify-between items-center">
        <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider">Anamnesis y Signos Vitales</h3>
        <span className="text-[10px] bg-green-100 text-green-800 px-2 py-1 rounded font-semibold">Guardado automático</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block font-semibold text-gray-600 mb-1">Presión Arterial (PA)</label>
          <input
            type="text"
            value={fichaData.presionArterial}
            onChange={(e) => handleFichaChange('presionArterial', e.target.value)}
            placeholder="Ej: 120/80 mmHg"
            className="w-full p-2.5 rounded-lg border border-gray-300 font-semibold text-gray-800"
          />
        </div>
        <div>
          <label className="block font-semibold text-gray-600 mb-1">Riesgo Cariogénico</label>
          <select
            value={fichaData.riesgoCariogenico}
            onChange={(e) => handleFichaChange('riesgoCariogenico', e.target.value)}
            className="w-full p-2.5 rounded-lg border border-gray-300 bg-white"
          >
            <option value="Bajo">Bajo Riesgo</option>
            <option value="Medio">Medio Riesgo</option>
            <option value="Alto">Alto Riesgo</option>
          </select>
        </div>
        <div>
          <label className="block font-semibold text-gray-600 mb-1">Diagnóstico Periodontal</label>
          <select
            value={fichaData.riesgoPeriodontal}
            onChange={(e) => handleFichaChange('riesgoPeriodontal', e.target.value)}
            className="w-full p-2.5 rounded-lg border border-gray-300 bg-white"
          >
            <option value="Sano">Salud Periodontal</option>
            <option value="Gingivitis">Gingivitis</option>
            <option value="Periodontitis Leve">Periodontitis Leve</option>
            <option value="Periodontitis Severa">Periodontitis Severa</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
        <div className="relative">
          <label className="block font-semibold text-gray-600 mb-1">Diagnóstico Principal (Autocompletado CIE-10)</label>
          <textarea
            rows="2"
            value={fichaData.motivoConsulta}
            onChange={handleMotivoChange}
            placeholder="Escribe para buscar... Ej: Caries, Pulpitis, Gingivitis..."
            className="w-full p-2.5 rounded-lg border border-gray-300"
          />
          {sugerenciasCie.length > 0 && (
            <div className="absolute left-0 right-0 top-full bg-white border border-gray-300 rounded-xl shadow-lg z-30 max-h-40 overflow-y-auto mt-1">
              {sugerenciasCie.map((diag, idx) => (
                <div
                  key={idx}
                  onClick={() => { handleFichaChange('motivoConsulta', diag); setSugerenciasCie([]); }}
                  className="p-2 hover:bg-gray-100 cursor-pointer font-bold text-gray-800 border-b border-gray-100 text-xs"
                >
                  {diag}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block font-semibold text-gray-600 mb-1">Anamnesis Próxima</label>
          <textarea
            rows="2"
            value={fichaData.anamnesisProxima}
            onChange={(e) => handleFichaChange('anamnesisProxima', e.target.value)}
            placeholder="Ej: Paciente refiere molestias de 3 días de evolución..."
            className="w-full p-2.5 rounded-lg border border-gray-300"
          />
        </div>
      </div>

      <h4 className="font-bold text-xs text-gray-800 border-b pt-2 pb-1 uppercase">Antecedentes Médicos (Anamnesis Remota)</h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block font-semibold text-red-600 mb-1">Alergias (Medicamentos, Látex)</label>
          <input
            type="text"
            value={fichaData.alergias}
            onChange={(e) => handleFichaChange('alergias', e.target.value)}
            placeholder="Ej: Penicilina, AINEs, Ninguna"
            className="w-full p-2.5 rounded-lg border border-red-200 bg-red-50/30 font-bold text-red-900"
          />
        </div>
        <div>
          <label className="block font-semibold text-gray-600 mb-1">Enfermedades Sistémicas / Crónicas</label>
          <input
            type="text"
            value={fichaData.enfermedades}
            onChange={(e) => handleFichaChange('enfermedades', e.target.value)}
            placeholder="Ej: Hipertensión, Diabetes, Cardiopatía"
            className="w-full p-2.5 rounded-lg border border-gray-300"
          />
        </div>
        <div>
          <label className="block font-semibold text-gray-600 mb-1">Medicamentos Habituales</label>
          <input
            type="text"
            value={fichaData.medicamentos}
            onChange={(e) => handleFichaChange('medicamentos', e.target.value)}
            placeholder="Ej: Losartán 50mg, Metformina..."
            className="w-full p-2.5 rounded-lg border border-gray-300"
          />
        </div>
      </div>

      <h4 className="font-bold text-xs text-gray-800 border-b pt-2 pb-1 uppercase">Examen Físico y Hábitos</h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block font-semibold text-gray-600 mb-1">Examen Extraoral (ATM, Cuello, Ganglios)</label>
          <textarea
            rows="2"
            value={fichaData.examenExtraoral}
            onChange={(e) => handleFichaChange('examenExtraoral', e.target.value)}
            placeholder="Ej: Sin adenopatías palpables, ATM asintomática..."
            className="w-full p-2.5 rounded-lg border border-gray-300"
          />
        </div>
        <div>
          <label className="block font-semibold text-gray-600 mb-1">Examen Intraoral (Mucosas, Lengua)</label>
          <textarea
            rows="2"
            value={fichaData.examenIntraoral}
            onChange={(e) => handleFichaChange('examenIntraoral', e.target.value)}
            placeholder="Ej: Mucosa yugular sana, gingivitis marginal leve..."
            className="w-full p-2.5 rounded-lg border border-gray-300"
          />
        </div>
        <div>
          <label className="block font-semibold text-gray-600 mb-1">Hábitos (Fumador, Bruxismo)</label>
          <textarea
            rows="2"
            value={fichaData.habitos}
            onChange={(e) => handleFichaChange('habitos', e.target.value)}
            placeholder="Ej: Tabaquismo ocasional, bruxismo nocturno..."
            className="w-full p-2.5 rounded-lg border border-gray-300"
          />
        </div>
      </div>
    </div>
  )
})

AnamnesisSection.displayName = 'AnamnesisSection'