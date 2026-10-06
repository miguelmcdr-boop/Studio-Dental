import React from 'react'
import { Building2, User } from 'lucide-react'
import type { TipoActividad } from '../types/bootstrapClinica'

export interface PasoTipoActividadProps {
  tipoActividad: TipoActividad
  setTipoActividad: (tipo: TipoActividad) => void
}

export const PasoTipoActividad: React.FC<PasoTipoActividadProps> = ({
  tipoActividad,
  setTipoActividad,
}) => {
  return (
    <div className="space-y-4">
      <p className="text-sm text-center text-gray-600 dark:text-slate-300">
        Selecciona el modelo de tu actividad profesional:
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => setTipoActividad('individual')}
          className={`p-5 rounded-2xl border text-left transition cursor-pointer ${
            tipoActividad === 'individual'
              ? 'border-[#D4AF37] bg-[#D4AF37]/10'
              : 'border-gray-200 dark:border-slate-800'
          }`}
        >
          <User size={28} className="text-[#D4AF37] mb-2" />
          <h3 className="font-bold text-sm text-gray-900 dark:text-white">Consulta individual</h3>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
            Dentista independiente con su propio box o consulta privada.
          </p>
        </button>
        <button
          type="button"
          onClick={() => setTipoActividad('clinica')}
          className={`p-5 rounded-2xl border text-left transition cursor-pointer ${
            tipoActividad === 'clinica'
              ? 'border-[#D4AF37] bg-[#D4AF37]/10'
              : 'border-gray-200 dark:border-slate-800'
          }`}
        >
          <Building2 size={28} className="text-[#D4AF37] mb-2" />
          <h3 className="font-bold text-sm text-gray-900 dark:text-white">Clínica dental</h3>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
            Centro con equipo multidisciplinario y una o más sedes operativas.
          </p>
        </button>
      </div>
    </div>
  )
}
