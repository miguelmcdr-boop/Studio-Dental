import React, { memo, useState } from 'react'
import { TIPOS_TRABAJO_SUGERIDOS } from '../constants/laboratorioConstants'

export const DirectorioLaboratorios = memo(({ laboratorios, alGuardarLab, alEliminarLab }) => {
  const [labEditar, setLabEditar] = useState(null)

  const [nombre, setNombre] = useState('')
  const [contacto, setContacto] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')
  const [direccion, setDireccion] = useState('')

  // Tarifario
  const [trabajoTexto, setTrabajoTexto] = useState('')
  const [precioSel, setPrecioSel] = useState('')
  const [tarifasTemp, setTarifasTemp] = useState([])

  const handleAbrirNuevo = () => {
    setLabEditar(null)
    setNombre('')
    setContacto('')
    setTelefono('')
    setEmail('')
    setDireccion('')
    setTarifasTemp([])
  }

  const handleAbrirEditar = (lab) => {
    setLabEditar(lab)
    setNombre(lab.nombre || '')
    setContacto(lab.contacto || '')
    setTelefono(lab.telefono || '')
    setEmail(lab.email || '')
    setDireccion(lab.direccion || '')
    setTarifasTemp(lab.tarifas || [])
  }

  const handleAgregarTarifa = () => {
    if (!trabajoTexto.trim() || !precioSel || parseFloat(precioSel) <= 0) return
    const trabajoClean = trabajoTexto.trim()
    const existe = tarifasTemp.some(t => t.trabajo.toLowerCase() === trabajoClean.toLowerCase())
    
    if (existe) {
      setTarifasTemp(tarifasTemp.map(t => t.trabajo.toLowerCase() === trabajoClean.toLowerCase() ? { ...t, precio: parseFloat(precioSel) } : t))
    } else {
      setTarifasTemp([...tarifasTemp, { trabajo: trabajoClean, precio: parseFloat(precioSel) }])
    }
    setTrabajoTexto('')
    setPrecioSel('')
  }

  const handleEliminarTarifa = (trabajoNombre) => {
    setTarifasTemp(tarifasTemp.filter(t => t.trabajo !== trabajoNombre))
  }

  const handleGuardarSubmit = (e) => {
    e.preventDefault()
    if (!nombre.trim()) return

    const labObj = {
      id: labEditar ? labEditar.id : Date.now(),
      nombre: nombre.trim(),
      contacto,
      telefono,
      email,
      direccion,
      tarifas: tarifasTemp
    }

    alGuardarLab(labObj)
    handleAbrirNuevo()
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
      {/* Formulario Crear / Editar Lab */}
      <form onSubmit={handleGuardarSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-3">
        <div className="border-b pb-2 flex justify-between items-center">
          <h3 className="font-bold text-sm text-gray-900 uppercase">
            {labEditar ? 'Editar Proveedor Lab' : '➕ Registrar Nuevo Lab'}
          </h3>
          {labEditar && (
            <button type="button" onClick={handleAbrirNuevo} className="text-gray-400 font-bold hover:text-black">✕ Cancelar</button>
          )}
        </div>

        <div>
          <label className="block font-semibold text-gray-700 mb-1">Nombre Laboratorio *</label>
          <input
            type="text"
            required
            placeholder="Ej: Laboratorio Estética & Cerámica"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-gray-300 font-bold"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Contacto / Ceramista</label>
            <input
              type="text"
              placeholder="Ej: Roberto Gómez"
              value={contacto}
              onChange={(e) => setContacto(e.target.value)}
              className="w-full p-2 rounded-xl border border-gray-300"
            />
          </div>
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Teléfono</label>
            <input
              type="text"
              placeholder="+56 9 1234 5678"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="w-full p-2 rounded-xl border border-gray-300"
            />
          </div>
        </div>

        <div className="border-t pt-3 space-y-2">
          <label className="block font-bold text-gray-800 uppercase text-[10px]">⚙️ Tarifario Personalizado del Laboratorio</label>
          
          <div className="space-y-2 bg-gray-50 p-3 rounded-xl border">
            <input
              type="text"
              list="tarifas-sugeridas-list"
              placeholder="Nombre del trabajo (Ej: Carilla E-Max, Protesis Valplast...)"
              value={trabajoTexto}
              onChange={(e) => setTrabajoTexto(e.target.value)}
              className="w-full p-2 rounded-lg border bg-white font-semibold text-[11px]"
            />
            <datalist id="tarifas-sugeridas-list">
              {TIPOS_TRABAJO_SUGERIDOS.map(t => <option key={t} value={t} />)}
            </datalist>

            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Precio ($ CLP)"
                value={precioSel}
                onChange={(e) => setPrecioSel(e.target.value)}
                className="w-full p-2 rounded-lg border bg-white font-bold"
              />
              <button
                type="button"
                onClick={handleAgregarTarifa}
                className="bg-black text-white px-3 py-2 rounded-lg font-bold hover:bg-gray-800"
              >
                + Añadir
              </button>
            </div>
          </div>

          <div className="space-y-1 max-h-40 overflow-y-auto pt-1">
            {tarifasTemp.map(t => (
              <div key={t.trabajo} className="flex justify-between items-center p-2 bg-white border rounded-lg">
                <span className="font-semibold text-[11px] text-gray-800 truncate max-w-[170px]">{t.trabajo}</span>
                <div className="flex items-center gap-2">
                  <span className="font-black text-emerald-800">${t.precio.toLocaleString('es-CL')}</span>
                  <button type="button" onClick={() => handleEliminarTarifa(t.trabajo)} className="text-red-500 font-bold">✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-black text-white font-bold py-2.5 rounded-xl hover:bg-gray-800 transition-colors shadow-xs"
        >
          {labEditar ? 'Guardar Cambios Proveedor' : 'Registrar Laboratorio y Tarifas'}
        </button>
      </form>

      {/* Directorio de Laboratorios Guardados */}
      <div className="md:col-span-2 space-y-4">
        <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider">
          📂 Directorio de Laboratorios y Aranceles ({laboratorios.length})
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {laboratorios.map(lab => (
            <div key={lab.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-3">
              <div>
                <div className="flex justify-between items-start border-b pb-2">
                  <h4 className="font-black text-sm text-gray-900">{lab.nombre}</h4>
                  <div className="flex gap-1">
                    <button onClick={() => handleAbrirEditar(lab)} className="p-1 hover:bg-gray-100 rounded" title="Editar">✏️</button>
                    <button onClick={() => alEliminarLab(lab.id)} className="p-1 text-red-500 hover:bg-red-50 rounded" title="Eliminar">🗑️</button>
                  </div>
                </div>

                <div className="text-[11px] text-gray-600 mt-2 space-y-1">
                  <p><span className="font-semibold text-gray-800">Contacto:</span> {lab.contacto || 'N/I'}</p>
                  <p><span className="font-semibold text-gray-800">Teléfono:</span> {lab.telefono || 'N/I'}</p>
                </div>

                <div className="mt-3 pt-2 border-t space-y-1">
                  <span className="font-bold text-[10px] text-gray-500 uppercase block">Tarifas Registradas ({lab.tarifas?.length || 0}):</span>
                  {lab.tarifas && lab.tarifas.length > 0 ? (
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {lab.tarifas.map(t => (
                        <div key={t.trabajo} className="flex justify-between text-[10px] bg-gray-50 p-1.5 rounded">
                          <span className="truncate max-w-[160px] font-medium text-gray-700">{t.trabajo}</span>
                          <span className="font-bold text-gray-900">${t.precio.toLocaleString('es-CL')} CLP</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 italic text-[10px]">Sin tarifas asignadas.</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})

DirectorioLaboratorios.displayName = 'DirectorioLaboratorios'