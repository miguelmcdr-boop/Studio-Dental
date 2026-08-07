import { VADEMECUM_ODONTOLOGICO } from '../../../data/vademecum'

export const obtenerDescuentoConvenio = (nombreConvenio) => {
  try {
    const saved = localStorage.getItem('studio_dental_finanzas_convenios')
    if (!saved) return 0
    const convenios = JSON.parse(saved)
    const encontrado = convenios.find(c => 
      c.nombre.toLowerCase().includes(nombreConvenio.toLowerCase()) ||
      c.id.toLowerCase().includes(nombreConvenio.toLowerCase())
    )
    return encontrado ? encontrado.descuentoDefecto : 0
  } catch (e) {
    return 0
  }
}

/**
 * Evalúa si un medicamento a recetar es potencialmente incompatible con
 * las alergias registradas del paciente, dentro de las categorías cubiertas
 * por esta validación (Penicilinas/Betalactámicos y AINEs).
 *
 * REGLA DE SEGURIDAD CLÍNICA (Constitución, Cap. V.2 — "Fail-Safe Clinical
 * Default"): si el campo de alergias del paciente no está informado, la
 * función NUNCA debe retornar el mismo valor (`null`) que usa para decir
 * "se verificó y no hay incompatibilidad". Ausencia de dato ≠ ausencia de
 * riesgo. Se retorna un estado explícito `tipo: 'sin_datos'` para que la
 * UI le exija al profesional verificar manualmente antes de prescribir.
 *
 * Nota de alcance: esta validación automática cubre únicamente 2 categorías
 * de fármacos (Penicilinas/Betalactámicos y AINEs), no el vademécum completo.
 * Cuando las alergias SÍ están informadas pero el fármaco buscado cae fuera
 * de esas 2 categorías, la función retorna `null` de forma legítima (fue
 * verificado contra lo que sabe cubrir). El aviso de que la cobertura es
 * limitada se muestra como texto fijo en la UI (RecetasSection.jsx), no
 * como una alerta por cada búsqueda, para evitar fatiga de alertas.
 *
 * @param {string} textoMedicamento - Texto del fármaco que se está por recetar.
 * @param {string} alergiasTexto - Texto libre de alergias registradas del paciente.
 * @returns {{tipo: 'critica'|'advertencia'|'sin_datos', mensaje: string, sugerencia: string}|null}
 */
export const evaluarIncompatibilidadFarmaco = (textoMedicamento, alergiasTexto) => {
  const medLower = String(textoMedicamento || '').toLowerCase()
  const alergiasLimpias = String(alergiasTexto || '').trim()

  if (!alergiasLimpias) {
    return {
      tipo: 'sin_datos',
      mensaje: '⚠️ Alergias no registradas para este paciente.',
      sugerencia: 'Verifique manualmente los antecedentes alérgicos con el paciente antes de prescribir.'
    }
  }

  const alergiasLower = alergiasLimpias.toLowerCase()

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