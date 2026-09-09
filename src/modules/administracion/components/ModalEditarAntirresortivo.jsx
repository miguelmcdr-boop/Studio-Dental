/**
 * Modal para crear/editar antirresortivos óseos (riesgo MRONJ).
 * F4-03f-3
 */
import React, { useState, useEffect } from 'react'
import { Modal } from '../../../components/ui/Modal'
import { Button } from '../../../components/ui/Button'
import { CamposFormularioAntirresortivo } from './CamposFormularioAntirresortivo'
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
    <Modal
      isOpen={true}
      onClose={onClose}
      title={esEdicion ? `🦴 Editar Antirresortivo #${form.numero}` : '🦴 Nuevo Antirresortivo (MRONJ)'}
      size="lg"
      closeOnOverlayClick={!guardando}
      closeOnEscape={!guardando}
    >
      {/* Header distintivo MRONJ preservado como banner interno */}
      <div className="bg-purple-50 dark:bg-purple-900/20 border-b border-purple-200 dark:border-purple-800 px-6 py-3 mb-4 rounded-t-lg">
        <p className="text-sm font-semibold text-purple-800 dark:text-purple-200">
          ⚠️ Fármaco de riesgo MRONJ (osteonecrosis maxilar)
        </p>
      </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <CamposFormularioAntirresortivo
            form={form}
            errores={errores}
            esEdicion={esEdicion}
            handleChange={handleChange}
          />

          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3 text-sm text-purple-800 dark:text-purple-200">
            🦴 <strong>Relevancia clínica:</strong> Identificar estos fármacos en la anamnesis es crítico antes de exodoncias, cirugía periodontal o implantes para prevenir MRONJ (osteonecrosis maxilar relacionada a fármacos).
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
              variant="primary"
              disabled={guardando}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {guardando ? 'Guardando...' : (esEdicion ? 'Actualizar' : 'Crear')}
            </Button>
          </div>
        </form>
    </Modal>
  )
}
