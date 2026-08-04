import React, { memo, useState, useEffect } from 'react'
import { ESPECIALIDADES_ODONTOLOGICAS } from '../constants/prestacionesConstants'

export const ModalNuevaPrestacion = memo(({ prestacionEditar, alGuardar, alCerrar }) => {
  const [nombre, setNombre] = useState('')
  const [especialidad, setEspecialidad] = useState(ESPECIALIDADES_ODONTOLOGICAS[0])
  const [precioParticular, setPrecioParticular] = useState('')
  const [precioFonasa, setPrecioFonasa] = useState('')
  const [codigoFonasa, setCodigoFonasa] = useState('')

  useEffect(() => {
    if (prestacionEditar) {
      setNombre(prestacionEditar.nombre || '')
      setEspecialidad(prestacionEditar.especialidad || ESPECIALIDADES_ODONTOLOGICAS[0])
      setPrecioParticular(prestacionEditar.precioParticular || prestacionEditar.precio || '')
      setPrecioFonasa(prestacionEditar.precioFonasa || '')
      setCodigoFonasa(prestacionEditar.codigoFonasa || '')
    }
  }, [prestacionEditar])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!nombre.trim() || !precioParticular) return

    const valParticular = parseFloat(precioParticular) || 0
    const valFonasa = parseFloat(precioFonasa) || 0

    const prestacionObj = {
      id: prestacionEditar ? prestacionEditar.id : Date.now(),
      nombre: nombre.trim(),
      especialidad,
      precio: valParticular, // 💡 Propiedad requerida por FichaPaciente y Presupuestos
      precioParticular: valParticular,
      precioFonasa: valFonasa,
      codigoFonasa: codigoFonasa.trim()
    }

    alGuardar(prestacionObj)
    alCerrar()
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 print:hidden">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md border border-gray-200 shadow-xl space-y-4 text-xs">
        <div className="flex justify-between items-center border-b pb-3">
          <h3 className="text-base font-bold text-gray-900">
            {prestacionEditar ? 'Editar Procedimiento de Arancel' : '➕ Registrar Nueva Prestación'}
          </h3>
          <button onClick={alCerrar} className="text-gray-400 hover:text-black font-bold text-lg">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Nombre del Procedimiento / Tratamiento *</label>
            <input
              type="text"
              required
              placeholder="Ej: Obturación Resina 1 Cara..."
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-300 font-bold"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Especialidad Clínica</label>
            <select
              value={especialidad}
              onChange={(e) => setEspecialidad(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-300 bg-white font-medium"
            >
              {ESPECIALIDADES_ODONTOLOGICAS.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Precio Particular ($) *</label>
              <input
                type="number"
                required
                placeholder="Ej: 35000"
                value={precioParticular}
                onChange={(e) => setPrecioParticular(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-300 font-black text-emerald-900 bg-emerald-50/50"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Precio Fonasa / Convenio ($)</label>
              <input
                type="number"
                placeholder="Ej: 28000"
                value={precioFonasa}
                onChange={(e) => setPrecioFonasa(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-300 font-bold text-blue-900 bg-blue-50/50"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Código Fonasa (Opcional)</label>
            <input
              type="text"
              placeholder="Ej: 01-02-010"
              value={codigoFonasa}
              onChange={(e) => setCodigoFonasa(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-300 font-mono"
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
              Guardar Prestación
            </button>
          </div>
        </form>
      </div>
    </div>
  )
})

ModalNuevaPrestacion.displayName = 'ModalNuevaPrestacion'