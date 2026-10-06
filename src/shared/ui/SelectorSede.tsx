import React from 'react'
import { MapPin } from 'lucide-react'
import { useSedes } from '../../domains/organization/clinic/hooks/useSedes'
import { useSesionStore } from '../../app/stores/sesionStore'

export interface SelectorSedeProps {
  onCambioSede?: (sedeId: string) => void
  className?: string
  compacto?: boolean
  sincronizado?: boolean
}

export const SelectorSede: React.FC<SelectorSedeProps> = ({
  onCambioSede,
  className = '',
  compacto = false,
  sincronizado = true,
}) => {
  const { sedes, sedeActivaId, cambiarSede } = useSedes()
  const storeCambiarSede = useSesionStore((s) => s.cambiarSede)

  if (!sedes || sedes.length === 0) return null

  const handleSeleccion = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nuevaSedeId = e.target.value
    cambiarSede(nuevaSedeId)
    storeCambiarSede(nuevaSedeId)
    if (onCambioSede) onCambioSede(nuevaSedeId)
  }

  const statusTitle = sincronizado ? 'Sede activa y sincronizada' : 'Cambio pendiente'
  const statusIndicator = (
    <span
      className={`w-2 h-2 rounded-full shrink-0 ${sincronizado ? 'bg-emerald-500' : 'bg-amber-400'}`}
      title={statusTitle}
      aria-label={statusTitle}
    />
  )

  // Si solo hay una sede
  if (sedes.length === 1) {
    if (compacto) {
      return (
        <div
          className={`inline-flex items-center gap-1.5 text-xs text-graphite-600 dark:text-graphite-300 ${className}`}
          title={`${sedes[0].nombre} — ${statusTitle}`}
        >
          {statusIndicator}
          <MapPin size={13} className="text-[#D4AF37] shrink-0" />
          <span className="truncate max-w-[140px] font-medium">{sedes[0].nombre}</span>
        </div>
      )
    }

    return (
      <div
        className={`px-2 py-1.5 rounded-lg border border-surface bg-surface/50 text-xs text-graphite-600 dark:text-graphite-300 flex items-center gap-2 ${className}`}
        title={`${sedes[0].nombre} — ${statusTitle}`}
      >
        {statusIndicator}
        <MapPin size={14} className="text-[#D4AF37] shrink-0" />
        <span className="truncate font-medium">{sedes[0].nombre}</span>
      </div>
    )
  }

  // Múltiples sedes: dropdown interactivo con indicador visual
  return (
    <div className={`relative inline-flex items-center gap-1.5 ${className}`}>
      {statusIndicator}
      <div className="relative inline-flex items-center">
        <label htmlFor="selector-sede-select" className="sr-only">Seleccionar sede</label>
        <div className="absolute left-2 pointer-events-none text-[#D4AF37]">
          <MapPin size={12} />
        </div>
        <select
          id="selector-sede-select"
          value={sedeActivaId || sedes[0]?.id || ''}
          onChange={handleSeleccion}
          title={statusTitle}
          className="pl-6 pr-6 py-1 text-xs font-medium border border-surface rounded-lg bg-surface text-graphite-900 dark:text-graphite-100 surgical:text-black focus:outline-none focus:ring-1 focus:ring-[#D4AF37] cursor-pointer transition-colors"
        >
          {sedes.map((s) => (
            <option key={s.id || s.nombre} value={s.id || s.nombre}>
              {s.nombre}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
