import React, { memo } from 'react'
import { Baby, Columns3, Eraser } from 'lucide-react'
import { Icon } from '../../components/Icon'
import { Tooth } from '../../components/icons/Tooth'
import { Button } from '../../components/ui/Button'
import { DienteSVG } from '../../components/DienteSVG'
import {
  PERMANENTE_SUPERIOR,
  PERMANENTE_INFERIOR,
  TEMPORAL_SUPERIOR,
  TEMPORAL_INFERIOR,
  HERRAMIENTAS_ODONTOGRAMA
} from './constants/odontogramaConstants'
import { useOdontograma } from './hooks/useOdontograma'
import { CpodSummaryCard } from './components/CpodSummaryCard'

export const OdontogramaModulo = memo(({
  odontograma: odontogramaProp = {},
  odontogramaComparar = null,
  guardarOdontograma = () => {},
  esEvolucion = false
}) => {
  const {
    odontograma,
    tipoDenticion,
    setTipoDenticion,
    modoSeleccionado,
    setModoSeleccionado,
    piezaActiva,
    setPiezaActiva,
    modoComparativoSplit,
    setModoComparativoSplit,
    cpodStats,
    handleCaraClick,
    handleEstadoGeneral,
    handleLimpiarPieza,
    handleObservacionChange
  } = useOdontograma(odontogramaProp, guardarOdontograma)

  const piezasSuperiores = tipoDenticion === 'permanente' ? PERMANENTE_SUPERIOR : TEMPORAL_SUPERIOR
  const piezasInferiores = tipoDenticion === 'permanente' ? PERMANENTE_INFERIOR : TEMPORAL_INFERIOR

  return (
    <div className="space-y-6 w-full max-w-full">
      {/* Barra Superior de Control */}
      <div className="flex justify-between items-center mb-4 flex-wrap gap-3 print:hidden">
        <div className="flex gap-2">
          <Button
            type="button"
            onClick={() => setTipoDenticion('permanente')}
            variant={tipoDenticion === 'permanente' ? 'primary' : 'outline'}
            size="sm"
            className={tipoDenticion === 'permanente' ? 'font-extrabold' : 'font-extrabold'}
          >
            <span className="flex items-center gap-1.5"><Icon icon={Tooth} size="sm" />Permanente (11-48)</span>
          </Button>

          <Button
            type="button"
            onClick={() => setTipoDenticion('temporal')}
            variant={tipoDenticion === 'temporal' ? 'primary' : 'outline'}
            size="sm"
            className="font-extrabold"
          >
            <span className="flex items-center gap-1.5"><Icon icon={Baby} size="sm" />Temporal (51-85)</span>
          </Button>
        </div>

        {odontogramaComparar && (
          <Button
            type="button"
            onClick={() => setModoComparativoSplit(!modoComparativoSplit)}
            variant="outline"
            size="sm"
            className={modoComparativoSplit 
              ? 'bg-purple-700 text-white border-purple-800 hover:bg-purple-800 font-extrabold' 
              : 'bg-purple-50 text-purple-900 border-purple-300 hover:bg-purple-100 font-extrabold'}
          >
            <span className="flex items-center gap-1.5"><Icon icon={Columns3} size="sm" />{modoComparativoSplit ? 'Cerrar Vista Comparativa Split' : 'Ver Antes vs. Después (Split)'}</span>
          </Button>
        )}

        {esEvolucion && (
          <span className="bg-emerald-100 text-emerald-900 text-xs font-black px-3.5 py-1.5 rounded-xl border border-emerald-300 shadow-2xs">
            Modo Evolución (Tratamientos Realizados)
          </span>
        )}
      </div>

      {/* Tarjeta CPO-D */}
      <CpodSummaryCard cpodStats={cpodStats} />

      {/* Paleta de Herramientas */}
      <div className="bg-gray-50 dark:bg-graphite-800 p-4 rounded-2xl border border-gray-200 dark:border-graphite-700 flex flex-wrap gap-2.5 items-center text-xs print:hidden shadow-2xs">
        <span className="font-extrabold text-gray-600 dark:text-graphite-400 uppercase mr-2 text-[11px] tracking-wider">Herramienta:</span>
        {HERRAMIENTAS_ODONTOGRAMA.map(h => (
          <Button
            key={h.id}
            type="button"
            onClick={() => setModoSeleccionado(h.id)}
            variant="outline"
            size="sm"
            className={modoSeleccionado === h.id 
              ? `${h.color} ring-2 ring-black font-bold` 
              : 'bg-white dark:bg-graphite-800 text-gray-700 dark:text-graphite-300 border-gray-300 dark:border-graphite-600 hover:bg-gray-100 dark:hover:bg-graphite-700 font-bold'}
          >
            {h.label}
          </Button>
        ))}

        <div className="h-5 w-px bg-gray-300 mx-2"></div>
        <Button type="button" onClick={() => handleEstadoGeneral('implante')} variant="outline" size="sm" className="font-bold">Implante</Button>
        <Button type="button" onClick={() => handleEstadoGeneral('ausente')} variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50 font-bold">Ausente</Button>
        <Button type="button" onClick={() => handleEstadoGeneral('indicacion_exodoncia')} variant="outline" size="sm" className="border-red-300 text-red-800 hover:bg-red-50 font-bold">Exodoncia</Button>
      </div>

      {/* Grid de Odontograma Split con ancho contenedor independiente */}
      <div className="grid grid-cols-1 gap-6">
        
        {/* Panel 1: Odontograma Inicial */}
        <div className="bg-white dark:bg-graphite-800 border border-gray-200 dark:border-graphite-700 rounded-3xl p-5 shadow-xs">
          {modoComparativoSplit && (
            <h3 className="font-black text-xs text-gray-800 dark:text-graphite-100 uppercase tracking-wider mb-4 text-center bg-gray-100 dark:bg-graphite-800 p-2.5 rounded-xl border">
              Odontograma Diagnóstico Inicial (Antes)
            </h3>
          )}

          <div className="w-full overflow-x-auto pb-3">
            <div className="min-w-[850px] space-y-6 px-2">
              {/* Arcada Superior */}
              <div>
                <h3 className="text-[11px] font-extrabold text-gray-400 dark:text-graphite-500 uppercase tracking-widest mb-3 text-center">
                  Arcada Superior (Maxilar)
                </h3>
                <div className="flex justify-center items-center gap-1.5">
                  {piezasSuperiores.map(num => (
                    <div key={num} className="transform hover:scale-110 transition-transform">
                      <DienteSVG
                        numero={num}
                        estadosPieza={odontograma[num]}
                        modoSeleccionado={modoSeleccionado}
                        alHacerClicCara={handleCaraClick}
                        alSeleccionarPieza={setPiezaActiva}
                        piezaActiva={piezaActiva}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-graphite-700 my-3"></div>

              {/* Arcada Inferior */}
              <div>
                <h3 className="text-[11px] font-extrabold text-gray-400 dark:text-graphite-500 uppercase tracking-widest mb-3 text-center">
                  Arcada Inferior (Mandíbula)
                </h3>
                <div className="flex justify-center items-center gap-1.5">
                  {piezasInferiores.map(num => (
                    <div key={num} className="transform hover:scale-110 transition-transform">
                      <DienteSVG
                        numero={num}
                        estadosPieza={odontograma[num]}
                        modoSeleccionado={modoSeleccionado}
                        alHacerClicCara={handleCaraClick}
                        alSeleccionarPieza={setPiezaActiva}
                        piezaActiva={piezaActiva}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Panel 2: Odontograma Evolución (Split) */}
        {modoComparativoSplit && odontogramaComparar && (
          <div className="bg-emerald-50/40 border border-emerald-200 rounded-3xl p-5 shadow-xs">
            <h3 className="font-black text-xs text-emerald-900 uppercase tracking-wider mb-4 text-center bg-white dark:bg-graphite-800 p-2.5 rounded-xl border border-emerald-300">
              Odontograma Evolución (Tratamientos Realizados / Después)
            </h3>

            <div className="w-full overflow-x-auto pb-3">
              <div className="min-w-[850px] space-y-6 px-2">
                {/* Arcada Superior Comparativa */}
                <div>
                  <h3 className="text-[11px] font-extrabold text-emerald-700 uppercase tracking-widest mb-3 text-center">
                    Arcada Superior
                  </h3>
                  <div className="flex justify-center items-center gap-1.5">
                    {piezasSuperiores.map(num => (
                      <div key={num}>
                        <DienteSVG numero={num} estadosPieza={odontogramaComparar[num]} />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-emerald-200 my-3"></div>

                {/* Arcada Inferior Comparativa */}
                <div>
                  <h3 className="text-[11px] font-extrabold text-emerald-700 uppercase tracking-widest mb-3 text-center">
                    Arcada Inferior
                  </h3>
                  <div className="flex justify-center items-center gap-1.5">
                    {piezasInferiores.map(num => (
                      <div key={num}>
                        <DienteSVG numero={num} estadosPieza={odontogramaComparar[num]} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Observaciones por Pieza */}
      <div className="bg-white dark:bg-graphite-800 border border-gray-200 dark:border-graphite-700 rounded-2xl p-5 shadow-2xs print:hidden">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-xs font-extrabold text-gray-900 dark:text-graphite-50">Observación Clínica — Pieza Dental {piezaActiva}</h4>
          <Button type="button" onClick={handleLimpiarPieza} variant="ghost" size="sm" className="text-red-600 font-bold"><span className="flex items-center gap-1.5"><Icon icon={Eraser} size="sm" />Limpiar Pieza</span></Button>
        </div>
        <textarea
          rows="2"
          value={odontograma[piezaActiva]?.observacion || ''}
          onChange={(e) => handleObservacionChange(e.target.value)}
          placeholder="Añadir hallazgos u observaciones específicas para esta pieza dental..."
          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-graphite-600 text-xs focus:outline-none focus:border-black font-medium"
        />
      </div>
    </div>
  )
})

OdontogramaModulo.displayName = 'OdontogramaModulo'