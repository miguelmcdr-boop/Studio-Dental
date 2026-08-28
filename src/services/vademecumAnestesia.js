/**
 * Servicio de anestesia del vademécum (F7-02).
 *
 * Extraído de vademecumService.js para cumplir límites arquitectónicos.
 */

import { obtenerVademecum } from './vademecumService'

export const obtenerDosisAnestesia = () => {
  const vademecum = obtenerVademecum()

  return vademecum
    .filter(f =>
      f.familia === 'anestesico_amida' ||
      f.familia === 'anestesico_ester' ||
      f.familia === 'anestesico_topico'
    )
    .map(f => ({
      id: f.numero,
      nombre: f.nombre_generico,
      familia: f.familia,
      presentacion: f.presentacion,

      // F7-04: Valores directos desde SQL, sin cálculo derivado en JS
      dosisMaxAdulto_mgPorKg: f.dosis_max_adulto_mg_por_kg,
      dosisMaxPediatrico_mgPorKg: f.dosis_max_pediatrica_mg_por_kg,
      topeAbsolutoAdulto_mg: f.dosis_max_adulto_mg,
      topeAbsolutoPediatrico_mg: f.dosis_max_pediatrica_mg,

      contenidoPorUnidad_mg: f.contenido_por_unidad_mg,
      volumenPorUnidad_ml: f.volumen_por_unidad_ml,
      concentracion_mgPorMl: f.concentracion_mg_por_ml,

      posologiaPediatrica: f.posologia_pediatrica,
      contraindicaciones: f.contraindicaciones,
      notas: f.notas_especiales
    }))
}
