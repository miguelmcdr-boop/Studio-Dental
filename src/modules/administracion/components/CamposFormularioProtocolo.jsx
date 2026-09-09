/**
 * CamposFormularioProtocolo — Campos de protocolos clínicos (profilaxis / anticoagulantes)
 * Extraído de ModalEditarProtocolo.jsx para cumplir límites de allowlist (F7-25)
 * F4-03f-5c
 */
import React from 'react'

const campoError = (errores, campo) => errores[campo] ? 'border-red-400 bg-red-50' : 'border-gray-300'
const mensajeError = (errores, campo) => errores[campo] && (
  <p className="text-xs text-red-600 mt-1">{errores[campo]}</p>
)

export const CamposFormularioProtocolo = ({ form, errores, handleChange, esProfilaxis }) => {
  if (esProfilaxis) {
    return (
      <>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Situación clínica <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.situacion}
            onChange={(e) => handleChange('situacion', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg text-sm ${campoError(errores, 'situacion')}`}
            placeholder="Ej: Vía oral disponible, Alergia a penicilinas vía oral"
          />
          {mensajeError(errores, 'situacion')}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Fármaco <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.farmaco}
            onChange={(e) => handleChange('farmaco', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg text-sm ${campoError(errores, 'farmaco')}`}
            placeholder="Ej: Amoxicilina, Azitromicina"
          />
          {mensajeError(errores, 'farmaco')}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Dosis adulto <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.dosis_adulto}
              onChange={(e) => handleChange('dosis_adulto', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg text-sm ${campoError(errores, 'dosis_adulto')}`}
              placeholder="Ej: 2 g VO"
            />
            {mensajeError(errores, 'dosis_adulto')}
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
    )
  }

  return (
    <>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Fármaco / grupo <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.farmaco_o_grupo}
          onChange={(e) => handleChange('farmaco_o_grupo', e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg text-sm ${campoError(errores, 'farmaco_o_grupo')}`}
          placeholder="Ej: Warfarina / Acenocumarol, DOACs"
        />
        {mensajeError(errores, 'farmaco_o_grupo')}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Recomendación <span className="text-red-500">*</span>
        </label>
        <textarea
          value={form.recomendacion}
          onChange={(e) => handleChange('recomendacion', e.target.value)}
          rows={3}
          className={`w-full px-3 py-2 border rounded-lg text-sm ${campoError(errores, 'recomendacion')}`}
          placeholder="Ej: No suspender si INR ≤3.5-4.0; verificar INR el día del procedimiento"
        />
        {mensajeError(errores, 'recomendacion')}
      </div>

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
  )
}
