import React, { memo, useState } from 'react'

export const ModalEditarPaciente = memo(({ paciente, alGuardar, alCerrar }) => {
  const [datosEdit, setDatosEdit] = useState({ ...paciente })

  const handleSubmit = (e) => {
    e.preventDefault()
    alGuardar(datosEdit)
    alCerrar()
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 print:hidden">
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl border border-gray-200 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 border-b pb-3">
          <h3 className="text-base font-bold text-gray-900">Editar Datos Personales de {paciente.nombre}</h3>
          <button onClick={alCerrar} className="text-gray-400 hover:text-black font-bold text-lg">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-600 uppercase mb-1">Nombre Completo</label>
              <input
                type="text"
                required
                value={datosEdit.nombre || ''}
                onChange={(e) => setDatosEdit({ ...datosEdit, nombre: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-600 uppercase mb-1">RUT</label>
              <input
                type="text"
                required
                value={datosEdit.rut || ''}
                onChange={(e) => setDatosEdit({ ...datosEdit, rut: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-gray-600 uppercase mb-1">Edad</label>
              <input
                type="number"
                value={datosEdit.edad || ''}
                onChange={(e) => setDatosEdit({ ...datosEdit, edad: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-600 uppercase mb-1">Teléfono</label>
              <input
                type="text"
                value={datosEdit.telefono || ''}
                onChange={(e) => setDatosEdit({ ...datosEdit, telefono: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-600 uppercase mb-1">Correo Electrónico</label>
              <input
                type="email"
                value={datosEdit.email || ''}
                onChange={(e) => setDatosEdit({ ...datosEdit, email: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-gray-600 uppercase mb-1">Ocupación</label>
              <input
                type="text"
                value={datosEdit.ocupacion || ''}
                onChange={(e) => setDatosEdit({ ...datosEdit, ocupacion: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-600 uppercase mb-1">Dirección / Comuna</label>
              <input
                type="text"
                value={datosEdit.direccion || ''}
                onChange={(e) => setDatosEdit({ ...datosEdit, direccion: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-600 uppercase mb-1">Previsión</label>
              <select
                value={datosEdit.prevision || 'Fonasa'}
                onChange={(e) => setDatosEdit({ ...datosEdit, prevision: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white"
              >
                <option value="Fonasa">Fonasa</option>
                <option value="Isapre">Isapre</option>
                <option value="Particular">Particular</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-600 uppercase mb-1">Contacto de Emergencia</label>
            <input
              type="text"
              value={datosEdit.contactoEmergencia || ''}
              onChange={(e) => setDatosEdit({ ...datosEdit, contactoEmergencia: e.target.value })}
              placeholder="Ej: María Pérez +56 9 1111 2222"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={alCerrar}
              className="w-1/2 py-2.5 rounded-xl border border-gray-300 font-semibold text-gray-700 hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="w-1/2 bg-black text-white py-2.5 rounded-xl font-semibold hover:bg-gray-800"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  )
})

ModalEditarPaciente.displayName = 'ModalEditarPaciente'