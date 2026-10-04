import { useState, useEffect } from 'react'
import type React from 'react'
import { configuracionStorageService, type DatosClinicaConfig } from '../../../../modules/configuracion/services/configuracionStorageService'
import { CLINICA_DEFAULT, type ClinicaConfig } from '../../../../modules/configuracion/constants/configuracionConstants'
import { pacientesStorageService } from '../services/pacientesStorageService'
import { createLogger } from '../../../../services/logger'

const log = createLogger('useConsentimientosInit')

export type { ClinicaConfig }

export interface UseConsentimientosInitReturn {
  datosClinica: ClinicaConfig
  setDatosClinica: React.Dispatch<React.SetStateAction<ClinicaConfig>>
}

/**
 * Hook para inicialización de ConsentimientosSection (M4b).
 *
 * Responsabilidades:
 * - Cargar configuración de clínica desde localStorage
 * - Cargar papelera de archivos
 * - Limpiar consentimientos legacy de localStorage
 *
 * @param pacienteId - UUID del paciente
 * @param cargarPapelera - función para cargar papelera
 * @returns {UseConsentimientosInitReturn}
 */
export const useConsentimientosInit = (
  pacienteId: string | number,
  cargarPapelera: () => Promise<void> | void
): UseConsentimientosInitReturn => {
  const [datosClinica, setDatosClinica] = useState<ClinicaConfig>(CLINICA_DEFAULT)

  useEffect(() => {
    // Cargar configuración de clínica
    try {
      const config = configuracionStorageService.obtenerClinica(CLINICA_DEFAULT as unknown as DatosClinicaConfig)
      if (config) {
        setDatosClinica(prev => ({
          ...prev,
          ...config,
          nombreClinica: config.nombreClinica ?? prev.nombreClinica,
          razonSocial: config.razonSocial ?? prev.razonSocial,
          rutClinica: config.rutClinica ?? prev.rutClinica,
          direccion: config.direccion ?? prev.direccion,
          ciudad: config.ciudad ?? prev.ciudad,
          telefono: config.telefono ?? prev.telefono,
          emailContacto: config.emailContacto ?? prev.emailContacto,
          logoUrl: config.logoUrl ?? prev.logoUrl
        }))
      }
    } catch (e) {
      log.warn('Error cargando configuración de clínica:', e)
    }

    // Cargar papelera
    cargarPapelera()

    // M4b: Limpieza de localStorage legacy (una sola vez)
    try {
      const legacyKey = `consentimientos_${pacienteId}`
      const legacyData = pacientesStorageService.obtenerItem<unknown[]>(legacyKey, [])
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
