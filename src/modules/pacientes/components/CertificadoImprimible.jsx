import React, { memo } from 'react'

/**
 * Documento de Certificado Médico en formato Letter (M2a)
 *
 * Extraído de CertificadosSection para reutilizarse en:
 * - Preview en pantalla
 * - Portal de impresión aislada (print-cert-activo)
 * - Generación de PDF con html2canvas (M2b)
 */
export const CertificadoImprimible = memo(({ cert, paciente }) => {
  if (!cert) return null

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-10 print:border-none print:p-0 min-h-[500px] flex flex-col justify-between">
      <div>
        {/* Membrete */}
        <div className="border-b-2 border-black pb-4 mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{cert.profesional}</h1>
            <p className="text-xs text-gray-600">{cert.especialidad} | RUT: {cert.rutProfesional}</p>
            <p className="text-xs text-gray-500">Consulta Odontológica Particular</p>
          </div>
          <div className="text-right">
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest">
              {cert.tipo === 'asistencia' ? 'CERTIFICADO DE ASISTENCIA' : 'CERTIFICADO DE REPOSO MÉDICO'}
            </h2>
            <p className="text-xs text-gray-500">Fecha de Emisión: {cert.fechaEmision}</p>
          </div>
        </div>

        {/* Cuerpo del Certificado */}
        <div className="space-y-6 text-sm leading-relaxed text-gray-800 py-4">
          <p>
            El profesional cirujano dentista que suscribe certifica que don/doña <strong>{paciente.nombre}</strong>, RUT <strong>{paciente.rut}</strong>:
          </p>

          {cert.tipo === 'asistencia' ? (
            <p className="bg-gray-50 p-4 rounded-xl border border-gray-200 print:bg-transparent print:border-none">
              Asistió a atención odontológica el día <strong>{cert.fechaAtencion}</strong> en el horario comprendido entre las <strong>{cert.horaInicio} hrs.</strong> y las <strong>{cert.horaFin} hrs.</strong>, debido a: <em>{cert.diagnosticoMotivo}</em>.
            </p>
          ) : (
            <p className="bg-gray-50 p-4 rounded-xl border border-gray-200 print:bg-transparent print:border-none">
              Requiere guardar reposo médico odontológico por un período de <strong>{cert.diasReposo} día(s)</strong> acontar del día <strong>{cert.fechaAtencion}</strong>, debido al cuadro clínico de: <em>{cert.diagnosticoMotivo}</em>.
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

      {/* Firma al Pie */}
      <div className="pt-20 text-center">
        <div className="w-64 mx-auto border-t border-black pt-2">
          <p className="font-bold text-xs text-gray-900">{cert.profesional}</p>
          <p className="text-[10px] text-gray-600">{cert.especialidad}</p>
          <p className="text-[10px] text-gray-500">RUT: {cert.rutProfesional}</p>
        </div>
      </div>
    </div>
  )
})

CertificadoImprimible.displayName = 'CertificadoImprimible'
