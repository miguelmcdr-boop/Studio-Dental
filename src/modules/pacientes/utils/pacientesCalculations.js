import { VADEMECUM_ODONTOLOGICO } from '../../../data/vademecum'

export const obtenerDescuentoConvenio = (nombreConvenio) => {
  try {
    const saved = localStorage.getItem('finanzas_config_convenios')
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

export const evaluarIncompatibilidadFarmaco = (textoMedicamento, alergiasTexto = '') => {
  const alergiasLower = alergiasTexto.toLowerCase()
  const medLower = textoMedicamento.toLowerCase()

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