import React, { memo } from 'react'
import { GUIA_TONOS_VITA, FORMAS_DENTARIAS } from '../constants/dsdConstants'

export const SimuladorCarillas = memo(({ dsdData, ratioAnchoAlto, esProporcionIdeal, visibilidadDorada, onActualizar }) => {
  const tonoObjeto = GUIA_TONOS_VITA.find(t => t.id === dsdData.tonoDeseado) || GUIA_TONOS_VITA[1]

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-6 text-xs">
      <div className="border-b pb-2 flex justify-between items-center flex-wrap gap-2">
        <div>
          <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider">
            📐 Planificación Digital de Sonrisa (DSD)
          </h3>
          <p className="text-gray-500 text-[11px]">Mediciones microestéticas e inspección de relación Ancho/Alto (Objetivo: 75% - 85%).</p>
        </div>

        <div className={`px-4 py-2 rounded-xl border text-center ${
          esProporcionIdeal ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-amber-50 border-amber-300 text-amber-900'
        }`}>
          <span className="text-[10px] font-bold uppercase block">Proporción Ancho/Alto</span>
          <span className="text-xl font-black">{(ratioAnchoAlto * 100).toFixed(0)}%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-gray-600 font-bold mb-1 uppercase">Ancho Central Superior (mm)</label>
          <input
            type="number"
            step="0.1"
            value={dsdData.anchoCentral || 8.5}
            onChange={(e) => onActualizar('anchoCentral', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border rounded-xl font-bold bg-white"
          />
        </div>

        <div>
          <label className="block text-gray-600 font-bold mb-1 uppercase">Alto Central Superior (mm)</label>
          <input
            type="number"
            step="0.1"
            value={dsdData.altoCentral || 10.5}
            onChange={(e) => onActualizar('altoCentral', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border rounded-xl font-bold bg-white"
          />
        </div>

        <div>
          <label className="block text-gray-600 font-bold mb-1 uppercase">Línea de la Sonrisa</label>
          <select
            value={dsdData.lineaSonrisa}
            onChange={(e) => onActualizar('lineaSonrisa', e.target.value)}
            className="w-full px-3 py-2 border rounded-xl bg-white font-bold"
          >
            <option value="Baja">Baja (Muestra menos del 75% de dientes)</option>
            <option value="Media (Muestra 100% de corona clínica)">Media (Muestra 100% de corona clínica)</option>
            <option value="Alta (Gingival > 2mm)">Alta (Sonrisa Gingival &gt; 2mm)</option>
          </select>
        </div>
      </div>

      {/* Matriz Visual de Proporción Dorada (1.618) */}
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
        <h4 className="font-bold text-gray-800 text-[11px] uppercase tracking-wider">
          ✨ Visibilidad Frontal Teórica (Proporción Dorada 1.618 : 1.0 : 0.618)
        </h4>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-2 bg-white rounded-lg border">
            <span className="text-[10px] text-gray-400 font-bold block">Incisivo Central (1.618)</span>
            <span className="font-black text-gray-900 text-sm">{visibilidadDorada.centralVisible} mm</span>
          </div>
          <div className="p-2 bg-white rounded-lg border">
            <span className="text-[10px] text-gray-400 font-bold block">Lateral Aparente (1.0)</span>
            <span className="font-black text-gray-900 text-sm">{visibilidadDorada.lateralEstimado} mm</span>
          </div>
          <div className="p-2 bg-white rounded-lg border">
            <span className="text-[10px] text-gray-400 font-bold block">Canino Aparente (0.618)</span>
            <span className="font-black text-gray-900 text-sm">{visibilidadDorada.caninoEstimado} mm</span>
          </div>
        </div>
      </div>

      {/* Selección de Guía de Color Vita & Morfología */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
        <div>
          <label className="block text-gray-600 font-bold mb-2 uppercase">Selección de Tono Objetivo (Guía Vita / Bleach)</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {GUIA_TONOS_VITA.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => onActualizar('tonoDeseado', t.id)}
                className={`p-2 rounded-xl border text-left flex items-center justify-between cursor-pointer transition-all ${
                  dsdData.tonoDeseado === t.id ? 'border-2 border-black font-bold shadow-xs' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <span className="text-[10px]">{t.id}</span>
                <span
                  className="w-4 h-4 rounded-full border border-gray-300 inline-block"
                  style={{ backgroundColor: t.hex }}
                ></span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-gray-600 font-bold mb-2 uppercase">Morfología Dentaria Deseada</label>
          <div className="space-y-2">
            {FORMAS_DENTARIAS.map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => onActualizar('formaDeseada', f.id)}
                className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  dsdData.formaDeseada === f.id ? 'bg-black text-white font-bold' : 'bg-gray-50 text-gray-800 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <span className="block text-xs">{f.nombre}</span>
                <span className={`text-[10px] block mt-0.5 ${dsdData.formaDeseada === f.id ? 'text-gray-300' : 'text-gray-500'}`}>{f.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
})

SimuladorCarillas.displayName = 'SimuladorCarillas'