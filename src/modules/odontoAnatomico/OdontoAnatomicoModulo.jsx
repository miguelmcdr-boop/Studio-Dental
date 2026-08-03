import React, { memo, useState, useEffect } from 'react'
import {
  HALLAZGOS_ANATOMICOS,
  PIEZAS_PERMANENTES_SUPERIOR,
  PIEZAS_PERMANENTES_INFERIOR,
  PIEZAS_TEMPORALES_SUPERIOR,
  PIEZAS_TEMPORALES_INFERIOR
} from './constants/odontoAnatomicoConstants'
import { calcularCPODAnatomico } from './utils/odontoAnatomicoCalculations'
import { PiezaAnatomicaSVG } from './components/PiezaAnatomicaSVG'

export const OdontoAnatomicoModulo = memo(({ pacienteId }) => {
  const STORAGE_KEY = `odonto_anatomico_${pacienteId}`

  const [odontoData, setOdontoData] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : {}
    } catch (e) {
      return {}
    }
  })

  const [hallazgoActivo, setHallazgoActivo] = useState('caries')
  const [mostrarTemporales, setMostrarTemporales] = useState(false)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(odontoData))
  }, [odontoData, STORAGE_KEY])

  // Clic en una cara individual
  const handleCaraClick = (numero, cara) => {
    setOdontoData(prev => {
      const estadoPieza = prev[numero] || {}
      
      // Si la cara ya tenía este hallazgo, conmutar a 'sano' (limpiar)
      const nuevoHallazgo = estadoPieza[cara] === hallazgoActivo ? 'sano' : hallazgoActivo

      const nuevoEstado = { ...estadoPieza, [cara]: nuevoHallazgo }
      
      // Si todas las caras quedan en sano, limpiar la pieza
      const tieneHallazgos = Object.values(nuevoEstado).some(val => val && val !== 'sano')
      if (!tieneHallazgos) {
        const copia = { ...prev }
        delete copia[numero]
        return copia
      }

      return { ...prev, [numero]: nuevoEstado }
    })
  }

  // Clic en toda la pieza o en la marca de ausente
  const handlePiezaClick = (numero) => {
    setOdontoData(prev => {
      const estadoPieza = prev[numero] || {}
      const esAusente = Object.values(estadoPieza).includes('ausente')

      // Si la pieza ya es ausente o la herramienta activa es 'sano', limpiamos la pieza
      if (esAusente || hallazgoActivo === 'sano') {
        const copia = { ...prev }
        delete copia[numero]
        return copia
      }

      // Si la herramienta activa es 'ausente', marcamos todas las caras como ausentes
      if (hallazgoActivo === 'ausente') {
        return {
          ...prev,
          [numero]: {
            superior: 'ausente',
            derecha: 'ausente',
            inferior: 'ausente',
            izquierda: 'ausente',
            centro: 'ausente'
          }
        }
      }

      return prev
    })
  }

  const cpod = calcularCPODAnatomico(odontoData)

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-6 text-xs">
      {/* Header y Control Temporal */}
      <div className="border-b pb-3 flex justify-between items-center flex-wrap gap-3">
        <div>
          <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider">
            🦷 Odontograma Anatómico 5 Caras
          </h3>
          <p className="text-gray-500 text-[11px]">Mapeo anatómico por caras dentarias (FDI). Haz clic en una cara o pieza para marcar/desmarcar.</p>
        </div>

        <button
          onClick={() => setMostrarTemporales(!mostrarTemporales)}
          className="px-3 py-1.5 rounded-xl border border-gray-300 font-bold hover:bg-gray-100 transition-colors"
        >
          {mostrarTemporales ? 'Ocultar Dentición Temporal' : '👶 Dentición Temporal (Niños)'}
        </button>
      </div>

      {/* Selector de Herramienta / Hallazgo */}
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
        <span className="font-bold text-gray-700 text-[11px] uppercase block">Herramienta Activa:</span>
        <div className="flex flex-wrap gap-2">
          {HALLAZGOS_ANATOMICOS.map(h => (
            <button
              key={h.id}
              onClick={() => setHallazgoActivo(h.id)}
              className={`px-3 py-1.5 rounded-xl border font-bold text-xs transition-all cursor-pointer ${
                hallazgoActivo === h.id ? 'bg-black text-white border-black shadow-xs' : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {h.texto}
            </button>
          ))}
        </div>
      </div>

      {/* Diagrama Anatómico por Arcadas */}
      <div className="space-y-6 overflow-x-auto py-2">
        {/* Maxilar Superior */}
        <div>
          <span className="font-bold text-gray-500 text-[10px] uppercase block text-center mb-2">Maxilar Superior</span>
          <div className="flex justify-center gap-1 min-w-[600px]">
            {PIEZAS_PERMANENTES_SUPERIOR.map(num => (
              <PiezaAnatomicaSVG
                key={num}
                numero={num}
                estadoPieza={odontoData[num]}
                onCaraClick={handleCaraClick}
                onPiezaClick={handlePiezaClick}
              />
            ))}
          </div>
        </div>

        {/* Dentición Temporal Superior */}
        {mostrarTemporales && (
          <div className="pt-2 border-t border-dashed">
            <span className="font-bold text-blue-600 text-[10px] uppercase block text-center mb-2">Temporal Superior</span>
            <div className="flex justify-center gap-1 min-w-[400px]">
              {PIEZAS_TEMPORALES_SUPERIOR.map(num => (
                <PiezaAnatomicaSVG
                  key={num}
                  numero={num}
                  estadoPieza={odontoData[num]}
                  onCaraClick={handleCaraClick}
                  onPiezaClick={handlePiezaClick}
                />
              ))}
            </div>
          </div>
        )}

        {/* Dentición Temporal Inferior */}
        {mostrarTemporales && (
          <div className="pb-2 border-b border-dashed">
            <span className="font-bold text-blue-600 text-[10px] uppercase block text-center mb-2">Temporal Inferior</span>
            <div className="flex justify-center gap-1 min-w-[400px]">
              {PIEZAS_TEMPORALES_INFERIOR.map(num => (
                <PiezaAnatomicaSVG
                  key={num}
                  numero={num}
                  estadoPieza={odontoData[num]}
                  onCaraClick={handleCaraClick}
                  onPiezaClick={handlePiezaClick}
                />
              ))}
            </div>
          </div>
        )}

        {/* Mandíbula Inferior */}
        <div>
          <div className="flex justify-center gap-1 min-w-[600px]">
            {PIEZAS_PERMANENTES_INFERIOR.map(num => (
              <PiezaAnatomicaSVG
                key={num}
                numero={num}
                estadoPieza={odontoData[num]}
                onCaraClick={handleCaraClick}
                onPiezaClick={handlePiezaClick}
              />
            ))}
          </div>
          <span className="font-bold text-gray-500 text-[10px] uppercase block text-center mt-2">Mandíbula Inferior</span>
        </div>
      </div>

      {/* Resumen del Índice CPO-D */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t text-center">
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
          <span className="text-[10px] font-bold text-red-700 block">Caries (C)</span>
          <span className="text-lg font-black text-red-900">{cpod.caries}</span>
        </div>
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
          <span className="text-[10px] font-bold text-gray-700 block">Perdidos (P)</span>
          <span className="text-lg font-black text-gray-900">{cpod.perdidos}</span>
        </div>
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
          <span className="text-[10px] font-bold text-blue-700 block">Obturados (O)</span>
          <span className="text-lg font-black text-blue-900">{cpod.obturados}</span>
        </div>
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
          <span className="text-[10px] font-bold text-emerald-700 block">Índice CPO-D Total</span>
          <span className="text-lg font-black text-emerald-900">{cpod.totalCPOD}</span>
        </div>
      </div>
    </div>
  )
})

OdontoAnatomicoModulo.displayName = 'OdontoAnatomicoModulo'