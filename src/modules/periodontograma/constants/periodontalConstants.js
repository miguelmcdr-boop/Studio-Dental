/**
 * Constantes del Dominio Periodontal
 * Define nomenclaturas anatómicas, límites clínicos y clasificación anatómica de raíces.
 */

export const ARCADA_SUPERIOR = [
  '1.8','1.7','1.6','1.5','1.4','1.3','1.2','1.1',
  '2.1','2.2','2.3','2.4','2.5','2.6','2.7','2.8'
]

export const ARCADA_INFERIOR = [
  '4.8','4.7','4.6','4.5','4.4','4.3','4.2','4.1',
  '3.1','3.2','3.3','3.4','3.5','3.6','3.7','3.8'
]

export const SITIOS_VESTIBULAR = [
  { id: 'mv', label: 'MV' },
  { id: 'v',  label: 'V' },
  { id: 'dv', label: 'DV' }
]

export const SITIOS_PALATINO_LINGUAL = [
  { id: 'mp', label: 'MP/ML' },
  { id: 'p',  label: 'P/L' },
  { id: 'dp', label: 'DP/DL' }
]

export const SITIOS_TOTALES = [...SITIOS_VESTIBULAR, ...SITIOS_PALATINO_LINGUAL]

/**
 * Nomenclatura FDI de piezas multirradiculares donde la evaluación de Furca es clínicamente válida:
 * Molares superiores e inferiores, y primeros premolares superiores (1.4, 2.4).
 */
export const DIENTES_MULTIRRADICULARES = [
  '1.8','1.7','1.6','1.4',
  '2.4','2.6','2.7','2.8',
  '3.8','3.7','3.6',
  '4.6','4.7','4.8'
]

export const LIMITES_SONDAJE = {
  MIN: 0,
  MAX: 12,
  UMBRAL_SACO_MODERADO: 4,
  UMBRAL_SACO_SEVERO: 6
}

export const OPCIONES_MOVILIDAD = ['0', '1', '2', '3']
export const OPCIONES_FURCA = ['0', '1', '2', '3']