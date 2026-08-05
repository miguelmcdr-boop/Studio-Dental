import React, { memo, useState } from 'react'
import { pacientesStorageService } from '../services/pacientesStorageService'

export const CertificadosSection = memo(({
  paciente,
  userProfile,
  certificados = [],
  setCertificados = () => {}
}) => {
  const [tipoCertificado, setTipoCertificado] = useState('asistencia')
  const [fechaAtencion, setFechaAtencion] = useState(new Date().toISOString().split('T')[0])
  const [horaInicio, setHoraInicio] = useState('10:00')
  const [horaFin, setHoraFin] = useState('11:00')
  const [diasReposo, setDiasReposo] = useState('1')
  const [diagnosticoMotivo, setDiagnosticoMotivo] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [certSeleccionadoVer, setCertSeleccionadoVer] = useState(null)

  const listaCertificados = Array.isArray(certificados) ? certificados : []

  const handleGenerarCertificado = (e) => {
    e.preventDefault()
    if (!diagnosticoMotivo) {
      alert('Por favor ingresa el motivo o diagnóstico de la atención.')
      return
    }

    const nuevoCertificado = {
      id: Date.now(),
      fechaEmision: new Date().toLocaleDateString('es-CL'),
      tipo: tipoCertificado,
      fechaAtencion,
      horaInicio,
      horaFin,
      diasReposo: tipoCertificado === 'reposo' ? diasReposo : null,
      diagnosticoMotivo,
      observaciones,
      profesional: userProfile?.nombreCompleto || 'Dr. Miguel Díaz Rodríguez',
      rutProfesional: userProfile?.rut || 'N/I',
      especialidad: userProfile?.especialidad || 'Cirujano Dentista'
    }

    const actualizados = [nuevoCertificado, ...listaCertificados]
    setCertificados(actualizados)
    pacientesStorageService.guardarItem(`certificados_${paciente.id}`, actualizados)
    setCertSeleccionadoVer(nuevoCertificado)

    setDiagnosticoMotivo('')
    setObservaciones('')
  }

  const handleEliminarCertificado = (id) => {
    if (window.confirm('¿Deseas eliminar este registro de certificado del historial?')) {
      const actualizados = listaCertificados.filter(c => c.id !== id)
      setCertificados(actualizados)
      pacientesStorageService.guardarItem(`certificados_${paciente.id}`, actualizados)
      if (certSeleccionadoVer?.id === id) setCertSeleccionadoVer(null)
    }
  }

  const certAMostrar = certSeleccionadoVer || (listaCertificados.length > 0 ? listaCertificados[0] : null)

  return (
    <div className="space-y-6">
      {/* Formulario de Emisión */}
      <div className="bg-gray-50 p-5 border border-gray-200 rounded-2xl print:hidden">
        <h4 className="font-bold text-xs text-gray-800 mb-4 uppercase tracking-wider">Emitir Nuevo Certificado / Constancia Médica</h4>
        
        <form onSubmit={handleGenerarCertificado} className="space-y-4 text-xs">
          <div className="flex gap-4">
            <label className="flex items-center gap-2 font-bold cursor-pointer">
              <input
                type="radio"
                name="tipoCert"
                value="asistencia"
                checked={tipoCertificado === 'asistencia'}
                onChange={() => setTipoCertificado('asistencia')}
                className="accent-black"
              />
              📋 Certificado de Asistencia
            </label>
            <label className="flex items-center gap-2 font-bold cursor-pointer">
              <input
                type="radio"
                name="tipoCert"
                value="reposo"
                checked={tipoCertificado === 'reposo'}
                onChange={() => setTipoCertificado('reposo')}
                className="accent-black"
              />
              🛌 Certificado de Reposo / Licencia Médica
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-gray-600 mb-1 font-semibold">Fecha de Atención</label>
              <input
                type="date"
                value={fechaAtencion}
                onChange={(e) => setFechaAtencion(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-white"
              />
            </div>

            {tipoCertificado === 'asistencia' ? (
              <>
                <div>
                  <label className="block text-gray-600 mb-1 font-semibold">Hora Inicio</label>
                  <input
                    type="time"
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-1 font-semibold">Hora Término</label>
                  <input
                    type="time"
                    value={horaFin}
                    onChange={(e) => setHoraFin(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-white"
                  />
                </div>
              </>
            ) : (
              <div>
                <label className="block text-gray-600 mb-1 font-semibold">Días de Reposo Indicados</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={diasReposo}
                  onChange={(e) => setDiasReposo(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white font-bold"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-gray-600 mb-1 font-semibold">
              {tipoCertificado === 'asistencia' ? 'Procedimiento / Atención Realizada' : 'Diagnóstico Clínico / Causa del Reposo'}
            </label>
            <input
              type="text"
              placeholder={tipoCertificado === 'asistencia' ? 'Ej: Exodoncia de pieza 3.8 y sutura' : 'Ej: Cirugía de terceros molares e inflamación moderada'}
              value={diagnosticoMotivo}
              onChange={(e) => setDiagnosticoMotivo(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-white font-medium"
            />
          </div>

          <div>
            <label className="block text-gray-600 mb-1 font-semibold">Observaciones o Indicaciones Adicionales (Opcional)</label>
            <input
              type="text"
              placeholder="Ej: Se sugiere no realizar actividad física intensa por 48 hrs."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-white"
            />
          </div>

          <div className="flex justify-end">
            <button type="submit" className="bg-black text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-gray-800">
              📄 Generar y Guardar Certificado
            </button>
          </div>
        </form>
      </div>

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