import React, { memo, useState } from 'react'
import { CATEGORIAS_INGRESO, CATEGORIAS_EGRESO } from '../constants/finanzasConstants'

export const ModalNuevoMovimiento = memo(({ alGuardar, alCerrar }) => {
  const [tipo, setTipo] = useState('ingreso')
  const [monto, setMonto] = useState('')
  const [categoria, setCategoria] = useState(CATEGORIAS_INGRESO[0])
  const [metodoPago, setMetodoPago] = useState('Efectivo')
  const [detalle, setDetalle] = useState('')

  const handleTipoChange = (nuevoTipo) => {
    setTipo(nuevoTipo)
    setCategoria(nuevoTipo === 'ingreso' ? CATEGORIAS_INGRESO[0] : CATEGORIAS_EGRESO[0])
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!monto || parseInt(monto) <= 0) return

    const nuevoMov = {
      id: Date.now(),
      fecha: new Date().toLocaleDateString('es-CL'),
      tipo,
      monto: parseInt(monto),
      categoria,
      metodoPago,
      detalle
    }

    alGuardar(nuevoMov)
    alCerrar()
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 print:hidden">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md border border-gray-200 shadow-xl space-y-4 text-xs">
        <div className="flex justify-between items-center border-b pb-3">
          <h3 className="text-base font-bold text-gray-900">Registrar Movimiento de Caja</h3>
          <button onClick={alCerrar} className="text-gray-400 hover:text-black font-bold text-lg">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleTipoChange('ingreso')}
              className={`py-2 rounded-xl font-bold transition-all ${
                tipo === 'ingreso' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-gray-100 text-gray-600'
              }`}
            >
              🟢 Ingreso
            </button>
            <button
              type="button"
              onClick={() => handleTipoChange('egreso')}
              className={`py-2 rounded-xl font-bold transition-all ${
                tipo === 'egreso' ? 'bg-red-600 text-white shadow-xs' : 'bg-gray-100 text-gray-600'
              }`}
            >
              🔴 Egreso / Gasto
            </button>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Monto ($ CLP)</label>
            <input
              type="number"
              required
              placeholder="Ej: 45000"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-300 font-bold text-sm"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Categoría</label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-300 bg-white font-semibold"
            >
              {(tipo === 'ingreso' ? CATEGORIAS_INGRESO : CATEGORIAS_EGRESO).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Método de Pago</label>
            <select
              value={metodoPago}
              onChange={(e) => setMetodoPago(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-300 bg-white"
            >
              <option value="Efectivo">Efectivo</option>
              <option value="Transferencia">Transferencia Bancaria</option>
              <option value="Débito">Tarjeta de Débito</option>
              <option value="Crédito">Tarjeta de Crédito</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Detalle / Observación</label>
            <input
              type="text"
              placeholder="Ej: Compra de cajas de guantes y anestesia..."
              value={detalle}
              onChange={(e) => setDetalle(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-300"
            />
          </div>

          <div className="flex gap-2 pt-3">
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
              Guardar Registro
            </button>
          </div>
        </form>
      </div>
    </div>
  )
})

ModalNuevoMovimiento.displayName = 'ModalNuevoMovimiento'