import React, { memo } from 'react'
import { DentikOSMicroSeal } from '../../../../shared/ui/brand/DentikOSMicroSeal'
import type { CertificadoMedico } from '../services/certificadosStorageService'
import type { CertificadoPapelera } from '../services/papeleraCertificadosService'
import type { Paciente } from '../schemas/pacienteSchema'

export interface CertificadoImprimibleProps {
  cert: CertificadoPapelera | CertificadoMedico | null
  paciente: Partial<Paciente> & { nombre: string; rut?: string; [key: string]: unknown }
}

/**
 * Documento de Certificado Médico en formato Letter (M2a)
 *
 * Extraído de CertificadosSection para reutilizarse en:
 * - Preview en pantalla
 * - Portal de impresión aislada (print-cert-activo)
 * - Generación de PDF con html2canvas (M2b)
 */
export const CertificadoImprimible: React.FC<CertificadoImprimibleProps> = memo(({ cert, paciente }) => {
  if (!cert) return null

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-10 print:border-none print:p-0 print:bg-white print:text-black min-h-[500px] flex flex-col justify-between">
      <div>
        {/* Membrete */}
        <div className="border-b-2 border-black pb-4 mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{cert.profesional}</h1>
            <p className="text-xs text-gray-600">{cert.especialidad} | RUT: <span className="tabular-nums">{cert.rutProfesional}</span></p>
            <p className="text-xs text-gray-500">Consulta Odontológica DentikOS</p>
          </div>
          <div className="text-right">
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest">
              {cert.tipo === 'asistencia' ? 'CERTIFICADO DE ASISTENCIA' : 'CERTIFICADO DE REPOSO MÉDICO'}
            </h2>
            <p className="text-xs text-gray-500">Fecha de Emisión: <span className="tabular-nums">{cert.fechaEmision}</span></p>
          </div>
        </div>

        {/* Cuerpo del Certificado */}
        <div className="space-y-6 text-sm leading-relaxed text-gray-800 py-4">
          <p>
            El profesional cirujano dentista que suscribe certifica que don/doña <strong>{paciente.nombre}</strong>, RUT <strong className="tabular-nums">{paciente.rut}</strong>:
          </p>

          {cert.tipo === 'asistencia' ? (
            <p className="bg-gray-50 p-4 rounded-xl border border-gray-200 print:bg-transparent print:border-none">
              Asistió a atención odontológica el día <strong className="tabular-nums">{cert.fechaAtencion}</strong> en el horario comprendido entre las <strong className="tabular-nums">{cert.horaInicio} hrs.</strong> y las <strong className="tabular-nums">{cert.horaFin} hrs.</strong>, debido a: <em>{cert.diagnosticoMotivo}</em>.
            </p>
          ) : (
            <p className="bg-gray-50 p-4 rounded-xl border border-gray-200 print:bg-transparent print:border-none">
              Requiere guardar reposo médico odontológico por un período de <strong className="tabular-nums">{cert.diasReposo} día(s)</strong> acontar del día <strong className="tabular-nums">{cert.fechaAtencion}</strong>, debido al cuadro clínico de: <em>{cert.diagnosticoMotivo}</em>.
            </p>
          )}

          {cert.observaciones && (
            <p className="text-xs text-gray-600 italic">
              <strong>Observaciones:</strong> {cert.observaciones}
            </p>
          )}

          <p className="text-xs text-gray-500 pt-4">
            Se extiende el presente certificado a solicitud del interesado para los fines que estime convenientes.
          </p>
        </div>
      </div>

      {/* Firma al Pie y Micro-Sello DentikOS */}
      <div className="pt-20">
        <div className="w-64 mx-auto border-t border-black pt-2 text-center">
          <p className="font-bold text-xs text-gray-900">{cert.profesional}</p>
          <p className="text-[10px] text-gray-600">{cert.especialidad}</p>
          <p className="text-[10px] text-gray-500">RUT: <span className="tabular-nums">{cert.rutProfesional}</span></p>
        </div>
        <DentikOSMicroSeal className="mt-8" />
      </div>
    </div>
  )
})

CertificadoImprimible.displayName = 'CertificadoImprimible'
