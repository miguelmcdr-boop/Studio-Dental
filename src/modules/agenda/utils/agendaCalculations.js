export const obtenerFechaHoyISO = () => {
  const hoy = new Date()
  return hoy.toISOString().split('T')[0]
}

export const formatearFechaLegible = (fechaISO) => {
  if (!fechaISO) return ''
  const partes = fechaISO.split('-')
  if (partes.length !== 3) return fechaISO
  return `${partes[2]}/${partes[1]}/${partes[0]}`
}

export const generarMensajeWhatsappRecordatorio = (cita, paciente, profesionalNombre) => {
  const fecha = formatearFechaLegible(cita.fecha)
  const telClean = (paciente?.telefono || '').replace(/\s+/g, '').replace('+', '').replace(/-/g, '')
  
  const mensaje = `Hola ${paciente?.nombre || 'Paciente'}, te recordamos tu cita odontológica programada para el día ${fecha} a las ${cita.horaInicio} hrs en ${cita.box} con el/la ${profesionalNombre || 'Dr.'}.\n\nPor favor confirma tu asistencia respondiendo a este mensaje.`
  
  return `https://api.whatsapp.com/send?phone=${telClean}&text=${encodeURIComponent(mensaje)}`
}