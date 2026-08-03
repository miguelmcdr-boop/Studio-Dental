import React, { useState, useEffect } from 'react'

export const InventarioModulo = () => {
  const [busqueda, setBusqueda] = useState('')
  const [filtroCategoria, setFiltroEstado] = useState('Todas')
  const [mostrarModalNuevo, setMostrarModalNuevo] = useState(false)
  const [insumoEditando, setInsumoEditando] = useState(null)

  const [insumos, setInsumos] = useState(() => {
    const saved = localStorage.getItem('clinica_inventario_insumos')
    if (saved) return JSON.parse(saved)
    return [
      { id: 1, nombre: 'Anestesia Mepivacaína 3% (Caja 50 tubos)', categoria: 'Anestesia y Agujas', cantidad: 3, stockMinimo: 2, precioCompra: 32000, vencimiento: '2027-08-15' },
      { id: 2, nombre: 'Agujas Cortas 30G para Carpuled (Caja 100)', categoria: 'Anestesia y Agujas', cantidad: 1, stockMinimo: 2, precioCompra: 12000, vencimiento: '2028-01-10' },
      { id: 3, nombre: 'Resina Composite Z350 Filtek 3M (A2)', categoria: 'Operatoria y Adhesión', cantidad: 5, stockMinimo: 3, precioCompra: 45000, vencimiento: '2027-11-20' },
      { id: 4, nombre: 'Adhesivo Monocomponente Single Bond 3M', categoria: 'Operatoria y Adhesión', cantidad: 2, stockMinimo: 2, precioCompra: 38000, vencimiento: '2027-05-18' },
      { id: 5, nombre: 'Guantes de Nitrilo Talla M (Caja 100 un)', categoria: 'Bioseguridad y Desinfección', cantidad: 8, stockMinimo: 4, precioCompra: 6500, vencimiento: '2029-03-30' }
    ]
  })

  const [nuevoInsumo, setNuevoInsumo] = useState({
    nombre: '', categoria: 'Anestesia y Agujas', cantidad: '', stockMinimo: '', precioCompra: '', vencimiento: ''
  })

  useEffect(() => {
    localStorage.setItem('clinica_inventario_insumos', JSON.stringify(insumos))
  }, [insumos])

  const categorias = ['Todas', 'Anestesia y Agujas', 'Operatoria y Adhesión', 'Endodoncia', 'Cirugía y Suturas', 'Bioseguridad y Desinfección', 'Impresión y Modelos', 'Periodoncia y Preventiva']

  const handleCrearInsumo = (e) => {
    e.preventDefault()
    if (!nuevoInsumo.nombre || !nuevoInsumo.cantidad) return

    if (insumoEditando) {
      const actualizados = insumos.map(i => i.id === insumoEditando.id ? {
        ...insumoEditando,
        nombre: nuevoInsumo.nombre,
        categoria: nuevoInsumo.categoria,
        cantidad: parseInt(nuevoInsumo.cantidad),
        stockMinimo: parseInt(nuevoInsumo.stockMinimo) || 2,
        precioCompra: parseInt(nuevoInsumo.precioCompra) || 0,
        vencimiento: nuevoInsumo.vencimiento
      } : i)
      setInsumos(actualizados)
      setInsumoEditando(null)
    } else {
      const nuevo = {
        id: Date.now(),
        nombre: nuevoInsumo.nombre,
        categoria: nuevoInsumo.categoria,
        cantidad: parseInt(nuevoInsumo.cantidad),
        stockMinimo: parseInt(nuevoInsumo.stockMinimo) || 2,
        precioCompra: parseInt(nuevoInsumo.precioCompra) || 0,
        vencimiento: nuevoInsumo.vencimiento
      }
      setInsumos([...insumos, nuevo])
    }

    setNuevoInsumo({ nombre: '', categoria: 'Anestesia y Agujas', cantidad: '', stockMinimo: '', precioCompra: '', vencimiento: '' })
    setMostrarModalNuevo(false)
  }

  const handleModificarCantidad = (id, delta) => {
    const actualizados = insumos.map(i => {
      if (i.id === id) {
        const nuevaCant = Math.max(0, i.cantidad + delta)
        return { ...i, cantidad: nuevaCant }
      }
      return i
    })
    setInsumos(actualizados)
  }

  const handleAbrirEditar = (insumo) => {
    setInsumoEditando(insumo)
    setNuevoInsumo({
      nombre: insumo.nombre,
      categoria: insumo.categoria,
      cantidad: insumo.cantidad,
      stockMinimo: insumo.stockMinimo,
      precioCompra: insumo.precioCompra,
      vencimiento: insumo.vencimiento || ''
    })
    setMostrarModalNuevo(true)
  }

  const handleEliminarInsumo = (id) => {
    if (window.confirm('¿Deseas eliminar este insumo del inventario?')) {
      setInsumos(insumos.filter(i => i.id !== id))
    }
  }

  const insumosFiltrados = insumos.filter(i => {
    const coincideTexto = i.nombre.toLowerCase().includes(busqueda.toLowerCase())
    const coincideCategoria = filtroCategoria === 'Todas' || i.categoria === filtroCategoria
    return coincideTexto && coincideCategoria
  })

  const insumosCriticos = insumos.filter(i => i.cantidad <= i.stockMinimo)
  const valorTotalInventario = insumos.reduce((acc, curr) => acc + (curr.cantidad * curr.precioCompra), 0)

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Inventario y Stock Odontológico</h2>
          <p className="text-xs text-gray-500">Control de insumos clínicos, reposición de productos y vencimientos.</p>
        </div>

        <button
          onClick={() => { setInsumoEditando(null); setNuevoInsumo({ nombre: '', categoria: 'Anestesia y Agujas', cantidad: '', stockMinimo: '', precioCompra: '', vencimiento: '' }); setMostrarModalNuevo(true); }}
          className="bg-black text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-gray-800 transition-colors flex items-center gap-2 shadow-sm"
        >
          <span>➕</span> Nuevo Insumo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-xs">
          <span className="text-xs font-bold text-gray-500 uppercase block mb-1">Insumos Registrados</span>
          <span className="text-2xl font-extrabold text-gray-900">{insumos.length}</span>
          <p className="text-[11px] text-gray-400 mt-1">Variedad de materiales</p>
        </div>

        <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-xs">
          <span className="text-xs font-bold text-gray-500 uppercase block mb-1">Stock Crítico (Reponer)</span>
          <span className="text-2xl font-extrabold text-red-600">{insumosCriticos.length}</span>
          <p className="text-[11px] text-gray-400 mt-1">Insumos con bajo stock</p>
        </div>

        <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-xs">
          <span className="text-xs font-bold text-gray-500 uppercase block mb-1">Valoración de Bodega</span>
          <span className="text-2xl font-extrabold text-green-700">${valorTotalInventario.toLocaleString('es-CL')} CLP</span>
          <p className="text-[11px] text-gray-400 mt-1">Capital invertido en stock</p>
        </div>
      </div>

      <div className="bg-gray-50 p-4 border border-gray-200 rounded-2xl mb-6 flex flex-wrap gap-4 items-center justify-between">
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="🔍 Buscar insumo por nombre..."
          className="px-4 py-2.5 rounded-xl border border-gray-300 text-xs w-full md:w-80 bg-white"
        />

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-bold text-gray-500 uppercase mr-1">Categoría:</span>
          {categorias.map(cat => (
            <button
              key={cat}
              onClick={() => setFiltroEstado(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all whitespace-nowrap ${
                filtroCategoria === cat ? 'bg-black text-white border-black' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider">
              <th className="p-4">Material / Insumo</th>
              <th className="p-4">Categoría</th>
              <th className="p-4 text-center">Stock Actual</th>
              <th className="p-4 text-right">Precio Compra</th>
              <th className="p-4 text-center">Vencimiento</th>
              <th className="p-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {insumosFiltrados.map(i => {
              const esCritico = i.cantidad <= i.stockMinimo
              return (
                <tr key={i.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                  <td className="p-4">
                    <span className="font-bold text-gray-900 block text-sm">{i.nombre}</span>
                    {esCritico && (
                      <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded border border-red-200 inline-block mt-0.5">
                        ⚠️ Stock Mínimo Alcanzado
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className="bg-gray-100 border border-gray-200 text-gray-800 font-semibold px-2.5 py-1 rounded-md text-[11px]">
                      {i.categoria}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleModificarCantidad(i.id, -1)}
                        className="w-6 h-6 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded flex items-center justify-center text-xs"
                      >
                        -
                      </button>
                      <span className={`font-extrabold text-sm ${esCritico ? 'text-red-600' : 'text-gray-900'}`}>
                        {i.cantidad} un.
                      </span>
                      <button
                        onClick={() => handleModificarCantidad(i.id, 1)}
                        className="w-6 h-6 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded flex items-center justify-center text-xs"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="p-4 text-right font-extrabold text-gray-900">
                    ${i.precioCompra.toLocaleString('es-CL')} CLP
                  </td>
                  <td className="p-4 text-center text-gray-600 font-medium">
                    {i.vencimiento ? i.vencimiento.split('-').reverse().join('/') : 'N/I'}
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button onClick={() => handleAbrirEditar(i)} className="text-gray-600 hover:text-black font-semibold text-xs bg-gray-100 px-2.5 py-1 rounded-md">✏️ Editar</button>
                    <button onClick={() => handleEliminarInsumo(i.id)} className="text-red-500 hover:text-red-700 font-semibold text-xs bg-red-50 px-2.5 py-1 rounded-md">🗑️ Borrar</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {insumosFiltrados.length === 0 && (
          <p className="text-gray-400 text-center py-10 text-xs">No se encontraron insumos asociados a la búsqueda.</p>
        )}
      </div>

      {mostrarModalNuevo && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md border border-gray-200 shadow-xl">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900">{insumoEditando ? 'Editar Insumo' : 'Registrar Nuevo Insumo'}</h3>
              <button onClick={() => setMostrarModalNuevo(false)} className="text-gray-400 hover:text-black font-bold text-lg">✕</button>
            </div>

            <form onSubmit={handleCrearInsumo} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-600 uppercase mb-1">Nombre del Material / Insumo *</label>
                <input
                  type="text"
                  required
                  value={nuevoInsumo.nombre}
                  onChange={(e) => setNuevoInsumo({ ...nuevoInsumo, nombre: e.target.value })}
                  placeholder="Ej: Anestesia Lidocaína 2% (Caja 50 un)"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-600 uppercase mb-1">Categoría</label>
                  <select
                    value={nuevoInsumo.categoria}
                    onChange={(e) => setNuevoInsumo({ ...nuevoInsumo, categoria: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white"
                  >
                    {categorias.filter(c => c !== 'Todas').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-600 uppercase mb-1">Cantidad Inicial *</label>
                  <input
                    type="number"
                    required
                    value={nuevoInsumo.cantidad}
                    onChange={(e) => setNuevoInsumo({ ...nuevoInsumo, cantidad: e.target.value })}
                    placeholder="10"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-gray-600 uppercase mb-1">Stock Mínimo</label>
                  <input
                    type="number"
                    value={nuevoInsumo.stockMinimo}
                    onChange={(e) => setNuevoInsumo({ ...nuevoInsumo, stockMinimo: e.target.value })}
                    placeholder="2"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-600 uppercase mb-1">Precio Compra ($)</label>
                  <input
                    type="number"
                    value={nuevoInsumo.precioCompra}
                    onChange={(e) => setNuevoInsumo({ ...nuevoInsumo, precioCompra: e.target.value })}
                    placeholder="15000"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-600 uppercase mb-1">Vencimiento</label>
                  <input
                    type="date"
                    value={nuevoInsumo.vencimiento}
                    onChange={(e) => setNuevoInsumo({ ...nuevoInsumo, vencimiento: e.target.value })}
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