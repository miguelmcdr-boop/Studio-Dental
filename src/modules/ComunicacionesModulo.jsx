import React, { useState } from 'react'

export const ComunicacionesModulo = ({ pacientes = [], userProfile }) => {
  const [tabActiva, setTabActiva] = useState('Recordatorios')

  const [citas] = useState(() => {
    const saved = localStorage.getItem('clinica_citas_agenda')
    return saved ? JSON.parse(saved) : []
  })

  const hoyFecha = new Date().toISOString().split('T')[0]
  
  const mananaObj = new Date()
  mananaObj.setDate(mananaObj.getDate() + 1)
  const mananaFecha = mananaObj.toISOString().split('T')[0]

  const citasHoy = citas.filter(c => c.fecha === hoyFecha)
  const citasManana = citas.filter(c => c.fecha === mananaFecha)

  const enviarWhatsAppRecordatorio = (cita) => {
    const pacObj = pacientes.find(p => p.nombre.toLowerCase().trim() === cita.paciente.toLowerCase().trim())
    let numeroTel = pacObj?.telefono || ''
    numeroTel = numeroTel.replace(/\s+/g, '').replace('+', '').replace(/-/g, '')
    
    const textoMensaje = `Hola ${cita.paciente}, te saludamos de la consulta del ${userProfile?.nombreCompleto || 'Dr. Miguel Díaz'}. Te recordamos tu cita odontológica agendada para el ${cita.fecha.split('-').reverse().join('/')} a las ${cita.hora} hrs para: ${cita.motivo}. Por favor confirma tu asistencia respondiendo a este mensaje.`
    
    const urlWhatsApp = `https://api.whatsapp.com/send?phone=${numeroTel}&text=${encodeURIComponent(textoMensaje)}`
    window.open(urlWhatsApp, '_blank')
  }

  const enviarWhatsAppPostquirurgico = (paciente) => {
    let numeroTel = paciente?.telefono || ''
    numeroTel = numeroTel.replace(/\s+/g, '').replace('+', '').replace(/-/g, '')

    const textoMensaje = `Hola ${paciente.nombre}, te contactamos del equipo del ${userProfile?.nombreCompleto || 'Dr. Miguel Díaz'} para saber cómo te has sentido tras tu procedimiento odontológico de hoy. Recuerda seguir las indicaciones de reposo, frío local y tomar tus medicamentos prescritos a la hora indicada. Ante cualquier molestia, contáctanos.`

    const urlWhatsApp = `https://api.whatsapp.com/send?phone=${numeroTel}&text=${encodeURIComponent(textoMensaje)}`
    window.open(urlWhatsApp, '_blank')
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Centro de Comunicaciones</h2>
          <p className="text-xs text-gray-500">Recordatorios por WhatsApp, indicaciones postoperatorias e higiene.</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-200 mb-6">
        {['Recordatorios Citas', 'Seguimiento Postoperatorio'].map(tab => (
          <button
            key={tab}
            onClick={() => setTabActiva(tab)}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              tabActiva === tab ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {tabActiva === 'Recordatorios Citas' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
            <h3 className="font-bold text-sm text-gray-900 mb-4 border-b pb-2 flex items-center justify-between">
              <span>📅 Citas Programadas para Mañana ({mananaFecha.split('-').reverse().join('/')})</span>
              <span className="text-xs font-normal text-gray-500">Ideal para confirmación previa</span>
            </h3>

            <div className="space-y-3">
              {citasManana.map(c => {
                const pac = pacientes.find(p => p.nombre.toLowerCase().trim() === c.paciente.toLowerCase().trim())
                return (
                  <div key={c.id} className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex justify-between items-center">
                    <div>
                      <span className="font-bold text-gray-900 block text-sm">{c.paciente} ({c.hora} hrs)</span>
                      <p className="text-xs text-gray-600 mt-0.5">Procedimiento: {c.motivo} | Tel: {pac?.telefono || 'No registrado'}</p>
                    </div>

                    <button
                      onClick={() => enviarWhatsAppRecordatorio(c)}
                      className="bg-emerald-600 text-white font-bold text-xs px-4 py-2 rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-xs"
                    >
                      <span>💬 Recordar por WhatsApp</span>
                    </button>
                  </div>
                )
              })}

              {citasManana.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-6">No hay citas agendadas para el día de mañana.</p>
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
            <h3 className="font-bold text-sm text-gray-900 mb-4 border-b pb-2 flex items-center justify-between">
              <span>📅 Citas Programadas para Hoy ({hoyFecha.split('-').reverse().join('/')})</span>
            </h3>

            <div className="space-y-3">
              {citasHoy.map(c => {
                const pac = pacientes.find(p => p.nombre.toLowerCase().trim() === c.paciente.toLowerCase().trim())
                return (
                  <div key={c.id} className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex justify-between items-center">
                    <div>
                      <span className="font-bold text-gray-900 block text-sm">{c.paciente} ({c.hora} hrs)</span>
                      <p className="text-xs text-gray-600 mt-0.5">Procedimiento: {c.motivo} | Estado: {c.estado}</p>
                    </div>

                    <button
                      onClick={() => enviarWhatsAppRecordatorio(c)}
                      className="bg-emerald-600 text-white font-bold text-xs px-4 py-2 rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-xs"
                    >
                      <span>💬 Recordar por WhatsApp</span>
                    </button>
                  </div>
                )
              })}

              {citasHoy.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-8">No hay citas programadas para el día de hoy.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {tabActiva === 'Seguimiento Postoperatorio' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
          <h3 className="font-bold text-sm text-gray-900 mb-4 border-b pb-2">
            Enviar Indicaciones o Consultar Evolución de Pacientes
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pacientes.map(p => (
              <div key={p.id} className="p-4 border border-gray-200 rounded-xl bg-gray-50 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">{p.nombre}</h4>
                  <p className="text-xs text-gray-500">Tel: {p.telefono || 'Sin teléfono'}</p>
                </div>

                <button
                  onClick={() => enviarWhatsAppPostquirurgico(p)}
                  className="bg-emerald-600 text-white font-semibold text-xs px-3 py-2 rounded-lg hover:bg-emerald-700"
                >
                  💬 Enviar Seguimiento
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}