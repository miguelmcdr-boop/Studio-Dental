import { useState } from 'react'
import {
  generarPDFCertificado,
  respaldarCertificadoEnR2,
  descargarBlob,
  descargarCertificadoDesdeR2
} from '../services/certificadosPDFService'
import { certificadosStorageService } from '../services/certificadosStorageService'
import type { CertificadoPapelera } from '../services/papeleraCertificadosService'
import { createLogger } from '../../../../infrastructure/logging/logger'
import { useAppDialog } from '../../../../hooks/useAppDialog'

const log = createLogger('useDescargaCertificado')

export interface UseDescargaCertificadoReturn {
  generandoPDF: boolean
  descargarPDF: (certAMostrar?: CertificadoPapelera | null) => Promise<void>
}

/**
 * Hook para descargar PDF de certificados (M2b/M3).
 *
 * Extraído de CertificadosSection para reducir tamaño del componente.
 */
export const useDescargaCertificado = (
  pacienteId: string | number,
  listaCertificados: CertificadoPapelera[] = [],
  setCertificados: (actualizados: CertificadoPapelera[]) => void
): UseDescargaCertificadoReturn => {
  const [generandoPDF, setGenerandoPDF] = useState<boolean>(false)
  const { alert } = useAppDialog()

  const descargarPDF = async (certAMostrar?: CertificadoPapelera | null): Promise<void> => {
    if (!certAMostrar || generandoPDF) return
    setGenerandoPDF(true)
    try {
      const nombre = `certificado-${certAMostrar.tipo || 'medico'}-${(certAMostrar.fechaEmision || '').replace(/\//g, '-')}.pdf`

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

      const respaldo = await respaldarCertificadoEnR2({ blob, pacienteId: String(pacienteId), nombreArchivo: nombre })
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
      const err = e as Error
      log.error('Error generando PDF:', err)
      await alert({ title: 'Error al generar PDF', description: 'No se pudo generar el PDF del certificado. Intenta de nuevo.', variant: 'error', confirmText: 'Entendido' })
    } finally {
      setGenerandoPDF(false)
    }
  }

  return { generandoPDF, descargarPDF }
}
