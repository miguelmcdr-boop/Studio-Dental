import React, { memo, useState, useMemo } from 'react'
import { DienteSVG } from '../../components/DienteSVG'
import { calcularIndiceCPOD } from './utils/odontogramaCalculations'
import { CpodSummaryCard } from './components/CpodSummaryCard'

export const OdontogramaModulo = memo(({
  odontograma = {},
  odontogramaComparar = null,
  guardarOdontograma = () => {},
  esEvolucion = false
}) => {
  const [tipoDenticion, setTipoDenticion] = useState('permanente')
  const [modoSeleccionado, setModoSeleccionado] = useState('caries')
  const [piezaActiva, setPiezaActiva] = useState('1.8')
  const [modoComparativoSplit, setModoComparativoSplit] = useState(false)

  const PERMANENTE_SUPERIOR = ['1.8', '1.7', '1.6', '1.5', '1.4', '1.3', '1.2', '1.1', '2.1', '2.2', '2.3', '2.4', '2.5', '2.6', '2.7', '2.8']
  const PERMANENTE_INFERIOR = ['4.8', '4.7', '4.6', '4.5', '4.4', '4.3', '4.2', '4.1', '3.1', '3.2', '3.3', '3.4', '3.5', '3.6', '3.7', '3.8']
  const TEMPORAL_SUPERIOR = ['5.5', '5.4', '5.3', '5.2', '5.1', '6.1', '6.2', '6.3', '6.4', '6.5']
  const TEMPORAL_INFERIOR = ['8.5', '8.4', '8.3', '8.2', '8.1', '7.1', '7.2', '7.3', '7.4', '7.5']

  const piezasSuperiores = tipoDenticion === 'permanente' ? PERMANENTE_SUPERIOR : TEMPORAL_SUPERIOR
  const piezasInferiores = tipoDenticion === 'permanente' ? PERMANENTE_INFERIOR : TEMPORAL_INFERIOR

  const cpodStats = useMemo(() => calcularIndiceCPOD(odontograma), [odontograma])

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
      {/* Barra Superior con Toggle Split-Screen & Dentición */}
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2 print:hidden">
        <div className="flex gap-2">
          <button
            onClick={() => setTipoDenticion('permanente')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              tipoDenticion === 'permanente' ? 'bg-black text-white border-black' : 'bg-white text-gray-700 border-gray-300'
            }`}
          >
            🦷 Permanente (11-48)
          </button>

          <button
            onClick={() => setTipoDenticion('temporal')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              tipoDenticion === 'temporal' ? 'bg-black text-white border-black' : 'bg-white text-gray-700 border-gray-300'
            }`}
          >
            🧸 Temporal (51-85)
          </button>
        </div>

        {odontogramaComparar && (
          <button
            onClick={() => setModoComparativoSplit(!modoComparativoSplit)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              modoComparativoSplit ? 'bg-purple-700 text-white border-purple-800' : 'bg-purple-50 text-purple-900 border-purple-300'
            }`}
          >
            🪞 {modoComparativoSplit ? 'Cerrar Vista Comparativa Split' : 'Ver Antes vs. Después (Split)'}
          </button>
        )}

        {esEvolucion && (
          <span className="bg-emerald-100 text-emerald-900 text-xs font-bold px-3 py-1 rounded-lg border border-emerald-300">
            🟢 Modo Evolución (Tratamientos Realizados)
          </span>
        )}
      </div>

      {/* Tarjeta de Resumen Epidemiológico CPO-D */}
      <CpodSummaryCard cpodStats={cpodStats} />

      {/* Paleta de Herramientas */}
      <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 mb-6 flex flex-wrap gap-2 items-center text-xs print:hidden">
        <span className="font-bold text-gray-500 uppercase mr-2 text-[10px]">Herramienta:</span>
        {[
          { id: 'sano', label: 'Sano', color: 'bg-white text-gray-800' },
          { id: 'caries', label: 'Caries', color: 'bg-red-500 text-white' },
          { id: 'restauracion', label: 'Restauración', color: 'bg-blue-500 text-white' },
          { id: 'incrustacion', label: 'Incrustación', color: 'bg-orange-500 text-white' },
          { id: 'sellante', label: 'Sellante', color: 'bg-emerald-500 text-white' },
          { id: 'corona', label: 'Corona', color: 'bg-yellow-500 text-black' },
          { id: 'endodoncia', label: 'Endodoncia', color: 'bg-purple-500 text-white' }
        ].map(h => (
          <button
            key={h.id}
            onClick={() => setModoSeleccionado(h.id)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              modoSeleccionado === h.id ? `${h.color} ring-2 ring-black` : 'bg-white text-gray-700 border-gray-300'
            }`}
          >
            {h.label}
          </button>
        ))}

        <div className="h-4 w-px bg-gray-300 mx-2"></div>
        <button onClick={() => handleEstadoGeneral('implante')} className="px-3 py-1 rounded-lg text-xs font-semibold bg-white border border-gray-300 text-gray-800 hover:bg-gray-100 cursor-pointer">Implante</button>
        <button onClick={() => handleEstadoGeneral('ausente')} className="px-3 py-1 rounded-lg text-xs font-semibold bg-white border border-red-200 text-red-600 hover:bg-red-50 cursor-pointer">Ausente</button>
        <button onClick={() => handleEstadoGeneral('indicacion_exodoncia')} className="px-3 py-1 rounded-lg text-xs font-semibold bg-white border border-red-300 text-red-800 hover:bg-red-50 cursor-pointer">Indicación Exodoncia</button>
      </div>

      {/* Renderizado Gráfico Principal u Opción Split Comparativa */}
      <div className={`grid gap-6 ${modoComparativoSplit ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
        {/* Odontograma Principal */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 overflow-x-auto">
          {modoComparativoSplit && (
            <h3 className="font-bold text-xs text-gray-800 uppercase tracking-wider mb-4 text-center bg-white p-2 rounded-lg border">
              Odontograma Diagnóstico Actual
            </h3>
          )}

          <div className="mb-6">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 text-center">Arcada Superior</h3>
            <div className="flex justify-center gap-1 min-w-[500px]">
              {piezasSuperiores.map(num => (
                <DienteSVG key={num} numero={num} estadosPieza={odontograma[num]} modoSeleccionado={modoSeleccionado} alHacerClicCara={handleCaraClick} alSeleccionarPieza={setPiezaActiva} piezaActiva={piezaActiva} />
              ))}
            </div>
          </div>

          <div className="border-t border-gray-200 my-4"></div>

          <div>
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 text-center">Arcada Inferior</h3>
            <div className="flex justify-center gap-1 min-w-[500px]">
              {piezasInferiores.map(num => (
                <DienteSVG key={num} numero={num} estadosPieza={odontograma[num]} modoSeleccionado={modoSeleccionado} alHacerClicCara={handleCaraClick} alSeleccionarPieza={setPiezaActiva} piezaActiva={piezaActiva} />
              ))}
            </div>
          </div>
        </div>

        {/* Odontograma Comparativo en Split */}
        {modoComparativoSplit && odontogramaComparar && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 overflow-x-auto">
            <h3 className="font-bold text-xs text-emerald-900 uppercase tracking-wider mb-4 text-center bg-white p-2 rounded-lg border border-emerald-300">
              Odontograma Proyectado / Post-Tratamiento
            </h3>

            <div className="mb-6">
              <h3 className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-3 text-center">Arcada Superior</h3>
              <div className="flex justify-center gap-1 min-w-[500px]">
                {piezasSuperiores.map(num => (
                  <DienteSVG key={num} numero={num} estadosPieza={odontogramaComparar[num]} />
                ))}
              </div>
            </div>

            <div className="border-t border-emerald-200 my-4"></div>

            <div>
              <h3 className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-3 text-center">Arcada Inferior</h3>
              <div className="flex justify-center gap-1 min-w-[500px]">
                {piezasInferiores.map(num => (
                  <DienteSVG key={num} numero={num} estadosPieza={odontogramaComparar[num]} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Editor de Observaciones por Pieza */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mt-6 print:hidden">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-xs font-bold text-gray-800">Detalle y Observaciones — Pieza Dental {piezaActiva}</h4>
          <button onClick={handleLimpiarPieza} className="text-xs text-red-600 font-bold hover:underline cursor-pointer">🧹 Limpiar Pieza</button>
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
})

OdontogramaModulo.displayName = 'OdontogramaModulo'