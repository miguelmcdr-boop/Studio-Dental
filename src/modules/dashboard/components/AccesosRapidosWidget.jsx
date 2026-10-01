import React, { memo } from 'react'
import { ACCESOS_RAPIDOS } from '../constants/dashboardConstants'
import { Zap, Calendar, UserPlus, CreditCard, FileText, ArrowRight } from 'lucide-react'

const ICONOS_ACCESO = {
  agenda: Calendar,
  paciente: UserPlus,
  cobro: CreditCard,
  presupuesto: FileText,
}

export const AccesosRapidosWidget = memo(({ setActiveSection }) => {
  return (
    <div className="relative overflow-hidden bg-white/90 dark:bg-[#0F172A]/90 surgical:bg-[#F1F5F9] backdrop-blur-md border border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] rounded-2xl p-5 shadow-sm text-xs space-y-3.5 before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-gradient-to-r before:from-transparent before:via-[#B88E3A]/40 before:to-transparent">
      <div className="flex items-center justify-between border-b border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] pb-3">
        <h3 className="font-extrabold text-sm text-graphite-900 dark:text-graphite-50 tracking-tight inline-flex items-center gap-2">
          <Zap size={16} className="text-[#B88E3A]" />
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
              className="group p-3.5 rounded-xl border border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] bg-slate-50/70 dark:bg-[#1E293B]/70 surgical:bg-[#E2E8F0] hover:bg-white dark:hover:bg-[#1E293B] hover:border-[#B88E3A]/50 dark:hover:border-[#B88E3A]/50 font-bold text-left transition-all duration-150 hover:-translate-y-0.5 hover:shadow-xs flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-[#B88E3A]/10 text-[#B88E3A] dark:text-[#E5C378] group-hover:bg-[#B88E3A] group-hover:text-white transition-colors duration-150">
                  <Icono size={14} />
                </div>
                <span className="text-xs font-bold text-graphite-900 dark:text-graphite-100 group-hover:text-[#B88E3A] dark:group-hover:text-[#E5C378] transition-colors">
                  {acc.nombre}
                </span>
              </div>
              <ArrowRight size={13} className="text-graphite-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-[#B88E3A]" />
            </button>
          )
        })}
      </div>
    </div>
  )
})

AccesosRapidosWidget.displayName = 'AccesosRapidosWidget'