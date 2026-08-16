/**
 * Modal para crear/editar antirresortivos óseos (riesgo MRONJ).
 * F4-03f-3
 */
import React, { useState, useEffect } from 'react'
import { validarAntirresortivo, FAMILIAS_ANTIRRESORTIVOS, NIVELES_RIESGO_MRONG } from '../schemas/vademecumSchema'

const VALOR_INICIAL = {
  numero: '',
  nombre_generico: '',
  familia: '',
  via_administracion: '',
  dosis_habitual: '',
  indicacion: '',
  riesgo_mronj: '',
  manejo_odontologico: ''
}

export const ModalEditarAntirresortivo = ({ farmaco, onGuardar, onClose, guardando }) => {
  const esEdicion = !!farmaco
  const [form, setForm] = useState(VALOR_INICIAL)
  const [errores, setErrores] = useState({})
  const [haIntentadoGuardar, setHaIntentadoGuardar] = useState(false)

  useEffect(() => {
    if (farmaco) {
      setForm({
        numero: farmaco.numero || '',
        nombre_generico: farmaco.nombre_generico || '',
        familia: farmaco.familia || '',
        via_administracion: farmaco.via_administracion || '',
        dosis_habitual: farmaco.dosis_habitual || '',
        indicacion: farmaco.indicacion || '',
        riesgo_mronj: farmaco.riesgo_mronj || '',
        manejo_odontologico: farmaco.manejo_odontologico || ''
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
      const resultado = validarAntirresortivo({ ...form, [campo]: valor })
      setErrores(resultado.errores)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setHaIntentadoGuardar(true)
    const resultado = validarAntirresortivo(form)
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
        <div className="sticky top-0 bg-purple-50 border-b border-purple-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            🦴 {esEdicion ? `Editar Antirresortivo #${form.numero}` : 'Nuevo Antirresortivo (MRONJ)'}
          </h2>
          <button onClick={onClose} disabled={guardando} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Familia <span className="text-red-500">*</span></label>
              <select
                value={form.familia}
                onChange={(e) => handleChange('familia', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg text-sm ${campoError('familia')}`}
              >
                <option value="">-- Seleccione --</option>
                {FAMILIAS_ANTIRRESORTIVOS.map(f => <option key={f} value={f}>{f.replace(/_/g, ' ')}</option>)}
              </select>
              {mensajeError('familia')}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre genérico <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={form.nombre_generico}
              onChange={(e) => handleChange('nombre_generico', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg text-sm ${campoError('nombre_generico')}`}
              placeholder="Ej: Alendronato 70 mg semanal"
            />
            {mensajeError('nombre_generico')}
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
                className={`w-full px-3 py-2 border rounded-lg text-sm ${campoError('indicacion')}`}
                placeholder="Ej: Osteoporosis"
              />
              {mensajeError('indicacion')}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Riesgo de MRONJ <span className="text-red-500">*</span></label>
            <select
              value={form.riesgo_mronj}
              onChange={(e) => handleChange('riesgo_mronj', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg text-sm ${campoError('riesgo_mronj')}`}
            >
              <option value="">-- Seleccione --</option>
              {NIVELES_RIESGO_MRONG.map(n => <option key={n} value={n}>{n.toUpperCase()}</option>)}
            </select>
            {mensajeError('riesgo_mronj')}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Manejo odontológico <span className="text-red-500">*</span></label>
            <textarea
              value={form.manejo_odontologico}
              onChange={(e) => handleChange('manejo_odontologico', e.target.value)}
              rows={4}
              className={`w-full px-3 py-2 border rounded-lg text-sm ${campoError('manejo_odontologico')}`}
              placeholder="Ej: Coordinar con oncólogo antes de cirugía electiva; priorizar tratamiento conservador"
            />
            {mensajeError('manejo_odontologico')}
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm text-purple-800">
            🦴 <strong>Relevancia clínica:</strong> Identificar estos fármacos en la anamnesis es crítico antes de exodoncias, cirugía periodontal o implantes para prevenir MRONJ (osteonecrosis maxilar relacionada a fármacos).
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} disabled={guardando} className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={guardando} className="px-6 py-2 text-sm font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:bg-purple-400">{guardando ? 'Guardando...' : (esEdicion ? 'Actualizar' : 'Crear')}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
