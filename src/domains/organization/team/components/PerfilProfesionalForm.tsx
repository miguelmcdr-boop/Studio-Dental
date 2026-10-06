import React, { memo, useState } from 'react'
import { User, Award, PenTool } from 'lucide-react'
import { Button } from '../../../../shared/ui/ui/Button'
import { FirmaDigitalCanvas } from '../../../../shared/ui/FirmaDigitalCanvas'

export interface PerfilProfesionalData {
  nombreCompleto?: string
  rut?: string
  especialidad?: string
  registroSalud?: string
  numeroRegistroISP?: string
  firmaDigital?: string
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
  const [numeroRegistroISP, setNumeroRegistroISP] = useState<string>(
    userProfile?.numeroRegistroISP || userProfile?.registroSalud || ''
  )
  const [firmaDigital, setFirmaDigital] = useState<string>(userProfile?.firmaDigital || '')
  const [email, setEmail] = useState<string>(userProfile?.email || '')
  const [enviando, setEnviando] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    if (!numeroRegistroISP.trim()) {
      setError('El N° de Registro ISP es obligatorio para el ejercicio clínico odontológico.')
      return
    }

    setEnviando(true)
    try {
      await alGuardar({
        ...userProfile,
        nombreCompleto,
        rut,
        especialidad,
        registroSalud: numeroRegistroISP,
        numeroRegistroISP,
        firmaDigital,
        email,
      })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-surface border border-surface rounded-2xl p-6 shadow-xs space-y-4 text-xs">
      <div className="border-b border-surface pb-3">
        <h3 className="font-bold text-sm text-gray-900 dark:text-graphite-50 surgical:text-black uppercase tracking-wider inline-flex items-center gap-2">
          <User size={14} /> Perfil del Odontólogo / Profesional
        </h3>
        <p className="text-gray-500 dark:text-graphite-400 text-[11px]">
          Información acreditada para firmar recetas médicas, certificados y consentimientos informados.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/40 rounded-xl text-red-700 dark:text-red-300 text-xs">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block font-semibold text-gray-700 dark:text-graphite-300 surgical:text-black mb-1">Nombre Completo *</label>
          <input
            type="text"
            required
            value={nombreCompleto}
            onChange={(e) => setNombreCompleto(e.target.value)}
            className="w-full p-2.5 rounded-lg border border-surface bg-white dark:bg-graphite-800 surgical:bg-graphite-200 text-graphite-900 dark:text-graphite-50 font-bold focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div>
          <label className="block font-semibold text-gray-700 dark:text-graphite-300 surgical:text-black mb-1">RUT Profesional *</label>
          <input
            type="text"
            required
            value={rut}
            onChange={(e) => setRut(e.target.value)}
            className="w-full p-2.5 rounded-lg border border-surface bg-white dark:bg-graphite-800 surgical:bg-graphite-200 text-graphite-900 dark:text-graphite-50 font-bold focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div>
          <label className="block font-semibold text-gray-700 dark:text-graphite-300 surgical:text-black mb-1">Especialidad Clínica *</label>
          <input
            type="text"
            required
            value={especialidad}
            onChange={(e) => setEspecialidad(e.target.value)}
            className="w-full p-2.5 rounded-lg border border-surface bg-white dark:bg-graphite-800 surgical:bg-graphite-200 text-graphite-900 dark:text-graphite-50 focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div>
          <label className="block font-semibold text-gray-700 dark:text-graphite-300 surgical:text-black mb-1">
            N° Registro ISP / Super. Salud *
          </label>
          <input
            type="text"
            required
            value={numeroRegistroISP}
            onChange={(e) => setNumeroRegistroISP(e.target.value)}
            placeholder="Ej: 123456"
            className="w-full p-2.5 rounded-lg border border-surface bg-white dark:bg-graphite-800 surgical:bg-graphite-200 text-graphite-900 dark:text-graphite-50 font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block font-semibold text-gray-700 dark:text-graphite-300 surgical:text-black mb-1">Email Profesional</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2.5 rounded-lg border border-surface bg-white dark:bg-graphite-800 surgical:bg-graphite-200 text-graphite-900 dark:text-graphite-50 focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>

      <div className="pt-3 border-t border-surface space-y-2">
        <label className="block font-semibold text-gray-700 dark:text-graphite-300 surgical:text-black mb-1 flex items-center gap-1.5">
          <PenTool size={13} className="text-[#D4AF37]" /> Firma Digital (3 Modos: Dibujar, Subir imagen o Tipográfica)
        </label>
        <FirmaDigitalCanvas alGuardarFirma={(dataUrl) => setFirmaDigital(dataUrl)} />
      </div>

      <div className="flex justify-end pt-3 border-t border-surface">
        <Button type="submit" variant="primary" size="md" disabled={enviando}>
          {enviando ? 'Guardando...' : 'Guardar Perfil Profesional'}
        </Button>
      </div>
    </form>
  )
})

PerfilProfesionalForm.displayName = 'PerfilProfesionalForm'
