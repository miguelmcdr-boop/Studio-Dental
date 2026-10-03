import React, { memo } from 'react'
import { ACCESOS_RAPIDOS } from '../constants/dashboardConstants'
import { Zap, Calendar, UserPlus, CreditCard, FileText, ArrowRight, type LucideIcon } from 'lucide-react'

const ICONOS_ACCESO: Record<string, LucideIcon> = {
  agenda: Calendar,
  paciente: UserPlus,
  cobro: CreditCard,
  presupuesto: FileText,
}

export interface AccesosRapidosWidgetProps {
  setActiveSection?: (seccion: string) => void
}

export const AccesosRapidosWidget: React.FC<AccesosRapidosWidgetProps> = memo(({ setActiveSection }) => {
  return (
    <div className="relative overflow-hidden bg-surface/90 backdrop-blur-md border border-surface rounded-2xl p-5 shadow-sm text-xs space-y-3.5 before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-gradient-to-r before:from-transparent before:via-[#B88E3A]/40 before:to-transparent">
      <div className="flex items-center justify-between border-b border-surface pb-3">
        <h3 className="font-extrabold text-sm text-graphite-900 dark:text-graphite-50 tracking-tight inline-flex items-center gap-2">
          <Zap size={16} className="text-primary" />
          Accesos Rápidos de Navegación
        </h3>
        <span className="text-[10px] text-graphite-500 dark:text-graphite-400 font-medium">
          Acciones frecuentes
        </span>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {ACCESOS_RAPIDOS.map(acc => {
          const Icono = ICONOS_ACCESO[acc.id] || Zap
          return (
            <button
              key={acc.id}
              type="button"
              onClick={() => setActiveSection && setActiveSection(acc.seccion)}
              className="group p-3.5 rounded-xl border border-surface bg-slate-50/70 dark:bg-graphite-800/70 surgical:bg-graphite-200 hover:bg-white dark:hover:bg-graphite-800 hover:border-primary/50 dark:hover:border-primary/50 font-bold text-left transition-all duration-150 hover:-translate-y-0.5 hover:shadow-xs flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-150">
                  <Icono size={14} />
                </div>
                <span className="text-xs font-bold text-graphite-900 dark:text-graphite-100 group-hover:text-primary dark:group-hover:text-gold-satin transition-colors">
                  {acc.nombre}
                </span>
              </div>
              <ArrowRight size={13} className="text-graphite-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-primary" />
            </button>
          )
        })}
      </div>
    </div>
  )
})

AccesosRapidosWidget.displayName = 'AccesosRapidosWidget'
