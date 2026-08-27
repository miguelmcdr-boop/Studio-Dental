import React, { memo, useState, useMemo } from 'react'
import { calcularDosisAnestesiaCompleta } from '../../../utils/anestesiaCalculations'
import { esCardiopata, esPediatria, parseEdad } from '../utils/anestesiaHelpers'
import { CONFIG_ESTADO } from '../constants/anestesiaConstants'

/**
 * Calculadora de Dosis Máxima de Anestesia Local (F7-01).
 *
 * Conecta la UI a `calcularDosisAnestesiaCompleta` (API enriquecida F4-03d)
 * y retira la API legada `calcularTubosAnestesia` de producción.
 *
 * Recibe el paciente completo (no solo peso) para derivar:
 * - esPediatria: edad < 18 años
 * - esCardiopata: enfermedades contienen términos cardiovasculares
 * - esEmbarazo: marcado manualmente por el usuario (no hay campo explícito)
 * - edad: años del paciente
 *
 * Estados posibles del cálculo:
 * - OK: cálculo válido → muestra dosis y tubos
 * - DATOS_INCOMPLETOS: falta peso válido o hay contraindicación por edad
 * - ANESTESICO_DESCONOCIDO: anestésico no reconocido o sin datos de dosis
 *
 * Fail-Safe Clinical Default (Constitución Cap. V.2):
 * Si cualquier dato clínico obligatorio falta o es inválido, NUNCA se
 * muestra una cifra estimada — siempre estado restrictivo explícito.
 */

