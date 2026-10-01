import { sanitizarTorque, sanitizarISQ } from '../utils/quirurgicoValidation'
import React, { useState } from 'react'
import { MARCAS_IMPLANTES, TIPOS_PLATAFORMA, CONEXIONES_DIAMETRO } from '../constants/quirurgicoConstants'
import { Icon } from '../../../components/Icon'
import { Tooth } from '../../../components/icons/Tooth'
import { Trash2 } from 'lucide-react'

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
      <div className="relative overflow-hidden bg-white/90 dark:bg-[#0F172A]/90 surgical:bg-[#F1F5F9] backdrop-blur-md border border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] rounded-2xl p-6 shadow-sm before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-gradient-to-r before:from-transparent before:via-[#B88E3A]/40 before:to-transparent">
        <h3 className="font-extrabold text-sm text-gray-900 dark:text-graphite-50 surgical:text-black mb-4 border-b border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] pb-3 uppercase tracking-wider">
          <span className="flex items-center gap-1.5"><Icon icon={Tooth} size="sm" />Registrar Colocación de Implante Óseointegrado</span>
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-gray-600 dark:text-graphite-400 surgical:text-black font-bold mb-1 uppercase">Pieza Dental *</label>
              <input
                type="text"
                required
                value={form.pieza}
                onChange={(e) => setForm({ ...form, pieza: e.target.value })}
                placeholder="Ej: 1.6"
                className="w-full px-3 py-2 border border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] rounded-lg bg-white dark:bg-[#1E293B] surgical:bg-[#E2E8F0] text-xs font-bold text-graphite-900 dark:text-graphite-50 surgical:text-black focus:ring-2 focus:ring-[#B88E3A]/40"
              />
            </div>

            <div>
              <label className="block text-gray-600 dark:text-graphite-400 surgical:text-black font-bold mb-1 uppercase">Marca del Implante</label>
              <select
                value={form.marca}
                onChange={(e) => setForm({ ...form, marca: e.target.value })}
                className="w-full px-3 py-2 border border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] rounded-lg bg-white dark:bg-[#1E293B] surgical:bg-[#E2E8F0] text-xs text-graphite-900 dark:text-graphite-50 surgical:text-black focus:ring-2 focus:ring-[#B88E3A]/40"
              >
                {MARCAS_IMPLANTES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-gray-600 dark:text-graphite-400 surgical:text-black font-bold mb-1 uppercase">Plataforma / Conexión</label>
              <select
                value={form.plataforma}
                onChange={(e) => setForm({ ...form, plataforma: e.target.value })}
                className="w-full px-3 py-2 border border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] rounded-lg bg-white dark:bg-[#1E293B] surgical:bg-[#E2E8F0] text-xs text-graphite-900 dark:text-graphite-50 surgical:text-black focus:ring-2 focus:ring-[#B88E3A]/40"
              >
                {TIPOS_PLATAFORMA.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-gray-600 dark:text-graphite-400 surgical:text-black font-bold mb-1 uppercase">Diámetro / Conexión</label>
              <select
                value={form.diametro}
                onChange={(e) => setForm({ ...form, diametro: e.target.value })}
                className="w-full px-3 py-2 border border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] rounded-lg bg-white dark:bg-[#1E293B] surgical:bg-[#E2E8F0] text-xs text-graphite-900 dark:text-graphite-50 surgical:text-black focus:ring-2 focus:ring-[#B88E3A]/40"
              >
                {CONEXIONES_DIAMETRO.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-gray-600 dark:text-graphite-400 surgical:text-black font-bold mb-1 uppercase">Longitud (mm)</label>
              <input
                type="text"
                value={form.longitud}
                onChange={(e) => setForm({ ...form, longitud: e.target.value })}
                placeholder="Ej: 10 mm"
                className="w-full px-3 py-2 border border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] rounded-lg bg-white dark:bg-[#1E293B] surgical:bg-[#E2E8F0] text-xs tabular-nums text-graphite-900 dark:text-graphite-50 surgical:text-black focus:ring-2 focus:ring-[#B88E3A]/40"
              />
            </div>

            <div>
              <label className="block text-sky-700 dark:text-sky-300 surgical:text-black font-bold mb-1 uppercase">Torque Inserción (Ncm)</label>
              <input
                type="number"
                value={form.torqueInsercion}
                onChange={(e) => setForm({ ...form, torqueInsercion: e.target.value })}
                placeholder="35"
                className="w-full px-3 py-2 border border-sky-200 dark:border-sky-800 rounded-lg bg-sky-50 dark:bg-sky-950/40 font-bold text-sky-900 dark:text-sky-300 surgical:text-black text-xs tabular-nums focus:ring-2 focus:ring-[#B88E3A]/40"
              />
            </div>

            <div>
              <label className="block text-emerald-700 dark:text-emerald-300 surgical:text-black font-bold mb-1 uppercase">Estabilidad ISQ (Osstell)</label>
              <input
                type="number"
                value={form.isqInicial}
                onChange={(e) => setForm({ ...form, isqInicial: e.target.value })}
                placeholder="70"
                className="w-full px-3 py-2 border border-emerald-200 dark:border-emerald-800 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 font-bold text-emerald-900 dark:text-emerald-300 surgical:text-black text-xs tabular-nums focus:ring-2 focus:ring-[#B88E3A]/40"
              />
            </div>

            <div>
              <label className="block text-gray-600 dark:text-graphite-400 surgical:text-black font-bold mb-1 uppercase">N° Lote / Trazabilidad</label>
              <input
                type="text"
                value={form.lote}
                onChange={(e) => setForm({ ...form, lote: e.target.value })}
                placeholder="Ej: LOT-98212"
                className="w-full px-3 py-2 border border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] rounded-lg bg-white dark:bg-[#1E293B] surgical:bg-[#E2E8F0] text-xs font-mono tabular-nums text-graphite-900 dark:text-graphite-50 surgical:text-black focus:ring-2 focus:ring-[#B88E3A]/40"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-600 dark:text-graphite-400 surgical:text-black font-bold mb-1 uppercase">Observaciones Cirugía</label>
            <textarea
              rows="2"
              value={form.observacion}
              onChange={(e) => setForm({ ...form, observacion: e.target.value })}
              className="w-full p-2.5 border border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] rounded-lg bg-white dark:bg-[#1E293B] surgical:bg-[#E2E8F0] text-xs text-graphite-900 dark:text-graphite-50 surgical:text-black focus:ring-2 focus:ring-[#B88E3A]/40"
            />
          </div>

          <button type="submit" className="bg-[#B88E3A] hover:bg-[#99732B] dark:bg-[#E5C378] dark:hover:bg-[#B88E3A] text-white dark:text-graphite-950 font-bold px-4 py-2.5 rounded-lg transition-micro shadow-xs cursor-pointer">
            + Guardar Registro Quirúrgico de Implante
          </button>
        </form>
      </div>

      {/* Historial de Implantes */}
      <div className="relative overflow-hidden bg-white/90 dark:bg-[#0F172A]/90 surgical:bg-[#F1F5F9] backdrop-blur-md border border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] rounded-2xl p-6 shadow-sm before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-gradient-to-r before:from-transparent before:via-[#0EA5E9]/40 before:to-transparent">
        <h4 className="font-extrabold text-sm text-gray-900 dark:text-graphite-50 surgical:text-black mb-4 border-b border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] pb-3 tracking-tight">Implantes Colocados en el Paciente</h4>
        <div className="space-y-3">
          {implantes.map(imp => (
            <div key={imp.id} className="p-4 bg-slate-50 dark:bg-[#070B14] surgical:bg-[#E2E8F0] border border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] rounded-xl flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sky-900 dark:text-sky-300 surgical:text-black text-sm">Pieza {imp.pieza}</span>
                  <span className="bg-[#070B14] dark:bg-[#1E293B] text-white text-[10px] font-bold px-2 py-0.5 rounded">{imp.marca}</span>
                  <span className="bg-slate-200 dark:bg-graphite-700 text-gray-800 dark:text-graphite-100 text-[10px] font-semibold px-2 py-0.5 rounded">{imp.plataforma}</span>
                </div>
                <p className="text-gray-600 dark:text-graphite-400 surgical:text-black mt-1">
                  Diámetro: <strong>{imp.diametro}</strong> | Longitud: <strong>{imp.longitud}</strong> | Torque:{' '}
                  <strong className={imp.torqueInsercion === null || imp.torqueInsercion === undefined ? 'text-amber-600' : 'text-sky-700 dark:text-sky-300'}>
                    {imp.torqueInsercion === null || imp.torqueInsercion === undefined ? 'No registrado' : `${imp.torqueInsercion} Ncm`}
                  </strong> | ISQ:{' '}
                  <strong className={imp.isqInicial === null || imp.isqInicial === undefined ? 'text-amber-600' : 'text-emerald-700 dark:text-emerald-400'}>
                    {imp.isqInicial === null || imp.isqInicial === undefined ? 'No registrado' : imp.isqInicial}
                  </strong>
                </p>
                {imp.lote && <p className="text-[10px] text-gray-400 dark:text-graphite-500 font-mono tabular-nums">Lote Seremi: {imp.lote}</p>}
                <p className="text-gray-700 dark:text-graphite-300 surgical:text-black italic mt-1">{imp.observacion}</p>
              </div>

              <button onClick={() => onEliminarImplante(imp.id)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-bold text-xs bg-red-50 dark:bg-red-950/40 px-2 py-1 rounded transition-micro cursor-pointer">
                <span className="inline-flex items-center gap-1"><Trash2 size={12} />Borrar</span>
              </button>
            </div>
          ))}

          {implantes.length === 0 && <p className="text-gray-400 dark:text-graphite-500 py-6 text-center">No hay implantes registrados para este paciente.</p>}
        </div>
      </div>
    </div>
  )
}