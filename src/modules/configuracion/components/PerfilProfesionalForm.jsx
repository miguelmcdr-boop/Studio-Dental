import React, { memo, useState } from 'react'

export const PerfilProfesionalForm = memo(({ userProfile, alGuardar }) => {
  const [nombreCompleto, setNombreCompleto] = useState(userProfile?.nombreCompleto || '')
  const [rut, setRut] = useState(userProfile?.rut || '')
  const [especialidad, setEspecialidad] = useState(userProfile?.especialidad || 'Cirujano Dentista')
  const [registroSalud, setRegistroSalud] = useState(userProfile?.registroSalud || '')
  const [email, setEmail] = useState(userProfile?.email || '')

  const handleSubmit = (e) => {
    e.preventDefault()
    alGuardar({
      ...userProfile,
      nombreCompleto,
      rut,
      especialidad,
      registroSalud,
      email
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4 text-xs">
      <div className="border-b pb-3">
        <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider">👤 Perfil del Odontólogo / Profesional</h3>
        <p className="text-gray-500 text-[11px]">Información personal que aparece en firmantes de recetas y licencias.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block font-semibold text-gray-700 mb-1">Nombre Completo *</label>
          <input
            type="text"
            required
            value={nombreCompleto}
            onChange={(e) => setNombreCompleto(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-gray-300 font-bold"
          />
        </div>

        <div>
          <label className="block font-semibold text-gray-700 mb-1">RUT / Identificación *</label>
          <input
            type="text"
            required
            value={rut}
            onChange={(e) => setRut(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-gray-300 font-bold"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block font-semibold text-gray-700 mb-1">Especialidad Principal</label>
          <input
            type="text"
            value={especialidad}
            onChange={(e) => setEspecialidad(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-gray-300"
          />
        </div>

        <div>
          <label className="block font-semibold text-gray-700 mb-1">N° Registro Superintendencia Salud</label>
          <input
            type="text"
            placeholder="Ej: 485120"
            value={registroSalud}
            onChange={(e) => setRegistroSalud(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-gray-300 font-mono font-bold"
          />
        </div>

        <div>
          <label className="block font-semibold text-gray-700 mb-1">Correo Electrónico</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-gray-300"
          />
        </div>
      </div>

      <div className="pt-2 text-right">
        <button
          type="submit"
          className="bg-black text-white font-bold px-5 py-2.5 rounded-xl hover:bg-gray-800 transition-colors shadow-xs"
        >
          Guardar Perfil Profesional
        </button>
      </div>
    </form>
  )
})

PerfilProfesionalForm.displayName = 'PerfilProfesionalForm'