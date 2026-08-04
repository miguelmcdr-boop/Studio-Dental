/**
 * Constantes y Diagnósticos Normados GES/AUGE y Urgencias
 */

export const PATOLOGIAS_GES_ODONTO = [
  {
    id: 'urgencia_ambulatoria',
    nombre: 'Urgencia Odontológica Ambulatoria',
    codigo: 'GES-01',
    descripcion: 'Atención inmediata para dolor agudo, infección, hemorragia o traumatismo dentoalveolar.'
  },
  {
    id: 'salud_60_anos',
    nombre: 'Salud Oral Integral del Adulto de 60 Años',
    codigo: 'GES-02',
    descripcion: 'Atención odontológica integral a personas de 60 años (cumplidos).'
  },
  {
    id: 'embarazada',
    nombre: 'Salud Oral Integral de la Embarazada',
    codigo: 'GES-03',
    descripcion: 'Atención odontológica integral durante todo el período de gestación.'
  },
  {
    id: 'fisura_labiopalatina',
    nombre: 'Tratamiento de Fisura Labiopalatina',
    codigo: 'GES-04',
    descripcion: 'Rehabilitación e intervenciones en pacientes con fisura labionasopalatina.'
  }
]

export const CATEGORIAS_TRIAGE_URGENCIA = [
  { id: 'C1', nombre: '🔴 C1 - Urgencia Vital / Hemorragia Severa', color: 'bg-red-100 text-red-900 border-red-300' },
  { id: 'C2', nombre: '🟠 C2 - Dolor Severo / Absceso / Traumatismo', color: 'bg-amber-100 text-amber-900 border-amber-300' },
  { id: 'C3', nombre: '🟡 C3 - Dolor Moderado / Pulpitis / Fractura', color: 'bg-yellow-100 text-yellow-900 border-yellow-300' },
  { id: 'C4', nombre: '🟢 C4 - Molestia Leve / Desprendimiento Tapón', color: 'bg-emerald-100 text-emerald-900 border-emerald-300' }
]

export const DIAGNOSTICOS_URGENCIA_COMMON = [
  'K04.0 - Pulpitis Aguda Irreversible',
  'K04.7 - Absceso Periapical sin Fístula',
  'K05.2 - Periodontitis Aguda / Absceso Periodontal',
  'S02.5 - Fractura Dientaría / Traumatismo Dentoalveolar',
  'K05.3 - Pericoronaritis Aguda (Tercer Molar)',
  'K10.3 - Alveolitis Post-Exodoncia',
  'K08.1 - Pérdida de Diente por Traumatismo / Exodoncia Urgente'
]