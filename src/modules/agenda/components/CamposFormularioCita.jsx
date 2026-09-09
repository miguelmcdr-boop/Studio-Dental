/**
 * CamposFormularioCita — Campos del formulario de nueva cita
 * Extraído de ModalNuevaCita.jsx para cumplir límites de allowlist (F7-25)
 */
import React from 'react'
import { Input } from '../../../components/ui/Input'

const TRATAMIENTOS_RAPIDOS = [
  'Evaluación / Diagnóstico Inicial',
  'Limpieza / Destartraje Higiene',
  'Obturación / Tapadura Resina',
  'Exodoncia / Extracción Simple',
  'Exodoncia Tercer Molar (Muela Juicio)',
  'Tratamiento de Conducto (Endodoncia)',
  'Control de Ortodoncia / Frenillos',
  'Instalación / Blanqueamiento Dental',
  'Control / Urgencia Dental'
]

export const CamposFormularioCita = ({
  pacientes,
  sillonesDentales,
  esPacienteExpress,
  pacienteSeleccionadoId,
  pacienteNombre,
  pacienteTelefono,
  pacienteRut,
  autoCrearFicha,
  tratamiento,
  boxAsignado,
  fecha,
  horaInicio,
  horaFinCalculada,
  duracionMinutos,
  observaciones,
  setPacienteSeleccionadoId,
  setPacienteNombre,
  setPacienteTelefono,
  setPacienteRut,
  setAutoCrearFicha,
  setTratamiento,
  setBoxAsignado,
  setFecha,
  setHoraInicio,
  setDuracionMinutos,
  setObservaciones,
  handleSelectPacienteChange
}) => {
  return (
    <>
      {/* Sección de paciente */}
      {!esPacienteExpress ? (
        <div>
          <label className="font-extrabold text-gray-800 dark:text-graphite-100 block mb-1">
            Seleccionar Paciente de la Base de Datos *
          </label>
          <select
            value={pacienteSeleccionadoId}
            onChange={handleSelectPacienteChange}
            className="w-full p-3 rounded-xl border border-gray-300 dark:border-graphite-600 font-bold bg-gray-50 dark:bg-graphite-900 focus:bg-white dark:focus:bg-graphite-800 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-graphite-400 cursor-pointer text-xs dark:text-graphite-100"
            required
          >
            <option value="">-- Despliega para elegir paciente registrado --</option>
            {pacientes.map(p => {
              const nombreFull = `${p.nombre || ''} ${p.apellido || ''}`.trim() || p.nombreCompleto || 'Sin Nombre'
              return (
                <option key={p.id} value={p.id}>
                  👤 {nombreFull} {p.rut ? `(RUT: ${p.rut})` : ''} {p.telefono ? `- 📞 ${p.telefono}` : ''}
                </option>
              )
            })}
          </select>

          {pacienteSeleccionadoId && (
            <div className="mt-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 font-extrabold text-[11px] flex justify-between items-center">
              <span>✓ Paciente: <strong>{pacienteNombre}</strong></span>
              <span>📞 {pacienteTelefono || 'Sin fono registrado'}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3 bg-gray-50 dark:bg-graphite-800 p-3 rounded-2xl border border-gray-200 dark:border-graphite-700">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Nombre Completo"
              type="text"
              value={pacienteNombre}
              onChange={(e) => setPacienteNombre(e.target.value)}
              placeholder="Ej. María González"
              required
            />

            <Input
              label="Teléfono / WhatsApp"
              type="text"
              value={pacienteTelefono}
              onChange={(e) => setPacienteTelefono(e.target.value)}
              placeholder="+56 9 1234 5678"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="autoCrear"
              checked={autoCrearFicha}
              onChange={(e) => setAutoCrearFicha(e.target.checked)}
              className="w-4 h-4 rounded text-black focus:ring-black cursor-pointer"
            />
            <label htmlFor="autoCrear" className="font-bold text-gray-800 dark:text-graphite-100 text-[11px] cursor-pointer">
              📁 Crear automáticamente Ficha Clínica en el Módulo Pacientes
            </label>
          </div>
        </div>
      )}

      {/* Tratamiento + Box */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="font-extrabold text-gray-700 dark:text-graphite-300 block mb-1">Tratamiento / Motivo *</label>
          <select
            value={tratamiento}
            onChange={(e) => setTratamiento(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-graphite-600 font-bold bg-gray-50 dark:bg-graphite-900 focus:bg-white dark:focus:bg-graphite-800 cursor-pointer dark:text-graphite-100"
          >
            {TRATAMIENTOS_RAPIDOS.map((t, idx) => (
              <option key={idx} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="font-extrabold text-gray-700 dark:text-graphite-300 block mb-1">Sillón / Box Dental</label>
          <select
            value={boxAsignado}
            onChange={(e) => setBoxAsignado(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-graphite-600 font-bold bg-gray-50 dark:bg-graphite-900 focus:bg-white dark:focus:bg-graphite-800 cursor-pointer dark:text-graphite-100"
          >
            {sillonesDentales.map(s => (
              <option key={s.id} value={s.nombre}>🪑 {s.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Fecha + Hora + Duración */}
      <div className="grid grid-cols-3 gap-3">
        <Input
          label="Fecha"
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          required
        />

        <Input
          label="Hora Inicio"
          type="time"
          value={horaInicio}
          onChange={(e) => setHoraInicio(e.target.value)}
          required
        />

        <div>
          <label className="font-extrabold text-gray-700 dark:text-graphite-300 block mb-1">Duración</label>
          <select
            value={duracionMinutos}
            onChange={(e) => setDuracionMinutos(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-graphite-600 font-bold bg-gray-50 dark:bg-graphite-900 cursor-pointer dark:text-graphite-100"
          >
            <option value="15">15 min</option>
            <option value="30">30 min</option>
            <option value="45">45 min</option>
            <option value="60">60 min (1 hr)</option>
            <option value="90">90 min (1.5 hrs)</option>
            <option value="120">120 min (2 hrs)</option>
          </select>
        </div>
      </div>

      {/* Horario calculado */}
      <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 flex justify-between items-center text-[11px] font-extrabold text-blue-900 dark:text-blue-200">
        <span>⏰ Horario Asignado: {horaInicio} hrs a {horaFinCalculada} hrs</span>
        <span>⏱️ {duracionMinutos} min</span>
      </div>

      {/* Observaciones */}
      <div>
        <label className="font-extrabold text-gray-700 dark:text-graphite-300 block mb-1">Observaciones / Notas Clínicas</label>
        <textarea
          rows={2}
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          placeholder="Instrucciones previas, sensibilidad, paciente ansioso..."
          className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-graphite-600 font-bold bg-gray-50 dark:bg-graphite-900 focus:bg-white dark:focus:bg-graphite-800 resize-none dark:text-graphite-100"
        />
      </div>
    </>
  )
}