export const CalculadoraAnestesiaSection = memo(({ paciente }) => {
  // Sin valor por defecto para peso: Fail-Safe Clinical Default
  const [pesoPaciente, setPesoPaciente] = useState(paciente?.peso ?? '')
  const [tipoAnestesicoCalc, setTipoAnestesicoCalc] = useState('lidocaina')
  const [esEmbarazo, setEsEmbarazo] = useState(false)

  const edadPaciente = paciente?.edad ?? null
  const enfermedadesPaciente = paciente?.enfermedades ?? ''
  const edadNumerica = parseEdad(edadPaciente)
  const esPediatriaPaciente = esPediatria(edadPaciente)
  const esCardiopataPaciente = esCardiopata(enfermedadesPaciente)

  // ─── Cálculo enriquecido (F7-01: reemplaza calcularTubosAnestesia) ───
  const resultadoAnestesia = useMemo(() => {
    return calcularDosisAnestesiaCompleta({
      peso: pesoPaciente,
      tipoAnestesico: tipoAnestesicoCalc,
      esPediatria: esPediatriaPaciente,
      esCardiopata: esCardiopataPaciente,
      esEmbarazo,
      edad: edadNumerica
    })
  }, [pesoPaciente, tipoAnestesicoCalc, esEmbarazo, edadNumerica, esPediatriaPaciente, esCardiopataPaciente])

  const estado = resultadoAnestesia.estado
  const esOk = estado === 'OK'
  const advertencias = resultadoAnestesia.advertencias || []
  const config = CONFIG_ESTADO[estado] || CONFIG_ESTADO.DATOS_INCOMPLETOS

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 print:hidden space-y-6">
      {/* ─── Header ─── */}
      <div className="border-b pb-3">
        <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider">
          Calculadora de Dosis Máxima de Anestesia Local
        </h3>
        <p className="text-xs text-gray-500 flex flex-wrap gap-x-2 gap-y-1 mt-1">
          <span>Cálculo de seguridad que considera edad, peso, cardiopatía y embarazo.</span>
          {esPediatriaPaciente && (
            <span className="font-bold text-amber-700">👶 Dosis pediátrica</span>
          )}
          {esCardiopataPaciente && (
            <span className="font-bold text-red-700">❤️ Cardiopatía detectada</span>
          )}
          {esEmbarazo && (
            <span className="font-bold text-pink-700">🤰 Embarazo activo</span>
          )}
        </p>
      </div>

      {/* ─── Datos contextuales del paciente ─── */}
      {(edadPaciente !== null && edadPaciente !== '' || enfermedadesPaciente) && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs space-y-1">
          <div className="font-semibold text-gray-700 text-[11px] uppercase tracking-wider mb-1">
            Datos clínicos del paciente
          </div>
          {edadPaciente !== null && edadPaciente !== '' && (
            <div className="flex gap-2">
              <span className="font-semibold text-gray-600">Edad:</span>
              <span className="text-gray-900">
                {edadPaciente} años
                {esPediatriaPaciente && <span className="text-amber-700 ml-1">(dosis pediátrica)</span>}
              </span>
            </div>
          )}
          {enfermedadesPaciente && (
            <div className="flex gap-2">
              <span className="font-semibold text-gray-600">Enfermedades:</span>
              <span className="text-gray-900">{enfermedadesPaciente}</span>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ─── Formulario ─── */}
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-gray-700 mb-1" htmlFor="anestesia-peso">
              Peso del Paciente (Kg)
            </label>
            <input
              id="anestesia-peso"
              data-testid="anestesia-peso"
              type="number"
              value={pesoPaciente}
              onChange={(e) => setPesoPaciente(e.target.value)}
              placeholder="Ingrese el peso del paciente"
              className={`w-full p-2.5 rounded-xl border font-bold text-sm ${
                !esOk ? 'border-amber-400 bg-amber-50' : 'border-gray-300'
              }`}
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1" htmlFor="anestesia-tipo">
              Tipo de Anestésico Local
            </label>
            <select
              id="anestesia-tipo"
              data-testid="anestesia-tipo"
              value={tipoAnestesicoCalc}
              onChange={(e) => setTipoAnestesicoCalc(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-300 font-semibold bg-white"
            >
              <option value="lidocaina">Lidocaína 2% con Epinefrina (36 mg/tubo — Máx 4.4 mg/kg)</option>
              <option value="mepivacaina">Mepivacaína 3% sin vasoconstrictor (54 mg/tubo — Máx 6.6 mg/kg)</option>
              <option value="articaina">Articaína 4% con Epinefrina (72 mg/tubo — Máx 7.0 mg/kg)</option>
              <option value="bupivacaina">Bupivacaína 0.5% con Epinefrina (9 mg/tubo — Máx 1.3 mg/kg)</option>
            </select>
          </div>

          <div className="flex items-center gap-2 p-3 bg-pink-50 border border-pink-200 rounded-xl">
            <input
              id="anestesia-embarazo"
              data-testid="anestesia-embarazo"
              type="checkbox"
              checked={esEmbarazo}
              onChange={(e) => setEsEmbarazo(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="anestesia-embarazo" className="font-semibold text-pink-900 text-xs cursor-pointer">
              Paciente embarazada (aplicar precauciones adicionales)
            </label>
          </div>
        </div>

        {/* ─── Resultado ─── */}
        {esOk ? (
          <div
            data-testid="anestesia-resultado-ok"
            className={`p-6 ${config.bg} border ${config.border} rounded-2xl flex flex-col justify-center text-center`}
          >
            <span className={`text-xs uppercase font-bold ${config.text} block mb-1`}>
              {config.label}
            </span>
            <span className="text-3xl font-extrabold text-blue-900">
              {resultadoAnestesia.calculos.tubos} Tubos
            </span>
            <span className="text-xs font-semibold text-blue-700 mt-1">
              Dosis máxima: {resultadoAnestesia.calculos.mgMax} mg
            </span>
            {resultadoAnestesia.calculos.dosisUsada === 'pediatrica' && (
              <span className="text-[11px] text-amber-700 mt-2 font-semibold">
                ⚠️ Dosis pediátrica aplicada ({resultadoAnestesia.calculos.mgPorKg} mg/kg)
              </span>
            )}
            {resultadoAnestesia.calculos.dosisUsada === 'adulta_fallback' && (
              <span className="text-[11px] text-amber-700 mt-2 font-semibold">
                ⚠️ Dosis adulta aplicada (pediátrica no disponible)
              </span>
            )}
          </div>
        ) : (
          <div
            data-testid="anestesia-resultado-restrictivo"
            className={`p-6 ${config.bg} border-2 ${config.border} rounded-2xl flex flex-col justify-center text-center gap-1`}
          >
            <span className={`text-xs uppercase font-bold ${config.text} block`}>
              {config.label}
            </span>
            <span className="text-sm font-semibold text-amber-700">
              {resultadoAnestesia.mensaje}
            </span>
            <span className="text-[11px] text-amber-600 mt-1">
              No se muestra ninguna dosis hasta cumplir todos los requisitos clínicos.
            </span>
          </div>
        )}
      </div>

      {/* ─── Advertencias / Contraindicaciones (independientes del estado) ─── */}
      {advertencias.length > 0 && (
        <div
          data-testid="anestesia-advertencias"
          className="bg-red-50 border-2 border-red-300 rounded-2xl p-4 space-y-2"
        >
          <div className="text-xs font-bold text-red-900 uppercase tracking-wider">
            ⛔ Contraindicaciones detectadas
          </div>
          {advertencias.map((adv, idx) => (
            <div key={idx} className="text-sm text-red-800 font-semibold">
              {adv}
            </div>
          ))}
        </div>
      )}

      {/* ─── Información del anestésico ─── */}
      {resultadoAnestesia.anestesiaInfo && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs">
          <div className="font-semibold text-gray-700 text-[11px] uppercase tracking-wider mb-1">
            Anestésico seleccionado
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-gray-900">
            <div>
              <span className="font-semibold text-gray-600 block md:inline md:mr-1">Nombre:</span>
              {resultadoAnestesia.anestesiaInfo.nombreGenerico}
            </div>
            <div>
              <span className="font-semibold text-gray-600 block md:inline md:mr-1">Familia:</span>
              {resultadoAnestesia.anestesiaInfo.familia}
            </div>
            <div>
              <span className="font-semibold text-gray-600 block md:inline md:mr-1">Presentación:</span>
              {resultadoAnestesia.anestesiaInfo.presentacion}
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

CalculadoraAnestesiaSection.displayName = 'CalculadoraAnestesiaSection'
