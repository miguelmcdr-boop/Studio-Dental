import React, { memo, useState } from 'react'
import { User } from 'lucide-react'
import { Button } from '../../../../shared/ui/ui/Button'

export interface PerfilProfesionalData {
  nombreCompleto?: string
  rut?: string
  especialidad?: string
  registroSalud?: string
  email?: string
  [key: string]: unknown
}

export interface PerfilProfesionalFormProps {
  userProfile?: PerfilProfesionalData | null
  alGuardar: (perfil: PerfilProfesionalData) => void | Promise<void>
}

export const PerfilProfesionalForm: React.FC<PerfilProfesionalFormProps> = memo(({ userProfile, alGuardar }) => {
  const [nombreCompleto, setNombreCompleto] = useState<string>(userProfile?.nombreCompleto || '')
  const [rut, setRut] = useState<string>(userProfile?.rut || '')
  const [especialidad, setEspecialidad] = useState<string>(userProfile?.especialidad || 'Cirujano Dentista')
  const [registroSalud, setRegistroSalud] = useState<string>(userProfile?.registroSalud || '')
  const [email, setEmail] = useState<string>(userProfile?.email || '')
  const [enviando, setEnviando] = useState<boolean>(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setEnviando(true)
    try {
      await alGuardar({
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
    <form onSubmit={handleSubmit} className="bg-surface border border-surface rounded-2xl p-6 shadow-xs space-y-4 text-xs">
      <div className="border-b border-surface pb-3">
        <h3 className="font-bold text-sm text-gray-900 dark:text-graphite-50 surgical:text-black uppercase tracking-wider inline-flex items-center gap-2"><User size={14} />Perfil del Odontólogo / Profesional</h3>
        <p className="text-gray-500 dark:text-graphite-400 text-[11px]">Información personal que aparece en firmantes de recetas y licencias.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block font-semibold text-gray-700 dark:text-graphite-300 surgical:text-black mb-1">Nombre Completo *</label>
          <input
            type="text"
            required
            value={nombreCompleto}
            onChange={(e) => setNombreCompleto(e.target.value)}
            className="w-full p-2.5 rounded-lg border border-surface bg-white dark:bg-graphite-800 surgical:bg-graphite-200 text-graphite-900 dark:text-graphite-50 surgical:text-black font-bold focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div>
          <label className="block font-semibold text-gray-700 dark:text-graphite-300 surgical:text-black mb-1">RUT Profesional *</label>
          <input
            type="text"
            required
            value={rut}
            onChange={(e) => setRut(e.target.value)}
            className="w-full p-2.5 rounded-lg border border-surface bg-white dark:bg-graphite-800 surgical:bg-graphite-200 text-graphite-900 dark:text-graphite-50 surgical:text-black font-bold focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div>
          <label className="block font-semibold text-gray-700 dark:text-graphite-300 surgical:text-black mb-1">Especialidad Clínica</label>
          <input
            type="text"
            value={especialidad}
            onChange={(e) => setEspecialidad(e.target.value)}
            className="w-full p-2.5 rounded-lg border border-surface bg-white dark:bg-graphite-800 surgical:bg-graphite-200 text-graphite-900 dark:text-graphite-50 surgical:text-black focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div>
          <label className="block font-semibold text-gray-700 dark:text-graphite-300 surgical:text-black mb-1">Registro Nacional de Salud (N°)</label>
          <input
            type="text"
            value={registroSalud}
            onChange={(e) => setRegistroSalud(e.target.value)}
            placeholder="Ej: 123456"
            className="w-full p-2.5 rounded-lg border border-surface bg-white dark:bg-graphite-800 surgical:bg-graphite-200 text-graphite-900 dark:text-graphite-50 surgical:text-black focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block font-semibold text-gray-700 dark:text-graphite-300 surgical:text-black mb-1">Email Profesional</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2.5 rounded-lg border border-surface bg-white dark:bg-graphite-800 surgical:bg-graphite-200 text-graphite-900 dark:text-graphite-50 surgical:text-black focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>

      <div className="flex justify-end pt-3 border-t border-surface">
        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={enviando}
        >
          {enviando ? 'Guardando...' : 'Guardar Perfil Profesional'}
        </Button>
      </div>
    </form>
  )
})

PerfilProfesionalForm.displayName = 'PerfilProfesionalForm'
