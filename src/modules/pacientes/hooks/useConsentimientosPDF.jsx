import { useState } from 'react'
import { ConsentimientoImprimible } from '../components/ConsentimientoImprimible'
import { generarPDFDesdeComponente, respaldarConsentimientoEnR2, descargarConsentimientoDesdeR2 } from '../services/consentimientosPDFService.jsx'
import { imprimirConsentimientoAislado } from '../services/consentimientosPrintService'
import { createLogger } from '../../../services/logger'

const log = createLogger('useConsentimientosPDF')

/**
 * Hook para gestión de PDFs de consentimientos (M4a).
 * Extraído de ConsentimientosSection.jsx para cumplir límite constitucional.
 *
 * Responsabilidades:
 * - Generar PDF con html2canvas (vía generarPDFDesdeComponente)
 * - Subir a R2 con categoría 'consentimiento'
 * - Descargar desde R2 (prioriza R2, fallback a regenerar)
 * - Imprimir en formato Letter aislado
 *
 * @param {Object} paciente — objeto paciente con id, nombre, rut
 * @param {Object} userProfile — perfil del profesional
 * @param {Object} datosClinica — configuración de clínica (membrete)
 * @returns {Object} API del hook
 */
export const useConsentimientosPDF = (paciente, userProfile, datosClinica) => {
  const [generandoPDF, setGenerandoPDF] = useState(false)
  const [consentimientoParaImprimir, setConsentimientoParaImprimir] = useState(null)

  /**
   * Genera PDF del consentimiento y lo sube a R2.
   */
  const generarYSubirPDF = async (consentimiento, metadata = {}) => {
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
        pacienteId: paciente.id,
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
   *
   * @param {Object} consentimiento — objeto consentimiento
   * @param {Function} actualizarConsentimiento — callback para actualizar metadata
   * @returns {Promise<boolean>} true si se descargó correctamente
   */
  const descargarPDF = async (consentimiento, actualizarConsentimiento) => {
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
  const imprimir = (consentimiento) => {
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
