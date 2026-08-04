/**
 * Constantes Gold Standard para Comunicaciones y Confirmaciones
 */

export const CANALES_COMUNICACION = [
  { id: 'whatsapp', nombre: '🟢 WhatsApp Web / App', icono: '💬' },
  { id: 'email', nombre: '📧 Correo Electrónico', icono: '✉️' },
  { id: 'sms', nombre: '📱 Mensaje SMS', icono: '📲' }
]

export const ESTADOS_CONFIRMACION_CITA = [
  { id: 'Enviado', nombre: '📤 Enviado / Esperando Respuesta', colorBg: 'bg-blue-50', colorText: 'text-blue-800', colorBorder: 'border-blue-300' },
  { id: 'Confirmado', nombre: '🟢 Cita Confirmada por Paciente', colorBg: 'bg-emerald-50', colorText: 'text-emerald-800', colorBorder: 'border-emerald-300' },
  { id: 'Reprogramar', nombre: '🟡 Pide Reprogramar Hora', colorBg: 'bg-amber-50', colorText: 'text-amber-800', colorBorder: 'border-amber-300' },
  { id: 'Cancelado', nombre: '🔴 Cita Cancelada', colorBg: 'bg-red-50', colorText: 'text-red-800', colorBorder: 'border-red-300' }
]

export const PLANTILLAS_DEFAULT = [
  {
    id: 1,
    nombre: '📅 Confirmación Cita Próxima',
    canal: 'whatsapp',
    asunto: 'Confirmación de Atención Odontológica',
    cuerpo: 'Hola {paciente}, le recordamos su cita para el {fecha} a las {hora} hrs con {doctor} en {clinica}. Por favor confirme respondiendo CONFIRMO o SOLICITO CAMBIO.'
  },
  {
    id: 2,
    nombre: '🦷 Recall / Control Preventivo (6 Meses)',
    canal: 'whatsapp',
    asunto: 'Control Dental Periódico Requerido',
    cuerpo: 'Estimado/a {paciente}, han pasado 6 meses desde su último control dental. En {clinica} nos preocupa su salud bucal. Le invitamos a agendar su limpieza/profilaxis periódica.'
  },
  {
    id: 3,
    nombre: '📋 Envío de Presupuesto / Plan de Tratamiento',
    canal: 'email',
    asunto: 'Su Plan de Tratamiento Odontológico - Studio Dental',
    cuerpo: 'Estimado/a {paciente}, junto con saludarle, le adjuntamos el detalle de su presupuesto en {clinica}. Quedamos a su disposición para iniciar su tratamiento.'
  },
  {
    id: 4,
    nombre: '🩺 Indicaciones Post-Operatorias / Cirugía',
    canal: 'whatsapp',
    asunto: 'Cuidados Post-Tratamiento',
    cuerpo: 'Hola {paciente}, esperamos que se encuentre bien tras su atención en {clinica}. Recuerde mantener reposo relativo, aplicar frío local y tomar los analgésicos según su receta.'
  }
]

export const MENSAJES_HISTORIAL_DEFAULT = [
  {
    id: 1001,
    pacienteId: 1,
    pacienteNombre: 'Camila Silva Morales',
    pacienteTelefono: '+56 9 8765 4321',
    pacienteEmail: 'camila.silva@gmail.com',
    canal: 'whatsapp',
    plantillaNombre: 'Confirmación Cita Próxima',
    mensajeEnviado: 'Hola Camila Silva Morales, le recordamos su cita para el 04/08/2026 a las 10:30 hrs con Dr. Miguel Díaz en Studio Dental.',
    fechaEnvio: new Date().toLocaleDateString('es-CL'),
    horaEnvio: '09:15',
    estado: 'Confirmado',
    notaBitacora: 'Respondió por WhatsApp confirmando su asistencia.'
  }
]