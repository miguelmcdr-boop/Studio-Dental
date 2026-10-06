import React, { memo, useState } from 'react'
import { convertirImagenADataURL } from '../utils/clinicCalculations'
import { createLogger } from '../../../../infrastructure/logging/logger'
import { Lock, Building2 } from 'lucide-react'
import { CLINICA_DEFAULT, type ClinicaConfig } from '../constants/clinicConstants'
import type { DatosClinicaConfig } from '../services/clinicStorageService'

const log = createLogger('DatosClinicaForm')

export interface DatosClinicaFormProps {
  datosClinica?: DatosClinicaConfig | ClinicaConfig
  alGuardar?: (datos: DatosClinicaConfig | ClinicaConfig) => void
  userProfile?: { rol?: string; [key: string]: unknown } | null
}

export const DatosClinicaForm: React.FC<DatosClinicaFormProps> = memo(({ datosClinica = CLINICA_DEFAULT, alGuardar, userProfile }) => {
  const [form, setForm] = useState<DatosClinicaConfig | ClinicaConfig>({ ...(datosClinica || CLINICA_DEFAULT) })

  // F6-C-e: solo el admin puede editar la configuración de clínica.
  // Los demás miembros ven los datos en modo solo-lectura.
  const esSoloLectura = userProfile?.rol !== 'admin'

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (esSoloLectura) return
    const file = e.target.files?.[0]
    if (file) {
      try {
        const dataUrl = await convertirImagenADataURL(file)
        if (typeof dataUrl === 'string') {
          setForm((prev) => ({ ...prev, logoUrl: dataUrl }))
        }
      } catch (err) {
        log.error('Error al cargar logo:', err)
      }
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (esSoloLectura) return
    if (alGuardar) {
      alGuardar(form)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-surface border border-surface rounded-2xl p-6 shadow-xs space-y-4 text-xs">
      <div className="border-b border-surface pb-3">
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
            disabled={esSoloLectura}
            value={form.nombreClinica || ''}
            onChange={(e) => setForm({ ...form, nombreClinica: e.target.value })}
            className={`w-full p-2.5 rounded-lg border border-surface text-graphite-900 dark:text-graphite-50 font-bold focus:outline-none focus:ring-2 focus:ring-primary/40 ${
              esSoloLectura ? 'bg-gray-100 dark:bg-graphite-900/50 cursor-not-allowed text-gray-500' : 'bg-white dark:bg-graphite-800 surgical:bg-graphite-200'
            }`}
          />
        </div>

        <div>
          <label className="block font-semibold text-gray-700 dark:text-graphite-300 surgical:text-black mb-1">Razón Social</label>
          <input
            type="text"
            disabled={esSoloLectura}
            value={form.razonSocial || ''}
            onChange={(e) => setForm({ ...form, razonSocial: e.target.value })}
            className={`w-full p-2.5 rounded-lg border border-surface text-graphite-900 dark:text-graphite-50 focus:outline-none focus:ring-2 focus:ring-primary/40 ${
              esSoloLectura ? 'bg-gray-100 dark:bg-graphite-900/50 cursor-not-allowed text-gray-500' : 'bg-white dark:bg-graphite-800 surgical:bg-graphite-200'
            }`}
          />
        </div>

        <div>
          <label className="block font-semibold text-gray-700 dark:text-graphite-300 surgical:text-black mb-1">RUT Empresa</label>
          <input
            type="text"
            disabled={esSoloLectura}
            value={form.rutClinica || ''}
            onChange={(e) => setForm({ ...form, rutClinica: e.target.value })}
            className={`w-full p-2.5 rounded-lg border border-surface text-graphite-900 dark:text-graphite-50 focus:outline-none focus:ring-2 focus:ring-primary/40 ${
              esSoloLectura ? 'bg-gray-100 dark:bg-graphite-900/50 cursor-not-allowed text-gray-500' : 'bg-white dark:bg-graphite-800 surgical:bg-graphite-200'
            }`}
          />
        </div>

        <div>
          <label className="block font-semibold text-gray-700 dark:text-graphite-300 surgical:text-black mb-1">Teléfono Contacto</label>
          <input
            type="text"
            disabled={esSoloLectura}
            value={form.telefono || ''}
            onChange={(e) => setForm({ ...form, telefono: e.target.value })}
            className={`w-full p-2.5 rounded-lg border border-surface text-graphite-900 dark:text-graphite-50 focus:outline-none focus:ring-2 focus:ring-primary/40 ${
              esSoloLectura ? 'bg-gray-100 dark:bg-graphite-900/50 cursor-not-allowed text-gray-500' : 'bg-white dark:bg-graphite-800 surgical:bg-graphite-200'
            }`}
          />
        </div>

        <div>
          <label className="block font-semibold text-gray-700 dark:text-graphite-300 surgical:text-black mb-1">Email Oficial</label>
          <input
            type="email"
            disabled={esSoloLectura}
            value={form.emailContacto || ''}
            onChange={(e) => setForm({ ...form, emailContacto: e.target.value })}
            className={`w-full p-2.5 rounded-lg border border-surface text-graphite-900 dark:text-graphite-50 focus:outline-none focus:ring-2 focus:ring-primary/40 ${
              esSoloLectura ? 'bg-gray-100 dark:bg-graphite-900/50 cursor-not-allowed text-gray-500' : 'bg-white dark:bg-graphite-800 surgical:bg-graphite-200'
            }`}
          />
        </div>

        <div>
          <label className="block font-semibold text-gray-700 dark:text-graphite-300 surgical:text-black mb-1">Ciudad / Región</label>
          <input
            type="text"
            disabled={esSoloLectura}
            value={form.ciudad || ''}
            onChange={(e) => setForm({ ...form, ciudad: e.target.value })}
            className={`w-full p-2.5 rounded-lg border border-surface text-graphite-900 dark:text-graphite-50 focus:outline-none focus:ring-2 focus:ring-primary/40 ${
              esSoloLectura ? 'bg-gray-100 dark:bg-graphite-900/50 cursor-not-allowed text-gray-500' : 'bg-white dark:bg-graphite-800 surgical:bg-graphite-200'
            }`}
          />
        </div>
      </div>

      <div>
        <label className="block font-semibold text-gray-700 dark:text-graphite-300 surgical:text-black mb-1">Dirección Completa</label>
        <input
          type="text"
          disabled={esSoloLectura}
          value={form.direccion || ''}
          onChange={(e) => setForm({ ...form, direccion: e.target.value })}
          className={`w-full p-2.5 rounded-lg border border-surface text-graphite-900 dark:text-graphite-50 focus:outline-none focus:ring-2 focus:ring-primary/40 ${
            esSoloLectura ? 'bg-gray-100 dark:bg-graphite-900/50 cursor-not-allowed text-gray-500' : 'bg-white dark:bg-graphite-800 surgical:bg-graphite-200'
          }`}
        />
      </div>

      <div>
        <label className="block font-semibold text-gray-700 dark:text-graphite-300 surgical:text-black mb-1">Eslogan o Frase Identitaria</label>
        <input
          type="text"
          disabled={esSoloLectura}
          value={(form.eslogan as string) || ''}
          onChange={(e) => setForm({ ...form, eslogan: e.target.value })}
          className={`w-full p-2.5 rounded-lg border border-surface text-graphite-900 dark:text-graphite-50 focus:outline-none focus:ring-2 focus:ring-primary/40 ${
            esSoloLectura ? 'bg-gray-100 dark:bg-graphite-900/50 cursor-not-allowed text-gray-500' : 'bg-white dark:bg-graphite-800 surgical:bg-graphite-200'
          }`}
        />
      </div>

      <div>
        <label className="block font-semibold text-gray-700 dark:text-graphite-300 surgical:text-black mb-1">Logo Impresión (Blanco y Negro o Color)</label>
        <div className="flex items-center gap-4 mt-2">
          {form.logoUrl && (
            <div className="w-16 h-16 border rounded-lg p-1 bg-white dark:bg-graphite-800 flex items-center justify-center">
              <img src={form.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            disabled={esSoloLectura}
            onChange={handleLogoUpload}
            className={`text-xs ${esSoloLectura ? 'cursor-not-allowed text-gray-400' : ''}`}
          />
        </div>
      </div>

      {!esSoloLectura && (
        <div className="flex justify-end pt-3 border-t border-surface">
          <button
            type="submit"
            className="px-4 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark transition cursor-pointer"
          >
            Guardar Configuración Clínica
          </button>
        </div>
      )}
    </form>
  )
})

DatosClinicaForm.displayName = 'DatosClinicaForm'
