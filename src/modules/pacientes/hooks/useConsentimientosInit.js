import { useState, useEffect } from 'react'
import { configuracionStorageService } from '../../configuracion/services/configuracionStorageService'
import { CLINICA_DEFAULT } from '../../configuracion/constants/configuracionConstants'
import { pacientesStorageService } from '../services/pacientesStorageService'
import { createLogger } from '../../../services/logger'

const log = createLogger('useConsentimientosInit')

/**
 * Hook para inicialización de ConsentimientosSection (M4b).
 *
 * Responsabilidades:
 * - Cargar configuración de clínica desde localStorage
 * - Cargar papelera de archivos
 * - Limpiar consentimientos legacy de localStorage
 *
 * @param {string} pacienteId - UUID del paciente
 * @param {Function} cargarPapelera - función para cargar papelera
 * @returns {Object} { datosClinica, setDatosClinica }
 */
export const useConsentimientosInit = (pacienteId, cargarPapelera) => {
  const [datosClinica, setDatosClinica] = useState(CLINICA_DEFAULT)

  useEffect(() => {
    // Cargar configuración de clínica
    try {
      const config = configuracionStorageService.obtenerClinica(CLINICA_DEFAULT)
      if (config) setDatosClinica(config)
    } catch (e) {
      log.warn('Error cargando configuración de clínica:', e)
    }

    // Cargar papelera
    cargarPapelera()

    // M4b: Limpieza de localStorage legacy (una sola vez)
    try {
      const legacyKey = `consentimientos_${pacienteId}`
      const legacyData = pacientesStorageService.obtenerItem(legacyKey, [])
      if (legacyData && legacyData.length > 0) {
        log.info(`Limpiando ${legacyData.length} consentimientos legacy de localStorage`)
        pacientesStorageService.guardarItem(legacyKey, [])
      }
    } catch (e) {
      log.warn('Error limpiando localStorage legacy:', e)
    }
  }, [cargarPapelera, pacienteId])

  return { datosClinica, setDatosClinica }
}
