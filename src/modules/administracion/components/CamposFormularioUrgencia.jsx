/**
 * CamposFormularioUrgencia — Campos del formulario de fármacos de urgencia
 * Extraído de ModalEditarUrgencia.jsx para cumplir límites de allowlist (F7-25)
 * F4-03f-3
 */
import React from 'react'
import { VIAS_ADMINISTRACION } from '../schemas/vademecumSchema'

const campoError = (errores, campo) => errores[campo] ? 'border-red-400 bg-red-50' : 'border-gray-300'
const mensajeError = (errores, campo) => errores[campo] && (
  <p className="text-xs text-red-600 mt-1">{errores[campo]}</p>
)

export const CamposFormularioUrgencia = ({ form, errores, esEdicion, handleChange }) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre genérico <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={form.nombre_generico}
            onChange={(e) => handleChange('nombre_generico', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg text-sm ${campoError(errores, 'nombre_generico')}`}
            placeholder="Ej: Adrenalina (Epinefrina)"
          />
          {mensajeError(errores, 'nombre_generico')}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Concentración</label>
          <input
            type="text"
            value={form.concentracion}
            onChange={(e) => handleChange('concentracion', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            placeholder="Ej: 1:1000 (1 mg/ml)"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Presentación <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={form.presentacion}
            onChange={(e) => handleChange('presentacion', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg text-sm ${campoError(errores, 'presentacion')}`}
            placeholder="Ej: Ampolla 1 ml"
          />
          {mensajeError(errores, 'presentacion')}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Indicación <span className="text-red-500">*</span></label>
        <input
          type="text"
          value={form.indicacion}
          onChange={(e) => handleChange('indicacion', e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg text-sm ${campoError(errores, 'indicacion')}`}
          placeholder="Ej: Anafilaxia / shock anafiláctico"
        />
        {mensajeError(errores, 'indicacion')}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Posología adulto</label>
          <textarea
            value={form.posologia_adulto}
            onChange={(e) => handleChange('posologia_adulto', e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Posología pediátrica</label>
          <textarea
            value={form.posologia_pediatrica}
            onChange={(e) => handleChange('posologia_pediatrica', e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Vía de administración <span className="text-red-500">*</span></label>
        <select
          value={form.via_administracion}
          onChange={(e) => handleChange('via_administracion', e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg text-sm ${campoError(errores, 'via_administracion')}`}
        >
          <option value="">-- Seleccione --</option>
          {VIAS_ADMINISTRACION.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
        {mensajeError(errores, 'via_administracion')}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Advertencias</label>
        <textarea
          value={form.advertencias}
          onChange={(e) => handleChange('advertencias', e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          placeholder="Ej: Nunca IV directa a esta concentración"
        />
      </div>
    </>
  )
}
