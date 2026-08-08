import { useState, useEffect, useCallback, useRef } from 'react'
import {
  guardarAdjunto,
  obtenerAdjuntosPorPaciente,
  eliminarAdjunto as eliminarAdjuntoDelServicio
} from '../../../services/adjuntosStorageService'

/**
 * Hook de adjuntos clínicos de un paciente (fotos, radiografías, consentimientos).
 * Tarea MASTER_ROADMAP: F1-02
 *
 * Ningún componente debe llamar a adjuntosStorageService directamente
 * (Cap. III de la Constitución) — este hook es el único punto de entrada.
 *
 * Las URLs de objeto (para <img src=...>) se generan aquí a partir de los
 * blobs recuperados de IndexedDB, y se revocan al recargar o desmontar
 * para no filtrar memoria.
 */
export const useAdjuntos = (pacienteId) => {
  const [adjuntos, setAdjuntos] = useState({ foto: [], rx: [], consentimiento: [] })
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const urlsCreadas = useRef([])

  const revocarUrlsAnteriores = () => {
    urlsCreadas.current.forEach((url) => URL.revokeObjectURL(url))
    urlsCreadas.current = []
  }

  const cargar = useCallback(async () => {
    if (!pacienteId) {
      setAdjuntos({ foto: [], rx: [], consentimiento: [] })
      setCargando(false)
      return
    }

    setCargando(true)
    setError(null)
    try {
      const registros = await obtenerAdjuntosPorPaciente(pacienteId)
      revocarUrlsAnteriores()

      const agrupado = { foto: [], rx: [], consentimiento: [] }
      registros
        .slice()
        .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
        .forEach((registro) => {
          const url = URL.createObjectURL(registro.blob)
          urlsCreadas.current.push(url)
          if (agrupado[registro.tipo]) {
            agrupado[registro.tipo].push({ ...registro, url })
          }
        })

      setAdjuntos(agrupado)
    } catch (e) {
      setError(e?.message || 'No se pudieron cargar los adjuntos de este paciente.')
    } finally {
      setCargando(false)
    }
  }, [pacienteId])

  useEffect(() => {
    cargar()
    return () => revocarUrlsAnteriores()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cargar])

  const subirArchivos = useCallback(async (files, tipo) => {
    if (!pacienteId) return
    setError(null)
    try {
      for (const file of Array.from(files)) {
        // eslint-disable-next-line no-await-in-loop
        await guardarAdjunto({ pacienteId, tipo, blob: file, nombre: file.name })
      }
      await cargar()
    } catch (e) {
      setError(e?.message || 'No se pudo guardar el archivo.')
    }
  }, [pacienteId, cargar])

  const eliminarArchivo = useCallback(async (id) => {
    setError(null)
    try {
      await eliminarAdjuntoDelServicio(id)
      await cargar()
    } catch (e) {
      setError(e?.message || 'No se pudo eliminar el archivo.')
    }
  }, [cargar])

  return { adjuntos, cargando, error, subirArchivos, eliminarArchivo }
}