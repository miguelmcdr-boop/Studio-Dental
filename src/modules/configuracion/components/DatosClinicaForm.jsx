import React, { memo, useState } from 'react'
import { convertirImagenADataURL } from '../utils/configuracionCalculations'

export const DatosClinicaForm = memo(({ datosClinica, alGuardar }) => {
  const [form, setForm] = useState({ ...datosClinica })

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0]
    if (file) {
      try {
        const dataUrl = await convertirImagenADataURL(file)
        setForm({ ...form, logoUrl: dataUrl })
      } catch (err) {
        console.error('Error al cargar logo:', err)
      }
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    alGuardar(form)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4 text-xs">
      <div className="border-b pb-3">
        <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider">🏢 Información de la Clínica & Membrete</h3>
        <p className="text-gray-500 text-[11px]">Membrete impreso oficial para consentimientos, recetas y presupuestos.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block font-semibold text-gray-700 mb-1">Nombre Fantasía Clínica *</label>
          <input
            type="text"
            required
            value={form.nombreClinica}
            onChange={(e) => setForm({ ...form, nombreClinica: e.target.value })}
            className="w-full p-2.5 rounded-xl border border-gray-300 font-extrabold text-gray-900"
          />
        </div>

        <div>
          <label className="block font-semibold text-gray-700 mb-1">Razón Social</label>
          <input
            type="text"
            value={form.razonSocial}
            onChange={(e) => setForm({ ...form, razonSocial: e.target.value })}
            className="w-full p-2.5 rounded-xl border border-gray-300 font-semibold"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block font-semibold text-gray-700 mb-1">RUT Empresa / Clínica</label>
          <input
            type="text"
            value={form.rutClinica}
            onChange={(e) => setForm({ ...form, rutClinica: e.target.value })}
            className="w-full p-2.5 rounded-xl border border-gray-300 font-bold"
          />
        </div>

        <div>
          <label className="block font-semibold text-gray-700 mb-1">Teléfono Fijo / Móvil</label>
          <input
            type="text"
            value={form.telefono}
            onChange={(e) => setForm({ ...form, telefono: e.target.value })}
            className="w-full p-2.5 rounded-xl border border-gray-300"
          />
        </div>

        <div>
          <label className="block font-semibold text-gray-700 mb-1">Correo de Contacto</label>
          <input
            type="email"
            value={form.emailContacto}
            onChange={(e) => setForm({ ...form, emailContacto: e.target.value })}
            className="w-full p-2.5 rounded-xl border border-gray-300"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block font-semibold text-gray-700 mb-1">Dirección & Oficina</label>
          <input
            type="text"
            value={form.direccion}
            onChange={(e) => setForm({ ...form, direccion: e.target.value })}
            className="w-full p-2.5 rounded-xl border border-gray-300"
          />
        </div>

        <div>
          <label className="block font-semibold text-gray-700 mb-1">Ciudad & Región</label>
          <input
            type="text"
            value={form.ciudad}
            onChange={(e) => setForm({ ...form, ciudad: e.target.value })}
            className="w-full p-2.5 rounded-xl border border-gray-300"
          />
        </div>
      </div>

      <div>
        <label className="block font-semibold text-gray-700 mb-1">Cargar Logo Oficial (PNG/JPG)</label>
        <div className="flex items-center gap-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="p-2 border rounded-xl bg-gray-50 flex-1 text-xs"
          />
          {form.logoUrl && (
            <img src={form.logoUrl} alt="Logo Clínica" className="h-10 border rounded p-1 object-contain" />
          )}
        </div>
      </div>

      <div className="pt-2 text-right">
        <button
          type="submit"
          className="bg-black text-white font-bold px-5 py-2.5 rounded-xl hover:bg-gray-800 transition-colors shadow-xs"
        >
          Guardar Membrete de Clínica
        </button>
      </div>
    </form>
  )
})

DatosClinicaForm.displayName = 'DatosClinicaForm'