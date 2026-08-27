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
    .map(f => {
      // F7-02: Calcular dosisMaxAdulto_mgPorKg desde tope absoluto (peso estándar 70kg)
      // Esto corrige el bug de usar dosis_max_pediatrica_mg_por_kg como adulto
      const topeAbsolutoAdulto_mg = f.dosis_max_adulto_mg || null
      const dosisMaxAdulto_mgPorKg = topeAbsolutoAdulto_mg 
        ? topeAbsolutoAdulto_mg / 70  // Peso estándar adulto
        : null

      return {
        id: f.numero,
        nombre: f.nombre_generico,
        familia: f.familia,
        presentacion: f.presentacion,
        
        // F7-02: Nombres con unidades explícitas
        dosisMaxAdulto_mgPorKg,
        dosisMaxPediatrico_mgPorKg: f.dosis_max_pediatrica_mg_por_kg,
        topeAbsolutoAdulto_mg,
        topeAbsolutoPediatrico_mg: null,  // No hay columna en SQL
        
        contenidoPorUnidad_mg: f.contenido_por_unidad_mg,
        volumenPorUnidad_ml: f.volumen_por_unidad_ml,
        concentracion_mgPorMl: f.concentracion_mg_por_ml,
        
        posologiaPediatrica: f.posologia_pediatrica,
        contraindicaciones: f.contraindicaciones,
        notas: f.notas_especiales
      }
    })
}
