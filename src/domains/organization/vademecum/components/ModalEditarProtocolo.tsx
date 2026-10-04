/**
 * Modal genérico para crear/editar protocolos clínicos.
 * Funciona tanto para profilaxis endocarditis como manejo anticoagulantes.
 * F4-03f-5c — Migrado a <Modal> base + CamposFormularioProtocolo (F7-25)
 */
import React, { useState, useEffect } from 'react'
import { validarProfilaxis, type Profilaxis } from '../schemas/profilaxisSchema'
import { validarAnticoagulante, type Anticoagulante } from '../schemas/anticoagulanteSchema'
import { Modal } from '../../../../components/ui/Modal'
import { Button } from '../../../../components/ui/Button'
import { CamposFormularioProtocolo, type ProtocoloFormState } from './CamposFormularioProtocolo'
import { AlertTriangle } from 'lucide-react'

const VALOR_INICIAL_PROFILAXIS: ProtocoloFormState = {
  situacion: '',
  farmaco: '',
  dosis_adulto: '',
  dosis_pediatrica: '',
  nota: ''
}

const VALOR_INICIAL_ANTICOAGULANTE: ProtocoloFormState = {
  farmaco_o_grupo: '',
  recomendacion: '',
  medidas_hemostasia: ''
}

export interface ModalEditarProtocoloProps {
  tipo: 'profilaxis' | 'anticoagulante' | string
  protocolo: (Profilaxis | Anticoagulante) | null
  onGuardar: (datos: Profilaxis | Anticoagulante) => void
  onClose: () => void
  guardando?: boolean
}

export const ModalEditarProtocolo: React.FC<ModalEditarProtocoloProps> = ({ tipo, protocolo, onGuardar, onClose, guardando = false }) => {
  const esEdicion = !!protocolo
  const esProfilaxis = tipo === 'profilaxis'

  const [form, setForm] = useState<ProtocoloFormState>(esProfilaxis ? VALOR_INICIAL_PROFILAXIS : VALOR_INICIAL_ANTICOAGULANTE)
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [haIntentadoGuardar, setHaIntentadoGuardar] = useState(false)

  useEffect(() => {
    if (protocolo) {
      if (esProfilaxis) {
        const prof = protocolo as Profilaxis
        setForm({
          situacion: prof.situacion || '',
          farmaco: prof.farmaco || '',
          dosis_adulto: prof.dosis_adulto || '',
          dosis_pediatrica: prof.dosis_pediatrica || '',
          nota: prof.nota || ''
        })
      } else {
        const anti = protocolo as Anticoagulante
        setForm({
          farmaco_o_grupo: anti.farmaco_o_grupo || '',
          recomendacion: anti.recomendacion || '',
          medidas_hemostasia: anti.medidas_hemostasia || ''
        })
      }
    } else {
      setForm(esProfilaxis ? VALOR_INICIAL_PROFILAXIS : VALOR_INICIAL_ANTICOAGULANTE)
    }
    setErrores({})
    setHaIntentadoGuardar(false)
  }, [protocolo, esProfilaxis])

  const handleChange = (campo: string, valor: unknown) => {
    const nuevoForm: ProtocoloFormState = { ...form, [campo]: valor }
    setForm(nuevoForm)

    if (haIntentadoGuardar) {
      const resultado = esProfilaxis
        ? validarProfilaxis(nuevoForm)
        : validarAnticoagulante(nuevoForm)
      setErrores(resultado.errores || {})
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setHaIntentadoGuardar(true)

    const resultado = esProfilaxis
      ? validarProfilaxis(form)
      : validarAnticoagulante(form)

    setErrores(resultado.errores || {})

    if (resultado.valido && resultado.datos) {
      onGuardar(resultado.datos)
    }
  }

  const titulo = esProfilaxis
    ? (esEdicion ? 'Editar Protocolo de Profilaxis' : 'Nuevo Protocolo de Profilaxis')
    : (esEdicion ? 'Editar Manejo de Anticoagulante' : 'Nuevo Manejo de Anticoagulante')

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
            ? <span className='inline-flex items-center gap-1'><AlertTriangle size={12} />Protocolo de profilaxis de endocarditis — verificar alergias y vía oral</span>
            : <span className='inline-flex items-center gap-1'><AlertTriangle size={12} />Manejo de anticoagulantes — verificar INR y riesgo de sangrado</span>}
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
          <button
            type="submit"
            className={`px-6 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-50 ${
              esProfilaxis
                ? 'bg-cyan-600 hover:bg-cyan-700 transition-colors duration-150'
                : 'bg-rose-600 hover:bg-rose-700 transition-colors duration-150'
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
