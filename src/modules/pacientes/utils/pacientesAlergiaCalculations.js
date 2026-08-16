/**
 * Lógica de cálculos de evaluación de alergias farmacológicas (F4-03e).
 *
 * Este archivo contiene la implementación completa de la evaluación de
 * incompatibilidades entre alergias del paciente y fármacos a prescribir,
 * usando la matriz de alergias cruzadas del vademécum v1.1 curado por
 * odontólogo (25 reglas de reactividad cruzada).
 *
 * El archivo `pacientesCalculations.js` actúa como re-export delgado
 * (wrapper) para preservar la compatibilidad de imports existentes.
 *
 * ESTRATEGIA DE DOBLE CAPA (F4-03e):
 * 1. Capa principal: consulta matriz desde vademecumService
 * 2. Capa de fallback: reglas legacy F1-04a (2 categorías hardcodeadas)
 *
 * REGLA DE SEGURIDAD CLÍNICA (Constitución, Cap. V.2):
 * Si alergias no informadas → tipo: 'sin_datos' (nunca null)
 */
import { vademecumService } from '../../../services/vademecumService'
import { normalizar } from '../../../utils/anestesiaCalculations'

/**
 * Detecta la familia farmacológica de un medicamento desde el vademécum.
 * Usa búsqueda normalizada (sin tildes, case-insensitive) para robustez.
 * 
 * @param {string} textoMedicamento - Texto del fármaco (ej: "Amoxicilina 500 mg")
 * @returns {string|null} Familia (ej: "penicilina") o null si no encontrado
 */
export const detectarFamiliaFarmaco = (textoMedicamento) => {
  if (!textoMedicamento || typeof textoMedicamento !== 'string') return null
  
  const textoNorm = normalizar(textoMedicamento)
  const vademecum = vademecumService.obtenerVademecum()
  
  // Buscar fármaco cuyo nombre normalizado incluya el texto (o viceversa)
  const farmaco = vademecum.find(f => {
    const nombreNorm = normalizar(f.nombre_generico || '')
    return nombreNorm.includes(textoNorm) || textoNorm.includes(nombreNorm)
  })
  
  return farmaco?.familia || null
}

/**
 * Detecta familias de alergias desde texto libre.
 * Parsea texto como "Alergia a Penicilina y AINEs" → ["penicilina", "aine"]
 * 
 * @param {string} textoAlergias - Texto libre de alergias
 * @returns {string[]} Lista de familias detectadas
 */
export const detectarFamiliasAlergia = (textoAlergias) => {
  if (!textoAlergias || typeof textoAlergias !== 'string') return []
  
  const textoNorm = normalizar(textoAlergias)
  const familiasDetectadas = []
  
  // Keywords por familia (ordenadas de más específico a más general)
  const KEYWORDS = {
    penicilina: ['penicilina', 'amoxicilina', 'ampicilina', 'betalactamico', 'betalactámicos'],
    cefalosporina: ['cefalosporina', 'cefadroxilo', 'cefalexina', 'cefuroximo', 'cefazolina'],
    lincosamida: ['clindamicina', 'lincomicina', 'lincosamida'],
    macrolido: ['azitromicina', 'claritromicina', 'eritromicina', 'macrolido'],
    nitroimidazol: ['metronidazol', 'tinidazol', 'nitroimidazol'],
    quinolona: ['ciprofloxacino', 'levofloxacino', 'moxifloxacino', 'quinolona'],
    tetraciclina: ['doxiciclina', 'minociclina', 'tetraciclina'],
    aine: ['ibuprofeno', 'ketoprofeno', 'ketorolaco', 'diclofenaco', 'naproxeno', 'dexketoprofeno', 'etoricoxib', 'celecoxib', 'aspirina', 'aine', 'aines'],
    paracetamol: ['paracetamol', 'acetaminofen'],
    opioide: ['tramadol', 'codeina', 'morfina', 'opioide'],
    corticoide: ['dexametasona', 'betametasona', 'prednisona', 'corticoide', 'esteroide'],
    antiseptico: ['clorhexidina', 'povidona', 'yodo', 'antiseptico'],
    anestesico_amida: ['lidocaina', 'mepivacaina', 'articaina', 'bupivacaina', 'prilocaina', 'amida'],
    anestesico_ester: ['benzocaina', 'tetracaina', 'procaina', 'ester'],
    antifungico_azol: ['fluconazol', 'ketoconazol', 'miconazol', 'azol', 'antifungico'],
    antiviral: ['aciclovir', 'valaciclovir', 'antiviral']
  }
  
  for (const [familia, keywords] of Object.entries(KEYWORDS)) {
    if (keywords.some(kw => textoNorm.includes(normalizar(kw)))) {
      familiasDetectadas.push(familia)
    }
  }
  
  return familiasDetectadas
}

