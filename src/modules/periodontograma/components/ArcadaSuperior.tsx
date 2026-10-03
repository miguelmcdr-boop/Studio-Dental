import React, { memo } from 'react'
import { TarjetaPieza, type PiezaDataModel } from './TarjetaPieza'
import type { PiezasDataCalculo } from '../utils/periodontalCalculations'

export interface ArcadaSuperiorProps {
  periodontoData?: PiezasDataCalculo
  setPeriodontoData?: React.Dispatch<React.SetStateAction<PiezasDataCalculo>>
}

export const ArcadaSuperior = memo<ArcadaSuperiorProps>(({ periodontoData = {}, setPeriodontoData = () => {} }) => {
  const CUADRANTE_1 = ['1.8', '1.7', '1.6', '1.5', '1.4', '1.3', '1.2', '1.1']
  const CUADRANTE_2 = ['2.1', '2.2', '2.3', '2.4', '2.5', '2.6', '2.7', '2.8']

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
      {/* Cuadrante 1 */}
      <div>
        <span className="text-[10px] font-black text-gray-400 dark:text-graphite-500 uppercase tracking-widest block mb-2">Cuadrante 1 (1.8 - 1.1)</span>
        <div className="overflow-x-auto pb-3">
          <div className="flex gap-3 min-w-max">
            {CUADRANTE_1.map(num => (
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

      {/* Cuadrante 2 */}
      <div>
        <span className="text-[10px] font-black text-gray-400 dark:text-graphite-500 uppercase tracking-widest block mb-2">Cuadrante 2 (2.1 - 2.8)</span>
        <div className="overflow-x-auto pb-3">
          <div className="flex gap-3 min-w-max">
            {CUADRANTE_2.map(num => (
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

ArcadaSuperior.displayName = 'ArcadaSuperior'
