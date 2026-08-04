import React, { memo, useState } from 'react'
import { PATOLOGIAS_GES_ODONTO, DIAGNOSTICOS_URGENCIA_COMMON } from '../constants/urgenciasGesConstants'

export const FormConstanciaGes = memo(({ pacientes = [], alRegistrar }) => {
  const [pacienteId, setPacienteId] = useState('')
  const [patologiaGes, setPatologiaGes] = useState(PATOLOGIAS_GES_ODONTO[0].id)
  const [diagnostico, setDiagnostico] = useState(DIAGNOSTICOS_URGENCIA_COMMON[0])
  const [indicacionesTratamiento, setIndicacionesTratamiento] = useState('')
  const [aceptaAtencion, setAceptaAtencion] = useState(true)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!pacienteId) {
      alert('Selecciona un paciente de la lista.')
      return
    }

    const pac = pacientes.find(p => p.id === parseInt(pacienteId) || p.id === pacienteId)
    const patObj = PATOLOGIAS_GES_ODONTO.find(p => p.id === patologiaGes)

    const registro = {
      pacienteId: pac?.id,
      pacienteNombre: pac?.nombre || 'Paciente',
      pacienteRut: pac?.rut || 'N/I',
      pacientePrevision: pac?.prevision || 'Fonasa',
      patologiaGesId: patObj?.id,
      patologiaNombre: patObj?.nombre,
      patologiaCodigo: patObj?.codigo,
      diagnostico,
      indicacionesTratamiento,
      aceptaAtencion
    }

    alRegistrar(registro)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4 text-xs">
      <div className="border-b pb-2">
        <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider">
          📄 Formulario Oficial de Constancia de Información al Paciente GES / AUGE
        </h3>
        <p className="text-gray-500 text-[11px]">
          Notificación obligatoria de confirmación de diagnóstico de problema de salud GES.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block font-semibold text-gray-700 mb-1">Seleccionar Paciente *</label>
          <select
            value={pacienteId}
            onChange={(e) => setPacienteId(e.target.value)}
            required
            className="w-full p-2.5 rounded-xl border border-gray-300 bg-white font-bold"
          >
            <option value="">-- Seleccionar paciente --</option>
            {pacientes.map(p => (
              <option key={p.id} value={p.id}>{p.nombre} ({p.rut})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold text-gray-700 mb-1">Problema de Salud GES / AUGE *</label>
          <select
            value={patologiaGes}
            onChange={(e) => setPatologiaGes(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-gray-300 bg-white font-semibold text-blue-900"
          >
            {PATOLOGIAS_GES_ODONTO.map(p => (
              <option key={p.id} value={p.id}>[{p.codigo}] {p.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block font-semibold text-gray-700 mb-1">Diagnóstico Clínico (CIE-10)</label>
          <select
            value={diagnostico}
            onChange={(e) => setDiagnostico(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-gray-300 bg-white"
          >
            {DIAGNOSTICOS_URGENCIA_COMMON.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold text-gray-700 mb-1">Decisión del Paciente</label>
          <div className="flex gap-4 pt-2">
            <label className="flex items-center gap-2 font-bold text-emerald-800 cursor-pointer">
              <input
                type="radio"
                name="acepta"
                checked={aceptaAtencion}
                onChange={() => setAceptaAtencion(true)}
              />
              Acepta atención prestador
            </label>
            <label className="flex items-center gap-2 font-bold text-red-800 cursor-pointer">
              <input
                type="radio"
                name="acepta"
                checked={!aceptaAtencion}
                onChange={() => setAceptaAtencion(false)}
              />
              Rechaza / Derivación
            </label>
          </div>
        </div>
      </div>

      <div>
        <label className="block font-semibold text-gray-700 mb-1">Indicaciones Clínicas / Conducta Inmediata</label>
        <textarea
          rows="2"
          placeholder="Ej: Se realiza trepanación y alivio de oclusión en pieza 1.6, indicación de farmacoterapia analgésica/antibiótica..."
          value={indicacionesTratamiento}
          onChange={(e) => setIndicacionesTratamiento(e.target.value)}
          className="w-full p-2.5 rounded-xl border border-gray-300"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-black text-white font-bold py-2.5 rounded-xl hover:bg-gray-800 transition-colors cursor-pointer shadow-xs"
      >
        📄 Generar y Emitir Constancia GES
      </button>
    </form>
  )
})

FormConstanciaGes.displayName = 'FormConstanciaGes'