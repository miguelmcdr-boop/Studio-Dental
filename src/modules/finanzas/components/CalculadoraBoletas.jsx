import React, { memo, useState } from 'react'
import { PORCENTAJE_RETENCION_HONORARIOS_DEFAULT } from '../constants/finanzasConstants'
import { calcularBoletaHonorarios, calcularMontoComision, formatearCLP } from '../utils/finanzasCalculations'

export const CalculadoraBoletas = memo(({ alRegistrarGastoHonorario }) => {
  const [usarPorcentajePrestacion, setUsarPorcentajePrestacion] = useState(true)
  const [nombrePrestacion, setNombrePrestacion] = useState('')
  const [valorPrestacion, setValorPrestacion] = useState('')
  const [pctComisionEspecialista, setPctComisionEspecialista] = useState(60)

  const [montoDirecto, setMontoDirecto] = useState('')
  const [modoCalculo, setModoCalculo] = useState('liquido')
  const [pctRetencion, setPctRetencion] = useState(PORCENTAJE_RETENCION_HONORARIOS_DEFAULT)
  const [nombreEspecialista, setNombreEspecialidad] = useState('')
  const [especialidad, setEspecialidad] = useState('')

  // 1. Cálculo del honorario base
  const valPrestacionNum = parseFloat(valorPrestacion) || 0
  const comisionInfo = calcularMontoComision(valPrestacionNum, pctComisionEspecialista)
  const montoBaseParaBoleta = usarPorcentajePrestacion ? comisionInfo.montoEspecialista : (parseFloat(montoDirecto) || 0)

  // 2. Desglose de boleta (Bruto / Retención / Líquido)
  const resultado = calcularBoletaHonorarios(montoBaseParaBoleta, modoCalculo, pctRetencion)

  const handleCargarAGastos = () => {
    if (!resultado.liquido || resultado.liquido <= 0) return

    const detalleTexto = usarPorcentajePrestacion
      ? `Honorario (${pctComisionEspecialista}% de ${nombrePrestacion || 'Prestación'} ${formatearCLP(valPrestacionNum)}): ${nombreEspecialista || 'Dr.'} (${especialidad || 'Especialista'}) — Boleta Bruta: ${formatearCLP(resultado.bruto)}, Retención SII (${pctRetencion}%): ${formatearCLP(resultado.retencion)}`
      : `Pago Honorarios: ${nombreEspecialista || 'Especialista'} (${especialidad || 'Dental'}) — Boleta Bruta: ${formatearCLP(resultado.bruto)}, Retención SII (${pctRetencion}%): ${formatearCLP(resultado.retencion)}`

    const nuevoGasto = {
      id: Date.now(),
      fecha: new Date().toLocaleDateString('es-CL'),
      tipo: 'egreso',
      monto: resultado.liquido,
      categoria: 'Pago Honorarios Especialista',
      metodoPago: 'Transferencia',
      detalle: detalleTexto
    }

    if (alRegistrarGastoHonorario) {
      alRegistrarGastoHonorario(nuevoGasto)
      alert('✅ Pago de honorarios registrado exitosamente en el Flujo de Caja.')
      setValorPrestacion('')
      setMontoDirecto('')
      setNombrePrestacion('')
      setNombreEspecialidad('')
      setEspecialidad('')
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-6 text-xs">
      <div className="border-b pb-3 flex justify-between items-center flex-wrap gap-2">
        <div>
          <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider">
            🧾 Liquidador de Honorarios por Prestación / Comisión
          </h3>
          <p className="text-gray-500 text-[11px]">
            Calcula el porcentaje que le corresponde al especialista y su desglose de retención tributaria (SII).
          </p>
        </div>

        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border">
          <span className="font-semibold text-gray-600">% Retención SII:</span>
          <input
            type="number"
            step="0.01"
            value={pctRetencion}
            onChange={(e) => setPctRetencion(parseFloat(e.target.value) || 0)}
            className="w-16 p-1 border rounded bg-white text-center font-bold text-xs"
          />
          <span className="font-bold text-gray-700">%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Modalidad de Cálculo</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setUsarPorcentajePrestacion(true)}
                className={`p-2.5 rounded-xl font-bold transition-all text-center ${
                  usarPorcentajePrestacion ? 'bg-black text-white shadow-xs' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                📊 % sobre Prestación
              </button>
              <button
                type="button"
                onClick={() => setUsarPorcentajePrestacion(false)}
                className={`p-2.5 rounded-xl font-bold transition-all text-center ${
                  !usarPorcentajePrestacion ? 'bg-black text-white shadow-xs' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                💵 Monto Fijo Directo
              </button>
            </div>
          </div>

          {usarPorcentajePrestacion ? (
            <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-2xl space-y-3">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Nombre Tratamiento / Prestación</label>
                <input
                  type="text"
                  placeholder="Ej: Endodoncia Multirradicular, Implante, Cirugía 3er Molar..."
                  value={nombrePrestacion}
                  onChange={(e) => setNombrePrestacion(e.target.value)}
                  className="w-full p-2 rounded-xl border border-gray-300 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Valor Prestación ($ CLP)</label>
                  <input
                    type="number"
                    placeholder="Ej: 160000"
                    value={valorPrestacion}
                    onChange={(e) => setValorPrestacion(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-300 font-bold text-sm bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">% Comisión Especialista</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={pctComisionEspecialista}
                      onChange={(e) => setPctComisionEspecialista(parseFloat(e.target.value) || 0)}
                      className="w-full p-2.5 rounded-xl border border-gray-300 font-black text-sm bg-white text-center"
                    />
                    <span className="font-bold text-gray-700">%</span>
                  </div>
                </div>
              </div>

              {valPrestacionNum > 0 && (
                <div className="text-[11px] bg-white p-2.5 rounded-xl border border-blue-200 flex justify-between items-center font-semibold text-blue-900">
                  <span>Monto Especialista ({pctComisionEspecialista}%): <strong>{formatearCLP(comisionInfo.montoEspecialista)}</strong></span>
                  <span>Clínica: <strong>{formatearCLP(comisionInfo.clinicaMonto)}</strong></span>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-3">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Modo de Emisión</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setModoCalculo('liquido')}
                    className={`p-2 rounded-lg font-bold text-xs ${
                      modoCalculo === 'liquido' ? 'bg-gray-800 text-white' : 'bg-white border text-gray-600'
                    }`}
                  >
                    A Pagar Líquido
                  </button>
                  <button
                    type="button"
                    onClick={() => setModoCalculo('bruto')}
                    className={`p-2 rounded-lg font-bold text-xs ${
                      modoCalculo === 'bruto' ? 'bg-gray-800 text-white' : 'bg-white border text-gray-600'
                    }`}
                  >
                    Monto Bruto Boleta
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  {modoCalculo === 'liquido' ? 'Monto Líquido a Pagar ($ CLP)' : 'Monto Bruto de la Boleta ($ CLP)'}
                </label>
                <input
                  type="number"
                  placeholder="Ej: 150000"
                  value={montoDirecto}
                  onChange={(e) => setMontoDirecto(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-300 font-bold text-sm bg-white"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-2 border-t">
            <div>
              <label className="block font-semibold text-gray-600 mb-1">Nombre Especialista</label>
              <input
                type="text"
                placeholder="Dr. Juan Pérez"
                value={nombreEspecialista}
                onChange={(e) => setNombreEspecialidad(e.target.value)}
                className="w-full p-2 rounded-lg border border-gray-300"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-600 mb-1">Especialidad</label>
              <input
                type="text"
                placeholder="Implantología / Cirugía"
                value={especialidad}
                onChange={(e) => setEspecialidad(e.target.value)}
                className="w-full p-2 rounded-lg border border-gray-300"
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 flex flex-col justify-between space-y-4">
          <div>
            <h4 className="font-extrabold text-xs text-gray-800 uppercase tracking-wider mb-4 border-b pb-2">
              Liquidación Tributaria de la Boleta
            </h4>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Monto Bruto Boleta:</span>
                <span className="font-bold text-gray-900 text-sm">{formatearCLP(resultado.bruto)}</span>
              </div>

              <div className="flex justify-between items-center text-red-700 bg-red-50 p-2.5 rounded-xl border border-red-200">
                <span className="font-semibold">(-) Retención SII ({pctRetencion}%):</span>
                <span className="font-black text-sm">-{formatearCLP(resultado.retencion)}</span>
              </div>

              <div className="flex justify-between items-center text-emerald-900 bg-emerald-50 p-3 rounded-xl border border-emerald-300">
                <span className="font-bold">(=) Valor Líquido a Transferir:</span>
                <span className="font-black text-base">{formatearCLP(resultado.liquido)}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCargarAGastos}
            disabled={!resultado.liquido || resultado.liquido <= 0}
            className="w-full bg-black text-white font-bold py-2.5 rounded-xl hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-xs"
          >
            Cargar Egreso a la Caja ({formatearCLP(resultado.liquido)})
          </button>
        </div>
      </div>
    </div>
  )
})

CalculadoraBoletas.displayName = 'CalculadoraBoletas'