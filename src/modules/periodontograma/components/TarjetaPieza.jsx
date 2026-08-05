import React, { memo } from 'react'

export const TarjetaPieza = memo(({ numero, piezaData = {}, onChange }) => {
  const ausente = !!piezaData.ausente

  const handleSondajeChange = (cara, campo, idx, valor) => {
    const actual = [...(piezaData[cara]?.[campo] || [0, 0, 0])]
    actual[idx] = parseInt(valor, 10) || 0
    onChange(numero, cara, campo, actual)
  }

  const handleToggleFlag = (cara, idx, flagName) => {
    const actualFlags = [...(piezaData[cara]?.[flagName] || [false, false, false])]
    actualFlags[idx] = !actualFlags[idx]
    onChange(numero, cara, flagName, actualFlags)
  }

  const handleSelectChange = (campo, valor) => {
    onChange(numero, null, campo, valor)
  }

  const secciones = [
    { cara: 'vestibular', titulo: 'VESTIBULAR', sitios: ['MV', 'V', 'DV'] },
    { cara: 'palatino', titulo: 'PALATINO / LINGUAL', sitios: ['MP', 'P', 'DP'] }
  ]

  return (
    <div className={`p-2.5 border border-gray-300 rounded-2xl bg-white shadow-2xs text-xs space-y-2.5 w-full transition-all ${
      ausente ? 'opacity-40 bg-gray-100' : 'hover:border-black'
    }`}>
      {/* Cabecera */}
      <div className="flex justify-between items-center border-b pb-1">
        <span className="font-black text-xs text-gray-900">Pieza {numero}</span>
        <button
          type="button"
          onClick={() => onChange(numero, null, 'ausente', !ausente)}
          className={`text-[9px] font-bold px-1.5 py-0.5 rounded cursor-pointer ${
            ausente ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {ausente ? 'Ausente' : 'Presente'}
        </button>
      </div>

      {!ausente && (
        <>
          {secciones.map(({ cara, titulo, sitios }) => (
            <div key={cara} className="space-y-1">
              <span className="text-[9px] font-extrabold text-gray-500 tracking-wider block text-center uppercase">
                {titulo}
              </span>

              <div className="grid grid-cols-3 gap-1 text-center">
                {sitios.map((labelSitio, idx) => {
                  const valP = piezaData[cara]?.sondaje?.[idx] ?? ''
                  const valR = piezaData[cara]?.recesion?.[idx] ?? ''
                  const bop = piezaData[cara]?.sangrado?.[idx] || false
                  const placa = piezaData[cara]?.placa?.[idx] || false
                  const sup = piezaData[cara]?.supuracion?.[idx] || false

                  return (
                    <div key={idx} className="bg-gray-50/80 p-1 rounded-lg border border-gray-200 space-y-1">
                      <span className="text-[8px] font-black text-gray-400 block uppercase">{labelSitio}</span>

                      {/* Input P */}
                      <div className="relative">
                        <span className="absolute left-0.5 top-0.5 text-[7px] font-bold text-gray-400">P</span>
                        <input
                          type="number"
                          min="0"
                          max="15"
                          value={valP}
                          onChange={(e) => handleSondajeChange(cara, 'sondaje', idx, e.target.value)}
                          className="w-full text-center font-extrabold text-[11px] pl-2 pr-0.5 py-0.5 border rounded bg-white focus:border-black focus:outline-none"
                        />
                      </div>

                      {/* Input R */}
                      <div className="relative">
                        <span className="absolute left-0.5 top-0.5 text-[7px] font-bold text-gray-400">R</span>
                        <input
                          type="number"
                          min="0"
                          max="15"
                          value={valR}
                          onChange={(e) => handleSondajeChange(cara, 'recesion', idx, e.target.value)}
                          className="w-full text-center font-extrabold text-[11px] pl-2 pr-0.5 py-0.5 border rounded bg-white focus:border-black focus:outline-none"
                        />
                      </div>

                      {/* B, P, S */}
                      <div className="flex justify-between gap-0.5 pt-0.5">
                        <button
                          type="button"
                          onClick={() => handleToggleFlag(cara, idx, 'sangrado')}
                          className={`w-3.5 h-3.5 rounded text-[8px] font-black cursor-pointer ${
                            bop ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-500'
                          }`}
                        >
                          B
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleFlag(cara, idx, 'placa')}
                          className={`w-3.5 h-3.5 rounded text-[8px] font-black cursor-pointer ${
                            placa ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-500'
                          }`}
                        >
                          P
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleFlag(cara, idx, 'supuracion')}
                          className={`w-3.5 h-3.5 rounded text-[8px] font-black cursor-pointer ${
                            sup ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-500'
                          }`}
                        >
                          S
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Movilidad & Furca */}
          <div className="border-t pt-1.5 space-y-1 text-[9px]">
            <div className="flex justify-between items-center">
              <span className="font-extrabold text-gray-600 uppercase">Movilidad:</span>
              <select
                value={piezaData.movilidad || 'Grado 0'}
                onChange={(e) => handleSelectChange('movilidad', e.target.value)}
                className="font-bold border rounded px-1 py-0.5 bg-white text-[9px]"
              >
                <option value="Grado 0">Grado 0</option>
                <option value="Grado I">Grado I</option>
                <option value="Grado II">Grado II</option>
                <option value="Grado III">Grado III</option>
              </select>
            </div>

            <div className="flex justify-between items-center">
              <span className="font-extrabold text-gray-600 uppercase">Furca:</span>
              <select
                value={piezaData.furca || 'N/A'}
                onChange={(e) => handleSelectChange('furca', e.target.value)}
                className="font-bold border rounded px-1 py-0.5 bg-white text-[9px]"
              >
                <option value="N/A">N/A</option>
                <option value="Grado I">Grado I</option>
                <option value="Grado II">Grado II</option>
                <option value="Grado III">Grado III</option>
              </select>
            </div>
          </div>
        </>
      )}
    </div>
  )
})

TarjetaPieza.displayName = 'TarjetaPieza'