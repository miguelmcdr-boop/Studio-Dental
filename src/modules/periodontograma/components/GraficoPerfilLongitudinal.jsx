import React, { memo } from 'react'

export const GraficoPerfilLongitudinal = memo(({ periodontoData = {} }) => {
  const PIEZAS_SUPERIORES = ['1.8', '1.7', '1.6', '1.5', '1.4', '1.3', '1.2', '1.1', '2.1', '2.2', '2.3', '2.4', '2.5', '2.6', '2.7', '2.8']
  const PIEZAS_INFERIORES = ['4.8', '4.7', '4.6', '4.5', '4.4', '4.3', '4.2', '4.1', '3.1', '3.2', '3.3', '3.4', '3.5', '3.6', '3.7', '3.8']

  const generarPuntosSVG = (piezas) => {
    return piezas.map((num, i) => {
      const pData = periodontoData[num]
      if (pData?.ausente) return { x: i * 40 + 20, y: 10, ausente: true, num, maxVal: 0 }

      const sVest = pData?.vestibular?.sondaje || [0, 0, 0]
      const maxVal = Math.max(...sVest.map(v => parseInt(v, 10) || 0))
      const yVal = 10 + (maxVal * 6)
      return { x: i * 40 + 20, y: Math.min(yVal, 80), maxVal, num }
    })
  }

  const renderSvgArcada = (piezas, titulo) => {
    const puntos = generarPuntosSVG(piezas)
    const pathD = puntos.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '')

    return (
      <div className="space-y-1">
        <span className="text-[10px] font-extrabold text-gray-500 uppercase block text-center">{titulo}</span>
        <div className="overflow-x-auto py-1">
          <svg width="680" height="100" className="mx-auto">
            <line x1="0" y1="28" x2="680" y2="28" stroke="#E5E7EB" strokeDasharray="3 3" />
            <text x="5" y="26" fill="#9CA3AF" fontSize="8" fontWeight="bold">3mm</text>

            <line x1="0" y1="46" x2="680" y2="46" stroke="#FECACA" strokeDasharray="3 3" />
            <text x="5" y="44" fill="#EF4444" fontSize="8" fontWeight="bold">6mm</text>

            <path d={pathD} fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

            {puntos.map((p, i) => (
              <g key={i}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="4"
                  fill={p.maxVal >= 4 ? '#EF4444' : '#2563EB'}
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                />
                <text x={p.x} y="95" textAnchor="middle" fill="#374151" fontSize="9" fontWeight="bold">
                  {p.num}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-6 text-xs print:hidden">
      <div className="flex justify-between items-center border-b pb-2">
        <h4 className="font-extrabold text-gray-900 uppercase tracking-wider text-[11px] flex items-center gap-2">
          <span>📈</span> Perfil Longitudinal de Sondaje Periodontal (Arcada Superior e Inferior)
        </h4>
        <div className="flex items-center gap-3 text-[10px] font-bold">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Normal (≤ 3 mm)</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Saco (≥ 4 mm)</span>
        </div>
      </div>

      {renderSvgArcada(PIEZAS_SUPERIORES, 'Arcada Superior (Maxilar)')}
      <div className="border-t border-gray-200 my-2"></div>
      {renderSvgArcada(PIEZAS_INFERIORES, 'Arcada Inferior (Mandíbula)')}
    </div>
  )
})

GraficoPerfilLongitudinal.displayName = 'GraficoPerfilLongitudinal'