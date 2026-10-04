import React, { memo } from 'react'
import { AlertTriangle, DollarSign, Calendar, ArrowRight, type LucideIcon } from 'lucide-react'

export interface AlertaOperativa {
  tipo: string
  severidad?: 'alta' | 'media' | 'baja' | string
  titulo: string
  descripcion: string
  pacienteId?: string | number
  citaId?: string | number
  [key: string]: unknown
}

interface SeveridadStyle {
  bg: string
  border: string
  text: string
  icon: LucideIcon
}

const SEVERIDAD_STYLES: Record<string, SeveridadStyle> = {
  alta: {
    bg: 'bg-rose-50/80 dark:bg-rose-950/30 surgical:bg-rose-100/50',
    border: 'border-rose-200 dark:border-rose-800/60 surgical:border-rose-300',
    text: 'text-rose-700 dark:text-rose-300 surgical:text-rose-900',
    icon: AlertTriangle,
  },
  media: {
    bg: 'bg-amber-50/80 dark:bg-amber-950/30 surgical:bg-amber-100/50',
    border: 'border-amber-200 dark:border-amber-800/60 surgical:border-amber-300',
    text: 'text-amber-800 dark:text-amber-300 surgical:text-amber-900',
    icon: Calendar,
  },
  baja: {
    bg: 'bg-emerald-50/80 dark:bg-emerald-950/30 surgical:bg-emerald-100/50',
    border: 'border-emerald-200 dark:border-emerald-800/60 surgical:border-emerald-300',
    text: 'text-emerald-800 dark:text-emerald-300 surgical:text-emerald-900',
    icon: ArrowRight,
  },
}

const ICONO_TIPO: Record<string, LucideIcon> = {
  cita_sin_confirmar: Calendar,
  deuda_pendiente: DollarSign,
  post_operatorio_pendiente: ArrowRight,
}

interface AlertaCardProps {
  alerta: AlertaOperativa
  onClick?: (alerta: AlertaOperativa) => void
}

const AlertaCard: React.FC<AlertaCardProps> = ({ alerta, onClick }) => {
  const estilo = (alerta.severidad && SEVERIDAD_STYLES[alerta.severidad]) || SEVERIDAD_STYLES.baja
  const Icono = ICONO_TIPO[alerta.tipo] || AlertTriangle

  return (
    <button
      type="button"
      onClick={() => onClick && onClick(alerta)}
      className={`w-full text-left p-3.5 rounded-xl border ${estilo.bg} ${estilo.border} hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 cursor-pointer`}
      aria-label={`Alerta: ${alerta.titulo}. ${alerta.descripcion}`}
    >
      <div className="flex items-start gap-2.5">
        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${estilo.text} bg-white/60 dark:bg-black/30 border border-current/20`}>
          <Icono size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-graphite-900 dark:text-graphite-50 mb-0.5 tracking-tight">
            {alerta.titulo}
          </p>
          <p className="text-[10px] text-graphite-600 dark:text-graphite-400 truncate">
            {alerta.descripcion}
          </p>
        </div>
      </div>
    </button>
  )
}

export interface AlertasOperativasWidgetProps {
  alertas?: AlertaOperativa[]
  onNavegarAlerta?: (alerta: AlertaOperativa) => void
}

export const AlertasOperativasWidget: React.FC<AlertasOperativasWidgetProps> = memo(({
  alertas = [],
  onNavegarAlerta
}) => {
  if (!alertas || alertas.length === 0) {
    return (
      <div className="relative overflow-hidden bg-surface/90 backdrop-blur-md border border-surface rounded-2xl p-6 text-center before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-gradient-to-r before:from-transparent before:via-emerald-500/40 before:to-transparent">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 mb-3">
          <AlertTriangle size={22} />
        </div>
        <h4 className="text-sm font-bold text-graphite-800 dark:text-graphite-100 mb-1">
          Sin alertas operativas
        </h4>
        <p className="text-xs text-graphite-500 dark:text-graphite-400">
          Todas las operaciones del día están al día.
        </p>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden bg-surface/90 backdrop-blur-md border border-surface rounded-2xl p-5 shadow-sm before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-gradient-to-r before:from-transparent before:via-rose-500/40 before:to-transparent" role="region" aria-label="Alertas operativas">
      <div className="flex items-center justify-between mb-4 border-b border-surface pb-3">
        <h3 className="text-sm font-extrabold text-graphite-900 dark:text-graphite-50 flex items-center gap-2 tracking-tight">
          <AlertTriangle size={16} className="text-rose-500" />
          Alertas Operativas
        </h3>
        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50 tabular-nums">
          {alertas.length} pendiente{alertas.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-80 overflow-y-auto pr-1">
        {alertas.map((alerta, index) => (
          <AlertaCard
            key={`${alerta.tipo}_${index}`}
            alerta={alerta}
            onClick={onNavegarAlerta}
          />
        ))}
      </div>
    </div>
  )
})

AlertasOperativasWidget.displayName = 'AlertasOperativasWidget'
