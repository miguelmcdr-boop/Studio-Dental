/**
 * Modal para crear/editar fármacos de urgencia del carro de reanimación.
 * F4-03f-3
 */
import React, { useState, useEffect } from 'react'
import { Modal } from '../../../components/ui/Modal'
import { CamposFormularioUrgencia } from './CamposFormularioUrgencia'
import { Button } from '../../../components/ui/Button'
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
    <Modal
      isOpen={true}
      onClose={onClose}
      title={esEdicion ? `🚨 Editar Fármaco de Urgencia #${form.numero}` : '🚨 Nuevo Fármaco de Urgencia'}
      size="lg"
      closeOnOverlayClick={!guardando}
      closeOnEscape={!guardando}
    >
      {/* Header distintivo urgencia preservado como banner interno */}
      <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 px-6 py-3 mb-4 rounded-t-lg">
        <p className="text-sm font-semibold text-red-800 dark:text-red-200">
          ⚠️ Fármaco crítico del carro de reanimación
        </p>
      </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <CamposFormularioUrgencia
            form={form}
            errores={errores}
            esEdicion={esEdicion}
            handleChange={handleChange}
          />

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 text-sm text-yellow-800 dark:text-yellow-200">
            ⚠️ <strong>Recuerde:</strong> Todo box dental debe contar con estos fármacos accesibles y con verificación periódica de fechas de vencimiento.
          </div>

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
              variant="danger"
              disabled={guardando}
            >
              {guardando ? 'Guardando...' : (esEdicion ? 'Actualizar' : 'Crear')}
            </Button>
          </div>
        </form>
    </Modal>
  )
}
