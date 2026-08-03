import React, { useState } from 'react'
import { TIPO_CONDUCTOS, TECNICAS_OBTURACION, SELLADORES_ENDODONTICOS } from '../constants/quirurgicoConstants'

export const FichaEndodoncia = ({ endodoncias = [], onAgregarEndodoncia, onEliminarEndodoncia }) => {
  const [pieza, setPieza] = useState('1.6')
  const [tecnicaObturacion, setTecnicaObturacion] = useState(TECNICAS_OBTURACION[0])
  const [sellador, setSellador] = useState(SELLADORES_ENDODONTICOS[1])
  const [conductos, setConductos] = useState([
    { nombre: 'MV', cad: '21 mm', crd: '20.5 mm', ltp: '20.5 mm', referencia: 'Cúspide MV', limaApical: '25.04', irrigacion: 'NaOCl 2.5%' },
    { nombre: 'DV', cad: '20 mm', crd: '19.5 mm', ltp: '19.5 mm', referencia: 'Cúspide DV', limaApical: '25.04', irrigacion: 'NaOCl 2.5%' },
    { nombre: 'P', cad: '22 mm', crd: '21.5 mm', ltp: '21.5 mm', referencia: 'Cúspide P', limaApical: '35.04', irrigacion: 'NaOCl 2.5%' }
  ])

  const handleAgregarConducto = () => {
    setConductos([...conductos, { nombre: 'MV2', cad: '', crd: '', ltp: '', referencia: 'Cúspide', limaApical: '25.04', irrigacion: 'NaOCl 2.5%' }])
  }

  const handleCambiarConducto = (index, campo, valor) => {
    const actualizados = conductos.map((c, i) => i === index ? { ...c, [campo]: valor } : c)
    setConductos(actualizados)
  }

  const handleEliminarFilaConducto = (index) => {
    setConductos(conductos.filter((_, i) => i !== index))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!pieza || conductos.length === 0) return
    onAgregarEndodoncia({
      pieza,
      tecnicaObturacion,
      sellador,
      conductos
    })
  }

  return (
    <div className="space-y-6 text-xs">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
        <h3 className="font-bold text-sm text-gray-900 mb-4 border-b pb-2 uppercase tracking-wider">
          🧪 Ficha de Endodoncia y Mapa de Conductometría
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-gray-600 font-bold mb-1 uppercase">Pieza Tratada *</label>
              <input
                type="text"
                required
                value={pieza}
                onChange={(e) => setPieza(e.target.value)}
                placeholder="Ej: 1.6 / 2.1"
                className="w-full px-3 py-2 border rounded-xl bg-white font-bold"
              />
            </div>

            <div>
              <label className="block text-gray-600 font-bold mb-1 uppercase">Técnica de Obturación</label>
              <select
                value={tecnicaObturacion}
                onChange={(e) => setTecnicaObturacion(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl bg-white"
              >
                {TECNICAS_OBTURACION.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-gray-600 font-bold mb-1 uppercase">Cementador / Sellador</label>
              <select
                value={sellador}
                onChange={(e) => setSellador(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl bg-white"
              >
                {SELLADORES_ENDODONTICOS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Tabla de Conductometría */}
          <div className="border rounded-xl overflow-x-auto bg-gray-50 p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-xs text-gray-800 uppercase">Tabla de Conductos y Mediciones (CAD / CRD / LTP)</span>
              <button type="button" onClick={handleAgregarConducto} className="bg-black text-white px-2.5 py-1 rounded-lg text-[10px] font-bold">
                + Agregar Conducto
              </button>
            </div>

            <table className="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr className="border-b text-gray-600 font-bold uppercase">
                  <th className="p-2">Conducto</th>
                  <th className="p-2">CAD (Rx)</th>
                  <th className="p-2">CRD (Localizador)</th>
                  <th className="p-2">LTP (Trabajo)</th>
                  <th className="p-2">Ref. Anatómica</th>
                  <th className="p-2">Lima Apical</th>
                  <th className="p-2">Irrigante</th>
                  <th className="p-2 text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {conductos.map((c, idx) => (
                  <tr key={idx} className="border-b bg-white">
                    <td className="p-1">
                      <input
                        type="text"
                        value={c.nombre}
                        onChange={(e) => handleCambiarConducto(idx, 'nombre', e.target.value)}
                        className="w-16 px-1.5 py-1 border rounded font-bold"
                      />
                    </td>
                    <td className="p-1">
                      <input
                        type="text"
                        value={c.cad}
                        onChange={(e) => handleCambiarConducto(idx, 'cad', e.target.value)}
                        className="w-16 px-1.5 py-1 border rounded"
                      />
                    </td>
                    <td className="p-1">
                      <input
                        type="text"
                        value={c.crd}
                        onChange={(e) => handleCambiarConducto(idx, 'crd', e.target.value)}
                        className="w-16 px-1.5 py-1 border rounded"
                      />
                    </td>
                    <td className="p-1">
                      <input
                        type="text"
                        value={c.ltp}
                        onChange={(e) => handleCambiarConducto(idx, 'ltp', e.target.value)}
                        className="w-16 px-1.5 py-1 border rounded font-bold text-blue-900"
                      />
                    </td>
                    <td className="p-1">
                      <input
                        type="text"
                        value={c.referencia}
                        onChange={(e) => handleCambiarConducto(idx, 'referencia', e.target.value)}
                        className="w-24 px-1.5 py-1 border rounded"
                      />
                    </td>
                    <td className="p-1">
                      <input
                        type="text"
                        value={c.limaApical}
                        onChange={(e) => handleCambiarConducto(idx, 'limaApical', e.target.value)}
                        className="w-20 px-1.5 py-1 border rounded font-bold text-emerald-800"
                      />
                    </td>
                    <td className="p-1">
                      <input
                        type="text"
                        value={c.irrigacion}
                        onChange={(e) => handleCambiarConducto(idx, 'irrigacion', e.target.value)}
                        className="w-24 px-1.5 py-1 border rounded"
                      />
                    </td>
                    <td className="p-1 text-right">
                      <button type="button" onClick={() => handleEliminarFilaConducto(idx)} className="text-red-500 font-bold px-1">✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button type="submit" className="bg-black text-white font-bold px-4 py-2.5 rounded-xl hover:bg-gray-800">
            + Guardar Registro de Endodoncia
          </button>
        </form>
      </div>

      {/* Historial Endodóntico */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
        <h4 className="font-bold text-sm text-gray-900 mb-4 border-b pb-2">Tratamientos de Endodoncia Realizados</h4>
        <div className="space-y-3">
          {endodoncias.map(endo => (
            <div key={endo.id} className="p-4 bg-gray-50 border rounded-xl flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-purple-900 text-sm">Pieza {endo.pieza}</span>
                  <span className="bg-black text-white text-[10px] font-bold px-2 py-0.5 rounded">{endo.tecnicaObturacion}</span>
                  <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded">{endo.sellador}</span>
                </div>
                
                <div className="mt-2 text-[11px] font-mono bg-white p-2 border rounded">
                  {endo.conductos.map((c, i) => (
                    <span key={i} className="inline-block mr-4">
                      <strong>{c.nombre}:</strong> LTP={c.ltp} | Lima={c.limaApical}
                    </span>
                  ))}
                </div>
              </div>

              <button onClick={() => onEliminarEndodoncia(endo.id)} className="text-red-500 hover:text-red-700 font-bold text-xs bg-red-50 px-2 py-1 rounded">
                🗑️ Borrar
              </button>
            </div>
          ))}

          {endodoncias.length === 0 && <p className="text-gray-400 text-center py-6">No hay tratamientos de endodoncia registrados para este paciente.</p>}
        </div>
      </div>
    </div>
  )
}