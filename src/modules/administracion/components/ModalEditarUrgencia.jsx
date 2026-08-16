/**
 * Modal para crear/editar fármacos de urgencia del carro de reanimación.
 * F4-03f-3
 */
import React, { useState, useEffect } from 'react'
import { validarUrgencia, VIAS_ADMINISTRACION } from '../schemas/vademecumSchema'

const VALOR_INICIAL = {
  numero: '',
  nombre_generico: '',
  concentracion: '',
  presentacion: '',
  indicacion: '',
  posologia_adulto: '',
  posologia_pediatrica: '',
  via_administracion: '',
  advertencias: ''
}

export const ModalEditarUrgencia = ({ farmaco, onGuardar, onClose, guardando }) => {
  const esEdicion = !!farmaco
  const [form, setForm] = useState(VALOR_INICIAL)
  const [errores, setErrores] = useState({})
  const [haIntentadoGuardar, setHaIntentadoGuardar] = useState(false)

  useEffect(() => {
    if (farmaco) {
      setForm({
        numero: farmaco.numero || '',
        nombre_generico: farmaco.nombre_generico || '',
        concentracion: farmaco.concentracion || '',
        presentacion: farmaco.presentacion || '',
        indicacion: farmaco.indicacion || '',
        posologia_adulto: farmaco.posologia_adulto || '',
        posologia_pediatrica: farmaco.posologia_pediatrica || '',
        via_administracion: farmaco.via_administracion || '',
        advertencias: farmaco.advertencias || ''
      })
    } else {
      setForm(VALOR_INICIAL)
    }
    setErrores({})
    setHaIntentadoGuardar(false)
  }, [farmaco])

  const handleChange = (campo, valor) => {
    setForm(prev => ({ ...prev, [campo]: valor }))
    if (haIntentadoGuardar) {
      const resultado = validarUrgencia({ ...form, [campo]: valor })
      setErrores(resultado.errores)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setHaIntentadoGuardar(true)
    const resultado = validarUrgencia(form)
    setErrores(resultado.errores)
    if (resultado.valido) onGuardar(resultado.datos)
  }

  const campoError = (campo) => errores[campo] ? 'border-red-400 bg-red-50' : 'border-gray-300'
  const mensajeError = (campo) => errores[campo] && (
    <p className="text-xs text-red-600 mt-1">{errores[campo]}</p>
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-red-50 border-b border-red-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            🚨 {esEdicion ? `Editar Fármaco de Urgencia #${form.numero}` : 'Nuevo Fármaco de Urgencia'}
          </h2>
          <button onClick={onClose} disabled={guardando} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Número <span className="text-red-500">*</span></label>
              <input
                type="number"
                value={form.numero}
                onChange={(e) => handleChange('numero', parseInt(e.target.value) || '')}
                className={`w-full px-3 py-2 border rounded-lg text-sm ${campoError('numero')}`}
                disabled={esEdicion}
              />
              {mensajeError('numero')}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre genérico <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.nombre_generico}
                onChange={(e) => handleChange('nombre_generico', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg text-sm ${campoError('nombre_generico')}`}
                placeholder="Ej: Adrenalina (Epinefrina)"
              />
              {mensajeError('nombre_generico')}
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
                className={`w-full px-3 py-2 border rounded-lg text-sm ${campoError('presentacion')}`}
                placeholder="Ej: Ampolla 1 ml"
              />
              {mensajeError('presentacion')}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Indicación <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={form.indicacion}
              onChange={(e) => handleChange('indicacion', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg text-sm ${campoError('indicacion')}`}
              placeholder="Ej: Anafilaxia / shock anafiláctico"
            />
            {mensajeError('indicacion')}
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
              className={`w-full px-3 py-2 border rounded-lg text-sm ${campoError('via_administracion')}`}
            >
              <option value="">-- Seleccione --</option>
              {VIAS_ADMINISTRACION.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
            {mensajeError('via_administracion')}
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

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
            ⚠️ <strong>Recuerde:</strong> Todo box dental debe contar con estos fármacos accesibles y con verificación periódica de fechas de vencimiento.
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} disabled={guardando} className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={guardando} className="px-6 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:bg-red-400">{guardando ? 'Guardando...' : (esEdicion ? 'Actualizar' : 'Crear')}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
