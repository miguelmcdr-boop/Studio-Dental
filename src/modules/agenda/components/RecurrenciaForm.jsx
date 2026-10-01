/**
 * RecurrenciaForm — F7-27
 *
 * Formulario de recurrencia para citas recurrentes.
 * Extraído de ModalNuevaCita para mantener el límite de 250 líneas.
 *
 * Props:
 * - recurrencia: 'ninguna' | 'semanal' | 'mensual' | 'anual'
 * - frecuencia: número (cada X períodos)
 * - diaSemana: 0-6 (solo semanal)
 * - diaMes: 1-31 (solo mensual)
 * - fechaFin: string YYYY-MM-DD (opcional)
 * - numInstancias: número de citas a generar
 * - proximasCitas: array de citas generadas (preview)
 * - setters para cada campo
 */
import React, { memo } from 'react'
import { Calendar, RefreshCw } from 'lucide-react'

export const RecurrenciaForm = memo(({
  recurrencia,
  setRecurrencia,
  frecuencia,
  setFrecuencia,
  diaSemana,
  setDiaSemana,
  diaMes,
  setDiaMes,
  fechaFin,
  setFechaFin,
  numInstancias,
  setNumInstancias,
  proximasCitas,
  fechaMinima,
}) => {
  return (
    <div className="bg-graphite-50 dark:bg-graphite-800 border border-graphite-200 dark:border-graphite-700 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <RefreshCw size={14} className="text-graphite-500 dark:text-graphite-400" />
        <h4 className="text-xs font-bold text-graphite-900 dark:text-graphite-50">
          Recurrencia de la cita
        </h4>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Tipo de recurrencia */}
        <div>
          <label className="block text-[10px] font-semibold text-graphite-600 dark:text-graphite-400 mb-1">
            Repetir
          </label>
          <select
            value={recurrencia}
            onChange={(e) => setRecurrencia(e.target.value)}
            className="w-full p-2 border border-graphite-200 dark:border-graphite-700 rounded-lg bg-white dark:bg-graphite-800 text-xs"
          >
            <option value="ninguna">No repetir</option>
            <option value="semanal">Semanal</option>
            <option value="mensual">Mensual</option>
            <option value="anual">Anual</option>
          </select>
        </div>

        {/* Frecuencia */}
        {recurrencia !== 'ninguna' && (
          <div>
            <label className="block text-[10px] font-semibold text-graphite-600 dark:text-graphite-400 mb-1">
              Cada cuántos períodos
            </label>
            <input
              type="number"
              min="1"
              max="12"
              value={frecuencia}
              onChange={(e) => setFrecuencia(parseInt(e.target.value, 10) || 1)}
              className="w-full p-2 border border-graphite-200 dark:border-graphite-700 rounded-lg bg-white dark:bg-graphite-800 text-xs"
            />
          </div>
        )}

        {/* Día de la semana (solo semanal) */}
        {recurrencia === 'semanal' && (
          <div>
            <label className="block text-[10px] font-semibold text-graphite-600 dark:text-graphite-400 mb-1">
              Día de la semana
            </label>
            <select
              value={diaSemana}
              onChange={(e) => setDiaSemana(parseInt(e.target.value, 10))}
              className="w-full p-2 border border-graphite-200 dark:border-graphite-700 rounded-lg bg-white dark:bg-graphite-800 text-xs"
            >
              <option value="0">Domingo</option>
              <option value="1">Lunes</option>
              <option value="2">Martes</option>
              <option value="3">Miércoles</option>
              <option value="4">Jueves</option>
              <option value="5">Viernes</option>
              <option value="6">Sábado</option>
            </select>
          </div>
        )}

        {/* Día del mes (solo mensual) */}
        {recurrencia === 'mensual' && (
          <div>
            <label className="block text-[10px] font-semibold text-graphite-600 dark:text-graphite-400 mb-1">
              Día del mes
            </label>
            <input
              type="number"
              min="1"
              max="31"
              value={diaMes}
              onChange={(e) => setDiaMes(parseInt(e.target.value, 10) || 1)}
              className="w-full p-2 border border-graphite-200 dark:border-graphite-700 rounded-lg bg-white dark:bg-graphite-800 text-xs"
            />
          </div>
        )}

        {/* Fecha fin */}
        {recurrencia !== 'ninguna' && (
          <div>
            <label className="block text-[10px] font-semibold text-graphite-600 dark:text-graphite-400 mb-1">
              Hasta (opcional)
            </label>
            <input
              type="date"
              value={fechaFin}
              min={fechaMinima}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-full p-2 border border-graphite-200 dark:border-graphite-700 rounded-lg bg-white dark:bg-graphite-800 text-xs"
            />
          </div>
        )}

        {/* Número de instancias */}
        {recurrencia !== 'ninguna' && (
          <div>
            <label className="block text-[10px] font-semibold text-graphite-600 dark:text-graphite-400 mb-1">
              Cuántas citas generar
            </label>
            <input
              type="number"
              min="2"
              max="12"
              value={numInstancias}
              onChange={(e) => setNumInstancias(parseInt(e.target.value, 10) || 4)}
              className="w-full p-2 border border-graphite-200 dark:border-graphite-700 rounded-lg bg-white dark:bg-graphite-800 text-xs"
            />
          </div>
        )}
      </div>

      {/* Preview de próximas citas */}
      {recurrencia !== 'ninguna' && proximasCitas.length > 0 && (
        <div className="bg-clinical-info/5 dark:bg-sky-400/10 border border-clinical-info/20 dark:border-sky-400/30 rounded-lg p-3">
          <p className="text-[10px] font-bold text-clinical-info dark:text-sky-300 mb-1.5 flex items-center gap-1">
            <Calendar size={11} />
            Próximas {proximasCitas.length} citas:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {proximasCitas.slice(0, 4).map((cita, index) => (
              <span
                key={index}
                className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-white dark:bg-graphite-800 border border-clinical-info/30 dark:border-sky-400/40 text-graphite-700 dark:text-graphite-300"
              >
                {cita.fecha}
              </span>
            ))}
            {proximasCitas.length > 4 && (
              <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-white dark:bg-graphite-800 border border-clinical-info/30 dark:border-sky-400/40 text-graphite-700 dark:text-graphite-300">
                +{proximasCitas.length - 4} más
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
})

RecurrenciaForm.displayName = 'RecurrenciaForm'
