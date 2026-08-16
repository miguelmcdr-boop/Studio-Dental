/**
 * Modal para crear/editar interacciones farmacológicas.
 * F4-03f-5b
 */
import React, { useState, useEffect } from 'react'
import { validarInteraccion, NIVELES_SEVERIDAD_INTERACCION } from '../schemas/interaccionSchema'

const VALOR_INICIAL = {
  farmaco_a: '',
  farmaco_b: '',
  efecto: '',
  manejo: '',
  severidad: ''
}

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

export const ModalEditarInteraccion = ({ interaccion, onGuardar, onClose, guardando }) => {
  const esEdicion = !!interaccion
  const [form, setForm] = useState(VALOR_INICIAL)
  const [errores, setErrores] = useState({})
  const [haIntentadoGuardar, setHaIntentadoGuardar] = useState(false)

  useEffect(() => {
    if (interaccion) {
      setForm({
        farmaco_a: interaccion.farmaco_a || '',
        farmaco_b: interaccion.farmaco_b || '',
        efecto: interaccion.efecto || '',
        manejo: interaccion.manejo || '',
        severidad: interaccion.severidad || ''
      })
    } else {
      setForm(VALOR_INICIAL)
    }
    setErrores({})
    setHaIntentadoGuardar(false)
  }, [interaccion])

  const handleChange = (campo, valor) => {
    const nuevoForm = { ...form, [campo]: valor }
    setForm(nuevoForm)
    
    if (haIntentadoGuardar) {
      const resultado = validarInteraccion(nuevoForm)
      setErrores(resultado.errores)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setHaIntentadoGuardar(true)
    
    const resultado = validarInteraccion(form)
    setErrores(resultado.errores)
    
    if (resultado.valido) {
      onGuardar(resultado.datos)
    }
  }

  const campoError = (campo) => errores[campo] ? 'border-red-400 bg-red-50' : 'border-gray-300'
  const mensajeError = (campo) => errores[campo] && (
    <p className="text-xs text-red-600 mt-1">{errores[campo]}</p>
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-orange-50 border-b border-orange-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            ⚗️ {esEdicion ? 'Editar Interacción Farmacológica' : 'Nueva Interacción Farmacológica'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            disabled={guardando}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                className={`w-full px-3 py-2 border rounded-lg text-sm ${campoError('farmaco_a')}`}
                placeholder="Ej: Macrólidos (Claritromicina, Eritromicina)"
              />
              {mensajeError('farmaco_a')}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Fármaco B / Grupo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.farmaco_b}
                onChange={(e) => handleChange('farmaco_b', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg text-sm ${campoError('farmaco_b')}`}
                placeholder="Ej: Estatinas (Simvastatina, Atorvastatina)"
              />
              {mensajeError('farmaco_b')}
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
              className={`w-full px-3 py-2 border rounded-lg text-sm ${campoError('efecto')}`}
              placeholder="Ej: ↑ riesgo de rabdomiólisis (inhibición CYP3A4)"
            />
            {mensajeError('efecto')}
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
            {mensajeError('severidad')}
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={guardando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-sm font-semibold text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:bg-orange-400"
              disabled={guardando}
            >
              {guardando ? 'Guardando...' : (esEdicion ? 'Actualizar' : 'Crear')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
