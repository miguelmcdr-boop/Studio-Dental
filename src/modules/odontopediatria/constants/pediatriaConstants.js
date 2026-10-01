/**
 * Constantes para Odontopediatría
 */

// Piezas temporales / deciduas (Nomenclatura FDI)
export const TEMPORAL_SUPERIOR = ['5.5', '5.4', '5.3', '5.2', '5.1', '6.1', '6.2', '6.3', '6.4', '6.5']
export const TEMPORAL_INFERIOR = ['8.5', '8.4', '8.3', '8.2', '8.1', '7.1', '7.2', '7.3', '7.4', '7.5']

export const ESCALA_FRANKL = [
  { grado: 1, titulo: 'Definitivamente Negativo (- -)', desc: 'Rechazo del tratamiento, llanto fuerte, temor extremo o agresividad.', color: 'bg-red-100 text-red-900 border-red-300' },
  { grado: 2, titulo: 'Negativo (-)', desc: 'Poco cooperador, actitud negativa, timidez excesiva o llanto monótono.', color: 'bg-orange-100 text-orange-900 border-orange-300' },
  { grado: 3, titulo: 'Positivo (+)', desc: 'Acepta el tratamiento de forma reservada, sigue instrucciones con cautela.', color: 'bg-blue-100 text-blue-900 border-blue-300' },
  { grado: 4, titulo: 'Definitivamente Positivo (+ +)', desc: 'Excelente relación con el odontólogo, disfruta de la atención y colabora al 100%.', color: 'bg-emerald-100 text-emerald-900 border-emerald-300' }
]

export const CARAS_OLEARY = ['mesial', 'vestibular', 'distal', 'palatinoLingual']