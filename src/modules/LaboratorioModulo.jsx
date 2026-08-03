import React, { useState, useEffect } from 'react'

export const LaboratorioModulo = ({ pacientes = [] }) => {
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('Todos')
  const [mostrarModalNuevo, setMostrarModalNuevo] = useState(false)

  const [ordenesLab, setOrdenesLab] = useState(() => {
    const saved = localStorage.getItem('clinica_ordenes_laboratorio')
    if (saved) return JSON.parse(saved)
    return [
      { id: 1, pacienteNombre: 'Camila Silva Morales', pacienteRut: '18.452.123-K', laboratorio: 'Laboratorio Dental Estético', trabajo: 'Corona Zirconio Monolítico Pieza 1.6', colorVita: 'A2', fechaEnvio: '2026-07-28', fechaEntrega: '2026-08-05', costo: 45000, estado: 'Enviado al Lab' },
      { id: 2, pacienteNombre: 'Carlos Mendoza Vera', pacienteRut: '15.321.987-4', laboratorio: 'Lab Cerámico Bío-Bío', trabajo: 'Incrustación Disilicato de Litio Pieza 2.4', colorVita: 'A1', fechaEnvio: '2026-07-25', fechaEntrega: '2026-08-01', costo: 38000, estado: 'Recibido en Consulta' }
    ]
  })

  const [nuevaOrden, setNuevaOrden] = useState({
    pacienteNombre: '', pacienteRut: '', laboratorio: '', trabajo: '', colorVita: 'A2', fechaEnvio: new Date().toISOString().split('T')[0], fechaEntrega: '', costo: '', estado: 'Enviado al Lab'
  })

  useEffect(() => {
    localStorage.setItem('clinica_ordenes_laboratorio', JSON.stringify(ordenesLab))
  }, [ordenesLab])

  const handleCrearOrden = (e) => {
    e.preventDefault()
    if (!nuevaOrden.pacienteNombre || !nuevaOrden.trabajo) return

    const ordenObj = {
      id: Date.now(),
      ...nuevaOrden,
      costo: parseInt(nuevaOrden.costo) || 0
    }

    setOrdenesLab([ordenObj, ...ordenesLab])
    setMostrarModalNuevo(false)
    setNuevaOrden({ pacienteNombre: '', pacienteRut: '', laboratorio: '', trabajo: '', colorVita: 'A2', fechaEnvio: new Date().toISOString().split('T')[0], fechaEntrega: '', costo: '', estado: 'Enviado al Lab' })
  }

  const handleCambiarEstadoOrden = (id, nuevoEstado) => {
    const actualizadas = ordenesLab.map(o => o.id === id ? { ...o, estado: nuevoEstado } : o)
    setOrdenesLab(actualizadas)
  }

  const handleEliminarOrden = (id) => {
    if (window.confirm('¿Deseas eliminar este registro de trabajo de laboratorio?')) {
      setOrdenesLab(ordenesLab.filter(o => o.id !== id))
    }
  }

  const ordenesFiltradas = ordenesLab.filter(o => {
    const coincideTexto = o.pacienteNombre.toLowerCase().includes(busqueda.toLowerCase()) || o.trabajo.toLowerCase().includes(busqueda.toLowerCase()) || o.laboratorio.toLowerCase().includes(busqueda.toLowerCase())
    const coincideEstado = filtroEstado === 'Todos' || o.estado === filtroEstado
    return coincideTexto && coincideEstado
  })

  const ESTADOS_LAB = {
    'Enviado al Lab': 'bg-yellow-50 text-yellow-800 border-yellow-200',
    'En Prueba (Bizcocho)': 'bg-blue-50 text-blue-700 border-blue-200',
    'Recibido en Consulta': 'bg-green-50 text-green-700 border-green-200',
    'Instalado en Paciente': 'bg-gray-100 text-gray-800 border-gray-300'
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Trabajos de Laboratorio Dental</h2>
          <p className="text-xs text-gray-500">Gestión de coronas, prótesis, incrustaciones, fechas de entrega y costos.</p>
        </div>

        <button
          onClick={() => setMostrarModalNuevo(true)}
          className="bg-black text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-gray-800 transition-colors flex items-center gap-2 shadow-sm"
        >
          <span>🧪</span> Nueva Orden de Lab
        </button>
      </div>

      <div className="bg-gray-50 p-4 border border-gray-200 rounded-2xl mb-6 flex flex-wrap gap-4 items-center justify-between">
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="🔍 Buscar por paciente, trabajo o laboratorio..."
          className="px-4 py-2.5 rounded-xl border border-gray-300 text-xs w-full md:w-80 bg-white"
        />

        <div className="flex gap-2 overflow-x-auto pb-1">
          {['Todos', 'Enviado al Lab', 'En Prueba (Bizcocho)', 'Recibido en Consulta', 'Instalado en Paciente'].map(e => (
            <button
              key={e}
              onClick={() => setFiltroEstado(e)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all whitespace-nowrap ${
                filtroEstado === e ? 'bg-black text-white border-black' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider">
              <th className="p-4">Paciente</th>
              <th className="p-4">Trabajo Solicitado / Color</th>
              <th className="p-4">Laboratorio</th>
              <th className="p-4 text-center">Entrega Estimada</th>
              <th className="p-4 text-right">Costo Lab</th>
              <th className="p-4 text-center">Estado</th>
              <th className="p-4 text-right">Acción</th>
            </tr>
          </thead>
          <tbody>
            {ordenesFiltradas.map(o => (
              <tr key={o.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                <td className="p-4">
                  <span className="font-bold text-gray-900 block text-sm">{o.pacienteNombre}</span>
                  {o.pacienteRut && <span className="text-gray-500 text-[11px]">RUT: {o.pacienteRut}</span>}
                </td>
                <td className="p-4">
                  <span className="font-bold text-gray-800 block">{o.trabajo}</span>
                  {o.colorVita && <span className="text-gray-500 text-[10px]">Guía VITA: <strong>{o.colorVita}</strong></span>}
                </td>
                <td className="p-4 font-semibold text-gray-700">{o.laboratorio || 'N/I'}</td>
                <td className="p-4 text-center font-bold text-gray-900">
                  {o.fechaEntrega ? o.fechaEntrega.split('-').reverse().join('/') : 'Pendiente'}
                </td>
                <td className="p-4 text-right font-extrabold text-gray-900">
                  ${o.costo.toLocaleString('es-CL')} CLP
                </td>
                <td className="p-4 text-center">
                  <select
                    value={o.estado}
                    onChange={(e) => handleCambiarEstadoOrden(o.id, e.target.value)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg border cursor-pointer ${ESTADOS_LAB[o.estado] || 'bg-gray-100'}`}
                  >
                    <option value="Enviado al Lab">🟡 Enviado al Lab</option>
                    <option value="En Prueba (Bizcocho)">🔵 En Prueba (Bizcocho)</option>
                    <option value="Recibido en Consulta">🟢 Recibido en Consulta</option>
                    <option value="Instalado en Paciente">✅ Instalado en Paciente</option>
                  </select>
                </td>
                <td className="p-4 text-right">
                  <button onClick={() => handleEliminarOrden(o.id)} className="text-red-500 hover:text-red-700 font-bold text-xs bg-red-50 px-2.5 py-1 rounded-md">🗑️ Borrar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {ordenesFiltradas.length === 0 && (
          <p className="text-gray-400 text-center py-10 text-xs">No hay ordenes de laboratorio que coincidan con la búsqueda.</p>
        )}
      </div>

      {mostrarModalNuevo && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md border border-gray-200 shadow-xl">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900">Crear Orden de Laboratorio</h3>
              <button onClick={() => setMostrarModalNuevo(false)} className="text-gray-400 hover:text-black font-bold text-lg">✕</button>
            </div>

            <form onSubmit={handleCrearOrden} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-600 uppercase mb-1">Seleccionar Paciente</label>
                <select
                  onChange={(e) => {
                    const pac = pacientes.find(p => p.id === parseInt(e.target.value))
                    if (pac) setNuevaOrden({ ...nuevaOrden, pacienteNombre: pac.nombre, pacienteRut: pac.rut })
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white mb-2"
                >
                  <option value="">-- Seleccionar paciente --</option>
                  {pacientes.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre} ({p.rut})</option>
                  ))}
                </select>

                <label className="block font-semibold text-gray-600 uppercase mb-1">Nombre Paciente (O escribir nuevo)</label>
                <input
                  type="text"
                  required
                  value={nuevaOrden.pacienteNombre}
                  onChange={(e) => setNuevaOrden({ ...nuevaOrden, pacienteNombre: e.target.value })}
                  placeholder="Ej: Camila Silva Morales"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-600 uppercase mb-1">Trabajo / Estructura Solicitada *</label>
                <input
                  type="text"
                  required
                  value={nuevaOrden.trabajo}
                  onChange={(e) => setNuevaOrden({ ...nuevaOrden, trabajo: e.target.value })}
                  placeholder="Ej: Corona Zirconio Pieza 1.6 / Prótesis Removible"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-600 uppercase mb-1">Laboratorio Dental</label>
                  <input
                    type="text"
                    value={nuevaOrden.laboratorio}
                    onChange={(e) => setNuevaOrden({ ...nuevaOrden, laboratorio: e.target.value })}
                    placeholder="Ej: Lab Estético Bío-Bío"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-600 uppercase mb-1">Color / Guía VITA</label>
                  <input
                    type="text"
                    value={nuevaOrden.colorVita}
                    onChange={(e) => setNuevaOrden({ ...nuevaOrden, colorVita: e.target.value })}
                    placeholder="Ej: A2, A1, BL2"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-gray-600 uppercase mb-1">Fecha Envío</label>
                  <input
                    type="date"
                    value={nuevaOrden.fechaEnvio}
                    onChange={(e) => setNuevaOrden({ ...nuevaOrden, fechaEnvio: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-600 uppercase mb-1">Fecha Entrega</label>
                  <input
                    type="date"
                    value={nuevaOrden.fechaEntrega}
                    onChange={(e) => setNuevaOrden({ ...nuevaOrden, fechaEntrega: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-600 uppercase mb-1">Costo Lab ($)</label>
                  <input
                    type="number"
                    value={nuevaOrden.costo}
                    onChange={(e) => setNuevaOrden({ ...nuevaOrden, costo: e.target.value })}
                    placeholder="45000"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMostrarModalNuevo(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-gray-300 font-semibold text-gray-700 hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-black text-white py-2.5 rounded-xl font-semibold hover:bg-gray-800"
                >
                  Guardar Orden
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}