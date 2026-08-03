import React, { useState } from 'react'

export const PrestacionesModulo = ({ prestaciones = [], setPrestaciones }) => {
  const [busqueda, setBusqueda] = useState('')
  const [filtroEspecialidad, setFiltroEspecialidad] = useState('Todas')
  const [mostrarModalNueva, setMostrarModalNueva] = useState(false)
  const [prestacionEditando, setPrestacionEditando] = useState(null)

  const [nuevaPrestacion, setNuevaPrestacion] = useState({
    nombre: '', especialidad: 'Operatoria', precio: '', descripcion: ''
  })

  const especialidades = ['Todas', 'Diagnóstico/Prevención', 'Operatoria', 'Endodoncia', 'Periodoncia', 'Cirugía', 'Rehabilitación/Prótesis', 'Implantología']

  const handleCrearPrestacion = (e) => {
    e.preventDefault()
    if (!nuevaPrestacion.nombre || !nuevaPrestacion.precio) return

    if (prestacionEditando) {
      const actualizadas = prestaciones.map(p => p.id === prestacionEditando.id ? {
        ...prestacionEditando,
        nombre: nuevaPrestacion.nombre,
        especialidad: nuevaPrestacion.especialidad,
        precio: parseInt(nuevaPrestacion.precio),
        descripcion: nuevaPrestacion.descripcion
      } : p)
      setPrestaciones(actualizadas)
      setPrestacionEditando(null)
    } else {
      const nueva = {
        id: Date.now(),
        nombre: nuevaPrestacion.nombre,
        especialidad: nuevaPrestacion.especialidad,
        precio: parseInt(nuevaPrestacion.precio),
        descripcion: nuevaPrestacion.descripcion
      }
      setPrestaciones([...prestaciones, nueva])
    }

    setNuevaPrestacion({ nombre: '', especialidad: 'Operatoria', precio: '', descripcion: '' })
    setMostrarModalNueva(false)
  }

  const handleAbrirEditar = (prestacion) => {
    setPrestacionEditando(prestacion)
    setNuevaPrestacion({
      nombre: prestacion.nombre,
      especialidad: prestacion.especialidad,
      precio: prestacion.precio,
      descripcion: prestacion.descripcion || ''
    })
    setMostrarModalNueva(true)
  }

  const handleEliminarPrestacion = (id) => {
    if (window.confirm('¿Deseas eliminar esta prestación de tu arancel?')) {
      setPrestaciones(prestaciones.filter(p => p.id !== id))
    }
  }

  const prestacionesFiltradas = prestaciones.filter(p => {
    const coincideTexto = p.nombre.toLowerCase().includes(busqueda.toLowerCase())
    const coincideEspecialidad = filtroEspecialidad === 'Todas' || p.especialidad === filtroEspecialidad
    return coincideTexto && coincideEspecialidad
  })

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Arancel de Prestaciones Dentales</h2>
          <p className="text-xs text-gray-500">Configura tus procedimientos y precios base para presupuestos.</p>
        </div>

        <button
          onClick={() => { setPrestacionEditando(null); setNuevaPrestacion({ nombre: '', especialidad: 'Operatoria', precio: '', descripcion: '' }); setMostrarModalNueva(true); }}
          className="bg-black text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-gray-800 transition-colors flex items-center gap-2 shadow-sm"
        >
          <span>➕</span> Nueva Prestación
        </button>
      </div>

      <div className="bg-gray-50 p-4 border border-gray-200 rounded-2xl mb-6 flex flex-wrap gap-4 items-center justify-between">
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="🔍 Buscar prestación por nombre..."
          className="px-4 py-2.5 rounded-xl border border-gray-300 text-xs w-full md:w-80 bg-white"
        />

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-bold text-gray-500 uppercase mr-1">Especialidad:</span>
          {especialidades.map(esp => (
            <button
              key={esp}
              onClick={() => setFiltroEspecialidad(esp)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all whitespace-nowrap ${
                filtroEspecialidad === esp ? 'bg-black text-white border-black' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {esp}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider">
              <th className="p-4">Procedimiento / Tratamiento</th>
              <th className="p-4">Especialidad</th>
              <th className="p-4 text-right">Precio Base ($ CLP)</th>
              <th className="p-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {prestacionesFiltradas.map(p => (
              <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                <td className="p-4">
                  <span className="font-bold text-gray-900 block text-sm">{p.nombre}</span>
                  {p.descripcion && <span className="text-gray-500 text-[11px]">{p.descripcion}</span>}
                </td>
                <td className="p-4">
                  <span className="bg-gray-100 border border-gray-200 text-gray-800 font-semibold px-2.5 py-1 rounded-md text-[11px]">
                    {p.especialidad}
                  </span>
                </td>
                <td className="p-4 text-right font-extrabold text-gray-900 text-sm">
                  ${p.precio.toLocaleString('es-CL')} CLP
                </td>
                <td className="p-4 text-right space-x-2">
                  <button onClick={() => handleAbrirEditar(p)} className="text-gray-600 hover:text-black font-semibold text-xs bg-gray-100 px-2.5 py-1 rounded-md">✏️ Editar</button>
                  <button onClick={() => handleEliminarPrestacion(p.id)} className="text-red-500 hover:text-red-700 font-semibold text-xs bg-red-50 px-2.5 py-1 rounded-md">🗑️ Borrar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {prestacionesFiltradas.length === 0 && (
          <p className="text-gray-400 text-center py-10 text-xs">No se encontraron prestaciones asociadas a la búsqueda.</p>
        )}
      </div>

      {mostrarModalNueva && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md border border-gray-200 shadow-xl">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900">{prestacionEditando ? 'Editar Prestación' : 'Añadir Prestación al Arancel'}</h3>
              <button onClick={() => setMostrarModalNueva(false)} className="text-gray-400 hover:text-black font-bold text-lg">✕</button>
            </div>

            <form onSubmit={handleCrearPrestacion} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-600 uppercase mb-1">Nombre del Procedimiento *</label>
                <input
                  type="text"
                  required
                  value={nuevaPrestacion.nombre}
                  onChange={(e) => setNuevaPrestacion({ ...nuevaPrestacion, nombre: e.target.value })}
                  placeholder="Ej: Incrustación Estética Cerámica"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-600 uppercase mb-1">Especialidad</label>
                  <select
                    value={nuevaPrestacion.especialidad}
                    onChange={(e) => setNuevaPrestacion({ ...nuevaPrestacion, especialidad: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white"
                  >
                    {especialidades.filter(e => e !== 'Todas').map(e => (
                      <option key={e} value={e}>{e}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-600 uppercase mb-1">Precio Base ($ CLP) *</label>
                  <input
                    type="number"
                    required
                    value={nuevaPrestacion.precio}
                    onChange={(e) => setNuevaPrestacion({ ...nuevaPrestacion, precio: e.target.value })}
                    placeholder="80000"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-600 uppercase mb-1">Descripción / Notas Adicionales</label>
                <textarea
                  rows="2"
                  value={nuevaPrestacion.descripcion}
                  onChange={(e) => setNuevaPrestacion({ ...nuevaPrestacion, descripcion: e.target.value })}
                  placeholder="Ej: Incluye técnica adhesiva y pulido final..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMostrarModalNueva(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-gray-300 font-semibold text-gray-700 hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-black text-white py-2.5 rounded-xl font-semibold hover:bg-gray-800"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}