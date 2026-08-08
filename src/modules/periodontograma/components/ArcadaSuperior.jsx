import React, { memo } from 'react'
import { TarjetaPieza } from './TarjetaPieza'

export const ArcadaSuperior = memo(({ periodontoData = {}, setPeriodontoData = () => {} }) => {
  const CUADRANTE_1 = ['1.8', '1.7', '1.6', '1.5', '1.4', '1.3', '1.2', '1.1']
  const CUADRANTE_2 = ['2.1', '2.2', '2.3', '2.4', '2.5', '2.6', '2.7', '2.8']

  const dataSegura = periodontoData || {}

  const handlePiezaChange = (numero, cara, tipoCampo, valor) => {
    setPeriodontoData(prev => {
      const statePrev = prev || {}
      const piezaActual = statePrev[numero] || {
        vestibular: { sondaje: [null, null, null], recesion: [null, null, null], sangrado: [false, false, false], placa: [false, false, false], supuracion: [false, false, false] },
        palatino: { sondaje: [null, null, null], recesion: [null, null, null], sangrado: [false, false, false], placa: [false, false, false], supuracion: [false, false, false] }
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
      {/* Cuadrante 1 */}
      <div>
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Cuadrante 1 (1.8 - 1.1)</span>
        <div className="overflow-x-auto pb-3">
          <div className="flex gap-3 min-w-max">
            {CUADRANTE_1.map(num => (
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

      {/* Cuadrante 2 */}
      <div>
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Cuadrante 2 (2.1 - 2.8)</span>
        <div className="overflow-x-auto pb-3">
          <div className="flex gap-3 min-w-max">
            {CUADRANTE_2.map(num => (
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

ArcadaSuperior.displayName = 'ArcadaSuperior'