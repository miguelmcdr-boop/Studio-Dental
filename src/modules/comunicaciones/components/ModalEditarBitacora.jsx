import React, { memo, useState, useEffect } from 'react'
import { ESTADOS_CONFIRMACION_CITA } from '../constants/comunicacionesConstants'

export const ModalEditarBitacora = memo(({ registroEditar, alGuardar, alCerrar }) => {
  const [estado, setEstado] = useState('')
  const [notaBitacora, setNotaBitacora] = useState('')
  const [mensajeEnviado, setMensajeEnviado] = useState('')

  useEffect(() => {
    if (registroEditar) {
      setEstado(registroEditar.estado || 'Enviado')
      setNotaBitacora(registroEditar.notaBitacora || '')
      setMensajeEnviado(registroEditar.mensajeEnviado || '')
    }
  }, [registroEditar])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!registroEditar) return

    alGuardar({
      ...registroEditar,
      estado,
      notaBitacora: notaBitacora.trim(),
      mensajeEnviado: mensajeEnviado.trim()
    })

    alCerrar()
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 print:hidden">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md border border-gray-200 shadow-xl space-y-4 text-xs">
        <div className="flex justify-between items-center border-b pb-3">
          <h3 className="text-base font-bold text-gray-900">✏️ Editar Entrada de Bitácora / Registro</h3>
          <button onClick={alCerrar} className="text-gray-400 hover:text-black font-bold text-lg">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Paciente</label>
            <input
              type="text"
              disabled
              value={`${registroEditar?.pacienteNombre} (${registroEditar?.pacienteTelefono || 'Sin fono'})`}
              className="w-full p-2.5 rounded-xl border bg-gray-100 font-bold text-gray-700"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Estado de Confirmación de Cita</label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-300 bg-white font-black text-xs"
            >
              {ESTADOS_CONFIRMACION_CITA.map(e => (
                <option key={e.id} value={e.id}>{e.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Mensaje Registrado</label>
            <textarea
              rows="3"
              value={mensajeEnviado}
              onChange={(e) => setMensajeEnviado(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-300 font-mono text-[11px]"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Nota Interna de Recepción / Auditoría</label>
            <input
              type="text"
              placeholder="Ej: Paciente llamó por teléfono solicitando mover la hora a las 16:00."
              value={notaBitacora}
              onChange={(e) => setNotaBitacora(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-300"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={alCerrar}
              className="w-1/2 py-2.5 rounded-xl border border-gray-300 font-bold text-gray-700 hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="w-1/2 bg-black text-white py-2.5 rounded-xl font-bold hover:bg-gray-800"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  )
})

ModalEditarBitacora.displayName = 'ModalEditarBitacora'