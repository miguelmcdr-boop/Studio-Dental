import React, { useState, memo } from 'react'
import { PORCENTAJES_LIQUIDACION } from '../constants/finanzasConstants'
import { calcularLiquidacionEspecialista } from '../utils/finanzasCalculations'

export const LiquidacionHonorarios = memo(({ liquidaciones, onGuardarLiquidacion, onEliminarLiquidacion }) => {
  const [profesional, setProfesional] = useState('')
  const [especialidad, setEspecialidad] = useState('Endodoncia')
  const [totalRecaudado, setTotalRecaudado] = useState('')
  const [costoInsumos, setCostoInsumos] = useState('')
  const [porcentajeProf, setPorcentajeProf] = useState(50)

  const resultado = calcularLiquidacionEspecialista(totalRecaudado, porcentajeProf, costoInsumos)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!profesional || !totalRecaudado) return
    onGuardarLiquidacion({
      profesional,
      especialidad,
      ...resultado
    })
    setProfesional('')
    setTotalRecaudado('')
    setCostoInsumos('')
  }

  return (
    <div className="space-y-6 text-xs">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
        <h3 className="font-bold text-sm text-gray-900 border-b pb-2 uppercase tracking-wider">
          📊 Calculadora y Liquidación de Honorarios Profesionales
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-gray-600 font-bold mb-1 uppercase">Nombre del Especialista *</label>
              <input
                type="text"
                required
                value={profesional}
                onChange={(e) => setProfesional(e.target.value)}
                placeholder="Ej: Dr. Alexis Vega"
                className="w-full px-3 py-2 border rounded-xl bg-white font-bold"
              />
            </div>

            <div>
              <label className="block text-gray-600 font-bold mb-1 uppercase">Especialidad</label>
              <input
                type="text"
                value={especialidad}
                onChange={(e) => setEspecialidad(e.target.value)}
                placeholder="Ej: Endodoncia / Implantología"
                className="w-full px-3 py-2 border rounded-xl bg-white"
              />
            </div>

            <div>
              <label className="block text-gray-600 font-bold mb-1 uppercase">Esquema de Comisión</label>
              <select
                value={porcentajeProf}
                onChange={(e) => setPorcentajeProf(parseFloat(e.target.value))}
                className="w-full px-3 py-2 border rounded-xl bg-white font-bold"
              >
                {PORCENTAJES_LIQUIDACION.map(p => (
                  <option key={p.valor} value={p.valor}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-600 font-bold mb-1 uppercase">Monto Total Tratamientos Realizados ($ CLP) *</label>
              <input
                type="number"
                required
                value={totalRecaudado}
                onChange={(e) => setTotalRecaudado(e.target.value)}
                placeholder="Ej: 1500000"
                className="w-full px-3 py-2 border rounded-xl bg-white font-bold text-sm"
              />
            </div>

            <div>
              <label className="block text-gray-600 font-bold mb-1 uppercase">Deducción Insumos / Laboratorio ($ CLP)</label>
              <input
                type="number"
                value={costoInsumos}
                onChange={(e) => setCostoInsumos(e.target.value)}
                placeholder="Ej: 200000"
                className="w-full px-3 py-2 border rounded-xl bg-white"
              />
            </div>
          </div>

          {/* Resumen del Cálculo en Tiempo Real */}
          <div className="p-4 bg-gray-50 border rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="bg-white p-3 border rounded-xl">
              <span className="text-[10px] text-gray-400 font-bold uppercase block">Base Liquidable</span>
              <span className="text-base font-extrabold text-gray-800">${resultado.baseLiquidable.toLocaleString('es-CL')} CLP</span>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
              <span className="text-[10px] text-emerald-700 font-bold uppercase block">Pago Especialista ({resultado.pctEspecialista}%)</span>
              <span className="text-lg font-black text-emerald-900">${resultado.pagoEspecialista.toLocaleString('es-CL')} CLP</span>
            </div>
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl">
              <span className="text-[10px] text-blue-700 font-bold uppercase block">Margen Neto Clínica ({resultado.pctClinica}%)</span>
              <span className="text-lg font-black text-blue-900">${resultado.margenClinica.toLocaleString('es-CL')} CLP</span>
            </div>
          </div>

          <button type="submit" className="bg-black text-white font-bold px-4 py-2.5 rounded-xl hover:bg-gray-800 cursor-pointer">
            + Procesar y CERRAR Liquidación
          </button>
        </form>
      </div>

      {/* Historial de Liquidaciones Creadas */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-3">
        <h4 className="font-bold text-sm text-gray-900 border-b pb-2">Historial de Liquidaciones Registradas</h4>

        {liquidaciones.map(liq => (
          <div key={liq.id} className="p-4 bg-gray-50 border rounded-xl flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-gray-900 text-sm">{liq.profesional}</span>
                <span className="bg-gray-200 text-gray-800 text-[10px] font-bold px-2 py-0.5 rounded">{liq.especialidad}</span>
                <span className="text-[10px] text-gray-400">{liq.fecha}</span>
              </div>
              <p className="text-gray-600 mt-1">
                Recaudación: <strong>${liq.totalRealizado.toLocaleString('es-CL')}</strong> | Deducciones: <strong>${liq.costoMateriales.toLocaleString('es-CL')}</strong> | Honorario ({liq.pctEspecialista}%): <strong className="text-emerald-700">${liq.pagoEspecialista.toLocaleString('es-CL')}</strong> | Ganancia Clínica: <strong className="text-blue-700">${liq.margenClinica.toLocaleString('es-CL')}</strong>
              </p>
            </div>

            <button onClick={() => onEliminarLiquidacion(liq.id)} className="text-red-500 hover:text-red-700 font-bold bg-red-50 px-2 py-1 rounded">
              🗑️ Borrar
            </button>
          </div>
        ))}

        {liquidaciones.length === 0 && <p className="text-gray-400 text-center py-6">No se registran liquidaciones de honorarios cerradas.</p>}
      </div>
    </div>
  )
})

LiquidacionHonorarios.displayName = 'LiquidacionHonorarios'