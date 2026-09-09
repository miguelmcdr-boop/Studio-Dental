/**
 * CamposFormularioCita — Campos del formulario de nueva cita (F10-C2.7)
 * Extraído de ModalNuevaCita.jsx para cumplir límites de allowlist (F7-25)
 *
 * Componente "dumb": recibe props + setters del padre (ModalNuevaCita).
 * NO tiene form propio, NO tiene estado local, NO tiene botones.
 *
 * Migración DS v2: CustomSelect para paciente/box (sin emojis 👤📞🪑),
 * iconos lucide para confirmación, ficha y horario.
 */
import React from 'react'
import { Input } from '../../../components/ui/Input'
import { CustomSelect } from '../../../components/ui/CustomSelect'
import { Icon } from '../../../components/Icon'
import { Armchair, Check, Phone, Folder, Clock, Timer } from 'lucide-react'
import { TRATAMIENTOS_RAPIDOS } from '../constants/agendaConstants'

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
  // El CustomSelect emite onChange(value) directo; el padre espera un evento.
  // Wrapper para mantener compatibilidad sin tocar el handler del padre.
  const handlePacienteChange = (value) => {
    handleSelectPacienteChange({ target: { value } })
  }

  return (
    <>
      {/* Sección de paciente */}
      {!esPacienteExpress ? (
        <div>
          <CustomSelect
            label="Seleccionar Paciente de la Base de Datos *"
            options={pacientes.map(p => {
              const nombreFull = `${p.nombre || ''} ${p.apellido || ''}`.trim() || p.nombreCompleto || 'Sin Nombre'
              return {
                value: p.id,
                label: `${nombreFull} ${p.rut ? `(RUT: ${p.rut})` : ''} ${p.telefono ? `- Tel: ${p.telefono}` : ''}`
              }
            })}
            value={pacienteSeleccionadoId}
            onChange={handlePacienteChange}
            placeholder="-- Despliega para elegir paciente registrado --"
          />

          {pacienteSeleccionadoId && (
            <div className="mt-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 font-extrabold text-[11px] flex justify-between items-center">
              <span className="flex items-center gap-1">
                <Icon icon={Check} size="xs" />
                Paciente: <strong>{pacienteNombre}</strong>
              </span>
              <span className="flex items-center gap-1">
                <Icon icon={Phone} size="xs" />
                {pacienteTelefono || 'Sin fono registrado'}
              </span>
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
            <label htmlFor="autoCrear" className="font-bold text-gray-800 dark:text-graphite-100 text-[11px] cursor-pointer flex items-center gap-1">
              <Icon icon={Folder} size="xs" />
              Crear automáticamente Ficha Clínica en el Módulo Pacientes
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

        <CustomSelect
          label="Sillón / Box Dental"
          options={sillonesDentales.map(s => ({
            value: s.nombre,
            label: s.nombre,
            icon: Armchair
          }))}
          value={boxAsignado}
          onChange={(value) => setBoxAsignado(value)}
        />
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
        <span className="flex items-center gap-1">
          <Icon icon={Clock} size="xs" />
          Horario Asignado: {horaInicio} hrs a {horaFinCalculada} hrs
        </span>
        <span className="flex items-center gap-1">
          <Icon icon={Timer} size="xs" />
          {duracionMinutos} min
        </span>
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
