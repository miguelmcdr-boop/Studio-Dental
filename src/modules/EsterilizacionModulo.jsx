import React, { useState, useEffect } from 'react'

export const EsterilizacionModulo = () => {
  const [ciclos, setCiclos] = useState(() => {
    const saved = localStorage.getItem('clinica_ciclos_esterilizacion')
    return saved ? JSON.parse(saved) : [
      { id: 1, lote: 'LOT-20260801-1', fecha: new Date().toLocaleDateString('es-CL'), autoclave: 'Autoclave B-Class Box 1', temperatura: '134°C', presion: '2.1 bar', tiempo: '18 min', operador: 'Asistente Clínica', virajeQuimico: 'Conforme (Virado)', virajeBiologico: 'Negativo (Sin crecimiento)' }
    ]
  })

  const [mostrarModalNuevo, setMostrarModalNuevo] = useState(false)
  const [nuevoCiclo, setNuevoCiclo] = useState({
    autoclave: 'Autoclave Principal 1', temperatura: '134°C', presion: '2.1 bar', tiempo: '18 min', operador: '', virajeQuimico: 'Conforme (Virado)', virajeBiologico: 'Negativo (Sin crecimiento)'
  })

  useEffect(() => {
    localStorage.setItem('clinica_ciclos_esterilizacion', JSON.stringify(ciclos))
  }, [ciclos])

  const handleCrearCiclo = (e) => {
    e.preventDefault()
    const loteId = `LOT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${ciclos.length + 1}`
    const cicloObj = {
      id: Date.now(),
      lote: loteId,
      fecha: new Date().toLocaleDateString('es-CL'),
      ...nuevoCiclo
    }
    setCiclos([cicloObj, ...ciclos])
    setMostrarModalNuevo(false)
    setNuevoCiclo({ autoclave: 'Autoclave Principal 1', temperatura: '134°C', presion: '2.1 bar', tiempo: '18 min', operador: '', virajeQuimico: 'Conforme (Virado)', virajeBiologico: 'Negativo (Sin crecimiento)' })
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Bioseguridad y Trazabilidad de Esterilización</h2>
          <p className="text-xs text-gray-500">Registro de cargas de autoclave, virajes y número de lote para fiscalización Seremi.</p>
        </div>

        <button
          onClick={() => setMostrarModalNuevo(true)}
          className="bg-black text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-gray-800 transition-colors flex items-center gap-2 shadow-sm"
        >
          <span>🧼</span> Registrar Ciclo Autoclave
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
          <h3 className="font-bold text-sm text-gray-800">Historial de Cargas y Lotes de Esterilización</h3>
          <button onClick={() => window.print()} className="text-xs font-bold bg-white border px-3 py-1.5 rounded-lg">
            🖨️ Imprimir Libro de Esterilización
          </button>
        </div>

        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider">
              <th className="p-4">N° Lote</th>
              <th className="p-4">Fecha</th>
              <th className="p-4">Autoclave</th>
              <th className="p-4 text-center">Parámetros (T° / P / t)</th>
              <th className="p-4 text-center">Viraje Químico</th>
              <th className="p-4 text-center">Control Biológico</th>
              <th className="p-4 text-right">Operador</th>
            </tr>
          </thead>
          <tbody>
            {ciclos.map(c => (
              <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="p-4 font-extrabold text-blue-900">{c.lote}</td>
                <td className="p-4 font-semibold text-gray-700">{c.fecha}</td>
                <td className="p-4 font-medium text-gray-800">{c.autoclave}</td>
                <td className="p-4 text-center font-bold text-gray-900">{c.temperatura} | {c.presion} | {c.tiempo}</td>
                <td className="p-4 text-center">
                  <span className="bg-green-100 text-green-800 font-bold px-2.5 py-1 rounded-md text-[10px]">
                    {c.virajeQuimico}
                  </span>
                </td>
                <td className="p-4 text-center">
                  <span className="bg-blue-100 text-blue-800 font-bold px-2.5 py-1 rounded-md text-[10px]">
                    {c.virajeBiologico}
                  </span>
                </td>
                <td className="p-4 text-right font-semibold text-gray-700">{c.operador || 'Cirujano Dentista'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {mostrarModalNuevo && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md border border-gray-200 shadow-xl">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900">Registrar Carga de Autoclave</h3>
              <button onClick={() => setMostrarModalNuevo(false)} className="text-gray-400 hover:text-black font-bold text-lg">✕</button>
            </div>

            <form onSubmit={handleCrearCiclo} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-600 uppercase mb-1">Equipo Autoclave</label>
                <input
                  type="text"
                  required
                  value={nuevoCiclo.autoclave}
                  onChange={(e) => setNuevoCiclo({ ...nuevoCiclo, autoclave: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-gray-600 uppercase mb-1">Temperatura</label>
                  <input
                    type="text"
                    value={nuevoCiclo.temperatura}
                    onChange={(e) => setNuevoCiclo({ ...nuevoCiclo, temperatura: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-600 uppercase mb-1">Presión</label>
                  <input
                    type="text"
                    value={nuevoCiclo.presion}
                    onChange={(e) => setNuevoCiclo({ ...nuevoCiclo, presion: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-600 uppercase mb-1">Tiempo</label>
                  <input
                    type="text"
                    value={nuevoCiclo.tiempo}
                    onChange={(e) => setNuevoCiclo({ ...nuevoCiclo, tiempo: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-600 uppercase mb-1">Operador Responsable</label>
                <input
                  type="text"
                  placeholder="Ej: Dr. Miguel Díaz / Asistente"
                  value={nuevoCiclo.operador}
                  onChange={(e) => setNuevoCiclo({ ...nuevoCiclo, operador: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-600 uppercase mb-1">Viraje Químico</label>
                  <select
                    value={nuevoCiclo.virajeQuimico}
                    onChange={(e) => setNuevoCiclo({ ...nuevoCiclo, virajeQuimico: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white"
                  >
                    <option value="Conforme (Virado)">🟢 Conforme (Virado)</option>
                    <option value="No Conforme">🔴 No Conforme</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-600 uppercase mb-1">Control Biológico</label>
                  <select
                    value={nuevoCiclo.virajeBiologico}
                    onChange={(e) => setNuevoCiclo({ ...nuevoCiclo, virajeBiologico: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white"
                  >
                    <option value="Negativo (Sin crecimiento)">🔵 Negativo (Sin crecimiento)</option>
                    <option value="Positivo (Crecimiento)">🔴 Positivo (Falla)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMostrarModalNuevo(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-gray-300 font-semibold text-gray-700 hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-black text-white py-2.5 rounded-xl font-semibold hover:bg-gray-800"
                >
                  Guardar Ciclo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}