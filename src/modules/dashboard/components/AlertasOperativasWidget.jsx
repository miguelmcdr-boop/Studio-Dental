/**
 * AlertasOperativasWidget — F7-27
 *
 * Widget de Dashboard que muestra alertas operativas críticas:
 * - Citas sin confirmar (últimas 24h)
 * - Pacientes con deuda > $50.000
 * - Post-operatorios por enviar (últimas 48h)
 *
 * Diseño:
 * - Grid responsive (1 col mobile, 2+ tablet/desktop)
 * - Colores semánticos por severidad (alta=rojo, media=ámbar, baja=verde)
 * - Click en alerta navega al contexto (paciente, cita, etc.)
 * - Estado vacío si no hay alertas
 */
import React, { memo } from 'react'
import { AlertTriangle, DollarSign, Calendar, ArrowRight } from 'lucide-react'

const SEVERIDAD_STYLES = {
  alta: {
    bg: 'bg-clinical-error/10 dark:bg-red-400/15',
    border: 'border-clinical-error dark:border-red-400',
    text: 'text-clinical-error dark:text-red-300',
    icon: AlertTriangle,
  },
  media: {
    bg: 'bg-clinical-warning/10 dark:bg-amber-400/15',
    border: 'border-clinical-warning dark:border-amber-400',
    text: 'text-clinical-warning dark:text-amber-300',
    icon: Calendar,
  },
  baja: {
    bg: 'bg-clinical-success/10 dark:bg-emerald-400/15',
    border: 'border-clinical-success dark:border-emerald-400',
    text: 'text-clinical-success dark:text-emerald-300',
    icon: ArrowRight,
  },
}

const ICONO_TIPO = {
  cita_sin_confirmar: Calendar,
  deuda_pendiente: DollarSign,
  post_operatorio_pendiente: ArrowRight,
}

const AlertaCard = ({ alerta, onClick }) => {
  const estilo = SEVERIDAD_STYLES[alerta.severidad] || SEVERIDAD_STYLES.baja
  const Icono = ICONO_TIPO[alerta.tipo] || AlertTriangle

  return (
    <button
      type="button"
      onClick={() => onClick && onClick(alerta)}
      className={`w-full text-left p-3 rounded-xl border-2 ${estilo.bg} ${estilo.border} hover:shadow-md transition-all cursor-pointer`}
      aria-label={`Alerta: ${alerta.titulo}. ${alerta.descripcion}`}
    >
      <div className="flex items-start gap-2">
        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${estilo.text}`}>
          <Icono size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-graphite-900 dark:text-graphite-50 mb-0.5">
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

export const AlertasOperativasWidget = memo(({ alertas = [], onNavegarAlerta }) => {
  if (!alertas || alertas.length === 0) {
    return (
      <div className="bg-white dark:bg-graphite-800 border border-graphite-200 dark:border-graphite-700 rounded-2xl p-6 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-clinical-success/10 dark:bg-emerald-400/15 text-clinical-success dark:text-emerald-300 mb-3">
          <AlertTriangle size={24} />
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
    <div className="bg-white dark:bg-graphite-800 border border-graphite-200 dark:border-graphite-700 rounded-2xl p-4" role="region" aria-label="Alertas operativas">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-graphite-900 dark:text-graphite-50 flex items-center gap-2">
          <AlertTriangle size={16} />
          Alertas Operativas
        </h3>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-clinical-error/10 dark:bg-red-400/15 text-clinical-error dark:text-red-300">
          {alertas.length} pendiente{alertas.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-80 overflow-y-auto">
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
