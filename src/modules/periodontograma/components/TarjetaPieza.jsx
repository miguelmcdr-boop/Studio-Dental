import React, { memo } from 'react'
import { SITIOS_VESTIBULAR, SITIOS_PALATINO_LINGUAL, OPCIONES_MOVILIDAD, OPCIONES_FURCA } from '../constants/periodontalConstants'
import { esSacoPeriodontal, esDienteMultirradicular } from '../utils/periodontalValidation'
import { calcularCAL } from '../utils/periodontalCalculations'

const getColorMovilidad = (grado) => {
  if (grado === '1') return 'bg-yellow-100 text-yellow-800 border-yellow-300'
  if (grado === '2') return 'bg-orange-100 text-orange-800 border-orange-300'
  if (grado === '3') return 'bg-red-600 text-white font-black'
  return 'bg-white text-gray-800 border-gray-300'
}

export const TarjetaPieza = memo(({ 
  piezaId, 
  piezaData, 
  onSondajeChange, 
  onRecesionChange,
  onFlagToggle, 
  onAtributoChange,
  onAusenteToggle,
  onImplanteToggle
}) => {
  const esAusente = !!piezaData?.ausente
  const esImplante = !!piezaData?.implante
  const esMultirradicular = esDienteMultirradicular(piezaId)

  if (esAusente) {
    return (
      <div className="border border-gray-300 rounded-xl p-2 bg-gray-200/80 text-center space-y-2 select-none min-h-[220px] flex flex-col justify-between">
        <div className="flex justify-between items-center border-b pb-1">
          <span className="font-bold text-gray-500 text-xs">P.{piezaId}</span>
          <button 
            type="button" 
            onClick={() => onAusenteToggle(piezaId)}
            className="text-[9px] bg-gray-300 font-bold px-1 rounded text-gray-700 hover:bg-gray-400"
          >
            Habilitar
          </button>
        </div>
        <div className="my-auto">
          <span className="text-red-700 font-black text-xl block">AUSENTE</span>
          <span className="text-[9px] text-gray-500 font-semibold block">Pieza Excluida</span>
        </div>
        <div className="text-[9px] text-gray-400 border-t pt-1">Sin datos</div>
      </div>
    )
  }

  return (
    <div className={`border rounded-xl p-2 text-center space-y-2 shadow-2xs hover:border-gray-400 transition-all ${
      esImplante ? 'bg-blue-50/50 border-blue-300' : 'bg-gray-50'
    }`}>
      {/* Controles de Cabecera de la Pieza */}
      <div className="flex justify-between items-center border-b pb-1">
        <span className="font-bold text-gray-900 text-xs">
          P.{piezaId} {esImplante && <span className="text-blue-700 font-black text-[9px]">[IMP]</span>}
        </span>
        <div className="flex gap-1 text-[8px]">
          <button
            type="button"
            onClick={() => onImplanteToggle(piezaId)}
            className={`px-1 py-0.5 rounded font-bold ${esImplante ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}
          >
            IMP
          </button>
          <button
            type="button"
            onClick={() => onAusenteToggle(piezaId)}
            className="px-1 py-0.5 rounded font-bold bg-gray-200 text-gray-600 hover:bg-red-100 hover:text-red-700"
          >
            AUS
          </button>
        </div>
      </div>
      
      {/* Caras Vestibulares */}
      <div>
        <span className="text-[8px] font-bold text-gray-500 uppercase block mb-1">Vestibular</span>
        <div className="flex justify-center gap-0.5">
          {SITIOS_VESTIBULAR.map(s => {
            const pb = piezaData?.sondaje?.[s.id] ?? ''
            const rec = piezaData?.recesion?.[s.id] ?? ''
            const cal = calcularCAL(pb, rec)
            const sangra = !!piezaData?.sangrado?.[s.id]
            const placa = !!piezaData?.placa?.[s.id]
            const supuracion = !!piezaData?.supuracion?.[s.id]
            const esSaco = esSacoPeriodontal(pb)

            return (
              <div key={s.id} className="flex flex-col items-center bg-white p-0.5 rounded border border-gray-200">
                <span className="text-[7px] text-gray-400 font-bold">{s.id.toUpperCase()}</span>
                {/* PB */}
                <input
                  type="number"
                  value={pb}
                  onChange={(e) => onSondajeChange(piezaId, s.id, e.target.value)}
                  placeholder="PB"
                  title="Profundidad de Bolsa (PB)"
                  className={`w-6 h-5 text-center rounded border font-bold text-[10px] ${
                    esSaco ? 'bg-red-500 text-white border-red-600' : 'bg-gray-50 text-gray-800'
                  }`}
                />
                {/* REC */}
                <input
                  type="number"
                  value={rec}
                  onChange={(e) => onRecesionChange(piezaId, s.id, e.target.value)}
                  placeholder="REC"
                  title="Recesión Gingival (REC)"
                  className="w-6 h-4 text-center rounded border font-semibold text-[9px] mt-0.5 bg-white text-gray-700"
                />
                {/* CAL Calculado Solamente */}
                <span title="Nivel de Inserción Clínica (CAL)" className="text-[8px] font-black text-purple-700 mt-0.5 min-h-[12px]">
                  {cal !== '' ? `C:${cal}` : ''}
                </span>

                {/* Flags: BOP, Placa, Supuración */}
                <div className="flex gap-0.5 mt-0.5">
                  <button
                    type="button"
                    title="Sangrado BOP"
                    onClick={() => onFlagToggle(piezaId, 'sangrado', s.id)}
                    className={`w-2.5 h-2.5 rounded-full text-[6px] font-bold ${sangra ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-400'}`}
                  >
                    B
                  </button>
                  <button
                    type="button"
                    title="Placa Bacteriana"
                    onClick={() => onFlagToggle(piezaId, 'placa', s.id)}
                    className={`w-2.5 h-2.5 rounded-full text-[6px] font-bold ${placa ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}
                  >
                    P
                  </button>
                  <button
                    type="button"
                    title="Supuración Active"
                    onClick={() => onFlagToggle(piezaId, 'supuracion', s.id)}
                    className={`w-2.5 h-2.5 rounded-full text-[6px] font-bold ${supuracion ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-400'}`}
                  >
                    S
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Caras Palatino / Lingual */}
      <div className="pt-1">
        <span className="text-[8px] font-bold text-gray-500 uppercase block mb-1">Palatino / Lingual</span>
        <div className="flex justify-center gap-0.5">
          {SITIOS_PALATINO_LINGUAL.map(s => {
            const pb = piezaData?.sondaje?.[s.id] ?? ''
            const rec = piezaData?.recesion?.[s.id] ?? ''
            const cal = calcularCAL(pb, rec)
            const sangra = !!piezaData?.sangrado?.[s.id]
            const placa = !!piezaData?.placa?.[s.id]
            const supuracion = !!piezaData?.supuracion?.[s.id]
            const esSaco = esSacoPeriodontal(pb)

            return (
              <div key={s.id} className="flex flex-col items-center bg-white p-0.5 rounded border border-gray-200">
                <span className="text-[7px] text-gray-400 font-bold">{s.id.toUpperCase()}</span>
                {/* PB */}
                <input
                  type="number"
                  value={pb}
                  onChange={(e) => onSondajeChange(piezaId, s.id, e.target.value)}
                  placeholder="PB"
                  title="Profundidad de Bolsa (PB)"
                  className={`w-6 h-5 text-center rounded border font-bold text-[10px] ${
                    esSaco ? 'bg-red-500 text-white border-red-600' : 'bg-gray-50 text-gray-800'
                  }`}
                />
                {/* REC */}
                <input
                  type="number"
                  value={rec}
                  onChange={(e) => onRecesionChange(piezaId, s.id, e.target.value)}
                  placeholder="REC"
                  title="Recesión Gingival (REC)"
                  className="w-6 h-4 text-center rounded border font-semibold text-[9px] mt-0.5 bg-white text-gray-700"
                />
                {/* CAL */}
                <span title="Nivel de Inserción Clínica (CAL)" className="text-[8px] font-black text-purple-700 mt-0.5 min-h-[12px]">
                  {cal !== '' ? `C:${cal}` : ''}
                </span>

                {/* Flags */}
                <div className="flex gap-0.5 mt-0.5">
                  <button
                    type="button"
                    title="Sangrado BOP"
                    onClick={() => onFlagToggle(piezaId, 'sangrado', s.id)}
                    className={`w-2.5 h-2.5 rounded-full text-[6px] font-bold ${sangra ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-400'}`}
                  >
                    B
                  </button>
                  <button
                    type="button"
                    title="Placa Bacteriana"
                    onClick={() => onFlagToggle(piezaId, 'placa', s.id)}
                    className={`w-2.5 h-2.5 rounded-full text-[6px] font-bold ${placa ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}
                  >
                    P
                  </button>
                  <button
                    type="button"
                    title="Supuración Active"
                    onClick={() => onFlagToggle(piezaId, 'supuracion', s.id)}
                    className={`w-2.5 h-2.5 rounded-full text-[6px] font-bold ${supuracion ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-400'}`}
                  >
                    S
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Controles Atributos Globales (Movilidad & Furca Condicional) */}
      <div className="pt-1 border-t grid grid-cols-2 gap-1 text-[9px]">
        <div>
          <span className="text-[8px] text-gray-400 block uppercase font-bold">Movilidad</span>
          <select
            value={piezaData?.movilidad || '0'}
            onChange={(e) => onAtributoChange(piezaId, 'movilidad', e.target.value)}
            className={`w-full border rounded text-[9px] font-bold py-0.5 cursor-pointer ${getColorMovilidad(piezaData?.movilidad)}`}
          >
            {OPCIONES_MOVILIDAD.map(op => <option key={op} value={op}>Grado {op}</option>)}
          </select>
        </div>

        <div>
          <span className="text-[8px] text-gray-400 block uppercase font-bold">
            {esMultirradicular ? 'Furca' : 'N/A'}
          </span>
          {esMultirradicular ? (
            <select
              value={piezaData?.furca || '0'}
              onChange={(e) => onAtributoChange(piezaId, 'furca', e.target.value)}
              className="w-full bg-white border border-gray-300 rounded text-[9px] font-bold py-0.5 cursor-pointer"
            >
              {OPCIONES_FURCA.map(op => <option key={op} value={op}>Grado {op}</option>)}
            </select>
          ) : (
            <div className="text-[8px] text-gray-300 italic pt-1 font-bold">Unirrad.</div>
          )}
        </div>
      </div>
    </div>
  )
})

TarjetaPieza.displayName = 'TarjetaPieza'