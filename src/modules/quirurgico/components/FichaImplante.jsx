import { sanitizarTorque, sanitizarISQ } from '../utils/quirurgicoValidation'
import React, { useState } from 'react'
import { MARCAS_IMPLANTES, TIPOS_PLATAFORMA, CONEXIONES_DIAMETRO } from '../constants/quirurgicoConstants'

export const FichaImplante = ({ implantes = [], onAgregarImplante, onEliminarImplante }) => {
  const [form, setForm] = useState({
    pieza: '1.6',
    marca: 'Neodent',
    plataforma: 'Cono Morse',
    diametro: '3.75 mm (Estándar)',
    longitud: '10 mm',
    torqueInsercion: '35',
    isqInicial: '72',
    lote: '',
    observacion: 'Cirugía de colocación de implante óseointegrado sin complicaciones.'
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.pieza) return
    onAgregarImplante({
      ...form,
      torqueInsercion: sanitizarTorque(form.torqueInsercion),
      isqInicial: sanitizarISQ(form.isqInicial)
    })
    setForm({
      pieza: '1.6', marca: 'Neodent', plataforma: 'Cono Morse', diametro: '3.75 mm (Estándar)', 
      longitud: '10 mm', torqueInsercion: '35', isqInicial: '72', lote: '', observacion: ''
    })
  }

  return (
    <div className="space-y-6 text-xs">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
        <h3 className="font-bold text-sm text-gray-900 mb-4 border-b pb-2 uppercase tracking-wider">
          🦷 Registrar Colocación de Implante Óseointegrado
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-gray-600 font-bold mb-1 uppercase">Pieza Dental *</label>
              <input
                type="text"
                required
                value={form.pieza}
                onChange={(e) => setForm({ ...form, pieza: e.target.value })}
                placeholder="Ej: 1.6"
                className="w-full px-3 py-2 border rounded-xl bg-white text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-gray-600 font-bold mb-1 uppercase">Marca del Implante</label>
              <select
                value={form.marca}
                onChange={(e) => setForm({ ...form, marca: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl bg-white text-xs"
              >
                {MARCAS_IMPLANTES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-gray-600 font-bold mb-1 uppercase">Plataforma / Conexión</label>
              <select
                value={form.plataforma}
                onChange={(e) => setForm({ ...form, plataforma: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl bg-white text-xs"
              >
                {TIPOS_PLATAFORMA.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-gray-600 font-bold mb-1 uppercase">Diámetro / Conexión</label>
              <select
                value={form.diametro}
                onChange={(e) => setForm({ ...form, diametro: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl bg-white text-xs"
              >
                {CONEXIONES_DIAMETRO.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-gray-600 font-bold mb-1 uppercase">Longitud (mm)</label>
              <input
                type="text"
                value={form.longitud}
                onChange={(e) => setForm({ ...form, longitud: e.target.value })}
                placeholder="Ej: 10 mm"
                className="w-full px-3 py-2 border rounded-xl bg-white text-xs"
              />
            </div>

            <div>
              <label className="block text-blue-700 font-bold mb-1 uppercase">Torque Inserción (Ncm)</label>
              <input
                type="number"
                value={form.torqueInsercion}
                onChange={(e) => setForm({ ...form, torqueInsercion: e.target.value })}
                placeholder="35"
                className="w-full px-3 py-2 border rounded-xl bg-blue-50 font-bold text-blue-900 text-xs"
              />
            </div>

            <div>
              <label className="block text-emerald-700 font-bold mb-1 uppercase">Estabilidad ISQ (Osstell)</label>
              <input
                type="number"
                value={form.isqInicial}
                onChange={(e) => setForm({ ...form, isqInicial: e.target.value })}
                placeholder="70"
                className="w-full px-3 py-2 border rounded-xl bg-emerald-50 font-bold text-emerald-900 text-xs"
              />
            </div>

            <div>
              <label className="block text-gray-600 font-bold mb-1 uppercase">N° Lote / Trazabilidad</label>
              <input
                type="text"
                value={form.lote}
                onChange={(e) => setForm({ ...form, lote: e.target.value })}
                placeholder="Ej: LOT-98212"
                className="w-full px-3 py-2 border rounded-xl bg-white text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-600 font-bold mb-1 uppercase">Observaciones Cirugía</label>
            <textarea
              rows="2"
              value={form.observacion}
              onChange={(e) => setForm({ ...form, observacion: e.target.value })}
              className="w-full p-2.5 border rounded-xl bg-white text-xs"
            />
          </div>

          <button type="submit" className="bg-black text-white font-bold px-4 py-2.5 rounded-xl hover:bg-gray-800">
            + Guardar Registro Quirúrgico de Implante
          </button>
        </form>
      </div>

      {/* Historial de Implantes */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
        <h4 className="font-bold text-sm text-gray-900 mb-4 border-b pb-2">Implantes Colocados en el Paciente</h4>
        <div className="space-y-3">
          {implantes.map(imp => (
            <div key={imp.id} className="p-4 bg-gray-50 border rounded-xl flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-blue-900 text-sm">Pieza {imp.pieza}</span>
                  <span className="bg-black text-white text-[10px] font-bold px-2 py-0.5 rounded">{imp.marca}</span>
                  <span className="bg-gray-200 text-gray-800 text-[10px] font-semibold px-2 py-0.5 rounded">{imp.plataforma}</span>
                </div>
                <p className="text-gray-600 mt-1">
                  Diámetro: <strong>{imp.diametro}</strong> | Longitud: <strong>{imp.longitud}</strong> | Torque:{' '}
                  <strong className={imp.torqueInsercion === null || imp.torqueInsercion === undefined ? 'text-amber-600' : 'text-blue-700'}>
                    {imp.torqueInsercion === null || imp.torqueInsercion === undefined ? 'No registrado' : `${imp.torqueInsercion} Ncm`}
                  </strong> | ISQ:{' '}
                  <strong className={imp.isqInicial === null || imp.isqInicial === undefined ? 'text-amber-600' : 'text-emerald-700'}>
                    {imp.isqInicial === null || imp.isqInicial === undefined ? 'No registrado' : imp.isqInicial}
                  </strong>
                </p>
                {imp.lote && <p className="text-[10px] text-gray-400">Lote Seremi: {imp.lote}</p>}
                <p className="text-gray-700 italic mt-1">{imp.observacion}</p>
              </div>

              <button onClick={() => onEliminarImplante(imp.id)} className="text-red-500 hover:text-red-700 font-bold text-xs bg-red-50 px-2 py-1 rounded">
                🗑️ Borrar
              </button>
            </div>
          ))}

          {implantes.length === 0 && <p className="text-gray-400 text-center py-6">No hay implantes registrados para este paciente.</p>}
        </div>
      </div>
    </div>
  )
}