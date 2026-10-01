/**
 * Datos de respaldo v1.0 para anestésicos (F7-02).
 *
 * Extraído de anestesiaCalculations.js para cumplir límites arquitectónicos.
 * Fallback si vademecumService retorna vacío o no está disponible.
 */

export const DOSIS_RESPALDO_V10 = {
  lidocaina: {
    numero: 1,
    nombreGenerico: 'Lidocaína 2% + Epinefrina 1:100.000',
    familia: 'anestesico_amida',
    mgPorKgAdulto: 4.4,
    topeAbsolutoAdulto: 300,
    mgPorKgPediatrico: 4.4,
    topeAbsolutoPediatrico: 300,
    mgPorTubo: 36,
    volumenPorTubo: 1.8,
    concentracionMgPorMl: 20,
    tieneVasoconstrictor: true,
    concentracionVasoconstrictor: 0.01,
    contraindicaciones: 'Bloqueo AV severo, feocromocitoma, alergia amidas, sulfito-sensibilidad',
    notasEspeciales: 'Embarazo: de elección (máx 2 tubos). Cardiopatías: limitar Epi a 0.04 mg.'
  },
  mepivacaina: {
    numero: 2,
    nombreGenerico: 'Mepivacaína 3% sin vasoconstrictor',
    familia: 'anestesico_amida',
    mgPorKgAdulto: 6.6,
    topeAbsolutoAdulto: 400,
    mgPorKgPediatrico: 4.4,
    topeAbsolutoPediatrico: 300,
    mgPorTubo: 54,
    volumenPorTubo: 1.8,
    concentracionMgPorMl: 30,
    tieneVasoconstrictor: false,
    concentracionVasoconstrictor: 0,
    contraindicaciones: 'Bloqueo AV, disfunción hepática severa',
    notasEspeciales: 'Elección en hipertensos no controlados y cardiopatías'
  },
  articaina: {
    numero: 3,
    nombreGenerico: 'Articaína 4% + Epinefrina 1:100.000',
    familia: 'anestesico_amida',
    mgPorKgAdulto: 7.0,
    topeAbsolutoAdulto: 500,
    mgPorKgPediatrico: 7.0,
    topeAbsolutoPediatrico: 500,
    mgPorTubo: 72,
    volumenPorTubo: 1.8,
    concentracionMgPorMl: 40,
    tieneVasoconstrictor: true,
    concentracionVasoconstrictor: 0.01,
    contraindicaciones: 'Metahemoglobinemia, déficit colinesterasa plasmática, asma por sulfitos',
    notasEspeciales: 'Contraindicado <4 años. Alta difusibilidad ósea.'
  },
  bupivacaina: {
    numero: 4,
    nombreGenerico: 'Bupivacaína 0.5% + Epinefrina 1:200.000',
    familia: 'anestesico_amida',
    mgPorKgAdulto: 1.3,
    topeAbsolutoAdulto: 90,
    mgPorKgPediatrico: null,
    topeAbsolutoPediatrico: null,
    mgPorTubo: 9,
    volumenPorTubo: 1.8,
    concentracionMgPorMl: 5,
    tieneVasoconstrictor: true,
    concentracionVasoconstrictor: 0.005,
    contraindicaciones: 'Cardiopatía isquémica severa, niños <12 años, arritmias ventriculares',
    notasEspeciales: 'Larga duración para cirugías complejas'
  }
}
