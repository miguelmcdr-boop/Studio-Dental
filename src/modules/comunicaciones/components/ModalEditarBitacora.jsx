import React, { memo, useState, useEffect } from 'react'
import { Modal } from '../../../components/ui/Modal'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
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
    <Modal isOpen={true} onClose={alCerrar} title="Editar Entrada de Bitácora / Registro" size="md">

        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            label="Paciente"
            type="text"
            disabled
            value={`${registroEditar?.pacienteNombre} (${registroEditar?.pacienteTelefono || 'Sin fono'})`}
          />

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

          <Input
            label="Nota Interna de Recepción / Auditoría"
            type="text"
            placeholder="Ej: Paciente llamó por teléfono solicitando mover la hora a las 16:00."
            value={notaBitacora}
            onChange={(e) => setNotaBitacora(e.target.value)}
          />

          <div className="flex gap-2 pt-2">
            <Button type="button" onClick={alCerrar} variant="ghost" fullWidth>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" fullWidth>
              Guardar Cambios
            </Button>
          </div>
        </form>
    </Modal>
  )
})

ModalEditarBitacora.displayName = 'ModalEditarBitacora'