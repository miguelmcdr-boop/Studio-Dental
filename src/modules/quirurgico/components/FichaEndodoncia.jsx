import React, { useState } from 'react'
import { TECNICAS_OBTURACION, SELLADORES_ENDODONTICOS } from '../constants/quirurgicoConstants'
import { Icon } from '../../../components/Icon'
import { FlaskConical, Trash2 } from 'lucide-react'

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
      <div className="bg-white dark:bg-[#0F172A] surgical:bg-[#F1F5F9] border border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] rounded-2xl p-6 shadow-xs">
        <h3 className="font-bold text-sm text-gray-900 dark:text-graphite-50 surgical:text-black mb-4 border-b border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] pb-2 uppercase tracking-wider">
          <span className="flex items-center gap-1.5"><Icon icon={FlaskConical} size="sm" />Ficha de Endodoncia y Mapa de Conductometría</span>
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-gray-600 dark:text-graphite-400 surgical:text-black font-bold mb-1 uppercase">Pieza Tratada *</label>
              <input
                type="text"
                required
                value={pieza}
                onChange={(e) => setPieza(e.target.value)}
                placeholder="Ej: 1.6 / 2.1"
                className="w-full px-3 py-2 border border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] rounded-lg bg-white dark:bg-[#1E293B] surgical:bg-[#E2E8F0] text-graphite-900 dark:text-graphite-50 surgical:text-black font-bold focus:ring-2 focus:ring-[#B88E3A]/40"
              />
            </div>

            <div>
              <label className="block text-gray-600 dark:text-graphite-400 surgical:text-black font-bold mb-1 uppercase">Técnica de Obturación</label>
              <select
                value={tecnicaObturacion}
                onChange={(e) => setTecnicaObturacion(e.target.value)}
                className="w-full px-3 py-2 border border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] rounded-lg bg-white dark:bg-[#1E293B] surgical:bg-[#E2E8F0] text-graphite-900 dark:text-graphite-50 surgical:text-black focus:ring-2 focus:ring-[#B88E3A]/40"
              >
                {TECNICAS_OBTURACION.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-gray-600 dark:text-graphite-400 surgical:text-black font-bold mb-1 uppercase">Cementador / Sellador</label>
              <select
                value={sellador}
                onChange={(e) => setSellador(e.target.value)}
                className="w-full px-3 py-2 border border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] rounded-lg bg-white dark:bg-[#1E293B] surgical:bg-[#E2E8F0] text-graphite-900 dark:text-graphite-50 surgical:text-black focus:ring-2 focus:ring-[#B88E3A]/40"
              >
                {SELLADORES_ENDODONTICOS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Tabla de Conductometría */}
          <div className="border border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] rounded-xl overflow-x-auto bg-slate-50 dark:bg-[#070B14] surgical:bg-[#E2E8F0] p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-xs text-gray-800 dark:text-graphite-100 surgical:text-black uppercase">Tabla de Conductos y Mediciones (CAD / CRD / LTP)</span>
              <button type="button" onClick={handleAgregarConducto} className="bg-graphite-900 dark:bg-[#1E293B] text-white px-2.5 py-1 rounded-lg text-[10px] font-bold transition-micro cursor-pointer">
                + Agregar Conducto
              </button>
            </div>

            <table className="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] text-gray-600 dark:text-graphite-400 surgical:text-black font-bold uppercase">
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
                  <tr key={idx} className="border-b border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] bg-white dark:bg-[#0F172A] surgical:bg-[#F1F5F9]">
                    <td className="p-1">
                      <input
                        type="text"
                        value={c.nombre}
                        onChange={(e) => handleCambiarConducto(idx, 'nombre', e.target.value)}
                        className="w-16 px-1.5 py-1 border border-[#E2E8F0] dark:border-[#24334A] rounded bg-white dark:bg-[#1E293B] font-bold text-graphite-900 dark:text-graphite-100 surgical:text-black"
                      />
                    </td>
                    <td className="p-1">
                      <input
                        type="text"
                        value={c.cad}
                        onChange={(e) => handleCambiarConducto(idx, 'cad', e.target.value)}
                        className="w-16 px-1.5 py-1 border border-[#E2E8F0] dark:border-[#24334A] rounded bg-white dark:bg-[#1E293B] tabular-nums text-graphite-900 dark:text-graphite-100 surgical:text-black"
                      />
                    </td>
                    <td className="p-1">
                      <input
                        type="text"
                        value={c.crd}
                        onChange={(e) => handleCambiarConducto(idx, 'crd', e.target.value)}
                        className="w-16 px-1.5 py-1 border border-[#E2E8F0] dark:border-[#24334A] rounded bg-white dark:bg-[#1E293B] tabular-nums text-graphite-900 dark:text-graphite-100 surgical:text-black"
                      />
                    </td>
                    <td className="p-1">
                      <input
                        type="text"
                        value={c.ltp}
                        onChange={(e) => handleCambiarConducto(idx, 'ltp', e.target.value)}
                        className="w-16 px-1.5 py-1 border border-[#E2E8F0] dark:border-[#24334A] rounded bg-white dark:bg-[#1E293B] font-bold tabular-nums text-blue-900 dark:text-sky-300 surgical:text-black"
                      />
                    </td>
                    <td className="p-1">
                      <input
                        type="text"
                        value={c.referencia}
                        onChange={(e) => handleCambiarConducto(idx, 'referencia', e.target.value)}
                        className="w-24 px-1.5 py-1 border border-[#E2E8F0] dark:border-[#24334A] rounded bg-white dark:bg-[#1E293B] text-graphite-900 dark:text-graphite-100 surgical:text-black"
                      />
                    </td>
                    <td className="p-1">
                      <input
                        type="text"
                        value={c.limaApical}
                        onChange={(e) => handleCambiarConducto(idx, 'limaApical', e.target.value)}
                        className="w-20 px-1.5 py-1 border border-[#E2E8F0] dark:border-[#24334A] rounded bg-white dark:bg-[#1E293B] font-bold tabular-nums text-emerald-800 dark:text-emerald-400 surgical:text-black"
                      />
                    </td>
                    <td className="p-1">
                      <input
                        type="text"
                        value={c.irrigacion}
                        onChange={(e) => handleCambiarConducto(idx, 'irrigacion', e.target.value)}
                        className="w-24 px-1.5 py-1 border border-[#E2E8F0] dark:border-[#24334A] rounded bg-white dark:bg-[#1E293B] text-graphite-900 dark:text-graphite-100 surgical:text-black"
                      />
                    </td>
                    <td className="p-1 text-right">
                      <button type="button" onClick={() => handleEliminarFilaConducto(idx)} className="text-red-500 hover:text-red-700 font-bold px-1 transition-micro cursor-pointer">✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button type="submit" className="bg-[#B88E3A] hover:bg-[#99732B] dark:bg-[#E5C378] dark:hover:bg-[#B88E3A] text-white dark:text-graphite-950 font-bold px-4 py-2.5 rounded-lg transition-micro shadow-xs cursor-pointer">
            + Guardar Registro de Endodoncia
          </button>
        </form>
      </div>

      {/* Historial Endodóntico */}
      <div className="bg-white dark:bg-[#0F172A] surgical:bg-[#F1F5F9] border border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] rounded-2xl p-6 shadow-xs">
        <h4 className="font-bold text-sm text-gray-900 dark:text-graphite-50 surgical:text-black mb-4 border-b border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] pb-2">Tratamientos de Endodoncia Realizados</h4>
        <div className="space-y-3">
          {endodoncias.map(endo => (
            <div key={endo.id} className="p-4 bg-slate-50 dark:bg-[#070B14] surgical:bg-[#E2E8F0] border border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] rounded-xl flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-indigo-900 dark:text-indigo-300 surgical:text-black text-sm">Pieza {endo.pieza}</span>
                  <span className="bg-[#070B14] dark:bg-[#1E293B] text-white text-[10px] font-bold px-2 py-0.5 rounded">{endo.tecnicaObturacion}</span>
                  <span className="bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded">{endo.sellador}</span>
                </div>
                
                <div className="mt-2 text-[11px] font-mono tabular-nums bg-white dark:bg-[#0F172A] surgical:bg-[#F1F5F9] p-2 border border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] rounded">
                  {endo.conductos.map((c, i) => (
                    <span key={i} className="inline-block mr-4">
                      <strong>{c.nombre}:</strong> LTP={c.ltp} | Lima={c.limaApical}
                    </span>
                  ))}
                </div>
              </div>

              <button onClick={() => onEliminarEndodoncia(endo.id)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-bold text-xs bg-red-50 dark:bg-red-950/40 px-2 py-1 rounded transition-micro cursor-pointer">
                <span className="inline-flex items-center gap-1"><Trash2 size={12} />Borrar</span>
              </button>
            </div>
          ))}

          {endodoncias.length === 0 && <p className="text-gray-400 dark:text-graphite-500 py-6 text-center">No hay tratamientos de endodoncia registrados para este paciente.</p>}
        </div>
      </div>
    </div>
  )
}