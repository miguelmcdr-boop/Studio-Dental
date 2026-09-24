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
    color: 'text-clinical-info dark:text-sky-300',
    bg: 'bg-clinical-info/10 dark:bg-sky-400/15',
    label: 'Receta',
  },
  certificado_pendiente: {
    icon: FileCheck,
    color: 'text-clinical-warning dark:text-amber-300',
    bg: 'bg-clinical-warning/10 dark:bg-amber-400/15',
    label: 'Certificado',
  },
  evolucion_pendiente: {
    icon: Stethoscope,
    color: 'text-clinical-success dark:text-emerald-300',
    bg: 'bg-clinical-success/10 dark:bg-emerald-400/15',
    label: 'Evolución',
  },
}

const TareaCard = ({ tarea, completada, onToggle, onNavegar }) => {
  const estilo = TIPO_STYLES[tarea.tipo] || TIPO_STYLES.evolucion_pendiente
  const Icono = estilo.icon

  return (
    <div
      className={`p-3 rounded-xl border transition-all ${
        completada
          ? 'bg-graphite-50 dark:bg-graphite-700/50 border-graphite-200 dark:border-graphite-600 opacity-60'
          : 'bg-white dark:bg-graphite-800 border-graphite-200 dark:border-graphite-700 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={() => onToggle && onToggle(tarea)}
          className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
            completada
              ? 'bg-clinical-success border-clinical-success text-white'
              : 'border-graphite-300 dark:border-graphite-600 hover:border-clinical-success'
          }`}
          aria-label={completada ? 'Marcar como pendiente' : 'Marcar como completada'}
        >
          {completada && <CheckCircle size={12} />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded ${estilo.bg} ${estilo.color}`}>
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
            className="flex-shrink-0 text-graphite-400 hover:text-graphite-600 dark:hover:text-graphite-200 transition-colors"
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
      <div className="bg-white dark:bg-graphite-800 border border-graphite-200 dark:border-graphite-700 rounded-2xl p-6 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-clinical-success/10 dark:bg-emerald-400/15 text-clinical-success dark:text-emerald-300 mb-3">
          <CheckCircle size={24} />
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
    <div className="bg-white dark:bg-graphite-800 border border-graphite-200 dark:border-graphite-700 rounded-2xl p-4" role="region" aria-label="Tareas clínicas pendientes">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-graphite-900 dark:text-graphite-50 flex items-center gap-2">
          <Stethoscope size={16} />
          Tareas Clínicas Pendientes
        </h3>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-clinical-warning/10 dark:bg-amber-400/15 text-clinical-warning dark:text-amber-300">
          {tareasPendientes.length} pendiente{tareasPendientes.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto">
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
