import React, { useState } from 'react'
import { DienteSVG } from '../components/DienteSVG'

export const OdontogramaModulo = ({ odontograma = {}, guardarOdontograma, esEvolucion = false }) => {
  const [tipoDenticion, setTipoDenticion] = useState('permanente')
  const [modoSeleccionado, setModoSeleccionado] = useState('caries')
  const [piezaActiva, setPiezaActiva] = useState('1.8')

  const PERMANENTE_SUPERIOR = ['1.8', '1.7', '1.6', '1.5', '1.4', '1.3', '1.2', '1.1', '2.1', '2.2', '2.3', '2.4', '2.5', '2.6', '2.7', '2.8']
  const PERMANENTE_INFERIOR = ['4.8', '4.7', '4.6', '4.5', '4.4', '4.3', '4.2', '4.1', '3.1', '3.2', '3.3', '3.4', '3.5', '3.6', '3.7', '3.8']
  const TEMPORAL_SUPERIOR = ['5.5', '5.4', '5.3', '5.2', '5.1', '6.1', '6.2', '6.3', '6.4', '6.5']
  const TEMPORAL_INFERIOR = ['8.5', '8.4', '8.3', '8.2', '8.1', '7.1', '7.2', '7.3', '7.4', '7.5']

  const piezasSuperiores = tipoDenticion === 'permanente' ? PERMANENTE_SUPERIOR : TEMPORAL_SUPERIOR
  const piezasInferiores = tipoDenticion === 'permanente' ? PERMANENTE_INFERIOR : TEMPORAL_INFERIOR

  const handleCaraClick = (numeroPieza, cara, modo) => {
    setPiezaActiva(numeroPieza)
    const piezaPrev = odontograma[numeroPieza] || { general: 'sano', caras: {}, observacion: '' }
    const estadoActualCara = piezaPrev.caras?.[cara]
    const nuevoEstadoCara = estadoActualCara === modo ? 'sano' : modo

    const nuevoOdontograma = {
      ...odontograma,
      [numeroPieza]: {
        ...piezaPrev,
        general: 'sano',
        caras: { ...piezaPrev.caras, [cara]: nuevoEstadoCara }
      }
    }
    guardarOdontograma(nuevoOdontograma)
  }

  const handleEstadoGeneral = (modo) => {
    if (!piezaActiva) return
    const nuevoOdontograma = {
      ...odontograma,
      [piezaActiva]: { ...(odontograma[piezaActiva] || {}), general: modo, caras: {} }
    }
    guardarOdontograma(nuevoOdontograma)
  }

  const handleLimpiarPieza = () => {
    if (!piezaActiva) return
    const nuevoOdontograma = {
      ...odontograma,
      [piezaActiva]: { general: 'sano', caras: {}, observacion: '' }
    }
    guardarOdontograma(nuevoOdontograma)
  }

  const handleObservacionChange = (texto) => {
    if (!piezaActiva) return
    const nuevoOdontograma = {
      ...odontograma,
      [piezaActiva]: { ...(odontograma[piezaActiva] || { general: 'sano', caras: {} }), observacion: texto }
    }
    guardarOdontograma(nuevoOdontograma)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          <button onClick={() => setTipoDenticion('permanente')} className={`px-3 py-2 rounded-xl text-xs font-semibold border ${tipoDenticion === 'permanente' ? 'bg-black text-white border-black' : 'bg-white text-gray-700 border-gray-200'}`}>
            🦷 Permanente (11-48)
          </button>
          <button onClick={() => setTipoDenticion('temporal')} className={`px-3 py-2 rounded-xl text-xs font-semibold border ${tipoDenticion === 'temporal' ? 'bg-black text-white border-black' : 'bg-white text-gray-700 border-gray-200'}`}>
            🧸 Temporal (51-85)
          </button>
        </div>
        {esEvolucion && (
          <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1.5 rounded-lg border border-green-200">
            Modo Evolución (Tratamientos Realizados)
          </span>
        )}
      </div>

      <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 mb-6 flex flex-wrap gap-2 items-center">
        <span className="text-xs font-bold text-gray-500 uppercase mr-2">Herramienta:</span>
        {[
          { id: 'sano', label: 'Sano', color: 'bg-white text-gray-800' },
          { id: 'caries', label: 'Caries', color: 'bg-red-500 text-white' },
          { id: 'restauracion', label: 'Restauración', color: 'bg-blue-500 text-white' },
          { id: 'incrustacion', label: 'Incrustación', color: 'bg-orange-500 text-white' },
          { id: 'sellante', label: 'Sellante', color: 'bg-emerald-500 text-white' },
          { id: 'corona', label: 'Corona', color: 'bg-yellow-500 text-black' },
          { id: 'endodoncia', label: 'Endodoncia', color: 'bg-purple-500 text-white' }
        ].map(h => (
          <button key={h.id} onClick={() => setModoSeleccionado(h.id)} className={`px-3 py-1 rounded-lg text-xs font-semibold border ${modoSeleccionado === h.id ? `${h.color} ring-2 ring-black` : 'bg-white text-gray-700 border-gray-300'}`}>
            {h.label}
          </button>
        ))}

        <div className="h-4 w-px bg-gray-300 mx-2"></div>
        <button onClick={() => handleEstadoGeneral('implante')} className="px-3 py-1 rounded-lg text-xs font-semibold bg-white border border-gray-300 text-gray-800">Implante</button>
        <button onClick={() => handleEstadoGeneral('ausente')} className="px-3 py-1 rounded-lg text-xs font-semibold bg-white border border-red-200 text-red-600">Ausente</button>
        <button onClick={() => handleEstadoGeneral('indicacion_exodoncia')} className="px-3 py-1 rounded-lg text-xs font-semibold bg-white border border-red-300 text-red-800">Indicación Exodoncia</button>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 mb-6 overflow-x-auto">
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 text-center">Arcada Superior</h3>
          <div className="flex justify-center gap-1 min-w-[500px]">
            {piezasSuperiores.map(num => (
              <DienteSVG key={num} numero={num} estadosPieza={odontograma[num]} modoSeleccionado={modoSeleccionado} alHacerClicCara={handleCaraClick} alSeleccionarPieza={setPiezaActiva} piezaActiva={piezaActiva} />
            ))}
          </div>
        </div>
        <div className="border-t border-gray-200 my-4"></div>
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 text-center">Arcada Inferior</h3>
          <div className="flex justify-center gap-1 min-w-[500px]">
            {piezasInferiores.map(num => (
              <DienteSVG key={num} numero={num} estadosPieza={odontograma[num]} modoSeleccionado={modoSeleccionado} alHacerClicCara={handleCaraClick} alSeleccionarPieza={setPiezaActiva} piezaActiva={piezaActiva} />
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-xs font-bold text-gray-800">Detalle y Observaciones — Pieza {piezaActiva}</h4>
          <button onClick={handleLimpiarPieza} className="text-xs text-red-600 font-medium">🧹 Limpiar pieza</button>
        </div>
        <textarea
          rows="2"
          value={odontograma[piezaActiva]?.observacion || ''}
          onChange={(e) => handleObservacionChange(e.target.value)}
          placeholder="Añadir observaciones para esta pieza dental..."
          className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs focus:outline-none focus:border-black"
        />
      </div>
    </div>
  )
}