import React, { memo, useState } from 'react'

export const PaquetesClinicosManager = memo(({ paquetes, alAgregarPaquete, alEliminarPaquete }) => {
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [precioCombo, setPrecioCombo] = useState('')
  const [ahorroEstimado, setAhorroEstimado] = useState('15%')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!nombre.trim() || !precioCombo) return

    alAgregarPaquete({
      nombre: nombre.trim(),
      descripcion,
      precioCombo: parseFloat(precioCombo) || 0,
      ahorroEstimado
    })

    setNombre('')
    setDescripcion('')
    setPrecioCombo('')
    alert('✅ Paquete o promoción clínica creada exitosamente.')
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-3">
        <h3 className="font-bold text-sm text-gray-900 uppercase border-b pb-2">➕ Crear Pack / Promoción</h3>

        <div>
          <label className="block font-semibold text-gray-700 mb-1">Nombre del Pack *</label>
          <input
            type="text"
            required
            placeholder="Ej: Pack Ortodoncia Completa..."
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-gray-300 font-bold"
          />
        </div>

        <div>
          <label className="block font-semibold text-gray-700 mb-1">Descripción de lo que Incluye</label>
          <textarea
            rows="2"
            placeholder="Ej: Incluye instalación de aparatos + primeros 3 controles..."
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-gray-300"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Precio Combo ($)</label>
            <input
              type="number"
              required
              placeholder="Ej: 250000"
              value={precioCombo}
              onChange={(e) => setPrecioCombo(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-300 font-black text-emerald-900 bg-emerald-50/50"
            />
          </div>
          <div>
            <label className="block font-semibold text-gray-700 mb-1">% Ahorro</label>
            <input
              type="text"
              placeholder="Ej: 15%"
              value={ahorroEstimado}
              onChange={(e) => setAhorroEstimado(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-300 font-bold"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-black text-white font-bold py-2.5 rounded-xl hover:bg-gray-800 transition-colors shadow-xs"
        >
          Guardar Paquete Clínico
        </button>
      </form>

      <div className="md:col-span-2 space-y-4">
        <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider">
          🎁 Packs y Promociones Activas ({paquetes.length})
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {paquetes.map(pk => (
            <div key={pk.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-3">
              <div>
                <div className="flex justify-between items-start border-b pb-2">
                  <h4 className="font-black text-sm text-gray-900">{pk.nombre}</h4>
                  <button onClick={() => alEliminarPaquete(pk.id)} className="text-red-500 font-bold hover:text-red-700">🗑️</button>
                </div>
                <p className="text-gray-600 mt-2 text-[11px] leading-relaxed">{pk.descripcion}</p>
              </div>

              <div className="flex justify-between items-center pt-3 border-t">
                <span className="font-black text-emerald-900 text-sm">${(parseFloat(pk.precioCombo) || 0).toLocaleString('es-CL')} CLP</span>
                <span className="bg-emerald-100 text-emerald-900 px-2.5 py-1 rounded-lg font-extrabold text-[10px]">Ahorro {pk.ahorroEstimado}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})

PaquetesClinicosManager.displayName = 'PaquetesClinicosManager'