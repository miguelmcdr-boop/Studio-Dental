import { useState } from 'react'
import {
  ConsentimientoImprimible,
  type ConsentimientoDoc,
  type PacienteConsentimientoRef,
  type DatosClinicaRef,
  type UserProfileRef
} from '../components/ConsentimientoImprimible'
import {
  generarPDFDesdeComponente,
  respaldarConsentimientoEnR2,
  descargarConsentimientoDesdeR2,
  type RespaldoConsentimientoResult
} from '../services/consentimientosPDFService'
import { imprimirConsentimientoAislado } from '../services/consentimientosPrintService'
import { createLogger } from '../../../../services/logger'

const log = createLogger('useConsentimientosPDF')

export interface UseConsentimientosPDFReturn {
  generandoPDF: boolean
  consentimientoParaImprimir: ConsentimientoDoc | null
  generarYSubirPDF: (consentimiento: ConsentimientoDoc, metadata?: Record<string, unknown>) => Promise<RespaldoConsentimientoResult | null>
  descargarPDF: (
    consentimiento: ConsentimientoDoc,
    actualizarConsentimiento?: (id: string | number | undefined, data: { r2ArchivoId: string; r2ObjectKey: string }) => void
  ) => Promise<boolean>
  imprimir: (consentimiento: ConsentimientoDoc) => void
}

export const useConsentimientosPDF = (
  paciente: PacienteConsentimientoRef,
  userProfile?: UserProfileRef,
  datosClinica?: DatosClinicaRef
): UseConsentimientosPDFReturn => {
  const [generandoPDF, setGenerandoPDF] = useState<boolean>(false)
  const [consentimientoParaImprimir, setConsentimientoParaImprimir] = useState<ConsentimientoDoc | null>(null)

  /**
   * Genera PDF del consentimiento y lo sube a R2.
   */
  const generarYSubirPDF = async (
    consentimiento: ConsentimientoDoc,
    metadata: Record<string, unknown> = {}
  ): Promise<RespaldoConsentimientoResult | null> => {
    try {
      setGenerandoPDF(true)

      const blob = await generarPDFDesdeComponente(ConsentimientoImprimible, {
        consentimiento,
        paciente,
        datosClinica,
        userProfile
      })

      if (!blob) {
        log.error('Error generando PDF del consentimiento')
        return null
      }

      // Subir a R2
      const nombreArchivo = `consentimiento_${consentimiento.id}.pdf`
      const respaldo = await respaldarConsentimientoEnR2({
        blob,
        pacienteId: String(paciente.id || ''),
        nombreArchivo,
        metadata
      })

      return respaldo
    } catch (e) {
      log.error('Error en generarYSubirPDF:', e)
      return null
    } finally {
      setGenerandoPDF(false)
    }
  }

  /**
   * Descarga PDF del consentimiento.
   * Prioriza descargar desde R2 si existe r2ArchivoId.
   * Si no, regenera el PDF localmente.
   */
  const descargarPDF = async (
    consentimiento: ConsentimientoDoc,
    actualizarConsentimiento?: (id: string | number | undefined, data: { r2ArchivoId: string; r2ObjectKey: string }) => void
  ): Promise<boolean> => {
    setGenerandoPDF(true)
    try {
      // Priorizar descarga desde R2
      if (consentimiento.r2ArchivoId) {
        const nombreArchivo = `consentimiento_${consentimiento.id}.pdf`
        const ok = await descargarConsentimientoDesdeR2(consentimiento.r2ArchivoId, nombreArchivo)
        if (ok) {
          setGenerandoPDF(false)
          return true
        }
        log.warn('Descarga desde R2 falló, regenerando PDF localmente')
      }

      // Fallback: regenerar PDF localmente
      const respaldo = await generarYSubirPDF(consentimiento)
      if (respaldo) {
        // Actualizar metadata con nuevo r2ArchivoId
        if (actualizarConsentimiento) {
          actualizarConsentimiento(consentimiento.id, {
            r2ArchivoId: respaldo.archivoId,
            r2ObjectKey: respaldo.objectKey
          })
        }
        const nombreArchivo = `consentimiento_${consentimiento.id}.pdf`
        return await descargarConsentimientoDesdeR2(respaldo.archivoId, nombreArchivo)
      }
      return false
    } catch (e) {
      log.error('Error descargando PDF:', e)
      return false
    } finally {
      setGenerandoPDF(false)
    }
  }

  /**
   * Imprime consentimiento en formato Letter aislado.
   */
  const imprimir = (consentimiento: ConsentimientoDoc): void => {
    setConsentimientoParaImprimir(consentimiento)
    // Esperar a que se renderice el portal antes de imprimir
    setTimeout(() => {
      imprimirConsentimientoAislado()
      setConsentimientoParaImprimir(null)
    }, 100)
  }

  return {
    generandoPDF,
    consentimientoParaImprimir,
    generarYSubirPDF,
    descargarPDF,
    imprimir
  }
}
