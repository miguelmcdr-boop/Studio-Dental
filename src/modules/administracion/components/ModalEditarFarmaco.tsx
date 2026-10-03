/**
 * Modal para crear/editar fármacos regulares del vademécum.
 * Usa CamposFormularioFarmaco para renderizar los campos (separación de responsabilidades).
 * F4-03f-3
 */
import React, { useState, useEffect } from 'react'
import { Modal } from '../../../components/ui/Modal'
import { Button } from '../../../components/ui/Button'
import { validarFarmaco, type Farmaco } from '../schemas/vademecumSchema'
import type { FarmacoVademecum } from '../../../services/vademecumService'
import { CamposFormularioFarmaco, type FarmacoFormState } from './CamposFormularioFarmaco'

const VALOR_INICIAL: FarmacoFormState = {
  numero: '',
  familia: '',
  nombre_generico: '',
  nombre_comercial: '',
  presentacion: '',
  posologia_adulto: '',
  posologia_pediatrica: '',
  dosis_max_adulto_mg: null,
  dosis_max_pediatrica_mg_por_kg: null,
  contenido_por_unidad_mg: null,
  volumen_por_unidad_ml: null,
  concentracion_mg_por_ml: null,
  duracion_dias: '',
  contraindicaciones: '',
  alergias_cruzadas: [],
  indicaciones: '',
  requiere_receta: true,
  notas_especiales: ''
}

export interface ModalEditarFarmacoProps {
  farmaco: Farmaco | FarmacoVademecum | null
  onGuardar: (datos: Farmaco) => void
  onClose: () => void
  guardando?: boolean
}

export const ModalEditarFarmaco: React.FC<ModalEditarFarmacoProps> = ({ farmaco, onGuardar, onClose, guardando = false }) => {
  const esEdicion = !!farmaco
  const [form, setForm] = useState<FarmacoFormState>(VALOR_INICIAL)
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [haIntentadoGuardar, setHaIntentadoGuardar] = useState(false)

  useEffect(() => {
    if (farmaco) {
      setForm({
        numero: farmaco.numero || '',
        familia: farmaco.familia || '',
        nombre_generico: farmaco.nombre_generico || '',
        nombre_comercial: farmaco.nombre_comercial || '',
        presentacion: farmaco.presentacion || '',
        posologia_adulto: farmaco.posologia_adulto || '',
        posologia_pediatrica: farmaco.posologia_pediatrica || '',
        dosis_max_adulto_mg: farmaco.dosis_max_adulto_mg ?? null,
        dosis_max_pediatrica_mg_por_kg: farmaco.dosis_max_pediatrica_mg_por_kg ?? null,
        contenido_por_unidad_mg: farmaco.contenido_por_unidad_mg ?? null,
        volumen_por_unidad_ml: farmaco.volumen_por_unidad_ml ?? null,
        concentracion_mg_por_ml: farmaco.concentracion_mg_por_ml ?? null,
        duracion_dias: farmaco.duracion_dias || '',
        contraindicaciones: farmaco.contraindicaciones || '',
        alergias_cruzadas: farmaco.alergias_cruzadas || [],
        indicaciones: farmaco.indicaciones || '',
        requiere_receta: farmaco.requiere_receta ?? true,
        notas_especiales: farmaco.notas_especiales || ''
      })
    } else {
      setForm(VALOR_INICIAL)
    }
    setErrores({})
    setHaIntentadoGuardar(false)
  }, [farmaco])

  const handleChange = (campo: string, valor: unknown) => {
    const nuevoValor = valor === '' ? VALOR_INICIAL[campo] : valor
    const nuevoForm: FarmacoFormState = { ...form, [campo]: nuevoValor }
    setForm(nuevoForm)

    // Validar en tiempo real si ya se intentó guardar
    if (haIntentadoGuardar) {
      const resultado = validarFarmaco(nuevoForm)
      setErrores(resultado.errores || {})
    }
  }

  const handleNumberChange = (campo: string, valor: string) => {
    const num = valor === '' ? null : parseFloat(valor)
    handleChange(campo, Number.isNaN(num) ? null : num)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setHaIntentadoGuardar(true)

    const resultado = validarFarmaco(form)
    setErrores(resultado.errores || {})

    if (resultado.valido && resultado.datos) {
      onGuardar(resultado.datos)
    }
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={esEdicion ? `Editar Fármaco #${form.numero}` : 'Nuevo Fármaco'}
      size="xl"
      closeOnOverlayClick={!guardando}
      closeOnEscape={!guardando}
    >
      <form onSubmit={handleSubmit}>
        <CamposFormularioFarmaco
          form={form}
          onChange={handleChange}
          onNumberChange={handleNumberChange}
          errores={errores}
          esEdicion={esEdicion}
        />

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-4 mt-4 border-t">
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
