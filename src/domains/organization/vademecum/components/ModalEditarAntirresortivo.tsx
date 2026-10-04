/**
 * Modal para crear/editar antirresortivos óseos (riesgo MRONJ).
 * F4-03f-3
 */
import React, { useState, useEffect } from 'react'
import { Modal } from '../../../../shared/ui/ui/Modal'
import { Button } from '../../../../shared/ui/ui/Button'
import { CamposFormularioAntirresortivo, type AntirresortivoFormState } from './CamposFormularioAntirresortivo'
import { validarAntirresortivo, type Antirresortivo } from '../schemas/vademecumSchema'
import { Bone, AlertTriangle } from 'lucide-react'

const VALOR_INICIAL: AntirresortivoFormState = {
  numero: '',
  nombre_generico: '',
  familia: '',
  via_administracion: '',
  indicacion: '',
  riesgo_mronj: '',
  manejo_odontologico: ''
}

export interface ModalEditarAntirresortivoProps {
  farmaco: Antirresortivo | null
  onGuardar: (datos: Antirresortivo) => void
  onClose: () => void
  guardando?: boolean
}

export const ModalEditarAntirresortivo: React.FC<ModalEditarAntirresortivoProps> = ({ farmaco, onGuardar, onClose, guardando = false }) => {
  const esEdicion = !!farmaco
  const [form, setForm] = useState<AntirresortivoFormState>(VALOR_INICIAL)
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [haIntentadoGuardar, setHaIntentadoGuardar] = useState(false)

  useEffect(() => {
    if (farmaco) {
      setForm({
        numero: farmaco.numero || '',
        nombre_generico: farmaco.nombre_generico || '',
        familia: farmaco.familia || '',
        via_administracion: farmaco.via_administracion || '',
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

  const handleChange = (campo: string, valor: unknown) => {
    const nuevoForm: AntirresortivoFormState = { ...form, [campo]: valor }
    setForm(nuevoForm)
    if (haIntentadoGuardar) {
      const resultado = validarAntirresortivo(nuevoForm)
      setErrores(resultado.errores || {})
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setHaIntentadoGuardar(true)
    const resultado = validarAntirresortivo(form)
    setErrores(resultado.errores || {})
    if (resultado.valido && resultado.datos) {
      onGuardar(resultado.datos)
    }
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={esEdicion ? `Editar Antirresortivo #${form.numero}` : 'Nuevo Antirresortivo (MRONJ)'}
      size="lg"
      closeOnOverlayClick={!guardando}
      closeOnEscape={!guardando}
    >
      {/* Header distintivo MRONJ preservado como banner interno */}
      <div className="bg-purple-50 dark:bg-purple-900/20 border-b border-purple-200 dark:border-purple-800 px-6 py-3 mb-4 rounded-t-lg">
        <p className="text-sm font-semibold text-purple-800 dark:text-purple-200">
          <span className="inline-flex items-center gap-1"><AlertTriangle size={12} />Fármaco de riesgo MRONJ (osteonecrosis maxilar)</span>
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
          <Bone size={14} className='inline' /> <strong>Relevancia clínica:</strong> Identificar estos fármacos en la anamnesis es crítico antes de exodoncias, cirugía periodontal o implantes para prevenir MRONJ (osteonecrosis maxilar relacionada a fármacos).
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
            className="bg-purple-600 hover:bg-purple-700 transition-colors duration-150"
          >
            {guardando ? 'Guardando...' : (esEdicion ? 'Actualizar' : 'Crear')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
