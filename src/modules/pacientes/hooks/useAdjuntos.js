import { useState, useEffect, useCallback, useRef } from 'react'
import {
  guardarAdjunto,
  obtenerAdjuntosPorPaciente,
  eliminarAdjunto as eliminarAdjuntoDelServicio
} from '../../../services/adjuntosStorageService'
import { useSesionStore } from '../../../store/sesionStore'

/**
 * Hook de adjuntos clínicos de un paciente (fotos, radiografías, consentimientos).
 * Tarea MASTER_ROADMAP: F1-02 + F6-E (Supabase Storage)
 *
 * Ningún componente debe llamar a adjuntosStorageService directamente
 * (Cap. III de la Constitución) — este hook es el único punto de entrada.
 *
 * Las URLs de objeto (para <img src=...>) se generan aquí a partir de los
 * blobs recuperados de IndexedDB, y se revocan al recargar o desmontar
 * para no filtrar memoria.
 *
 * F6-E: se agrega indicador de sincronización con Supabase Storage.
 */
export const useAdjuntos = (pacienteId) => {
  const [adjuntos, setAdjuntos] = useState({ foto: [], rx: [], consentimiento: [] })
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [sincronizando, setSincronizando] = useState(false)
  const urlsCreadas = useRef([])

  // F6-E: obtener clinicaId de sesionStore para subir a Supabase
  const clinicaId = useSesionStore((state) => state.userProfile?.clinicaId || null)

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
    setSincronizando(true)
    try {
      for (const file of Array.from(files)) {
        // F6-E: pasar clinicaId para subir a Supabase Storage
        // eslint-disable-next-line no-await-in-loop
        await guardarAdjunto({ pacienteId, tipo, blob: file, nombre: file.name, clinicaId })
      }
      await cargar()
    } catch (e) {
      setError(e?.message || 'No se pudo guardar el archivo.')
    } finally {
      setSincronizando(false)
    }
  }, [pacienteId, cargar, clinicaId])

  const eliminarArchivo = useCallback(async (id) => {
    setError(null)
    setSincronizando(true)
    try {
      await eliminarAdjuntoDelServicio(id)
      await cargar()
    } catch (e) {
      setError(e?.message || 'No se pudo eliminar el archivo.')
    } finally {
      setSincronizando(false)
    }
  }, [cargar])

  return { 
    adjuntos, 
    cargando, 
    error, 
    subirArchivos, 
    eliminarArchivo,
    sincronizando,
    clinicaId 
  }
}
