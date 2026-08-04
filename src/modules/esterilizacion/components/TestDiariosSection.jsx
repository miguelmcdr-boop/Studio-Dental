import React, { memo, useState } from 'react'
import { EQUIPOS_AUTOCLAVE, RESULTADOS_BOWIE_DICK } from '../constants/esterilizacionConstants'

export const TestDiariosSection = memo(({ testDiarios, alAgregarTest }) => {
  const [equipo, setEquipo] = useState(EQUIPOS_AUTOCLAVE[0])
  const [resultado, setResultado] = useState(RESULTADOS_BOWIE_DICK[0].nombre)
  const [operador, setOperador] = useState('TENS Esterilización')
  const [observacion, setObservacion] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()

    const nuevoTest = {
      id: Date.now(),
      fecha: new Date().toLocaleDateString('es-CL'),
      equipo,
      resultado,
      operador,
      observacion: observacion || 'Prueba de penetración de vapor matutina.'
    }

    alAgregarTest(nuevoTest)
    alert('✅ Test Diario de Bowie-Dick registrado correctamente.')
    setObservacion('')
  }

  return (
    <div className="space-y-6 text-xs">
      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="border-b pb-2">
          <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider">
            🛠️ Test Diarios de Penetración de Vapor (Bowie-Dick / Pre-Vacío)
          </h3>
          <p className="text-gray-500 text-[11px]">
            Verificación técnica matutina obligatoria por la SEREMI antes de procesar cargas de pacientes.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Equipo Autoclave *</label>
            <select
              value={equipo}
              onChange={(e) => setEquipo(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-300 bg-white font-bold"
            >
              {EQUIPOS_AUTOCLAVE.map(eq => <option key={eq} value={eq}>{eq}</option>)}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Resultado de Viraje Hoja Bowie-Dick</label>
            <select
              value={resultado}
              onChange={(e) => setResultado(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-300 bg-white font-semibold"
            >
              {RESULTADOS_BOWIE_DICK.map(r => <option key={r.id} value={r.nombre}>{r.nombre}</option>)}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Operador Responsable</label>
            <input
              type="text"
              value={operador}
              onChange={(e) => setOperador(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-300 font-semibold"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-gray-700 mb-1">Observaciones Técnicas</label>
          <input
            type="text"
            placeholder="Viraje uniforme de hoja de prueba, sin presencia de bolsas de aire..."
            value={observacion}
            onChange={(e) => setObservacion(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-gray-300"
          />
        </div>

        <button
          type="submit"
          className="bg-black text-white font-bold px-4 py-2.5 rounded-xl hover:bg-gray-800 transition-colors shadow-xs"
        >
          📝 Guardar Test de Bowie-Dick
        </button>
      </form>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 bg-gray-50 border-b font-bold text-gray-800 uppercase tracking-wider">
          Historial de Test Diarios de Autoclave ({testDiarios.length})
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b text-gray-700 font-bold uppercase text-[10px]">
              <th className="p-3">Fecha</th>
              <th className="p-3">Equipo</th>
              <th className="p-3">Operador</th>
              <th className="p-3">Resultado Bowie-Dick</th>
              <th className="p-3">Observación</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {testDiarios.map(t => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="p-3 font-bold text-gray-900">{t.fecha}</td>
                <td className="p-3 font-semibold text-gray-800">{t.equipo}</td>
                <td className="p-3 text-gray-600">{t.operador}</td>
                <td className="p-3 font-bold text-gray-900">{t.resultado}</td>
                <td className="p-3 text-gray-500 italic">{t.observacion}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
})

TestDiariosSection.displayName = 'TestDiariosSection'