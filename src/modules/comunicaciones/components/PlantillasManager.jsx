import React, { memo, useState } from 'react'
import { CANALES_COMUNICACION } from '../constants/comunicacionesConstants'

export const PlantillasManager = memo(({ plantillas, alGuardarPlantilla, alEliminarPlantilla }) => {
  const [plantillaEditar, setPlantillaEditar] = useState(null)
  const [nombre, setNombre] = useState('')
  const [canal, setCanal] = useState(CANALES_COMUNICACION[0].id)
  const [asunto, setAsunto] = useState('')
  const [cuerpo, setCuerpo] = useState('')

  const handleAbrirEditar = (pl) => {
    setPlantillaEditar(pl)
    setNombre(pl.nombre || '')
    setCanal(pl.canal || CANALES_COMUNICACION[0].id)
    setAsunto(pl.asunto || '')
    setCuerpo(pl.cuerpo || '')
  }

  const handleCancelarEdicion = () => {
    setPlantillaEditar(null)
    setNombre('')
    setAsunto('')
    setCuerpo('')
  }

  const handleInsertarVariable = (variable) => {
    setCuerpo(prev => prev + ` ${variable} `)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!nombre.trim() || !cuerpo.trim()) return

    alGuardarPlantilla({
      id: plantillaEditar ? plantillaEditar.id : undefined,
      nombre: nombre.trim(),
      canal,
      asunto: asunto.trim(),
      cuerpo: cuerpo.trim()
    })

    handleCancelarEdicion()
    alert(plantillaEditar ? '✅ Plantilla modificada exitosamente.' : '✅ Nueva plantilla creada exitosamente.')
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-3">
        <div className="flex justify-between items-center border-b pb-2">
          <h3 className="font-bold text-sm text-gray-900 uppercase">
            {plantillaEditar ? '✏️ Editar Plantilla' : '➕ Crear Plantilla'}
          </h3>
          {plantillaEditar && (
            <button type="button" onClick={handleCancelarEdicion} className="text-gray-400 font-bold hover:text-black">
              ✕ Cancelar
            </button>
          )}
        </div>

        <div>
          <label className="block font-semibold text-gray-700 mb-1">Nombre Identificador *</label>
          <input
            type="text"
            required
            placeholder="Ej: 📅 Confirmación de Cita"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-gray-300 font-bold"
          />
        </div>

        <div>
          <label className="block font-semibold text-gray-700 mb-1">Canal Predeterminado</label>
          <select
            value={canal}
            onChange={(e) => setCanal(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-gray-300 bg-white font-semibold"
          >
            {CANALES_COMUNICACION.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>

        {canal === 'email' && (
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Asunto del Correo</label>
            <input
              type="text"
              placeholder="Ej: Su Atención Odontológica"
              value={asunto}
              onChange={(e) => setAsunto(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-300"
            />
          </div>
        )}

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block font-semibold text-gray-700">Cuerpo del Mensaje *</label>
          </div>

          <textarea
            rows="4"
            required
            placeholder="Ej: Hola {paciente}, le recordamos su cita el {fecha} a las {hora} hrs..."
            value={cuerpo}
            onChange={(e) => setCuerpo(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-gray-300 font-mono text-[11px]"
          />

          {/* Chips de inserción rápida de variables */}
          <div className="pt-2 flex flex-wrap gap-1">
            <span className="text-[10px] text-gray-500 w-full block">Variables dinámicas rápidas:</span>
            {['{paciente}', '{fecha}', '{hora}', '{doctor}', '{clinica}'].map(v => (
              <button
                key={v}
                type="button"
                onClick={() => handleInsertarVariable(v)}
                className="bg-gray-100 hover:bg-black hover:text-white px-2 py-0.5 rounded border text-[10px] font-mono font-bold"
              >
                + {v}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-black text-white font-bold py-2.5 rounded-xl hover:bg-gray-800 transition-colors shadow-xs"
        >
          {plantillaEditar ? 'Guardar Cambios' : 'Guardar Plantilla'}
        </button>
      </form>

      <div className="md:col-span-2 space-y-4">
        <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider">
          📋 Plantillas Registradas ({plantillas.length})
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {plantillas.map(pl => (
            <div key={pl.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-3">
              <div>
                <div className="flex justify-between items-start border-b pb-2">
                  <h4 className="font-black text-sm text-gray-900">{pl.nombre}</h4>
                  <div className="flex gap-1">
                    <button onClick={() => handleAbrirEditar(pl)} className="text-gray-600 hover:text-black font-bold p-1" aria-label="Editar plantilla">✏️</button>
                    <button onClick={() => alEliminarPlantilla(pl.id)} className="text-red-500 hover:text-red-700 font-bold p-1" aria-label="Eliminar plantilla">🗑️</button>
                  </div>
                </div>
                <p className="text-gray-600 mt-2 font-mono text-[10px] leading-relaxed">{pl.cuerpo}</p>
              </div>

              <div className="pt-2 border-t text-right">
                <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded font-bold text-[10px]">
                  {pl.canal === 'whatsapp' ? '💬 WhatsApp' : '✉️ Email'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})

PlantillasManager.displayName = 'PlantillasManager'