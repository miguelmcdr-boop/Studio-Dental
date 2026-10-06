import React, { useState } from 'react'
import { Users, Trash2, Plus } from 'lucide-react'
import type { MiembroInvitacionOnboarding } from '../types/bootstrapClinica'
import { Button } from './ui/Button'

export interface PasoEquipoProps {
  equipo: MiembroInvitacionOnboarding[]
  agregarMiembro: (miembro: MiembroInvitacionOnboarding) => void
  eliminarMiembro: (index: number) => void
}

export const PasoEquipo: React.FC<PasoEquipoProps> = ({
  equipo,
  agregarMiembro,
  eliminarMiembro,
}) => {
  const [nuevoEmail, setNuevoEmail] = useState('')
  const [nuevoRol, setNuevoRol] = useState('dentista')

  const handleCrearMiembroManual = () => {
    if (!nuevoEmail.trim()) return
    agregarMiembro({ email: nuevoEmail.trim().toLowerCase(), rol: nuevoRol, sedes: [] })
    setNuevoEmail('')
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
        <Users size={16} className="text-[#D4AF37]" /> Invitar colaboradores (opcional)
      </h3>
      <div className="space-y-2">
        {equipo.map((m, idx) => (
          <div
            key={idx}
            className="flex justify-between items-center p-2.5 rounded-xl bg-gray-50 dark:bg-slate-900 border text-xs"
          >
            <span>{m.email} — <strong className="text-[#D4AF37]">{m.rol}</strong></span>
            <button
              type="button"
              onClick={() => eliminarMiembro(idx)}
              className="text-red-400 hover:text-red-500 cursor-pointer"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
      <div className="p-3 rounded-xl border border-dashed border-gray-300 dark:border-slate-700 space-y-2">
        <div className="grid grid-cols-3 gap-2">
          <input
            type="email"
            placeholder="colega@clinica.cl"
            value={nuevoEmail}
            onChange={(e) => setNuevoEmail(e.target.value)}
            className="col-span-2 p-2 text-xs rounded border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900"
          />
          <select
            value={nuevoRol}
            onChange={(e) => setNuevoRol(e.target.value)}
            className="p-2 text-xs rounded border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900"
          >
            <option value="dentista">Dentista</option>
            <option value="asistente">Asistente</option>
            <option value="recepcion">Recepción</option>
          </select>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleCrearMiembroManual}
          className="text-xs cursor-pointer"
        >
          <Plus size={14} className="mr-1" /> Agregar invitación
        </Button>
      </div>
    </div>
  )
}
