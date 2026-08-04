/**
 * Utilidades de formato de texto, enlaces WhatsApp y métricas
 */

export const interpolarVariablesMensaje = (textoBase = '', datos = {}) => {
  if (!textoBase) return ''
  return textoBase
    .replace(/\{paciente\}/g, datos.pacienteNombre || 'Paciente')
    .replace(/\{fecha\}/g, datos.fechaCita || new Date().toLocaleDateString('es-CL'))
    .replace(/\{hora\}/g, datos.horaCita || '10:00')
    .replace(/\{doctor\}/g, datos.doctorNombre || 'Dr. Odontólogo')
    .replace(/\{clinica\}/g, datos.clinicaNombre || 'Studio Dental')
}

export const generarLinkWhatsAppWeb = (telefono, mensaje) => {
  if (!telefono) return '#'
  const numLimpio = String(telefono).replace(/[^0-9]/g, '')
  return `https://web.whatsapp.com/send?phone=${numLimpio}&text=${encodeURIComponent(mensaje)}`
}

export const generarLinkWhatsAppApp = (telefono, mensaje) => {
  if (!telefono) return '#'
  const numLimpio = String(telefono).replace(/[^0-9]/g, '')
  return `https://wa.me/${numLimpio}?text=${encodeURIComponent(mensaje)}`
}

export const calcularResumenComunicaciones = (historial = []) => {
  const hoyStr = new Date().toLocaleDateString('es-CL')
  let enviadosHoy = 0
  let confirmadosCount = 0
  let totalWhatsApp = 0
  let totalEmail = 0

  historial.forEach(m => {
    if (m.fechaEnvio === hoyStr) enviadosHoy++
    if (m.estado === 'Confirmado') confirmadosCount++
    if (m.canal === 'whatsapp') totalWhatsApp++
    if (m.canal === 'email') totalEmail++
  })

  const tasaConfirmacion = historial.length > 0 
    ? Math.round((confirmadosCount / historial.length) * 100) 
    : 0

  return {
    totalEnviados: historial.length,
    enviadosHoy,
    confirmadosCount,
    tasaConfirmacion,
    totalWhatsApp,
    totalEmail
  }
}