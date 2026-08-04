import React, { memo, useState } from 'react'

export const ReajusteMasivoModal = memo(({ alAplicarReajuste, alCerrar }) => {
  const [porcentaje, setPorcentaje] = useState('5')

  const handleSubmit = (e) => {
    e.preventDefault()
    const pct = parseFloat(porcentaje) || 0
    if (window.confirm(`¿Estás seguro de reajustar todo el arancel en un ${pct}%? Esta acción actualizará los precios particulares y de convenio.`)) {
      alAplicarReajuste(pct)
      alert(`✅ Arancel reajustado exitosamente en un ${pct}%.`)
      alCerrar()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 print:hidden">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm border border-gray-200 shadow-xl space-y-4 text-xs">
        <div className="flex justify-between items-center border-b pb-3">
          <h3 className="text-base font-bold text-gray-900">📈 Reajuste Masivo de Arancel</h3>
          <button onClick={alCerrar} className="text-gray-400 hover:text-black font-bold text-lg">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <p className="text-gray-600 text-[11px] leading-relaxed">
            Aplica un incremento o descuento porcentual global a todos los ítems del arancel de la clínica (Ej: IPC anual del 4.5%).
          </p>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Porcentaje de Reajuste (%)</label>
            <input
              type="number"
              step="0.1"
              required
              value={porcentaje}
              onChange={(e) => setPorcentaje(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-300 font-black text-sm text-center"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={alCerrar}
              className="w-1/2 py-2.5 rounded-xl border border-gray-300 font-bold text-gray-700 hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="w-1/2 bg-black text-white py-2.5 rounded-xl font-bold hover:bg-gray-800"
            >
              Aplicar Reajuste
            </button>
          </div>
        </form>
      </div>
    </div>
  )
})

ReajusteMasivoModal.displayName = 'ReajusteMasivoModal'