/**
 * Modal para crear/editar reglas de alergias cruzadas.
 * F4-03f-5a
 */
import React, { useState, useEffect } from 'react'
import { validarAlergiaCruzada, FAMILIAS_ALERGIAS, NIVELES_SEVERIDAD } from '../schemas/alergiaCruzadaSchema'

const VALOR_INICIAL = {
  familia_alergia: '',
  familia_farmaco: '',
  severidad: '',
  porcentaje_cruzado: '',
  nota_clinica: ''
}

const SEVERIDAD_LABELS = {
  critica: {
    label: 'Crítica (X)',
    descripcion: 'Contraindicación absoluta — no prescribir bajo ninguna circunstancia',
    color: 'border-red-400 bg-red-50',
    badge: 'bg-red-100 text-red-800'
  },
  advertencia: {
    label: 'Advertencia (⚠️)',
    descripcion: 'Precaución — evaluar riesgo/beneficio y considerar alternativas',
    color: 'border-yellow-400 bg-yellow-50',
    badge: 'bg-yellow-100 text-yellow-800'
  },
  sin_relacion: {
    label: 'Sin relación',
    descripcion: 'No hay reactividad cruzada documentada entre estas familias',
    color: 'border-gray-300 bg-white',
    badge: 'bg-gray-100 text-gray-600'
  }
}

export const ModalEditarAlergiaCruzada = ({ celda, onGuardar, onClose, guardando }) => {
  const [form, setForm] = useState(VALOR_INICIAL)
  const [errores, setErrores] = useState({})
  const [haIntentadoGuardar, setHaIntentadoGuardar] = useState(false)

  useEffect(() => {
    if (celda) {
      // Si viene con regla existente, precargar datos
      if (celda.regla) {
        setForm({
          familia_alergia: celda.regla.familia_alergia || celda.familia_alergia,
          familia_farmaco: celda.regla.familia_farmaco || celda.familia_farmaco,
          severidad: celda.regla.severidad || '',
          porcentaje_cruzado: celda.regla.porcentaje_cruzado || '',
          nota_clinica: celda.regla.nota_clinica || ''
        })
      } else {
        // Nueva regla para esta celda específica
        setForm({
          ...VALOR_INICIAL,
          familia_alergia: celda.familia_alergia || '',
          familia_farmaco: celda.familia_farmaco || ''
        })
      }
    } else {
      setForm(VALOR_INICIAL)
    }
    setErrores({})
    setHaIntentadoGuardar(false)
  }, [celda])

  const handleChange = (campo, valor) => {
    const nuevoForm = { ...form, [campo]: valor }
    setForm(nuevoForm)
    
    if (haIntentadoGuardar) {
      const resultado = validarAlergiaCruzada(nuevoForm)
      setErrores(resultado.errores)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setHaIntentadoGuardar(true)
    
    const resultado = validarAlergiaCruzada(form)
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
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-blue-50 border-b border-blue-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            🧬 {celda?.regla ? 'Editar Regla de Alergia Cruzada' : 'Nueva Regla de Alergia Cruzada'}
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
          {/* Fila 1: Familias */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Familia de alergia <span className="text-red-500">*</span>
              </label>
              <select
                value={form.familia_alergia}
                onChange={(e) => handleChange('familia_alergia', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg text-sm ${campoError('familia_alergia')}`}
              >
                <option value="">-- Seleccione --</option>
                {FAMILIAS_ALERGIAS.map(f => (
                  <option key={f} value={f}>{f.replace(/_/g, ' ')}</option>
                ))}
              </select>
              {mensajeError('familia_alergia')}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Familia de fármaco <span className="text-red-500">*</span>
              </label>
              <select
                value={form.familia_farmaco}
                onChange={(e) => handleChange('familia_farmaco', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg text-sm ${campoError('familia_farmaco')}`}
              >
                <option value="">-- Seleccione --</option>
                {FAMILIAS_ALERGIAS.map(f => (
                  <option key={f} value={f}>{f.replace(/_/g, ' ')}</option>
                ))}
              </select>
              {mensajeError('familia_farmaco')}
            </div>
          </div>

          {/* Fila 2: Severidad */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nivel de severidad <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {NIVELES_SEVERIDAD.map(nivel => {
                const config = SEVERIDAD_LABELS[nivel]
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
                        <span className="font-semibold text-gray-900">{config.label}</span>
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

          {/* Fila 3: Porcentaje cruzado (solo si es advertencia) */}
          {form.severidad === 'advertencia' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Porcentaje de reactividad cruzada
              </label>
              <input
                type="text"
                value={form.porcentaje_cruzado}
                onChange={(e) => handleChange('porcentaje_cruzado', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="Ej: 5-10%, <5%, <2%"
              />
              <p className="text-xs text-gray-500 mt-1">
                Opcional — indica la tasa documentada de reactividad cruzada
              </p>
            </div>
          )}

          {/* Fila 4: Nota clínica */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Nota clínica
            </label>
            <textarea
              value={form.nota_clinica}
              onChange={(e) => handleChange('nota_clinica', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="Ej: La tasa real de reacción cruzada con cefalosporinas de 2ª generación es <2%. Contraindicado si hubo anafilaxia previa."
            />
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
              className="px-6 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
              disabled={guardando}
            >
              {guardando ? 'Guardando...' : (celda?.regla ? 'Actualizar' : 'Crear')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
