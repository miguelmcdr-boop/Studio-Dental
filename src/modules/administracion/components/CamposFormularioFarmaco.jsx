/**
 * Campos del formulario de fármaco regular.
 * Extraído de ModalEditarFarmaco para respetar límite de 250 líneas.
 * F4-03f-3 (refactorización)
 */
import React from 'react'
import { FAMILIAS_VADEMECUM } from '../schemas/vademecumSchema'

export const CamposFormularioFarmaco = ({ form, onChange, onNumberChange, errores, esEdicion }) => {
  const campoError = (campo) => errores[campo] ? 'border-red-400 bg-red-50' : 'border-gray-300'
  const mensajeError = (campo) => errores[campo] && (
    <p className="text-xs text-red-600 mt-1">{errores[campo]}</p>
  )

  return (
    <div className="space-y-4">
      {/* Fila 1: Número + Familia */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Número <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={form.numero}
            onChange={(e) => onChange('numero', parseInt(e.target.value) || '')}
            className={`w-full px-3 py-2 border rounded-lg text-sm ${campoError('numero')}`}
            disabled={esEdicion}
          />
          {mensajeError('numero')}
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Familia <span className="text-red-500">*</span>
          </label>
          <select
            value={form.familia}
            onChange={(e) => onChange('familia', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg text-sm ${campoError('familia')}`}
          >
            <option value="">-- Seleccione --</option>
            {FAMILIAS_VADEMECUM.map(f => (
              <option key={f} value={f}>{f.replace(/_/g, ' ')}</option>
            ))}
          </select>
          {mensajeError('familia')}
        </div>
      </div>

      {/* Fila 2: Nombres */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Nombre genérico <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.nombre_generico}
            onChange={(e) => onChange('nombre_generico', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg text-sm ${campoError('nombre_generico')}`}
            placeholder="Ej: Amoxicilina 500 mg"
          />
          {mensajeError('nombre_generico')}
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Nombre comercial (opcional)
          </label>
          <input
            type="text"
            value={form.nombre_comercial}
            onChange={(e) => onChange('nombre_comercial', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            placeholder="Ej: Amoxal"
          />
        </div>
      </div>

      {/* Fila 3: Presentación */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Presentación <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.presentacion}
          onChange={(e) => onChange('presentacion', e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg text-sm ${campoError('presentacion')}`}
          placeholder="Ej: Cápsulas / Comprimidos"
        />
        {mensajeError('presentacion')}
      </div>

      {/* Fila 4: Posologías */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Posología adulto <span className="text-red-500">*</span>
          </label>
          <textarea
            value={form.posologia_adulto}
            onChange={(e) => onChange('posologia_adulto', e.target.value)}
            rows={2}
            className={`w-full px-3 py-2 border rounded-lg text-sm ${campoError('posologia_adulto')}`}
            placeholder="Ej: 500 mg c/8h"
          />
          {mensajeError('posologia_adulto')}
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Posología pediátrica
          </label>
          <textarea
            value={form.posologia_pediatrica}
            onChange={(e) => onChange('posologia_pediatrica', e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            placeholder="Ej: 40-50 mg/kg/día div c/8h"
          />
        </div>
      </div>

      {/* Fila 5: Datos numéricos (anestésicos, etc.) */}
      <details className="border border-gray-200 rounded-lg p-3">
        <summary className="text-sm font-semibold text-gray-700 cursor-pointer">
          Datos numéricos (dosis máximas, concentraciones)
        </summary>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Dosis máx adulto (mg)</label>
            <input
              type="number"
              value={form.dosis_max_adulto_mg ?? ''}
              onChange={(e) => onNumberChange('dosis_max_adulto_mg', e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Dosis máx pediátrica (mg/kg)</label>
            <input
              type="number"
              step="0.1"
              value={form.dosis_max_pediatrica_mg_por_kg ?? ''}
              onChange={(e) => onNumberChange('dosis_max_pediatrica_mg_por_kg', e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">mg/unidad</label>
            <input
              type="number"
              step="0.1"
              value={form.contenido_por_unidad_mg ?? ''}
              onChange={(e) => onNumberChange('contenido_por_unidad_mg', e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">ml/unidad</label>
            <input
              type="number"
              step="0.1"
              value={form.volumen_por_unidad_ml ?? ''}
              onChange={(e) => onNumberChange('volumen_por_unidad_ml', e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Concentración mg/ml</label>
            <input
              type="number"
              step="0.1"
              value={form.concentracion_mg_por_ml ?? ''}
              onChange={(e) => onNumberChange('concentracion_mg_por_ml', e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
        </div>
      </details>

      {/* Fila 6: Duración y receta */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Duración (días)</label>
          <input
            type="text"
            value={form.duracion_dias}
            onChange={(e) => onChange('duracion_dias', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            placeholder="Ej: 5-7 días"
          />
        </div>
        <div className="flex items-center">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.requiere_receta}
              onChange={(e) => onChange('requiere_receta', e.target.checked)}
              className="rounded border-gray-300 text-blue-600"
            />
            <span className="font-semibold text-gray-700">Requiere receta médica</span>
          </label>
        </div>
      </div>

      {/* Fila 7: Contraindicaciones */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Contraindicaciones</label>
        <textarea
          value={form.contraindicaciones}
          onChange={(e) => onChange('contraindicaciones', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          placeholder="Ej: Hipersensibilidad a betalactámicos, mononucleosis infecciosa"
        />
      </div>

      {/* Fila 8: Indicaciones y notas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Indicaciones</label>
          <textarea
            value={form.indicaciones}
            onChange={(e) => onChange('indicaciones', e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Notas especiales</label>
          <textarea
            value={form.notas_especiales}
            onChange={(e) => onChange('notas_especiales', e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
      </div>
    </div>
  )
}
