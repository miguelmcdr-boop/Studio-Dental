import { useState, useEffect, useCallback, useRef } from 'react'
import {
  guardarAdjunto,
  obtenerAdjuntosPorPaciente,
  eliminarAdjunto as eliminarAdjuntoDelServicio,
  procesarColaSubidas,
  type AdjuntoClinico
} from '../../../../infrastructure/storage/adjuntosStorageService'
import { useSesionStore } from '../../../../store/sesionStore'

export interface AdjuntoConUrl extends AdjuntoClinico {
  url: string
}

export interface AdjuntosAgrupados {
  foto: AdjuntoConUrl[]
  rx: AdjuntoConUrl[]
  consentimiento: AdjuntoConUrl[]
  [key: string]: AdjuntoConUrl[]
}

export interface UseAdjuntosReturn {
  adjuntos: AdjuntosAgrupados
  cargando: boolean
  error: string | null
  subirArchivos: (files: FileList | File[], tipo: string) => Promise<void>
  eliminarArchivo: (id: string | number) => Promise<void>
  sincronizando: boolean
  clinicaId: string | null
}

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
export const useAdjuntos = (pacienteId?: string | number | null): UseAdjuntosReturn => {
  const [adjuntos, setAdjuntos] = useState<AdjuntosAgrupados>({ foto: [], rx: [], consentimiento: [] })
  const [cargando, setCargando] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [sincronizando, setSincronizando] = useState<boolean>(false)
  const urlsCreadas = useRef<string[]>([])

  // F6-E: obtener clinicaId de sesionStore para subir a Supabase
  const clinicaId = useSesionStore((state) => state.userProfile?.clinicaId || null)

  const revocarUrlsAnteriores = (): void => {
    urlsCreadas.current.forEach((url) => URL.revokeObjectURL(url))
    urlsCreadas.current = []
  }

  const cargar = useCallback(async (): Promise<void> => {
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

      const agrupado: AdjuntosAgrupados = { foto: [], rx: [], consentimiento: [] }
      ;(registros || [])
        .slice()
        .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
        .forEach((registro) => {
          if (registro.blob) {
            const url = URL.createObjectURL(registro.blob)
            urlsCreadas.current.push(url)
            if (agrupado[registro.tipo]) {
              agrupado[registro.tipo].push({ ...registro, url })
            }
          }
        })

      setAdjuntos(agrupado)
    } catch (e) {
      const err = e as Error
      setError(err?.message || 'No se pudieron cargar los adjuntos de este paciente.')
    } finally {
      setCargando(false)
    }
  }, [pacienteId])

  useEffect(() => {
    cargar()
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      procesarColaSubidas().catch(() => {})
    }
    return () => revocarUrlsAnteriores()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cargar])

  const subirArchivos = useCallback(async (files: FileList | File[], tipo: string): Promise<void> => {
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
      const err = e as Error
      setError(err?.message || 'No se pudo guardar el archivo.')
    } finally {
      setSincronizando(false)
    }
  }, [pacienteId, cargar, clinicaId])

  const eliminarArchivo = useCallback(async (id: string | number): Promise<void> => {
    setError(null)
    setSincronizando(true)
    try {
      await eliminarAdjuntoDelServicio(id)
      await cargar()
    } catch (e) {
      const err = e as Error
      setError(err?.message || 'No se pudo eliminar el archivo.')
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
