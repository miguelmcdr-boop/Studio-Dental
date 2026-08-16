/**
 * Modal genérico para crear/editar protocolos clínicos.
 * Funciona tanto para profilaxis endocarditis como manejo anticoagulantes.
 * F4-03f-5c
 */
import React, { useState, useEffect } from 'react'
import { validarProfilaxis } from '../schemas/profilaxisSchema'
import { validarAnticoagulante } from '../schemas/anticoagulanteSchema'

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

  const campoError = (campo) => errores[campo] ? 'border-red-400 bg-red-50' : 'border-gray-300'
  const mensajeError = (campo) => errores[campo] && (
    <p className="text-xs text-red-600 mt-1">{errores[campo]}</p>
  )

  const titulo = esProfilaxis
    ? (esEdicion ? '💉 Editar Protocolo de Profilaxis' : '💉 Nuevo Protocolo de Profilaxis')
    : (esEdicion ? '🩸 Editar Manejo de Anticoagulante' : '🩸 Nuevo Manejo de Anticoagulante')

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className={`sticky top-0 border-b px-6 py-4 flex items-center justify-between ${
          esProfilaxis ? 'bg-cyan-50 border-cyan-200' : 'bg-rose-50 border-rose-200'
        }`}>
          <h2 className="text-xl font-bold text-gray-900">{titulo}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            disabled={guardando}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {esProfilaxis ? (
            <>
              {/* Situación clínica */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Situación clínica <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.situacion}
                  onChange={(e) => handleChange('situacion', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg text-sm ${campoError('situacion')}`}
                  placeholder="Ej: Vía oral disponible, Alergia a penicilinas vía oral"
                />
                {mensajeError('situacion')}
              </div>

              {/* Fármaco */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Fármaco <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.farmaco}
                  onChange={(e) => handleChange('farmaco', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg text-sm ${campoError('farmaco')}`}
                  placeholder="Ej: Amoxicilina, Azitromicina"
                />
                {mensajeError('farmaco')}
              </div>

              {/* Dosis adulto y pediátrica */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Dosis adulto <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.dosis_adulto}
                    onChange={(e) => handleChange('dosis_adulto', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg text-sm ${campoError('dosis_adulto')}`}
                    placeholder="Ej: 2 g VO"
                  />
                  {mensajeError('dosis_adulto')}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Dosis pediátrica
                  </label>
                  <input
                    type="text"
                    value={form.dosis_pediatrica}
                    onChange={(e) => handleChange('dosis_pediatrica', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="Ej: 50 mg/kg VO (máx 2 g)"
                  />
                </div>
              </div>

              {/* Nota clínica */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Nota clínica
                </label>
                <textarea
                  value={form.nota}
                  onChange={(e) => handleChange('nota', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="Ej: No usar si antecedente de anafilaxia a penicilina"
                />
              </div>
            </>
          ) : (
            <>
              {/* Fármaco o grupo */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Fármaco / grupo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.farmaco_o_grupo}
                  onChange={(e) => handleChange('farmaco_o_grupo', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg text-sm ${campoError('farmaco_o_grupo')}`}
                  placeholder="Ej: Warfarina / Acenocumarol, DOACs"
                />
                {mensajeError('farmaco_o_grupo')}
              </div>

              {/* Recomendación */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Recomendación <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.recomendacion}
                  onChange={(e) => handleChange('recomendacion', e.target.value)}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg text-sm ${campoError('recomendacion')}`}
                  placeholder="Ej: No suspender si INR ≤3.5-4.0; verificar INR el día del procedimiento"
                />
                {mensajeError('recomendacion')}
              </div>

              {/* Medidas de hemostasia */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Medidas de hemostasia local
                </label>
                <textarea
                  value={form.medidas_hemostasia}
                  onChange={(e) => handleChange('medidas_hemostasia', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="Ej: Ácido tranexámico local, sutura hermética, compresión 20 min"
                />
              </div>
            </>
          )}

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
      </div>
    </div>
  )
}
