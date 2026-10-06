import React from 'react'
import { MapPin } from 'lucide-react'
import { useSedes } from '../../domains/organization/clinic/hooks/useSedes'
import { useSesionStore } from '../../app/stores/sesionStore'

export interface SelectorSedeProps {
  onCambioSede?: (sedeId: string) => void
  className?: string
  compacto?: boolean
}

export const SelectorSede: React.FC<SelectorSedeProps> = ({
  onCambioSede,
  className = '',
  compacto = false,
}) => {
  const { sedes, sedeActiva, sedeActivaId, cambiarSede } = useSedes()
  const storeCambiarSede = useSesionStore((s) => s.cambiarSede)

  if (!sedes || sedes.length === 0) return null

  const handleSeleccion = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nuevaSedeId = e.target.value
    cambiarSede(nuevaSedeId)
    storeCambiarSede(nuevaSedeId)
    if (onCambioSede) onCambioSede(nuevaSedeId)
  }

  // Si solo hay una sede
  if (sedes.length === 1) {
    if (compacto) {
      return (
        <div className={`inline-flex items-center gap-1.5 text-xs text-graphite-600 dark:text-graphite-300 ${className}`} title={sedes[0].direccion}>
          <MapPin size={13} className="text-[#D4AF37] shrink-0" />
          <span className="truncate max-w-[140px] font-medium">{sedes[0].nombre}</span>
        </div>
      )
    }

    return (
      <div className={`px-2 py-1.5 rounded-lg border border-surface bg-surface/50 text-xs text-graphite-600 dark:text-graphite-300 flex items-center gap-2 ${className}`}>
        <MapPin size={14} className="text-[#D4AF37] shrink-0" />
        <span className="truncate font-medium">{sedes[0].nombre}</span>
      </div>
    )
  }

  // Múltiples sedes: dropdown interactivo
  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <label htmlFor="selector-sede-select" className="sr-only">Seleccionar sede</label>
      <div className="absolute left-2.5 pointer-events-none text-[#D4AF37]">
        <MapPin size={13} />
      </div>
      <select
        id="selector-sede-select"
        value={sedeActivaId || sedes[0]?.id || ''}
        onChange={handleSeleccion}
        className="pl-7 pr-7 py-1 text-xs font-medium border border-surface rounded-lg bg-surface text-graphite-900 dark:text-graphite-100 surgical:text-black focus:outline-none focus:ring-1 focus:ring-[#D4AF37] cursor-pointer transition-colors"
      >
        {sedes.map((s) => (
          <option key={s.id || s.nombre} value={s.id || s.nombre}>
            {s.nombre}
          </option>
        ))}
      </select>
    </div>
  )
}
