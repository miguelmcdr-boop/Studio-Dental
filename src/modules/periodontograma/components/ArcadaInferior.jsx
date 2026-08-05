import React, { memo } from 'react'
import { TarjetaPieza } from './TarjetaPieza'

export const ArcadaInferior = memo(({ periodontoData = {}, setPeriodontoData = () => {} }) => {
  const CUADRANTE_4 = ['4.8', '4.7', '4.6', '4.5', '4.4', '4.3', '4.2', '4.1']
  const CUADRANTE_3 = ['3.1', '3.2', '3.3', '3.4', '3.5', '3.6', '3.7', '3.8']

  const dataSegura = periodontoData || {}

  const handlePiezaChange = (numero, cara, tipoCampo, valor) => {
    setPeriodontoData(prev => {
      const statePrev = prev || {}
      const piezaActual = statePrev[numero] || {
        vestibular: { sondaje: [0, 0, 0], recesion: [0, 0, 0], sangrado: [false, false, false], placa: [false, false, false], supuracion: [false, false, false] },
        palatino: { sondaje: [0, 0, 0], recesion: [0, 0, 0], sangrado: [false, false, false], placa: [false, false, false], supuracion: [false, false, false] }
      }

      if (tipoCampo === 'ausente') {
        return { ...statePrev, [numero]: { ...piezaActual, ausente: valor } }
      }

      return {
        ...statePrev,
        [numero]: {
          ...piezaActual,
          [cara]: {
            ...piezaActual[cara],
            [tipoCampo]: valor
          }
        }
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Cuadrante 4 */}
      <div>
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Cuadrante 4 (4.8 - 4.1)</span>
        <div className="overflow-x-auto pb-3">
          <div className="flex gap-3 min-w-max">
            {CUADRANTE_4.map(num => (
              <div key={num} className="w-[170px] shrink-0">
                <TarjetaPieza
                  numero={num}
                  piezaData={dataSegura[num] || {}}
                  onChange={handlePiezaChange}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cuadrante 3 */}
      <div>
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Cuadrante 3 (3.1 - 3.8)</span>
        <div className="overflow-x-auto pb-3">
          <div className="flex gap-3 min-w-max">
            {CUADRANTE_3.map(num => (
              <div key={num} className="w-[170px] shrink-0">
                <TarjetaPieza
                  numero={num}
                  piezaData={dataSegura[num] || {}}
                  onChange={handlePiezaChange}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
})

ArcadaInferior.displayName = 'ArcadaInferior'