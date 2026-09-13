import { useEffect, useState, useRef } from 'react'
import { generarPDFCertificado, respaldarCertificadoEnR2 } from '../services/certificadosPDFService'
import { certificadosStorageService } from '../services/certificadosStorageService'
import { createLogger } from '../../../services/logger'

const log = createLogger('useAutoRespaldoCertificados')

/**
 * Hook para auto-respaldar certificados en R2 Cloudflare (M2c).
 *
 * Observa la lista de certificados y detecta los que NO tienen r2ArchivoId.
 * Los respalda automáticamente en background, uno por uno (cola secuencial).
 *
 * @param {Array} listaCertificados — array de certificados del paciente
 * @param {string} pacienteId — UUID del paciente
 * @param {Function} setCertificados — setter para actualizar la lista
 * @returns {{ respaldandoIds: Set, idsConError: Set, reintentarRespaldo: Function }}
 */
export const useAutoRespaldoCertificados = (listaCertificados, pacienteId, setCertificados) => {
  const [respaldandoIds, setRespaldandoIds] = useState(new Set())
  const [idsConError, setIdsConError] = useState(new Set())
  const abortRef = useRef(new AbortController())

  useEffect(() => {
    return () => abortRef.current.abort()
  }, [])

  useEffect(() => {
    const pendientes = listaCertificados.filter(
      c => !c.r2ArchivoId && !respaldandoIds.has(c.id) && !idsConError.has(c.id)
    )
    if (pendientes.length === 0) return

    const respaldar = async () => {
      const cert = pendientes[0]
      setRespaldandoIds(prev => new Set(prev).add(cert.id))

      try {
        if (abortRef.current.signal.aborted) return

        // Esperar render del preview
        await new Promise(r => setTimeout(r, 500))
        if (abortRef.current.signal.aborted) return

        const nodo = document.getElementById('certificado-preview')
        if (!nodo) {
          log.warn(`Auto-respaldo: preview no disponible para cert ${cert.id}`)
          return
        }

        const blob = await generarPDFCertificado(nodo)
        if (abortRef.current.signal.aborted) return
        if (!blob) throw new Error('No se pudo generar el blob PDF')

        const nombreArchivo = `certificado-${cert.tipo}-${(cert.fechaEmision || '').replace(/\//g, '-')}-${cert.id}.pdf`
        const respaldo = await respaldarCertificadoEnR2({
          blob,
          pacienteId,
          nombreArchivo
        })
        if (abortRef.current.signal.aborted) return

        if (respaldo) {
          const actualizados = listaCertificados.map(c =>
            c.id === cert.id
              ? { ...c, r2ArchivoId: respaldo.archivoId, r2ObjectKey: respaldo.objectKey }
              : c
          )
          setCertificados(actualizados)
          certificadosStorageService
            .guardarCertificados(pacienteId, actualizados)
            .catch(err => log.warn('Error al guardar:', err))
        } else {
          setIdsConError(prev => new Set(prev).add(cert.id))
          log.warn(`Auto-respaldo falló para cert ${cert.id}`)
        }
      } catch (e) {
        if (abortRef.current.signal.aborted) return
        log.error(`Auto-respaldo error cert ${cert.id}:`, e)
        setIdsConError(prev => new Set(prev).add(cert.id))
      } finally {
        setRespaldandoIds(prev => {
          const next = new Set(prev)
          next.delete(cert.id)
          return next
        })
      }
    }

    respaldar()
  }, [listaCertificados, respaldandoIds, idsConError, pacienteId, setCertificados])

  const reintentarRespaldo = (certId) => {
    setIdsConError(prev => {
      const next = new Set(prev)
      next.delete(certId)
      return next
    })
  }

  return { respaldandoIds, idsConError, reintentarRespaldo }
}
