/**
 * TareasClinicasWidget — F7-27
 *
 * Widget de Dashboard que muestra tareas clínicas pendientes:
 * - Recetas por emitir (pacientes con consulta hoy sin receta)
 * - Certificados pendientes (pacientes solicitaron pero no se emitieron)
 * - Evoluciones clínicas faltantes (citas finalizadas sin nota)
 *
 * Diseño:
 * - Lista de tareas con checkbox para marcar como completadas
 * - Agrupadas por tipo (recetas, certificados, evoluciones)
 * - Click en tarea navega al paciente/módulo correspondiente
 * - Badge con count de tareas pendientes
 */
import React, { memo, useState } from 'react'
import { FileText, FileCheck, Stethoscope, CheckCircle, ArrowRight } from 'lucide-react'

const TIPO_STYLES = {
  receta_pendiente: {
    icon: FileText,
    color: 'text-sky-700 dark:text-sky-300',
    bg: 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800/50',
    label: 'Receta',
  },
  certificado_pendiente: {
    icon: FileCheck,
    color: 'text-amber-800 dark:text-amber-300',
    bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/50',
    label: 'Certificado',
  },
  evolucion_pendiente: {
    icon: Stethoscope,
    color: 'text-emerald-800 dark:text-emerald-300',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/50',
    label: 'Evolución',
  },
}

const TareaCard = ({ tarea, completada, onToggle, onNavegar }) => {
  const estilo = TIPO_STYLES[tarea.tipo] || TIPO_STYLES.evolucion_pendiente
  const Icono = estilo.icon

  return (
    <div
      className={`p-3 rounded-xl border transition-all duration-150 ${
        completada
          ? 'bg-slate-50/50 dark:bg-graphite-800/30 border-surface opacity-60'
          : 'bg-white/90 dark:bg-graphite-800/80 surgical:bg-graphite-200 border-surface hover:shadow-xs'
      }`}
    >
      <div className="flex items-start gap-2.5">
        <button
          type="button"
          onClick={() => onToggle && onToggle(tarea)}
          className={`flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors cursor-pointer mt-0.5 ${
            completada
              ? 'bg-emerald-600 border-emerald-600 text-white'
              : 'border-slate-300 dark:border-graphite-600 hover:border-emerald-500'
          }`}
          aria-label={completada ? 'Marcar como pendiente' : 'Marcar como completada'}
        >
          {completada && <CheckCircle size={12} />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border ${estilo.bg} ${estilo.color}`}>
              <Icono size={10} />
              {estilo.label}
            </span>
            <p className={`text-xs font-bold ${completada ? 'line-through text-graphite-400' : 'text-graphite-900 dark:text-graphite-50'}`}>
              {tarea.titulo}
            </p>
          </div>
          <p className="text-[10px] text-graphite-600 dark:text-graphite-400 truncate">
            {tarea.descripcion}
          </p>
        </div>

        {!completada && onNavegar && (
          <button
            type="button"
            onClick={() => onNavegar(tarea)}
            className="flex-shrink-0 text-slate-400 hover:text-primary dark:hover:text-gold-satin transition-colors p-1"
            aria-label={`Ir a ${tarea.titulo}`}
          >
            <ArrowRight size={14} />
          </button>
        )}
      </div>
    </div>
  )
}

export const TareasClinicasWidget = memo(({ tareas = [], onNavegarTarea }) => {
  const [tareasCompletadas, setTareasCompletadas] = useState(new Set())

  const handleToggle = (tarea) => {
    setTareasCompletadas((prev) => {
      const nueva = new Set(prev)
      const key = `${tarea.tipo}_${tarea.pacienteId}_${tarea.fecha}`
      if (nueva.has(key)) {
        nueva.delete(key)
      } else {
        nueva.add(key)
      }
      return nueva
    })
  }

  const tareasPendientes = tareas.filter((t) => !tareasCompletadas.has(`${t.tipo}_${t.pacienteId}_${t.fecha}`))

  if (!tareas || tareas.length === 0) {
    return (
      <div className="relative overflow-hidden bg-surface/90 backdrop-blur-md border border-surface rounded-2xl p-6 text-center before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-gradient-to-r before:from-transparent before:via-emerald-500/40 before:to-transparent">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 mb-3">
          <CheckCircle size={22} />
        </div>
        <h4 className="text-sm font-bold text-graphite-800 dark:text-graphite-100 mb-1">
          Sin tareas clínicas pendientes
        </h4>
        <p className="text-xs text-graphite-500 dark:text-graphite-400">
          Todos los registros clínicos del día están completos.
        </p>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden bg-surface/90 backdrop-blur-md border border-surface rounded-2xl p-5 shadow-sm before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-gradient-to-r before:from-transparent before:via-[#B88E3A]/40 before:to-transparent" role="region" aria-label="Tareas clínicas pendientes">
      <div className="flex items-center justify-between mb-4 border-b border-surface pb-3">
        <h3 className="text-sm font-extrabold text-graphite-900 dark:text-graphite-50 flex items-center gap-2 tracking-tight">
          <Stethoscope size={16} className="text-primary" />
          Tareas Clínicas Pendientes
        </h3>
        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50 tabular-nums">
          {tareasPendientes.length} pendiente{tareasPendientes.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {tareas.map((tarea, index) => {
          const key = `${tarea.tipo}_${tarea.pacienteId}_${tarea.fecha}`
          return (
            <TareaCard
              key={key}
              tarea={tarea}
              completada={tareasCompletadas.has(key)}
              onToggle={handleToggle}
              onNavegar={onNavegarTarea}
            />
          )
        })}
      </div>
    </div>
  )
})

TareasClinicasWidget.displayName = 'TareasClinicasWidget'
