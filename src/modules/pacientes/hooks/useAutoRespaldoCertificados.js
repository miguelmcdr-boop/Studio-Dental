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
 * FIX BUG LOOP: los sets de IDs en progreso/error se guardan en useRef
 * (no en useState) para evitar re-renders al cambiar. El useEffect solo
 * se dispara cuando listaCertificados o pacienteId cambian.
 * El estado que renderiza (Set para badges) se setea en paralelo vía
 * useState, pero NO está en las dependencias del useEffect.
 */
export const useAutoRespaldoCertificados = (listaCertificados, pacienteId, setCertificados) => {
  // Estado que TRIGGERA re-renders (para badges UI)
  const [respaldandoIds, setRespaldandoIds] = useState(new Set())
  const [idsConError, setIdsConError] = useState(new Set())

  // Refs que NO triggeran re-renders (para lógica interna del efecto)
  const respaldandoRef = useRef(new Set())
  const erroresRef = useRef(new Set())
  const abortRef = useRef(new AbortController())
  const enProgresoRef = useRef(false) // evita múltiples respaldos en paralelo

  useEffect(() => {
    return () => abortRef.current.abort()
  }, [])

  // useEffect ESTABLE: solo dispara cuando cambia la lista o el paciente
  useEffect(() => {
    if (!Array.isArray(listaCertificados) || !pacienteId) return
    if (enProgresoRef.current) return // ya hay un respaldo corriendo
    if (abortRef.current.signal.aborted) return

    const pendientes = listaCertificados.filter(
      c => !c.r2ArchivoId && !respaldandoRef.current.has(c.id) && !erroresRef.current.has(c.id)
    )
    if (pendientes.length === 0) return

    const respaldar = async () => {
      enProgresoRef.current = true
      const cert = pendientes[0]

      // Actualizar refs ANTES del await (no triggera re-render)
      respaldandoRef.current = new Set(respaldandoRef.current).add(cert.id)
      // Actualizar estado UI (triggera re-render UNA SOLA VEZ)
      setRespaldandoIds(new Set(respaldandoRef.current))

      try {
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
          // Leer la lista actualizada desde storage (puede haber cambiado)
          const actuales = certificadosStorageService.obtenerCertificados(pacienteId, [])
          const actualizados = actuales.map(c =>
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
        if (abortRef.current.signal.aborted) return
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
