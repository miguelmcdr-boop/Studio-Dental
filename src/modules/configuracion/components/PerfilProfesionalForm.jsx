import React, { memo, useState } from 'react'
import { User } from 'lucide-react'
import { Button } from '../../../components/ui/Button'

export const PerfilProfesionalForm = memo(({ userProfile, alGuardar }) => {
  const [nombreCompleto, setNombreCompleto] = useState(userProfile?.nombreCompleto || '')
  const [rut, setRut] = useState(userProfile?.rut || '')
  const [especialidad, setEspecialidad] = useState(userProfile?.especialidad || 'Cirujano Dentista')
  const [registroSalud, setRegistroSalud] = useState(userProfile?.registroSalud || '')
  const [email, setEmail] = useState(userProfile?.email || '')
  const [enviando, setEnviando] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setEnviando(true)
    try {
      alGuardar({
        ...userProfile,
        nombreCompleto,
        rut,
        especialidad,
        registroSalud,
        email
      })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-graphite-800 border border-gray-200 dark:border-graphite-700 rounded-2xl p-6 shadow-xs space-y-4 text-xs">
      <div className="border-b pb-3">
        <h3 className="font-bold text-sm text-gray-900 dark:text-graphite-50 uppercase tracking-wider inline-flex items-center gap-2"><User size={14} />Perfil del Odontólogo / Profesional</h3>
        <p className="text-gray-500 dark:text-graphite-400 text-[11px]">Información personal que aparece en firmantes de recetas y licencias.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block font-semibold text-gray-700 dark:text-graphite-300 mb-1">Nombre Completo *</label>
          <input
            type="text"
            required
            value={nombreCompleto}
            onChange={(e) => setNombreCompleto(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-graphite-600 font-bold"
          />
        </div>

        <div>
          <label className="block font-semibold text-gray-700 dark:text-graphite-300 mb-1">RUT / Identificación *</label>
          <input
            type="text"
            required
            value={rut}
            onChange={(e) => setRut(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-graphite-600 font-bold"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block font-semibold text-gray-700 dark:text-graphite-300 mb-1">Especialidad Principal</label>
          <input
            type="text"
            value={especialidad}
            onChange={(e) => setEspecialidad(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-graphite-600"
          />
        </div>

        <div>
          <label className="block font-semibold text-gray-700 dark:text-graphite-300 mb-1">N° Registro Superintendencia Salud</label>
          <input
            type="text"
            placeholder="Ej: 485120"
            value={registroSalud}
            onChange={(e) => setRegistroSalud(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-graphite-600 font-mono font-bold"
          />
        </div>

        <div>
          <label className="block font-semibold text-gray-700 dark:text-graphite-300 mb-1">Correo Electrónico</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-graphite-600"
          />
        </div>
      </div>

      <div className="pt-2 text-right">
        <Button
          type="submit"
          variant="primary"
          loading={enviando}
          disabled={enviando}
        >
          {enviando ? 'Guardando...' : 'Guardar Perfil Profesional'}
        </Button>
      </div>
    </form>
  )
})

PerfilProfesionalForm.displayName = 'PerfilProfesionalForm'