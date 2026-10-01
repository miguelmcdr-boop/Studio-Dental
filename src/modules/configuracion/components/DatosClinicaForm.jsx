import React, { memo, useState } from 'react'
import { convertirImagenADataURL } from '../utils/configuracionCalculations'
import { createLogger } from '../../../services/logger.js'
import { Lock } from 'lucide-react'
import { Building2 } from 'lucide-react'

const log = createLogger('DatosClinicaForm')

export const DatosClinicaForm = memo(({ datosClinica, alGuardar, userProfile }) => {
  const [form, setForm] = useState({ ...datosClinica })

  // F6-C-e: solo el admin puede editar la configuración de clínica.
  // Los demás miembros ven los datos en modo solo-lectura.
  const esSoloLectura = userProfile?.rol !== 'admin'

  const handleLogoUpload = async (e) => {
    if (esSoloLectura) return
    const file = e.target.files[0]
    if (file) {
      try {
        const dataUrl = await convertirImagenADataURL(file)
        setForm({ ...form, logoUrl: dataUrl })
      } catch (err) {
        log.error('Error al cargar logo:', err)
      }
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (esSoloLectura) return
    alGuardar(form)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-[#0F172A] surgical:bg-[#F1F5F9] border border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] rounded-2xl p-6 shadow-xs space-y-4 text-xs">
      <div className="border-b border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] pb-3">
        <h3 className="font-bold text-sm text-gray-900 dark:text-graphite-50 surgical:text-black uppercase tracking-wider inline-flex items-center gap-2"><Building2 size={14} />Información de la Clínica & Membrete</h3>
        <p className="text-gray-500 dark:text-graphite-400 text-[11px]">
          Membrete impreso oficial para consentimientos, recetas y presupuestos.
          {esSoloLectura && (
            <span className="ml-2 inline-block px-2 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 rounded text-[10px] font-semibold">
              <span className="inline-flex items-center gap-1"><Lock size={12} />Solo lectura - Contacta al administrador para cambios</span>
            </span>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block font-semibold text-gray-700 dark:text-graphite-300 surgical:text-black mb-1">Nombre Fantasía Clínica *</label>
          <input
            type="text"
            required
            value={form.nombreClinica}
            onChange={(e) => setForm({ ...form, nombreClinica: e.target.value })}
            disabled={esSoloLectura}
            className={`w-full p-2.5 rounded-lg border border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] font-extrabold text-graphite-900 dark:text-graphite-50 surgical:text-black focus:outline-none focus:ring-2 focus:ring-[#B88E3A]/40 ${
              esSoloLectura ? 'bg-slate-50 dark:bg-[#1E293B] cursor-not-allowed' : 'bg-white dark:bg-[#1E293B] surgical:bg-[#E2E8F0]'
            }`}
          />
        </div>

        <div>
          <label className="block font-semibold text-gray-700 dark:text-graphite-300 surgical:text-black mb-1">Razón Social</label>
          <input
            type="text"
            value={form.razonSocial}
            onChange={(e) => setForm({ ...form, razonSocial: e.target.value })}
            disabled={esSoloLectura}
            className={`w-full p-2.5 rounded-lg border border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] font-semibold text-graphite-900 dark:text-graphite-50 surgical:text-black focus:outline-none focus:ring-2 focus:ring-[#B88E3A]/40 ${
              esSoloLectura ? 'bg-slate-50 dark:bg-[#1E293B] cursor-not-allowed' : 'bg-white dark:bg-[#1E293B] surgical:bg-[#E2E8F0]'
            }`}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block font-semibold text-gray-700 dark:text-graphite-300 surgical:text-black mb-1">RUT Empresa / Clínica</label>
          <input
            type="text"
            value={form.rutClinica}
            onChange={(e) => setForm({ ...form, rutClinica: e.target.value })}
            disabled={esSoloLectura}
            className={`w-full p-2.5 rounded-lg border border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] font-bold tabular-nums text-graphite-900 dark:text-graphite-50 surgical:text-black focus:outline-none focus:ring-2 focus:ring-[#B88E3A]/40 ${
              esSoloLectura ? 'bg-slate-50 dark:bg-[#1E293B] cursor-not-allowed' : 'bg-white dark:bg-[#1E293B] surgical:bg-[#E2E8F0]'
            }`}
          />
        </div>

        <div>
          <label className="block font-semibold text-gray-700 dark:text-graphite-300 surgical:text-black mb-1">Teléfono Fijo / Móvil</label>
          <input
            type="text"
            value={form.telefono}
            onChange={(e) => setForm({ ...form, telefono: e.target.value })}
            disabled={esSoloLectura}
            className={`w-full p-2.5 rounded-lg border border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] tabular-nums text-graphite-900 dark:text-graphite-50 surgical:text-black focus:outline-none focus:ring-2 focus:ring-[#B88E3A]/40 ${
              esSoloLectura ? 'bg-slate-50 dark:bg-[#1E293B] cursor-not-allowed' : 'bg-white dark:bg-[#1E293B] surgical:bg-[#E2E8F0]'
            }`}
          />
        </div>

        <div>
          <label className="block font-semibold text-gray-700 dark:text-graphite-300 surgical:text-black mb-1">Correo de Contacto</label>
          <input
            type="email"
            value={form.emailContacto}
            onChange={(e) => setForm({ ...form, emailContacto: e.target.value })}
            disabled={esSoloLectura}
            className={`w-full p-2.5 rounded-lg border border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] text-graphite-900 dark:text-graphite-50 surgical:text-black focus:outline-none focus:ring-2 focus:ring-[#B88E3A]/40 ${
              esSoloLectura ? 'bg-slate-50 dark:bg-[#1E293B] cursor-not-allowed' : 'bg-white dark:bg-[#1E293B] surgical:bg-[#E2E8F0]'
            }`}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block font-semibold text-gray-700 dark:text-graphite-300 surgical:text-black mb-1">Dirección & Oficina</label>
          <input
            type="text"
            value={form.direccion}
            onChange={(e) => setForm({ ...form, direccion: e.target.value })}
            disabled={esSoloLectura}
            className={`w-full p-2.5 rounded-lg border border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] text-graphite-900 dark:text-graphite-50 surgical:text-black focus:outline-none focus:ring-2 focus:ring-[#B88E3A]/40 ${
              esSoloLectura ? 'bg-slate-50 dark:bg-[#1E293B] cursor-not-allowed' : 'bg-white dark:bg-[#1E293B] surgical:bg-[#E2E8F0]'
            }`}
          />
        </div>

        <div>
          <label className="block font-semibold text-gray-700 dark:text-graphite-300 surgical:text-black mb-1">Ciudad & Región</label>
          <input
            type="text"
            value={form.ciudad}
            onChange={(e) => setForm({ ...form, ciudad: e.target.value })}
            disabled={esSoloLectura}
            className={`w-full p-2.5 rounded-lg border border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] text-graphite-900 dark:text-graphite-50 surgical:text-black focus:outline-none focus:ring-2 focus:ring-[#B88E3A]/40 ${
              esSoloLectura ? 'bg-slate-50 dark:bg-[#1E293B] cursor-not-allowed' : 'bg-white dark:bg-[#1E293B] surgical:bg-[#E2E8F0]'
            }`}
          />
        </div>
      </div>

      <div>
        <label className="block font-semibold text-gray-700 dark:text-graphite-300 surgical:text-black mb-1">Cargar Logo Oficial (PNG/JPG)</label>
        <div className="flex items-center gap-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            disabled={esSoloLectura}
            className={`p-2 border border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] rounded-lg bg-slate-50 dark:bg-[#1E293B] surgical:bg-[#E2E8F0] flex-1 text-xs text-graphite-900 dark:text-graphite-50 surgical:text-black ${
              esSoloLectura ? 'cursor-not-allowed' : ''
            }`}
          />
          {form.logoUrl && (
            <img src={form.logoUrl} alt="Logo Clínica" className="h-10 border border-[#E2E8F0] dark:border-[#24334A] rounded-lg p-1 object-contain" />
          )}
        </div>
      </div>

      <div className="pt-2 text-right">
        <button
          type="submit"
          disabled={esSoloLectura}
          className={`font-bold px-5 py-2.5 rounded-lg transition-micro shadow-xs ${
            esSoloLectura
              ? 'bg-slate-300 dark:bg-[#1E293B] text-graphite-500 dark:text-graphite-400 cursor-not-allowed'
              : 'bg-[#B88E3A] hover:bg-[#99732B] dark:bg-[#E5C378] dark:hover:bg-[#B88E3A] text-white dark:text-graphite-950 cursor-pointer'
          }`}
        >
          {esSoloLectura ? <span className='inline-flex items-center gap-1'><Lock size={14} />Solo Lectura</span> : 'Guardar Membrete de Clínica'}
        </button>
      </div>
    </form>
  )
})

DatosClinicaForm.displayName = 'DatosClinicaForm'
