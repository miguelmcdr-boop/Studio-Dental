import { finanzasStorageService } from '../../finanzas/services/finanzasStorageService'
import { vademecumService } from '../../../services/vademecumService'
import {
  detectarFamiliaFarmaco,
  detectarFamiliasAlergia,
  generarMensajeDinamico,
  evaluarIncompatibilidadLegacy
} from './pacientesAlergiaCalculations'

export const obtenerDescuentoConvenio = (nombreConvenio) => {
  try {
    const convenios = finanzasStorageService.obtenerConvenios([])
    if (!Array.isArray(convenios) || convenios.length === 0) return 0
    
    const encontrado = convenios.find(c => 
      c.nombre.toLowerCase().includes(nombreConvenio.toLowerCase()) ||
      c.id.toLowerCase().includes(nombreConvenio.toLowerCase())
    )
    return encontrado ? encontrado.descuentoDefecto : 0
  } catch {
    return 0
  }
}

/**
 * Evalúa si un medicamento a recetar es potencialmente incompatible con
 * las alergias registradas del paciente.
 *
 * ESTRATEGIA DE DOBLE CAPA (F4-03e):
 * 1. Capa principal: consulta matriz de alergias cruzadas desde vademecumService
 * 2. Capa de fallback: reglas legacy F1-04a (si vademecumService falla)
 *
 * REGLA DE SEGURIDAD CLÍNICA (Constitución, Cap. V.2):
 * Si alergias no informadas → tipo: 'sin_datos' (nunca null)
 *
 * @param {string} textoMedicamento - Texto del fármaco que se está por recetar.
 * @param {string} alergiasTexto - Texto libre de alergias registradas del paciente.
 * @returns {{tipo: 'critica'|'advertencia'|'sin_datos', mensaje: string, sugerencia: string}|null}
 */
/**
 * F4-03h: Obtiene hasta 3 fármacos del vademécum que son seguros para el paciente
 * (sin reactividad cruzada con sus alergias).
 */
const obtenerAlternativasSeguras = (familiasAlergia) => {
  try {
    const vademecum = vademecumService.obtenerVademecum() || []
    const alergiasCruzadas = vademecumService.obtenerAlergiasCruzadas() || []
    
    // Construir set de familias incompatibles para todas las alergias del paciente
    const familiasIncompatibles = new Set()
    for (const regla of alergiasCruzadas) {
      if (familiasAlergia.includes(regla.familia_alergia) && 
          (regla.severidad === 'critica' || regla.severidad === 'advertencia')) {
        familiasIncompatibles.add(regla.familia_farmaco)
      }
    }
    
    // Filtrar fármacos seguros (que no están en familias incompatibles)
    const seguros = vademecum.filter(f => 
      f.activo !== false && 
      !familiasIncompatibles.has(f.familia) &&
      f.familia
    )
    
    // Agrupar por familia para variedad (1 por familia, máx 3)
    const familiasVistas = new Set()
    const alternativas = []
    for (const f of seguros) {
      if (!familiasVistas.has(f.familia) && alternativas.length < 3) {
        familiasVistas.add(f.familia)
        alternativas.push({
          nombre: f.nombre_generico || f.nombreGenerico || '',
          familia: f.familia || '',
          familia_legible: (f.familia || '').replace(/_/g, ' ')
        })
      }
    }
    return alternativas
  } catch {
    return []
  }
}

export const evaluarIncompatibilidadFarmaco = (textoMedicamento, alergiasTexto) => {
  const alergiasLimpias = String(alergiasTexto || '').trim()

  // Fail-safe: si alergias no informadas
  if (!alergiasLimpias) {
    return {
      tipo: 'sin_datos',
      mensaje: '⚠️ Alergias no registradas para este paciente.',
      sugerencia: 'Verifique manualmente los antecedentes alérgicos con el paciente antes de prescribir.'
    }
  }

  // Intentar detección vía vademecumService (matriz de alergias cruzadas)
  try {
    const familiaFarmaco = detectarFamiliaFarmaco(textoMedicamento)
    
    if (familiaFarmaco) {
      const familiasAlergia = detectarFamiliasAlergia(alergiasLimpias)
      
      // Consultar matriz de alergias cruzadas para cada familia detectada
      for (const familiaAlergia of familiasAlergia) {
        const resultado = vademecumService.evaluarAlergiaCruzada(familiaAlergia, familiaFarmaco)
        
        if (resultado.hayIncompatibilidad) {
          const { mensaje, sugerencia } = generarMensajeDinamico(familiaAlergia, familiaFarmaco, resultado)
          const alternativas = obtenerAlternativasSeguras(familiasAlergia)
          return {
            tipo: resultado.severidad === 'critica' ? 'critica' : 'advertencia',
            mensaje,
            sugerencia,
            familiaFarmaco,
            familiaAlergia,
            porcentajeCruzado: resultado.porcentajeCruzado || null,
            notaClinica: resultado.notaClinica || resultado.nota_clinica || null,
            alternativas
          }
        }
      }
    }
  } catch (error) {
    // vademecumService falló, usar fallback legacy
    console.warn('[pacientesCalculations] vademecumService falló, usando reglas legacy:', error?.message)
  }

  // Fallback: reglas legacy F1-04a (2 categorías hardcodeadas)
  return evaluarIncompatibilidadLegacy(textoMedicamento, alergiasLimpias)
}

export { obtenerAlternativasSeguras }
