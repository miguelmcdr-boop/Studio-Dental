import React, { memo, useState } from 'react'
// F6-D-6: usar certificadosStorageService en lugar de pacientesStorageService.guardarItem
import { certificadosStorageService } from '../services/certificadosStorageService'
import { FormularioNuevoCertificado } from './FormularioNuevoCertificado'
import { createLogger } from '../../../services/logger'

const log = createLogger('CertificadosSection')

/**
 * Sección de Certificados Médicos (F6-D-6 refactor)
 * 
 * Componente padre que renderiza:
 * - FormularioNuevoCertificado (extraído para respetar límite de 285 líneas)
 * - Historial de certificados emitidos
 * - Documento imprimible del certificado seleccionado
 */
export const CertificadosSection = memo(({
  paciente,
  userProfile,
  certificados = [],
  setCertificados = () => {}
}) => {
  const [certSeleccionadoVer, setCertSeleccionadoVer] = useState(null)

  const listaCertificados = Array.isArray(certificados) ? certificados : []

  const handleGenerarCertificado = (nuevoCertificado) => {
    const actualizados = [nuevoCertificado, ...listaCertificados]
    setCertificados(actualizados)
    // F6-D-6: usar certificadosStorageService (Supabase + localStorage)
    certificadosStorageService.guardarCertificados(paciente.id, actualizados).catch(err => log.warn("Error al guardar:", err))
    setCertSeleccionadoVer(nuevoCertificado)
  }

  const handleEliminarCertificado = (id) => {
    if (window.confirm('¿Deseas eliminar este registro de certificado del historial?')) {
      const actualizados = listaCertificados.filter(c => c.id !== id)
      setCertificados(actualizados)
      // F6-D-6: usar certificadosStorageService (Supabase + localStorage)
      certificadosStorageService.guardarCertificados(paciente.id, actualizados).catch(err => log.warn("Error al guardar:", err))
      if (certSeleccionadoVer?.id === id) setCertSeleccionadoVer(null)
    }
  }

  const certAMostrar = certSeleccionadoVer || (listaCertificados.length > 0 ? listaCertificados[0] : null)

  return (
    <div className="space-y-6">
      {/* Formulario de Emisión */}
      <FormularioNuevoCertificado 
        userProfile={userProfile} 
        onGenerarCertificado={handleGenerarCertificado} 
      />

      {/* Historial de Certificados Guardados */}
      {listaCertificados.length > 0 && (
        <div className="bg-white p-4 border border-gray-200 rounded-2xl print:hidden">
          <h4 className="font-bold text-xs text-gray-800 mb-3 uppercase tracking-wider">Historial de Certificados Emitidos ({listaCertificados.length})</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {listaCertificados.map(c => (
              <div
                key={c.id}
                onClick={() => setCertSeleccionadoVer(c)}
                className={`p-3 rounded-xl border text-xs flex justify-between items-center cursor-pointer transition-all ${
                  certAMostrar?.id === c.id ? 'bg-black text-white border-black' : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-800'
                }`}
              >
                <div>
                  <span className="font-bold uppercase tracking-wider mr-2">
                    {c.tipo === 'asistencia' ? '📋 Asistencia' : '🛌 Reposo'}
                  </span>
                  <span>({c.fechaEmision}) — {c.diagnosticoMotivo}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] opacity-75">Ver/Imprimir →</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleEliminarCertificado(c.id); }}
                    className="text-red-400 hover:text-red-200 font-bold ml-2"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documento de Certificado Listo para Impresión A4 */}
      {certAMostrar ? (
        <div className="space-y-4">
          <div className="flex justify-end print:hidden">
            <button
              onClick={() => window.print()}
              className="bg-black text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-gray-800 shadow-sm flex items-center gap-2"
            >
              🖨️ Imprimir Certificado Oficial (A4)
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-10 print:border-none print:p-0 min-h-[500px] flex flex-col justify-between">
            <div>
              {/* Membrete */}
              <div className="border-b-2 border-black pb-4 mb-8 flex justify-between items-start">
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{certAMostrar.profesional}</h1>
                  <p className="text-xs text-gray-600">{certAMostrar.especialidad} | RUT: {certAMostrar.rutProfesional}</p>
                  <p className="text-xs text-gray-500">Consulta Odontológica Particular</p>
                </div>
                <div className="text-right">
                  <h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest">
                    {certAMostrar.tipo === 'asistencia' ? 'CERTIFICADO DE ASISTENCIA' : 'CERTIFICADO DE REPOSO MÉDICO'}
                  </h2>
                  <p className="text-xs text-gray-500">Fecha de Emisión: {certAMostrar.fechaEmision}</p>
                </div>
              </div>

              {/* Cuerpo del Certificado */}
              <div className="space-y-6 text-sm leading-relaxed text-gray-800 py-4">
                <p>
                  El profesional cirujano dentista que suscribe certifica que don/doña <strong>{paciente.nombre}</strong>, RUT <strong>{paciente.rut}</strong>:
                </p>

                {certAMostrar.tipo === 'asistencia' ? (
                  <p className="bg-gray-50 p-4 rounded-xl border border-gray-200 print:bg-transparent print:border-none">
                    Asistió a atención odontológica el día <strong>{certAMostrar.fechaAtencion}</strong> en el horario comprendido entre las <strong>{certAMostrar.horaInicio} hrs.</strong> y las <strong>{certAMostrar.horaFin} hrs.</strong>, debido a: <em>{certAMostrar.diagnosticoMotivo}</em>.
                  </p>
                ) : (
                  <p className="bg-gray-50 p-4 rounded-xl border border-gray-200 print:bg-transparent print:border-none">
                    Requiere guardar reposo médico odontológico por un período de <strong>{certAMostrar.diasReposo} día(s)</strong> a contar del día <strong>{certAMostrar.fechaAtencion}</strong>, debido al cuadro clínico de: <em>{certAMostrar.diagnosticoMotivo}</em>.
                  </p>
                )}

                {certAMostrar.observaciones && (
                  <p className="text-xs text-gray-600 italic">
                    <strong>Observaciones:</strong> {certAMostrar.observaciones}
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
                <p className="font-bold text-xs text-gray-900">{certAMostrar.profesional}</p>
                <p className="text-[10px] text-gray-600">{certAMostrar.especialidad}</p>
                <p className="text-[10px] text-gray-500">RUT: {certAMostrar.rutProfesional}</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-300 text-xs text-gray-500 print:hidden">
          No hay certificados emitidos para este paciente. Completa el formulario superior para generar uno.
        </div>
      )}
    </div>
  )
})

CertificadosSection.displayName = 'CertificadosSection'
