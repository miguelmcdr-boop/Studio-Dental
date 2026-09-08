/**
 * CamposFormularioInteraccion — Campos del formulario de interacciones farmacológicas
 * Extraído de ModalEditarInteraccion.jsx para cumplir límites de allowlist (F7-25)
 * F4-03f-5b
 */
import React from 'react'
import { NIVELES_SEVERIDAD_INTERACCION } from '../schemas/interaccionSchema'

const SEVERIDAD_CONFIG = {
  mayor: {
    label: 'Mayor',
    descripcion: 'Riesgo grave — evitar combinación o monitorizar estrechamente',
    color: 'border-red-400 bg-red-50',
    badge: 'bg-red-100 text-red-800',
    icono: '🔴'
  },
  moderada: {
    label: 'Moderada',
    descripcion: 'Precaución — evaluar riesgo/beneficio y considerar alternativas',
    color: 'border-yellow-400 bg-yellow-50',
    badge: 'bg-yellow-100 text-yellow-800',
    icono: '🟡'
  },
  menor: {
    label: 'Menor',
    descripcion: 'Interacción leve — generalmente no requiere intervención',
    color: 'border-green-400 bg-green-50',
    badge: 'bg-green-100 text-green-800',
    icono: '🟢'
  }
}

const campoError = (errores, campo) => errores[campo] ? 'border-red-400 bg-red-50' : 'border-gray-300'
const mensajeError = (errores, campo) => errores[campo] && (
  <p className="text-xs text-red-600 mt-1">{errores[campo]}</p>
)

export const CamposFormularioInteraccion = ({ form, errores, handleChange }) => {
  return (
    <>
      {/* Fila 1: Fármaco A y B */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Fármaco A <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.farmaco_a}
            onChange={(e) => handleChange('farmaco_a', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg text-sm ${campoError(errores, 'farmaco_a')}`}
            placeholder="Ej: Macrólidos (Claritromicina, Eritromicina)"
          />
          {mensajeError(errores, 'farmaco_a')}
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Fármaco B / Grupo <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.farmaco_b}
            onChange={(e) => handleChange('farmaco_b', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg text-sm ${campoError(errores, 'farmaco_b')}`}
            placeholder="Ej: Estatinas (Simvastatina, Atorvastatina)"
          />
          {mensajeError(errores, 'farmaco_b')}
        </div>
      </div>

      {/* Fila 2: Efecto de la interacción */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Efecto de la interacción <span className="text-red-500">*</span>
        </label>
        <textarea
          value={form.efecto}
          onChange={(e) => handleChange('efecto', e.target.value)}
          rows={3}
          className={`w-full px-3 py-2 border rounded-lg text-sm ${campoError(errores, 'efecto')}`}
          placeholder="Ej: ↑ riesgo de rabdomiólisis (inhibición CYP3A4)"
        />
        {mensajeError(errores, 'efecto')}
      </div>

      {/* Fila 3: Manejo sugerido */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Manejo sugerido
        </label>
        <textarea
          value={form.manejo}
          onChange={(e) => handleChange('manejo', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          placeholder="Ej: Preferir Azitromicina (menor interacción) o espaciar/evitar la combinación"
        />
      </div>

      {/* Fila 4: Severidad */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Nivel de severidad <span className="text-red-500">*</span>
        </label>
        <div className="space-y-2">
          {NIVELES_SEVERIDAD_INTERACCION.map(nivel => {
            const config = SEVERIDAD_CONFIG[nivel]
            const seleccionado = form.severidad === nivel
            return (
              <label
                key={nivel}
                className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                  seleccionado ? config.color : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="severidad"
                  value={nivel}
                  checked={seleccionado}
                  onChange={(e) => handleChange('severidad', e.target.value)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{config.icono} {config.label}</span>
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded ${config.badge}`}>
                      {nivel}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{config.descripcion}</p>
                </div>
              </label>
            )
          })}
        </div>
        {mensajeError(errores, 'severidad')}
      </div>
    </>
  )
}
