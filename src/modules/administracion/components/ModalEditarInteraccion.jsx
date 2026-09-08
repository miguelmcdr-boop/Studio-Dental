/**
 * Modal para crear/editar interacciones farmacológicas.
 * F4-03f-5b
 */
import React, { useState, useEffect } from 'react'
import { Modal } from '../../../components/ui/Modal'
import { Button } from '../../../components/ui/Button'
import { CamposFormularioInteraccion } from './CamposFormularioInteraccion'
import { validarInteraccion, NIVELES_SEVERIDAD_INTERACCION } from '../schemas/interaccionSchema'

const VALOR_INICIAL = {
  farmaco_a: '',
  farmaco_b: '',
  efecto: '',
  manejo: '',
  severidad: ''
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
    <Modal
      isOpen={true}
      onClose={onClose}
      title={esEdicion ? '⚗️ Editar Interacción Farmacológica' : '⚗️ Nueva Interacción Farmacológica'}
      size="lg"
      closeOnOverlayClick={!guardando}
      closeOnEscape={!guardando}
    >
      {/* Banner distintivo interacciones preservado */}
      <div className="bg-orange-50 dark:bg-orange-900/20 border-b border-orange-200 dark:border-orange-800 px-6 py-3 mb-4 rounded-t-lg">
        <p className="text-sm font-semibold text-orange-800 dark:text-orange-200">
          ⚠️ Interacción farmacológica — validar severidad con evidencia clínica
        </p>
      </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <CamposFormularioInteraccion
            form={form}
            errores={errores}
            handleChange={handleChange}
          />

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              onClick={onClose}
              variant="ghost"
              disabled={guardando}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={guardando}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {guardando ? 'Guardando...' : (esEdicion ? 'Actualizar' : 'Crear')}
            </Button>
          </div>
        </form>
    </Modal>
  )
}
