import React, { memo } from 'react'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { useDictadoVoz } from '../hooks/useDictadoVoz'

export const AnamnesisSection = memo(({ fichaData, handleFichaChange }) => {
  const { escuchando, textoDictado, iniciarDictado, detenerDictado, soporteNativo } = useDictadoVoz()

  const handleAplicarDictado = (campo) => {
    if (!textoDictado) return
    const textoPrevio = fichaData[campo] || ''
    const textoNuevo = textoPrevio ? `${textoPrevio}. ${textoDictado}` : textoDictado
    handleFichaChange(campo, textoNuevo)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6">
      <div className="flex justify-between items-center border-b pb-3 flex-wrap gap-2">
        <h3 className="font-bold text-xs text-gray-800 uppercase tracking-wider">
          📋 Anamnesis & Examen Físico Clínico
        </h3>

        {soporteNativo && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={escuchando ? detenerDictado : iniciarDictado}
              size="sm"
              variant={escuchando ? 'danger' : 'secondary'}
              className={escuchando ? 'animate-pulse' : ''}
            >
              {escuchando ? '🔴 Escuchando... (Clic para detener)' : '🎙️ Activar Dictado por Voz'}
            </Button>
          </div>
        )}
      </div>

      {escuchando && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs space-y-2">
          <span className="font-bold text-red-900 block">🎙️ Dictado en Curso:</span>
          <p className="italic text-gray-800 bg-white p-2 rounded border">"{textoDictado || 'Habla claro hacia el micrófono...'}"</p>
          <div className="flex gap-2">
            <Button
              onClick={() => handleAplicarDictado('anamnesisProxima')}
              size="sm"
              variant="danger"
              className="text-[10px] font-bold px-2 py-1"
            >
              + Insertar en Anamnesis Próxima
            </Button>
            <Button
              onClick={() => handleAplicarDictado('alergias')}
              size="sm"
              variant="danger"
              className="text-[10px] font-bold px-2 py-1"
            >
              + Insertar en Alergias
            </Button>
            <Button
              onClick={() => handleAplicarDictado('enfermedades')}
              size="sm"
              variant="danger"
              className="text-[10px] font-bold px-2 py-1"
            >
              + Insertar en Enfermedades
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div>
          <label className="block text-gray-700 font-bold mb-1">Motivo de Consulta Principal</label>
          <Input
            type="text"
            placeholder="Ej: Dolor agudo en molar inferior derecho al masticar..."
            value={fichaData.motivoConsulta || ''}
            onChange={(e) => handleFichaChange('motivoConsulta', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-gray-700 font-bold mb-1">Anamnesis Próxima / Historia</label>
          <Input
            type="text"
            placeholder="Ej: Comienza hace 3 días, aumenta con frío/calor..."
            value={fichaData.anamnesisProxima || ''}
            onChange={(e) => handleFichaChange('anamnesisProxima', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-red-700 font-bold mb-1">⚠️ Alergias Conocidas (Fármacos / Látex)</label>
          <Input
            type="text"
            placeholder="Ej: Penicilina, AINEs, Latex, Ninguna..."
            value={fichaData.alergias || ''}
            onChange={(e) => handleFichaChange('alergias', e.target.value)}
            className="border-red-300 bg-red-50 text-red-950 font-bold"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-bold mb-1">Enfermedades Sistémicas (Mórbidos)</label>
          <Input
            type="text"
            placeholder="Ej: Hipertensión Arterial, Diabetes Tipo II..."
            value={fichaData.enfermedades || ''}
            onChange={(e) => handleFichaChange('enfermedades', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-gray-700 font-bold mb-1">Medicamentos de Uso Habitual</label>
          <Input
            type="text"
            placeholder="Ej: Losartán 50mg/día, Metformina 850mg..."
            value={fichaData.medicamentos || ''}
            onChange={(e) => handleFichaChange('medicamentos', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-gray-700 font-bold mb-1">Hábitos (Tabaco / Alcohol / Bruxismo)</label>
          <Input
            type="text"
            placeholder="Ej: Fumador 5 cig/día, Bruxismo nocturno..."
            value={fichaData.habitos || ''}
            onChange={(e) => handleFichaChange('habitos', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-gray-700 font-bold mb-1">Examen Extraoral (ATM, Ganglios, Asimetría)</label>
          <Input
            type="text"
            placeholder="Ej: ATM palpación indolora, sin chasquidos..."
            value={fichaData.examenExtraoral || ''}
            onChange={(e) => handleFichaChange('examenExtraoral', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-gray-700 font-bold mb-1">Examen Intraoral (Mucosas, Lengua, Periodonto)</label>
          <Input
            type="text"
            placeholder="Ej: Mucosas normocoloreadas, gingivitis marginal..."
            value={fichaData.examenIntraoral || ''}
            onChange={(e) => handleFichaChange('examenIntraoral', e.target.value)}
          />
        </div>
      </div>
    </div>
  )
})

AnamnesisSection.displayName = 'AnamnesisSection'