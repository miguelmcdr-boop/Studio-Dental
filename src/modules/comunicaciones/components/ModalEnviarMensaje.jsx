import React, { memo, useState, useEffect } from 'react'
import { Modal } from '../../../components/ui/Modal'
import { Button } from '../../../components/ui/Button'
import { CANALES_COMUNICACION } from '../constants/comunicacionesConstants'
import { interpolarVariablesMensaje, generarLinkWhatsAppWeb, generarLinkWhatsAppApp } from '../utils/comunicacionesCalculations'

export const ModalEnviarMensaje = memo(({ pacientes = [], plantillas = [], userProfile, alRegistrarEnvio, alCerrar }) => {
  const [pacienteId, setPacienteId] = useState('')
  const [plantillaId, setPlantillaId] = useState('')
  const [canal, setCanal] = useState(CANALES_COMUNICACION[0].id)
  const [mensajeTexto, setMensajeTexto] = useState('')

  useEffect(() => {
    if (!plantillaId) return
    const pl = plantillas.find(p => String(p.id) === String(plantillaId))
    const pac = pacientes.find(p => String(p.id) === String(pacienteId))

    if (pl) {
      setCanal(pl.canal || CANALES_COMUNICACION[0].id)
      const textoFinal = interpolarVariablesMensaje(pl.cuerpo, {
        pacienteNombre: pac?.nombre || 'Paciente',
        doctorNombre: userProfile?.nombreCompleto || 'Dr. Miguel Díaz',
        clinicaNombre: 'Studio Dental'
      })
      setMensajeTexto(textoFinal)
    }
  }, [plantillaId, pacienteId, plantillas, pacientes, userProfile])

  const handleEnviar = (tipoApertura = 'web') => {
    if (!pacienteId || !mensajeTexto) {
      alert('Selecciona un paciente y redacta o carga un mensaje.')
      return
    }

    const pac = pacientes.find(p => String(p.id) === String(pacienteId))
    const pl = plantillas.find(p => String(p.id) === String(plantillaId))

    const registro = {
      id: Date.now(),
      pacienteId: pac?.id,
      pacienteNombre: pac?.nombre || 'Paciente',
      pacienteTelefono: pac?.telefono || 'N/I',
      pacienteEmail: pac?.email || 'N/I',
      canal,
      plantillaNombre: pl?.nombre || 'Mensaje Personalizado',
      mensajeEnviado: mensajeTexto,
      fechaEnvio: new Date().toLocaleDateString('es-CL'),
      horaEnvio: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
      estado: 'Enviado',
      notaBitacora: 'Mensaje transmitido desde panel de comunicaciones.'
    }

    alRegistrarEnvio(registro)

    if (canal === 'whatsapp' && pac?.telefono) {
      const link = tipoApertura === 'web' 
        ? generarLinkWhatsAppWeb(pac.telefono, mensajeTexto)
        : generarLinkWhatsAppApp(pac.telefono, mensajeTexto)
      window.open(link, '_blank')
    } else {
      alert('✅ Mensaje registrado exitosamente en la bitácora.')
    }

    alCerrar()
  }

  return (
    <Modal isOpen={true} onClose={alCerrar} title="💬 Transmitir Mensaje / Notificación" size="md">
      <div className="space-y-3 text-xs">

        <div className="space-y-3">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Paciente Destinatario *</label>
            <select
              value={pacienteId}
              onChange={(e) => setPacienteId(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-300 bg-white font-bold"
            >
              <option value="">-- Seleccionar paciente --</option>
              {pacientes.map(p => (
                <option key={p.id} value={p.id}>{p.nombre} ({p.telefono || 'Sin fono'})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Cargar Plantilla</label>
              <select
                value={plantillaId}
                onChange={(e) => setPlantillaId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-300 bg-white font-medium"
              >
                <option value="">-- Seleccionar --</option>
                {plantillas.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Canal de Envío</label>
              <select
                value={canal}
                onChange={(e) => setCanal(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-300 bg-white font-bold"
              >
                {CANALES_COMUNICACION.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Mensaje (Editable / Previsualización en Vivo)</label>
            <textarea
              rows="4"
              value={mensajeTexto}
              onChange={(e) => setMensajeTexto(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-300 font-mono text-[11px]"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              onClick={alCerrar}
              variant="ghost"
              fullWidth
            >
              Cancelar
            </Button>

            {canal === 'whatsapp' ? (
              <>
                <Button
                  type="button"
                  onClick={() => handleEnviar('web')}
                  variant="primary"
                  fullWidth
                  className="bg-emerald-700 hover:bg-emerald-800"
                  title="Abrir en navegador de escritorio"
                >
                  💻 WhatsApp Web
                </Button>
                <Button
                  type="button"
                  onClick={() => handleEnviar('app')}
                  variant="primary"
                  fullWidth
                  title="Abrir App móvil wa.me"
                >
                  📱 App Móvil
                </Button>
              </>
            ) : (
              <Button
                type="button"
                onClick={() => handleEnviar('web')}
                variant="primary"
                fullWidth
              >
                ✉️ Registrar Envío
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
})

ModalEnviarMensaje.displayName = 'ModalEnviarMensaje'