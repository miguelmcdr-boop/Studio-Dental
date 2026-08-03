/**
 * Esquema y Modelo de Datos Periodontal
 * Contrato de datos para cada pieza dental y estructura para el historial evolutivo por controles.
 */

export const crearPiezaVaciaSchema = () => ({
  sondaje: { mv: '', v: '', dv: '', mp: '', p: '', dp: '' },
  recesion: { mv: '', v: '', dv: '', mp: '', p: '', dp: '' },
  sangrado: { mv: false, v: false, dv: false, mp: false, p: false, dp: false },
  placa: { mv: false, v: false, dv: false, mp: false, p: false, dp: false },
  supuracion: { mv: false, v: false, dv: false, mp: false, p: false, dp: false },
  movilidad: '0',
  furca: '0',
  implante: false,
  ausente: false,
  // Extensibilidad futura
  keratinizedGingiva: { v: '', p: '' }
})

export const crearControlPeriodontalSchema = (id = Date.now(), observacion = 'Control Inicial') => ({
  id,
  fecha: new Date().toLocaleDateString('es-CL'),
  observacion,
  piezas: {}
})