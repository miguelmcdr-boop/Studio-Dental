import React, { memo, useState } from 'react'

export const CertificadosSection = memo(({ paciente, userProfile }) => {
  const [tipoCertificado, setTipoCertificado] = useState('asistencia')
  const [horaInicioCert, setHoraInicioCert] = useState('10:00')
  const [horaFinCert, setHoraFinCert] = useState('11:00')
  const [diasReposoCert, setDiasReposoCert] = useState('2')
  const [diagnosticoCert, setDiagnosticoCert] = useState('Atención clínica quirúrgica odontológica.')

  return (
    <div>
      <div className="bg-gray-50 p-4 border border-gray-200 rounded-2xl mb-6 print:hidden space-y-4 text-xs">
        <h4 className="font-bold text-xs text-gray-800 uppercase tracking-wider">Emitir Certificado / Comprobante Médico</h4>
        
        <div className="flex gap-4">
          <label className="flex items-center gap-2 font-semibold cursor-pointer">
            <input
              type="radio"
              name="tipoCert"
              checked={tipoCertificado === 'asistencia'}
              onChange={() => setTipoCertificado('asistencia')}
            />
            Certificado de Asistencia a Consulta
          </label>
          <label className="flex items-center gap-2 font-semibold cursor-pointer">
            <input
              type="radio"
              name="tipoCert"
              checked={tipoCertificado === 'reposo'}
              onChange={() => setTipoCertificado('reposo')}
            />
            Certificado de Reposo / Licencia Odontológica
          </label>
        </div>

        {tipoCertificado === 'asistencia' ? (
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-gray-600 mb-1 font-semibold">Hora Inicio Atención</label>
              <input
                type="text"
                value={horaInicioCert}
                onChange={(e) => setHoraInicioCert(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-white"
              />
            </div>
            <div>
              <label className="block text-gray-600 mb-1 font-semibold">Hora Término Atención</label>
              <input
                type="text"
                value={horaFinCert}
                onChange={(e) => setHoraFinCert(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-white"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-gray-600 mb-1 font-semibold">Días de Reposo Indicados</label>
              <input
                type="number"
                value={diasReposoCert}
                onChange={(e) => setDiasReposoCert(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-white"
              />
            </div>
            <div>
              <label className="block text-gray-600 mb-1 font-semibold">Diagnóstico / Motivo del Reposo</label>
              <input
                type="text"
                value={diagnosticoCert}
                onChange={(e) => setDiagnosticoCert(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-white"
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end mb-4 print:hidden">
        <button onClick={() => window.print()} className="bg-black text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-gray-800 shadow-sm">
          🖨️ Imprimir Certificado (PDF)
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-10 print:border-none print:p-0">
        <div className="border-b-2 border-black pb-4 mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{userProfile?.nombreCompleto || 'Dr. Miguel Díaz Rodríguez'}</h1>
            <p className="text-xs text-gray-600">{userProfile?.especialidad || 'Cirujano Dentista'} | RUT: {userProfile?.rut || 'N/I'}</p>
            <p className="text-xs text-gray-500">Consulta Odontológica</p>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-bold text-gray-800 uppercase">
              {tipoCertificado === 'asistencia' ? 'Certificado de Asistencia' : 'Certificado Médico Odontológico'}
            </h2>
            <p className="text-xs text-gray-500">Fecha: {new Date().toLocaleDateString('es-CL')}</p>
          </div>
        </div>

        <div className="space-y-6 text-sm text-gray-800 leading-relaxed py-6">
          <p>
            El profesional que suscribe certifica que don(ña) <strong className="text-gray-900">{paciente.nombre}</strong>, 
            RUT <strong className="text-gray-900">{paciente.rut}</strong>:
          </p>

          {tipoCertificado === 'asistencia' ? (
            <p className="bg-gray-50 p-6 rounded-xl border border-gray-200 text-justify print:bg-white print:border">
              Ha concurrido a atención clínica odontológica en esta consulta el día de hoy,{' '}
              <strong>{new Date().toLocaleDateString('es-CL')}</strong>, desde las <strong>{horaInicioCert}</strong> hrs. 
              hasta las <strong>{horaFinCert}</strong> hrs.
            </p>
          ) : (
            <p className="bg-gray-50 p-6 rounded-xl border border-gray-200 text-justify print:bg-white print:border">
              Requiere guardar reposo relativo por un período de <strong>{diasReposoCert} días</strong> a contar de esta fecha, 
              debido a procedimiento odontológico / diagnóstico: <em>"{diagnosticoCert}"</em>.
            </p>
          )}

          <p className="text-xs text-gray-500 pt-4">
            Se extiende el presente certificado a solicitud del interesado para los fines que estime convenientes.
          </p>
        </div>

        <div className="hidden print:block mt-32 pt-10 border-t border-gray-300 text-center">
          <div className="w-64 mx-auto border-t border-black pt-2">
            <p className="font-bold text-xs">{userProfile?.nombreCompleto}</p>
            <p className="text-[10px] text-gray-600">Firma y Timbre Médico</p>
          </div>
        </div>
      </div>
    </div>
  )
})

CertificadosSection.displayName = 'CertificadosSection'