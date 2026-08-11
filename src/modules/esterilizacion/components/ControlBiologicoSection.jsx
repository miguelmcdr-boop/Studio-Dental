import React, { memo, useState } from 'react'
import { EQUIPOS_AUTOCLAVE } from '../constants/esterilizacionConstants'

export const ControlBiologicoSection = memo(({ biologicos, alAgregar, alActualizarResultado }) => {
  const [loteAsociado, setLoteAsociado] = useState('')
  const [equipo, setEquipo] = useState(EQUIPOS_AUTOCLAVE[0])
  const [marcaAmpolla] = useState('3M Attest 1262')
  const [horasRequeridas, setHorasRequeridas] = useState(24)
  const [observacion, setObservacion] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!loteAsociado.trim()) {
      alert('Ingresa el código de Lote asociado a la ampolla biológica.')
      return
    }

    const nuevaPrueba = {
      id: Date.now(),
      loteAsociado,
      equipo,
      fechaIncubacion: new Date().toLocaleDateString('es-CL'),
      horaIncubacion: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
      marcaAmpolla,
      horasRequeridas: parseInt(horasRequeridas),
      resultado: 'Pendiente',
      responsableLectura: 'Operador TENS',
      observacion
    }

    alAgregar(nuevaPrueba)
    setLoteAsociado('')
    setObservacion('')
  }

  return (
    <div className="space-y-6 text-xs">
      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="border-b pb-2">
          <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider">
            🧬 Control e Incubación de Indicadores Biológicos (Geobacillus)
          </h3>
          <p className="text-gray-500 text-[11px]">
            Seguimiento obligatorio de ampollas de esporas para liberación segura de instrumental.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Código de Lote Autoclave *</label>
            <input
              type="text"
              required
              placeholder="Ej: LOTE-20260803-01"
              value={loteAsociado}
              onChange={(e) => setLoteAsociado(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-300 font-mono font-bold"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Equipo Autoclave</label>
            <select
              value={equipo}
              onChange={(e) => setEquipo(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-300 bg-white font-semibold"
            >
              {EQUIPOS_AUTOCLAVE.map(eq => <option key={eq} value={eq}>{eq}</option>)}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Tiempo Lectura Requerido</label>
            <select
              value={horasRequeridas}
              onChange={(e) => setHorasRequeridas(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-300 bg-white font-bold"
            >
              <option value={24}>24 Horas (Incubación Estándar)</option>
              <option value={48}>48 Horas (Incubación Completa)</option>
              <option value={1}>1 Hora (Lectura Rápida Attest)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block font-semibold text-gray-700 mb-1">Observaciones / Marca de Indicador</label>
          <input
            type="text"
            placeholder="Ej: 3M Attest 1262, Incubadora a 56°C..."
            value={observacion}
            onChange={(e) => setObservacion(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-gray-300"
          />
        </div>

        <button
          type="submit"
          className="bg-black text-white font-bold px-4 py-2.5 rounded-xl hover:bg-gray-800 transition-colors shadow-xs"
        >
          ➕ Iniciar Incubación de Ampolla
        </button>
      </form>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 bg-gray-50 border-b font-bold text-gray-800 uppercase tracking-wider">
          Historial de Lectura de Indicadores Biológicos ({biologicos.length})
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b text-gray-700 font-bold uppercase text-[10px]">
              <th className="p-3">Lote Carga</th>
              <th className="p-3">Fecha Inicio</th>
              <th className="p-3">Equipo</th>
              <th className="p-3">Tiempo Incubación</th>
              <th className="p-3 text-center">Resultado</th>
              <th className="p-3 text-right">Acción Lectura</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {biologicos.map(b => (
              <tr key={b.id} className="hover:bg-gray-50">
                <td className="p-3 font-mono font-bold text-gray-900">{b.loteAsociado}</td>
                <td className="p-3 font-semibold text-gray-700">{b.fechaIncubacion} {b.horaIncubacion}</td>
                <td className="p-3 text-gray-800 font-medium">{b.equipo}</td>
                <td className="p-3 font-bold text-blue-900">{b.horasRequeridas} Hrs</td>
                <td className="p-3 text-center">
                  <span className={`px-2.5 py-1 rounded-lg font-extrabold text-[10px] ${
                    b.resultado === 'Aprobado' ? 'bg-emerald-100 text-emerald-900' :
                    b.resultado === 'Rechazado' ? 'bg-red-100 text-red-900' : 'bg-amber-100 text-amber-900'
                  }`}>
                    {b.resultado === 'Pendiente' ? '⏳ INCUBANDO' : b.resultado === 'Aprobado' ? '🟢 NEGATIVO (ESTÉRIL)' : '🔴 POSITIVO (FALLO)'}
                  </span>
                </td>
                <td className="p-3 text-right">
                  {b.resultado === 'Pendiente' ? (
                    <div className="flex gap-1 justify-end">
                      <button
                        onClick={() => alActualizarResultado(b.id, 'Aprobado')}
                        className="bg-emerald-600 text-white px-2 py-1 rounded font-bold hover:bg-emerald-700 text-[10px]"
                      >
                        ✔ Aprobar (Negativo)
                      </button>
                      <button
                        onClick={() => alActualizarResultado(b.id, 'Rechazado')}
                        className="bg-red-600 text-white px-2 py-1 rounded font-bold hover:bg-red-700 text-[10px]"
                      >
                        ✖ Rechazar
                      </button>
                    </div>
                  ) : (
                    <span className="text-gray-400 font-semibold text-[10px]">Lectura Registrada</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
})

ControlBiologicoSection.displayName = 'ControlBiologicoSection'