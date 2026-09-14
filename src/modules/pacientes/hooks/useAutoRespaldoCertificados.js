import { useEffect, useState, useRef } from 'react'
import { generarPDFCertificado, respaldarCertificadoEnR2 } from '../services/certificadosPDFService'
import { certificadosStorageService } from '../services/certificadosStorageService'
import { createLogger } from '../../../services/logger'

const log = createLogger('useAutoRespaldoCertificados')

/**
 * Hook para auto-respaldar certificados en R2 Cloudflare (M2c).
 *
 * FIX: Removido useCallback que causaba error de hooks.
 * reintentarRespaldo es una función simple que no necesita memoización.
 */
export const useAutoRespaldoCertificados = (listaCertificados, pacienteId, setCertificados) => {
  const [respaldandoIds, setRespaldandoIds] = useState(new Set())
  const [idsConError, setIdsConError] = useState(new Set())

  const respaldandoRef = useRef(new Set())
  const erroresRef = useRef(new Set())
  const enProgresoRef = useRef(false)
  const isMountedRef = useRef(true)
  const listaActualRef = useRef(listaCertificados)

  // Actualizar ref en cada render (sin useEffect para evitar problemas de hooks)
  listaActualRef.current = listaCertificados

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!Array.isArray(listaCertificados) || !pacienteId) return
    if (!isMountedRef.current) return
    if (enProgresoRef.current) return

    const pendientes = listaCertificados.filter(
      c => !c.r2ArchivoId && !respaldandoRef.current.has(c.id) && !erroresRef.current.has(c.id)
    )
    
    if (pendientes.length === 0) return

    const respaldar = async () => {
      enProgresoRef.current = true
      const cert = pendientes[0]

      if (cert.r2ArchivoId) {
        enProgresoRef.current = false
        return
      }

      respaldandoRef.current = new Set(respaldandoRef.current).add(cert.id)
      setRespaldandoIds(new Set(respaldandoRef.current))

      try {
        await new Promise(r => setTimeout(r, 500))
        if (!isMountedRef.current) return

        const nodo = document.getElementById('certificado-preview')
        if (!nodo) {
          log.warn(`Auto-respaldo: preview no disponible para cert ${cert.id}`)
          return
        }

        const blob = await generarPDFCertificado(nodo)
        if (!isMountedRef.current) return
        if (!blob) throw new Error('No se pudo generar el blob PDF')

        const nombreArchivo = `certificado-${cert.tipo}-${(cert.fechaEmision || '').replace(/\//g, '-')}-${cert.id}.pdf`
        const respaldo = await respaldarCertificadoEnR2({
          blob,
          pacienteId,
          nombreArchivo
        })
        if (!isMountedRef.current) return

        if (respaldo) {
          // CRÍTICO: usar listaActualRef para obtener la lista MÁS RECIENTE
          // (evita race condition con papelera)
          const listaActual = listaActualRef.current || []
          
          // Guard: si el cert ya no está en la lista o ya está en papelera, skip
          const certActual = listaActual.find(c => c.id === cert.id)
          if (!certActual || certActual.eliminadoAt) {
            log.warn(`Auto-respaldo: cert ${cert.id} no está activo, skip update`)
            return
          }
          
          const actualizados = listaActual.map(c =>
            c.id === cert.id
              ? { ...c, r2ArchivoId: respaldo.archivoId, r2ObjectKey: respaldo.objectKey }
              : c
          )
          setCertificados(actualizados)
          
          certificadosStorageService
            .guardarCertificados(pacienteId, actualizados)
            .catch(err => log.warn('Error al guardar:', err))
        } else {
          erroresRef.current = new Set(erroresRef.current).add(cert.id)
          setIdsConError(new Set(erroresRef.current))
          log.warn(`Auto-respaldo falló para cert ${cert.id}`)
        }
      } catch (e) {
        if (!isMountedRef.current) return
        log.error(`Auto-respaldo error cert ${cert.id}:`, e)
        erroresRef.current = new Set(erroresRef.current).add(cert.id)
        setIdsConError(new Set(erroresRef.current))
      } finally {
        respaldandoRef.current = new Set(
          [...respaldandoRef.current].filter(id => id !== cert.id)
        )
        setRespaldandoIds(new Set(respaldandoRef.current))
        enProgresoRef.current = false
      }
    }

    respaldar()
  }, [listaCertificados, pacienteId, setCertificados])

  const reintentarRespaldo = (certId) => {
    erroresRef.current = new Set([...erroresRef.current].filter(id => id !== certId))
    setIdsConError(new Set(erroresRef.current))
  }

  return { respaldandoIds, idsConError, reintentarRespaldo }
}
