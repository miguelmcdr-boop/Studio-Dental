/**
 * Modal para crear/editar interacciones farmacológicas.
 * F4-03f-5b
 */
import React, { useState, useEffect } from 'react'
import { Modal } from '../../../../shared/ui/ui/Modal'
import { Button } from '../../../../shared/ui/ui/Button'
import { CamposFormularioInteraccion, type InteraccionFormState } from './CamposFormularioInteraccion'
import { validarInteraccion, type Interaccion } from '../schemas/interaccionSchema'
import { AlertTriangle } from 'lucide-react'

const VALOR_INICIAL: InteraccionFormState = {
  farmaco_a: '',
  farmaco_b: '',
  efecto: '',
  manejo: '',
  severidad: ''
}

export interface ModalEditarInteraccionProps {
  interaccion: Interaccion | null
  onGuardar: (datos: Interaccion) => void
  onClose: () => void
  guardando?: boolean
}

export const ModalEditarInteraccion: React.FC<ModalEditarInteraccionProps> = ({ interaccion, onGuardar, onClose, guardando = false }) => {
  const esEdicion = !!interaccion
  const [form, setForm] = useState<InteraccionFormState>(VALOR_INICIAL)
  const [errores, setErrores] = useState<Record<string, string>>({})
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

  const handleChange = (campo: string, valor: unknown) => {
    const nuevoForm: InteraccionFormState = { ...form, [campo]: valor }
    setForm(nuevoForm)
    
    if (haIntentadoGuardar) {
      const resultado = validarInteraccion(nuevoForm)
      setErrores(resultado.errores || {})
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setHaIntentadoGuardar(true)
    
    const resultado = validarInteraccion(form)
    setErrores(resultado.errores || {})
    
    if (resultado.valido && resultado.datos) {
      onGuardar(resultado.datos)
    }
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={esEdicion ? 'Editar Interacción Farmacológica' : 'Nueva Interacción Farmacológica'}
      size="lg"
      closeOnOverlayClick={!guardando}
      closeOnEscape={!guardando}
    >
      {/* Banner distintivo interacciones preservado */}
      <div className="bg-orange-50 dark:bg-orange-900/20 border-b border-orange-200 dark:border-orange-800 px-6 py-3 mb-4 rounded-t-lg">
        <p className="text-sm font-semibold text-orange-800 dark:text-orange-200">
          <span className="inline-flex items-center gap-1"><AlertTriangle size={12} />Interacción farmacológica — validar severidad con evidencia clínica</span>
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
          >
            {guardando ? 'Guardando...' : (esEdicion ? 'Actualizar' : 'Crear')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
