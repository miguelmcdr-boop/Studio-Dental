import React, { memo } from 'react'
import { ESTADOS_CONFIRMACION_CITA } from '../constants/comunicacionesConstants'
import { generarLinkWhatsAppWeb } from '../utils/comunicacionesCalculations'

export const TablaHistorialMensajes = memo(({
  historial,
  onCambiarEstado,
  onEditarBitacora,
  onEliminarBitacora
}) => {
  if (historial.length === 0) {
    return (
      <div className="p-10 text-center text-xs text-gray-400 bg-white border border-gray-200 rounded-2xl">
        No se encontraron registros en la bitácora de mensajes para el filtro seleccionado.
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs text-xs">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-100 border-b border-gray-200 text-gray-700 font-bold uppercase text-[10px]">
            <th className="p-3">Paciente / Contacto</th>
            <th className="p-3">Canal</th>
            <th className="p-3">Mensaje / Plantilla</th>
            <th className="p-3 text-center">Estado Confirmación</th>
            <th className="p-3">Fecha / Hora</th>
            <th className="p-3 text-right print:hidden">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {historial.map((m) => {
            const configEst = ESTADOS_CONFIRMACION_CITA.find(e => e.id === m.estado) || ESTADOS_CONFIRMACION_CITA[0]

            return (
              <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-3">
                  <span className="font-extrabold text-gray-900 block">{m.pacienteNombre}</span>
                  <span className="text-[10px] text-gray-500 font-mono">{m.pacienteTelefono || 'Sin fono'}</span>
                </td>

                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded-lg border font-bold text-[10px] ${
                    m.canal === 'whatsapp' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-blue-50 text-blue-800 border-blue-200'
                  }`}>
                    {m.canal === 'whatsapp' ? '💬 WhatsApp' : '✉️ Email'}
                  </span>
                </td>

                <td className="p-3 max-w-xs">
                  <span className="font-bold text-gray-800 block text-[11px]">{m.plantillaNombre}</span>
                  <span className="text-gray-500 text-[10px] truncate block" title={m.mensajeEnviado}>
                    {m.mensajeEnviado}
                  </span>
                  {m.notaBitacora && (
                    <span className="text-[10px] italic text-purple-900 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 inline-block mt-0.5">
                      📌 Nota: {m.notaBitacora}
                    </span>
                  )}
                </td>

                <td className="p-3 text-center">
                  <select
                    value={m.estado}
                    onChange={(e) => onCambiarEstado(m.id, e.target.value)}
                    className={`px-2 py-1 rounded-xl font-black text-[10px] border bg-white cursor-pointer ${configEst.colorText} ${configEst.colorBorder}`}
                  >
                    {ESTADOS_CONFIRMACION_CITA.map(e => (
                      <option key={e.id} value={e.id}>{e.nombre}</option>
                    ))}
                  </select>
                </td>

                <td className="p-3 font-semibold text-gray-700">
                  {m.fechaEnvio} <span className="text-gray-400 font-normal block">{m.horaEnvio} hrs</span>
                </td>

                <td className="p-3 text-right print:hidden space-x-1">
                  {m.canal === 'whatsapp' && m.pacienteTelefono && (
                    <a
                      href={generarLinkWhatsAppWeb(m.pacienteTelefono, m.mensajeEnviado)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 bg-emerald-600 text-white font-bold rounded-lg text-[10px] hover:bg-emerald-700 inline-block"
                      title="Reenviar por WhatsApp Web"
                    >
                      💬 Reenviar
                    </a>
                  )}

                  <button
                    onClick={() => onEditarBitacora(m)}
                    className="p-1.5 text-gray-600 hover:text-black font-semibold rounded-lg hover:bg-gray-100"
                    title="Editar entrada en bitácora"
                  >
                    ✏️
                  </button>

                  <button
                    onClick={() => onEliminarBitacora(m.id)}
                    className="p-1.5 text-red-500 hover:text-red-700 font-semibold rounded-lg hover:bg-red-50"
                    title="Eliminar de bitácora"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
})

TablaHistorialMensajes.displayName = 'TablaHistorialMensajes'