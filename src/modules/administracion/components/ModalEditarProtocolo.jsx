/**
 * Modal genérico para crear/editar protocolos clínicos.
 * Funciona tanto para profilaxis endocarditis como manejo anticoagulantes.
 * F4-03f-5c — Migrado a <Modal> base + CamposFormularioProtocolo (F7-25)
 */
import React, { useState, useEffect } from 'react'
import { validarProfilaxis } from '../schemas/profilaxisSchema'
import { validarAnticoagulante } from '../schemas/anticoagulanteSchema'
import { Modal } from '../../../components/ui/Modal'
import { Button } from '../../../components/ui/Button'
import { CamposFormularioProtocolo } from './CamposFormularioProtocolo'

const VALOR_INICIAL_PROFILAXIS = {
  situacion: '',
  farmaco: '',
  dosis_adulto: '',
  dosis_pediatrica: '',
  nota: ''
}

const VALOR_INICIAL_ANTICOAGULANTE = {
  farmaco_o_grupo: '',
  recomendacion: '',
  medidas_hemostasia: ''
}

export const ModalEditarProtocolo = ({ tipo, protocolo, onGuardar, onClose, guardando }) => {
  const esEdicion = !!protocolo
  const esProfilaxis = tipo === 'profilaxis'

  const [form, setForm] = useState(esProfilaxis ? VALOR_INICIAL_PROFILAXIS : VALOR_INICIAL_ANTICOAGULANTE)
  const [errores, setErrores] = useState({})
  const [haIntentadoGuardar, setHaIntentadoGuardar] = useState(false)

  useEffect(() => {
    if (protocolo) {
      if (esProfilaxis) {
        setForm({
          situacion: protocolo.situacion || '',
          farmaco: protocolo.farmaco || '',
          dosis_adulto: protocolo.dosis_adulto || '',
          dosis_pediatrica: protocolo.dosis_pediatrica || '',
          nota: protocolo.nota || ''
        })
      } else {
        setForm({
          farmaco_o_grupo: protocolo.farmaco_o_grupo || '',
          recomendacion: protocolo.recomendacion || '',
          medidas_hemostasia: protocolo.medidas_hemostasia || ''
        })
      }
    } else {
      setForm(esProfilaxis ? VALOR_INICIAL_PROFILAXIS : VALOR_INICIAL_ANTICOAGULANTE)
    }
    setErrores({})
    setHaIntentadoGuardar(false)
  }, [protocolo, esProfilaxis])

  const handleChange = (campo, valor) => {
    const nuevoForm = { ...form, [campo]: valor }
    setForm(nuevoForm)

    if (haIntentadoGuardar) {
      const resultado = esProfilaxis
        ? validarProfilaxis(nuevoForm)
        : validarAnticoagulante(nuevoForm)
      setErrores(resultado.errores)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setHaIntentadoGuardar(true)

    const resultado = esProfilaxis
      ? validarProfilaxis(form)
      : validarAnticoagulante(form)

    setErrores(resultado.errores)

    if (resultado.valido) {
      onGuardar(resultado.datos)
    }
  }

  const titulo = esProfilaxis
    ? (esEdicion ? '💉 Editar Protocolo de Profilaxis' : '💉 Nuevo Protocolo de Profilaxis')
    : (esEdicion ? '🩸 Editar Manejo de Anticoagulante' : '🩸 Nuevo Manejo de Anticoagulante')

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={titulo}
      size="lg"
      closeOnOverlayClick={!guardando}
      closeOnEscape={!guardando}
    >
      {/* Banner distintivo de tipo de protocolo preservado */}
      <div className={`border-b px-6 py-3 mb-4 rounded-t-lg ${
        esProfilaxis
          ? 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800'
          : 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800'
      }`}>
        <p className={`text-sm font-semibold ${
          esProfilaxis ? 'text-cyan-800 dark:text-cyan-200' : 'text-rose-800 dark:text-rose-200'
        }`}>
          {esProfilaxis
            ? '⚠️ Protocolo de profilaxis de endocarditis — verificar alergias y vía oral'
            : '⚠️ Manejo de anticoagulantes — verificar INR y riesgo de sangrado'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <CamposFormularioProtocolo
          form={form}
          errores={errores}
          handleChange={handleChange}
          esProfilaxis={esProfilaxis}
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
          {/* Nativo: color clínico dinámico cyan/rosé no garantizado con <Button> */}
          <button
            type="submit"
            className={`px-6 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-50 ${
              esProfilaxis
                ? 'bg-cyan-600 hover:bg-cyan-700'
                : 'bg-rose-600 hover:bg-rose-700'
            }`}
            disabled={guardando}
          >
            {guardando ? 'Guardando...' : (esEdicion ? 'Actualizar' : 'Crear')}
          </button>
        </div>
      </form>
    </Modal>
  )
}
