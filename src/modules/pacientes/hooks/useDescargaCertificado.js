import { useState } from 'react'
import { generarPDFCertificado, respaldarCertificadoEnR2, descargarBlob, descargarCertificadoDesdeR2 } from '../services/certificadosPDFService'
import { certificadosStorageService } from '../services/certificadosStorageService'
import { createLogger } from '../../../services/logger'
import { useAppDialog } from '../../../hooks/useAppDialog'

const log = createLogger('useDescargaCertificado')

/**
 * Hook para descargar PDF de certificados (M2b/M3).
 *
 * Extraído de CertificadosSection para reducir tamaño del componente.
 */
export const useDescargaCertificado = (pacienteId, listaCertificados, setCertificados) => {
  const [generandoPDF, setGenerandoPDF] = useState(false)
  const { alert } = useAppDialog()

  const descargarPDF = async (certAMostrar) => {
    if (!certAMostrar || generandoPDF) return
    setGenerandoPDF(true)
    try {
      const nombre = `certificado-${certAMostrar.tipo}-${(certAMostrar.fechaEmision || '').replace(/\//g, '-')}.pdf`

      if (certAMostrar.r2ArchivoId) {
        const ok = await descargarCertificadoDesdeR2(certAMostrar.r2ArchivoId, nombre)
        if (ok) {
          await alert({ title: 'PDF descargado', description: 'El certificado se descargó desde R2 Cloudflare.', variant: 'success', confirmText: 'Entendido' })
          return
        }
        log.warn('Descarga desde R2 falló, regenerando PDF local')
      }

      const nodo = document.getElementById('certificado-preview')
      const blob = await generarPDFCertificado(nodo)
      if (!blob) throw new Error('No se pudo generar el blob PDF')

      descargarBlob(blob, nombre)

      const respaldo = await respaldarCertificadoEnR2({ blob, pacienteId, nombreArchivo: nombre })
      if (respaldo) {
        const actualizados = listaCertificados.map(c =>
          c.id === certAMostrar.id ? { ...c, r2ArchivoId: respaldo.archivoId, r2ObjectKey: respaldo.objectKey } : c
        )
        setCertificados(actualizados)
        certificadosStorageService.guardarCertificados(pacienteId, actualizados).catch(err => log.warn('Error al guardar:', err))
        await alert({ title: 'PDF descargado y respaldado', description: 'El certificado se descargó y quedó respaldado en R2 Cloudflare.', variant: 'success', confirmText: 'Entendido' })
      } else {
        await alert({ title: 'PDF descargado sin respaldo', description: 'El PDF se descargó correctamente pero no se pudo respaldar en R2. Intenta de nuevo más tarde.', variant: 'warning', confirmText: 'Entendido' })
      }
    } catch (e) {
      log.error('Error generando PDF:', e)
      await alert({ title: 'Error al generar PDF', description: 'No se pudo generar el PDF del certificado. Intenta de nuevo.', variant: 'error', confirmText: 'Entendido' })
    } finally {
      setGenerandoPDF(false)
    }
  }

  return { generandoPDF, descargarPDF }
}
