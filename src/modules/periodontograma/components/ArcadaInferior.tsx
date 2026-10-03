import React, { memo } from 'react'
import { TarjetaPieza, type PiezaDataModel } from './TarjetaPieza'
import type { PiezasDataCalculo } from '../utils/periodontalCalculations'

export interface ArcadaInferiorProps {
  periodontoData?: PiezasDataCalculo
  setPeriodontoData?: React.Dispatch<React.SetStateAction<PiezasDataCalculo>>
}

export const ArcadaInferior = memo<ArcadaInferiorProps>(({ periodontoData = {}, setPeriodontoData = () => {} }) => {
  const CUADRANTE_4 = ['4.8', '4.7', '4.6', '4.5', '4.4', '4.3', '4.2', '4.1']
  const CUADRANTE_3 = ['3.1', '3.2', '3.3', '3.4', '3.5', '3.6', '3.7', '3.8']

  const dataSegura = periodontoData || {}

  const handlePiezaChange = (numero: number | string, cara: string | null, tipoCampo: string, valor: unknown): void => {
    setPeriodontoData(prev => {
      const statePrev = prev || {}
      const numKey = String(numero)
      const piezaActual = (statePrev[numKey] || {
        vestibular: { sondaje: [null, null, null], recesion: [null, null, null], sangrado: [false, false, false], placa: [false, false, false], supuracion: [false, false, false] },
        palatino: { sondaje: [null, null, null], recesion: [null, null, null], sangrado: [false, false, false], placa: [false, false, false], supuracion: [false, false, false] }
      }) as PiezaDataModel

      if (tipoCampo === 'ausente') {
        return { ...statePrev, [numKey]: { ...piezaActual, ausente: Boolean(valor) } }
      }

      if (cara && (cara === 'vestibular' || cara === 'palatino')) {
        const caraActual = piezaActual[cara] || {}
        return {
          ...statePrev,
          [numKey]: {
            ...piezaActual,
            [cara]: {
              ...caraActual,
              [tipoCampo]: valor
            }
          }
        }
      }

      return {
        ...statePrev,
        [numKey]: {
          ...piezaActual,
          [tipoCampo]: valor
        }
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Cuadrante 4 */}
      <div>
        <span className="text-[10px] font-black text-gray-400 dark:text-graphite-500 uppercase tracking-widest block mb-2">Cuadrante 4 (4.8 - 4.1)</span>
        <div className="overflow-x-auto pb-3">
          <div className="flex gap-3 min-w-max">
            {CUADRANTE_4.map(num => (
              <div key={num} className="w-[170px] shrink-0">
                <TarjetaPieza
                  numero={num}
                  piezaData={(dataSegura[num] || {}) as PiezaDataModel}
                  onChange={handlePiezaChange}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cuadrante 3 */}
      <div>
        <span className="text-[10px] font-black text-gray-400 dark:text-graphite-500 uppercase tracking-widest block mb-2">Cuadrante 3 (3.1 - 3.8)</span>
        <div className="overflow-x-auto pb-3">
          <div className="flex gap-3 min-w-max">
            {CUADRANTE_3.map(num => (
              <div key={num} className="w-[170px] shrink-0">
                <TarjetaPieza
                  numero={num}
                  piezaData={(dataSegura[num] || {}) as PiezaDataModel}
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
