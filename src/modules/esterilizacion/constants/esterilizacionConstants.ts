/**
 * Constantes y Parámetros Normados para Esterilización SEREMI / Acreditación
 */

export interface ProgramaEsterilizacion {
  id: string
  nombre: string
  tempEsperada: number
  tiempoEsperado: number
  presionEsperada: number
}

export interface ResultadoBowieDick {
  id: string
  nombre: string
}

export interface CargaEsterilizacion {
  id: number | string
  lote: string
  equipo: string
  programa: string
  fecha: string
  hora: string
  temperatura: number
  presion: number
  tiempoMinutos: number
  responsable: string
  indicadorQuimico: string
  indicadorBiologico: string
  contenido: string
  estado: string
}

export interface PruebaBiologica {
  id: number | string
  loteAsociado: string
  equipo: string
  fechaIncubacion: string
  horaIncubacion: string
  marcaAmpolla: string
  horasRequeridas: number
  resultado: string
  responsableLectura: string
  observacion: string
}

export interface TestBowieDick {
  id: number | string
  fecha: string
  equipo: string
  resultado: string
  operador: string
  observacion: string
}

export const EQUIPOS_AUTOCLAVE: readonly string[] = [
  'Autoclave 1 - Cristófoli 21L (Box 1)',
  'Autoclave 2 - Tuttnauer 2340M (Central)',
  'Autoclave 3 - W&H Lisa (Quirófano)'
]

export const PROGRAMAS_ESTERILIZACION: readonly ProgramaEsterilizacion[] = [
  { id: '134_4min', nombre: '134°C - 4 min (Instrumental Embolsado / Cajas)', tempEsperada: 134, tiempoEsperado: 4, presionEsperada: 2.1 },
  { id: '121_20min', nombre: '121°C - 20 min (Textiles / Gomas / Plásticos)', tempEsperada: 121, tiempoEsperado: 20, presionEsperada: 1.1 },
  { id: '134_18min', nombre: '134°C - 18 min (Priones / Cirugía Compleja)', tempEsperada: 134, tiempoEsperado: 18, presionEsperada: 2.1 }
]

export const INDICADORES_QUIMICOS: readonly string[] = [
  'Clase 4 (Multivariable - Viraje Correcto)',
  'Clase 5 (Integrador - Viraje Correcto)',
  'Clase 6 (Emulador - Viraje Correcto)',
  'Fallo de Viraje (Carga No Conforme)'
]

export const INDICADORES_BIOLOGICOS: readonly string[] = [
  'Biológico Negativo (Carga Conforme / Aprobado)',
  'Biológico Positivo (Carga Contaminada / RECHAZADO)',
  'Pendiente de Lectura (En Incubación 24-48h)'
]

export const RESULTADOS_BOWIE_DICK: readonly ResultadoBowieDick[] = [
  { id: 'aprobado', nombre: 'Aprobado (Viraje Homogéneo - Pre-vacío OK)' },
  { id: 'rechazado', nombre: 'Rechazado (Fallo de penetración de vapor / Fuga de aire)' }
]

export const CARGAS_DEFAULT: readonly CargaEsterilizacion[] = [
  {
    id: 1,
    lote: 'LOTE-20260803-01',
    equipo: 'Autoclave 1 - Cristófoli 21L (Box 1)',
    programa: '134°C - 4 min (Instrumental Embolsado / Cajas)',
    fecha: '03/08/2026',
    hora: '09:15',
    temperatura: 134,
    presion: 2.1,
    tiempoMinutos: 4,
    responsable: 'Dra. María Paz Silva',
    indicadorQuimico: 'Clase 5 (Integrador - Viraje Correcto)',
    indicadorBiologico: 'Biológico Negativo (Carga Conforme / Aprobado)',
    contenido: '3 Cajas Cirugía Implantes, 5 Kits Operatoria, 10 Mangos Bisturí',
    estado: 'Conforme'
  }
]

export const PRUEBAS_BIOLOGICAS_DEFAULT: readonly PruebaBiologica[] = [
  {
    id: 101,
    loteAsociado: 'LOTE-20260803-01',
    equipo: 'Autoclave 1 - Cristófoli 21L (Box 1)',
    fechaIncubacion: '03/08/2026',
    horaIncubacion: '09:30',
    marcaAmpolla: '3M Attest 1262',
    horasRequeridas: 24,
    resultado: 'Aprobado',
    responsableLectura: 'Dra. María Paz Silva',
    observacion: 'Lectura final a las 24 hrs. Ampolla control cambió a amarillo (positivo control), ampolla muestra permaneció púrpura (negativo estéril).'
  }
]

export const TEST_BOWIE_DICK_DEFAULT: readonly TestBowieDick[] = [
  {
    id: 201,
    fecha: '03/08/2026',
    equipo: 'Autoclave 1 - Cristófoli 21L (Box 1)',
    resultado: 'Aprobado (Viraje Homogéneo - Pre-vacío OK)',
    operador: 'TENS Esterilización',
    observacion: 'Prueba de penetración de vapor matutina conforme.'
  }
]
