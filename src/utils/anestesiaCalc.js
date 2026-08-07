/**
 * Tabla de dosis máxima por kg y contenido de mg por tubo, según anestésico.
 * Fuente: fichas técnicas / referencias ADHA estándar de anestesia local odontológica.
 */
const DOSIS_POR_ANESTESICO = {
  lidocaina: { mgPorKg: 4.4, mgPorTubo: 36 },
  mepivacaina: { mgPorKg: 6.6, mgPorTubo: 54 },
  articaina: { mgPorKg: 7.0, mgPorTubo: 72 },
  bupivacaina: { mgPorKg: 1.3, mgPorTubo: 9 },
}

/**
 * Calcula la dosis máxima (mg) y el número máximo de tubos de anestesia local
 * seguros para un paciente, según su peso corporal y el anestésico elegido.
 *
 * REGLA DE SEGURIDAD CLÍNICA (Constitución de Arquitectura, Cap. V.2 —
 * "Fail-Safe Clinical Default"): si el peso no es un dato numérico válido
 * y positivo, o si el tipo de anestésico no está en la tabla de referencia,
 * la función NUNCA debe asumir un valor por defecto ni calcular una dosis
 * "aproximada". Debe devolver un estado explícito que bloquee el uso del
 * resultado hasta que un profesional verifique el dato manualmente.
 *
 * @param {number|string} peso - Peso del paciente en kg.
 * @param {string} tipoAnestesico - Clave del anestésico (ver DOSIS_POR_ANESTESICO).
 * @returns {{estado: 'OK'|'DATOS_INCOMPLETOS'|'ANESTESICO_DESCONOCIDO', mensaje: string|null, mgMax: string|null, tubos: number|null}}
 */
export const calcularTubosAnestesia = (peso, tipoAnestesico) => {
  const pesoNumerico = parseFloat(peso)
  const pesoValido = Number.isFinite(pesoNumerico) && pesoNumerico > 0

  if (!pesoValido) {
    return {
      estado: 'DATOS_INCOMPLETOS',
      mensaje: 'Peso no informado o inválido — Verificación manual requerida antes de administrar anestesia.',
      mgMax: null,
      tubos: null,
    }
  }

  const dosis = DOSIS_POR_ANESTESICO[tipoAnestesico]
  if (!dosis) {
    return {
      estado: 'ANESTESICO_DESCONOCIDO',
      mensaje: `Tipo de anestésico "${tipoAnestesico}" no reconocido — Verificación manual requerida.`,
      mgMax: null,
      tubos: null,
    }
  }

  const mgMaximo = pesoNumerico * dosis.mgPorKg
  return {
    estado: 'OK',
    mensaje: null,
    mgMax: mgMaximo.toFixed(0),
    tubos: Math.floor(mgMaximo / dosis.mgPorTubo),
  }
}