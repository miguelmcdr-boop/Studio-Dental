/**
 * CamposFormularioAntirresortivo — Campos del formulario de antirresortivos (MRONJ)
 * Extraído de ModalEditarAntirresortivo.jsx para cumplir límites de allowlist (F7-25)
 * F4-03f-3
 */
import React from 'react'
import { FAMILIAS_ANTIRRESORTIVOS, NIVELES_RIESGO_MRONG } from '../schemas/vademecumSchema'

const campoError = (errores, campo) => errores[campo] ? 'border-red-400 bg-red-50' : 'border-gray-300'
const mensajeError = (errores, campo) => errores[campo] && (
  <p className="text-xs text-red-600 mt-1">{errores[campo]}</p>
)

export const CamposFormularioAntirresortivo = ({ form, errores, esEdicion, handleChange }) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Número <span className="text-red-500">*</span></label>
          <input
            type="number"
            value={form.numero}
            onChange={(e) => handleChange('numero', parseInt(e.target.value) || '')}
            className={`w-full px-3 py-2 border rounded-lg text-sm ${campoError(errores, 'numero')}`}
            disabled={esEdicion}
          />
          {mensajeError(errores, 'numero')}
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Familia <span className="text-red-500">*</span></label>
          <select
            value={form.familia}
            onChange={(e) => handleChange('familia', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg text-sm ${campoError(errores, 'familia')}`}
          >
            <option value="">-- Seleccione --</option>
            {FAMILIAS_ANTIRRESORTIVOS.map(f => <option key={f} value={f}>{f.replace(/_/g, ' ')}</option>)}
          </select>
          {mensajeError(errores, 'familia')}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre genérico <span className="text-red-500">*</span></label>
        <input
          type="text"
          value={form.nombre_generico}
          onChange={(e) => handleChange('nombre_generico', e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg text-sm ${campoError(errores, 'nombre_generico')}`}
          placeholder="Ej: Alendronato 70 mg semanal"
        />
        {mensajeError(errores, 'nombre_generico')}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Vía / Dosis habitual</label>
          <input
            type="text"
            value={form.via_administracion}
            onChange={(e) => handleChange('via_administracion', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            placeholder="Ej: VO, 1 vez/semana"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Indicación <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={form.indicacion}
            onChange={(e) => handleChange('indicacion', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg text-sm ${campoError(errores, 'indicacion')}`}
            placeholder="Ej: Osteoporosis"
          />
          {mensajeError(errores, 'indicacion')}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Riesgo de MRONJ <span className="text-red-500">*</span></label>
        <select
          value={form.riesgo_mronj}
          onChange={(e) => handleChange('riesgo_mronj', e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg text-sm ${campoError(errores, 'riesgo_mronj')}`}
        >
          <option value="">-- Seleccione --</option>
          {NIVELES_RIESGO_MRONG.map(n => <option key={n} value={n}>{n.toUpperCase()}</option>)}
        </select>
        {mensajeError(errores, 'riesgo_mronj')}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Manejo odontológico <span className="text-red-500">*</span></label>
        <textarea
          value={form.manejo_odontologico}
          onChange={(e) => handleChange('manejo_odontologico', e.target.value)}
          rows={4}
          className={`w-full px-3 py-2 border rounded-lg text-sm ${campoError(errores, 'manejo_odontologico')}`}
          placeholder="Ej: Coordinar con oncólogo antes de cirugía electiva; priorizar tratamiento conservador"
        />
        {mensajeError(errores, 'manejo_odontologico')}
      </div>
    </>
  )
}
