import React, { memo, useState } from 'react'

export const PaquetesClinicosManager = memo(({ paquetes, alGuardarPaquete, alEliminarPaquete }) => {
  const [packEditar, setPackEditar] = useState(null)
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [precioCombo, setPrecioCombo] = useState('')
  const [ahorroEstimado, setAhorroEstimado] = useState('15%')

  const handleAbrirEditar = (pk) => {
    setPackEditar(pk)
    // Limpiar el prefijo de emoji si existe para editar solo el texto
    setNombre(pk.nombre ? pk.nombre.replace(/^🎁\s*/, '') : '')
    setDescripcion(pk.descripcion || '')
    setPrecioCombo(pk.precioCombo || pk.precio || '')
    setAhorroEstimado(pk.ahorroEstimado || '15%')
  }

  const handleCancelarEdicion = () => {
    setPackEditar(null)
    setNombre('')
    setDescripcion('')
    setPrecioCombo('')
    setAhorroEstimado('15%')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!nombre.trim() || !precioCombo) return

    // 💡 Limpieza de separadores de miles para evitar que 50.000 se convierta en 50
    const precioLimpio = parseFloat(String(precioCombo).replace(/[^0-9]/g, '')) || 0

    alGuardarPaquete({
      id: packEditar ? packEditar.id : undefined,
      nombre: nombre.trim(),
      descripcion,
      precioCombo: precioLimpio,
      ahorroEstimado
    })

    handleCancelarEdicion()
    alert(packEditar ? '✅ Pack modificado exitosamente.' : '✅ Paquete o promoción clínica creada exitosamente.')
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-3">
        <div className="flex justify-between items-center border-b pb-2">
          <h3 className="font-bold text-sm text-gray-900 uppercase">
            {packEditar ? '✏️ Editar Pack / Promoción' : '➕ Crear Pack / Promoción'}
          </h3>
          {packEditar && (
            <button
              type="button"
              onClick={handleCancelarEdicion}
              className="text-gray-400 font-bold hover:text-black text-xs"
            >
              ✕ Cancelar
            </button>
          )}
        </div>

        <div>
          <label htmlFor="pack-nombre" className="block font-semibold text-gray-700 mb-1">Nombre del Pack *</label>
          <input
            id="pack-nombre"
            type="text"
            required
            placeholder="Ej: Pack Ortodoncia Completa..."
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-gray-300 font-bold"
          />
        </div>

        <div>
          <label htmlFor="pack-descripcion" className="block font-semibold text-gray-700 mb-1">Descripción de lo que Incluye</label>
          <textarea
            id="pack-descripcion"
            rows="2"
            placeholder="Ej: Incluye instalación de aparatos + primeros 3 controles..."
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-gray-300"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="pack-precio" className="block font-semibold text-gray-700 mb-1">Precio Combo ($)</label>
            <input
              id="pack-precio"
              type="text"
              required
              placeholder="Ej: 50000"
              value={precioCombo}
              onChange={(e) => setPrecioCombo(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-300 font-black text-emerald-900 bg-emerald-50/50"
            />
          </div>
          <div>
            <label htmlFor="pack-ahorro" className="block font-semibold text-gray-700 mb-1">% Ahorro</label>
            <input
              id="pack-ahorro"
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
          {packEditar ? 'Guardar Cambios del Pack' : 'Guardar Paquete Clínico'}
        </button>
      </form>

      <div className="md:col-span-2 space-y-4">
        <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider">
          🎁 Packs y Promociones Activas ({paquetes.length})
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {paquetes.map(pk => {
            const precioMostrar = parseFloat(pk.precioCombo ?? pk.precio) || 0

            return (
              <div key={pk.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex justify-between items-start border-b pb-2">
                    <h4 className="font-black text-sm text-gray-900">{pk.nombre}</h4>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleAbrirEditar(pk)}
                        className="text-gray-600 font-bold hover:text-black p-1 hover:bg-gray-100 rounded"
                        title="Editar Pack"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => alEliminarPaquete(pk.id)}
                        className="text-red-500 font-bold hover:text-red-700 p-1 hover:bg-red-50 rounded"
                        title="Eliminar Pack"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-600 mt-2 text-[11px] leading-relaxed">{pk.descripcion}</p>
                </div>

                <div className="flex justify-between items-center pt-3 border-t">
                  <span className="font-black text-emerald-900 text-sm">
                    ${precioMostrar.toLocaleString('es-CL')} CLP
                  </span>
                  <span className="bg-emerald-100 text-emerald-900 px-2.5 py-1 rounded-lg font-extrabold text-[10px]">
                    Ahorro {pk.ahorroEstimado}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
})

PaquetesClinicosManager.displayName = 'PaquetesClinicosManager'