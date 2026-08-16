/**
 * Modal para crear/editar fármacos regulares del vademécum.
 * Usa CamposFormularioFarmaco para renderizar los campos (separación de responsabilidades).
 * F4-03f-3
 */
import React, { useState, useEffect } from 'react'
import { validarFarmaco } from '../schemas/vademecumSchema'
import { CamposFormularioFarmaco } from './CamposFormularioFarmaco'

const VALOR_INICIAL = {
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

export const ModalEditarFarmaco = ({ farmaco, onGuardar, onClose, guardando }) => {
  const esEdicion = !!farmaco
  const [form, setForm] = useState(VALOR_INICIAL)
  const [errores, setErrores] = useState({})
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
        dosis_max_adulto_mg: farmaco.dosis_max_adulto_mg || null,
        dosis_max_pediatrica_mg_por_kg: farmaco.dosis_max_pediatrica_mg_por_kg || null,
        contenido_por_unidad_mg: farmaco.contenido_por_unidad_mg || null,
        volumen_por_unidad_ml: farmaco.volumen_por_unidad_ml || null,
        concentracion_mg_por_ml: farmaco.concentracion_mg_por_ml || null,
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

  const handleChange = (campo, valor) => {
    const nuevoValor = valor === '' ? VALOR_INICIAL[campo] : valor
    const nuevoForm = { ...form, [campo]: nuevoValor }
    setForm(nuevoForm)

    // Validar en tiempo real si ya se intentó guardar
    if (haIntentadoGuardar) {
      const resultado = validarFarmaco(nuevoForm)
      setErrores(resultado.errores)
    }
  }

  const handleNumberChange = (campo, valor) => {
    const num = valor === '' ? null : parseFloat(valor)
    handleChange(campo, Number.isNaN(num) ? null : num)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setHaIntentadoGuardar(true)

    const resultado = validarFarmaco(form)
    setErrores(resultado.errores)

    if (resultado.valido) {
      onGuardar(resultado.datos)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {esEdicion ? `Editar Fármaco #${form.numero}` : 'Nuevo Fármaco'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            disabled={guardando}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <CamposFormularioFarmaco
            form={form}
            onChange={handleChange}
            onNumberChange={handleNumberChange}
            errores={errores}
            esEdicion={esEdicion}
          />

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4 mt-4 border-t">
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
              {guardando ? 'Guardando...' : (esEdicion ? 'Actualizar' : 'Crear')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