/**
 * Genera mensaje dinámico según resultado de matriz de alergias cruzadas.
 * 
 * @param {string} familiaAlergia - Familia de la alergia del paciente
 * @param {string} familiaFarmaco - Familia del fármaco a prescribir
 * @param {Object} resultado - Resultado de evaluarAlergiaCruzada()
 * @returns {Object} {mensaje, sugerencia}
 */
export const generarMensajeDinamico = (familiaAlergia, familiaFarmaco, resultado) => {
  const porcentaje = resultado.porcentaje_cruzado ? ' (' + resultado.porcentaje_cruzado + ')' : ''
  const nota = resultado.nota_clinica ? ' ' + resultado.nota_clinica : ''
  
  const mensaje = resultado.severidad === 'critica'
    ? '⚠️ ¡ALERTA GRAVE! Reactividad cruzada entre ' + familiaAlergia + ' y ' + familiaFarmaco + porcentaje + '.' + nota
    : '⚠️ Precaución: posible reactividad cruzada entre ' + familiaAlergia + ' y ' + familiaFarmaco + porcentaje + '.' + nota
  
  // Sugerencias por familia (las más comunes)
  const SUGERENCIAS = {
    penicilina: 'Alternativas seguras: Clindamicina, Azitromicina o Claritromicina.',
    aine: 'Alternativa segura: Paracetamol 500-1000 mg o Clonixinato de Lisina.',
    cefalosporina: 'Considerar macrólidos (Azitromicina/Claritromicina) o lincosamidas (Clindamicina).',
    lincosamida: 'Considerar macrólidos o fluorquinolonas según indicación.',
    macrolido: 'Considerar lincosamidas o fluorquinolonas según indicación.'
  }
  
  const sugerencia = SUGERENCIAS[familiaAlergia] || 'Consulte alternativas con familia farmacológica diferente.'
  
  return { mensaje, sugerencia }
}

/**
 * Reglas legacy F1-04a (fallback si vademecumService falla).
 * Preservadas para compatibilidad y como respaldo.
 */
export const evaluarIncompatibilidadLegacy = (textoMedicamento, alergiasTexto) => {
  const medLower = String(textoMedicamento || '').toLowerCase()
  const alergiasLower = String(alergiasTexto || '').toLowerCase()

  if ((alergiasLower.includes('penicilina') || alergiasLower.includes('amoxicilina') || alergiasLower.includes('betalactamico')) &&
      (medLower.includes('amoxicilina') || medLower.includes('penicilina'))) {
    return {
      tipo: 'critica',
      mensaje: '⚠️ ¡ALERTA GRAVE! Paciente registrado con alergia a Penicilinas / Betalactámicos.',
      sugerencia: 'Alternativa segura: Clindamicina 300 mg o Azitromicina 500 mg.'
    }
  }

  if ((alergiasLower.includes('aine') || alergiasLower.includes('ibuprofeno') || alergiasLower.includes('aspirina')) &&
      (medLower.includes('ibuprofeno') || medLower.includes('ketoprofeno') || medLower.includes('ketorolaco') || medLower.includes('diclofenaco') || medLower.includes('naproxeno'))) {
    return {
      tipo: 'advertencia',
      mensaje: '⚠️ ¡ALERTA DE ALERGIA! Paciente alérgico a AINEs.',
      sugerencia: 'Alternativa segura: Paracetamol 500 mg / 1 g o Clonixinato de Lisina.'
    }
  }

  return null
}
