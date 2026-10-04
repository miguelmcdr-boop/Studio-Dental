/**
 * Hook para el módulo admin de vademécum (F4-03f-1).
 *
 * Provee estado y acciones CRUD para administrar el vademécum desde la UI.
 * Integra con:
 * - vademecumService (lectura/escritura)
 * - notificationService (notificaciones toast)
 * - realtimeEvents (sincronización entre dispositivos)
 *
 * Uso:
 *   const { vademecum, familiaSeleccionada, setFamiliaSeleccionada, ... } = useVademecumAdmin()
 */
import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  vademecumService,
  type FarmacoVademecum,
  type FarmacoInput,
  type AlergiaCruzadaItem,
  type AlergiaCruzadaInput,
  type InteraccionInput
} from '../../../../infrastructure/clinical-data/vademecumService'
import type {
  FarmacoUrgencia,
  Antirresortivo
} from '../schemas/vademecumSchema'
import type { Interaccion } from '../schemas/interaccionSchema'
import type { Profilaxis } from '../schemas/profilaxisSchema'
import type { Anticoagulante } from '../schemas/anticoagulanteSchema'
import { notificationService } from '../../../../infrastructure/notification/notificationService'
import { REALTIME_EVENTS } from '../../../../infrastructure/realtime/realtimeEvents'
import { createLogger } from '../../../../infrastructure/logging/logger'
import { useDesactivarFarmaco } from './useDesactivarFarmaco'

const log = createLogger('useVademecumAdmin')

export interface UseVademecumAdminReturn {
  // Estado
  vademecum: FarmacoVademecum[]
  vademecumCompleto: FarmacoVademecum[]
  urgencia: FarmacoUrgencia[]
  antirresortivos: Antirresortivo[]
  alergiasCruzadas: AlergiaCruzadaItem[]
  interacciones: Interaccion[]
  profilaxisEndocarditis: Profilaxis[]
  manejoAnticoagulantes: Anticoagulante[]
  metadata: Record<string, unknown> | null
  cargando: boolean
  error: string | null

  // Filtros
  familiaSeleccionada: string
  setFamiliaSeleccionada: React.Dispatch<React.SetStateAction<string>>
  textoBusqueda: string
  setTextoBusqueda: React.Dispatch<React.SetStateAction<string>>
  soloActivos: boolean
  setSoloActivos: React.Dispatch<React.SetStateAction<boolean>>
  familiasDisponibles: string[]

  // Acciones
  crearOFarmacoActualizar: (
    farmaco: FarmacoInput
  ) => Promise<{ exito: boolean; error?: string }>
  desactivar: (numero: number) => Promise<{ exito: boolean; error?: string }>
  reactivar: (numero: number) => Promise<{ exito: boolean; error?: string }>
  guardarAlergia: (
    regla: AlergiaCruzadaInput
  ) => Promise<{ exito: boolean; error?: string }>
  guardarInteraccion: (
    interaccion: InteraccionInput
  ) => Promise<{ exito: boolean; error?: string }>
  refrescar: () => Promise<void>
}

export const useVademecumAdmin = (): UseVademecumAdminReturn => {
  const [vademecum, setVademecum] = useState<FarmacoVademecum[]>([])
  const [urgencia, setUrgencia] = useState<FarmacoUrgencia[]>([])
  const [antirresortivos, setAntirresortivos] = useState<Antirresortivo[]>([])
  const [alergiasCruzadas, setAlergiasCruzadas] = useState<AlergiaCruzadaItem[]>(
    []
  )
  const [interacciones, setInteracciones] = useState<Interaccion[]>([])
  const [profilaxisEndocarditis, setProfilaxisEndocarditis] = useState<
    Profilaxis[]
  >([])
  const [manejoAnticoagulantes, setManejoAnticoagulantes] = useState<
    Anticoagulante[]
  >([])
  const [metadata, setMetadata] = useState<Record<string, unknown> | null>(null)

  const [cargando, setCargando] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Filtros
  const [familiaSeleccionada, setFamiliaSeleccionada] = useState<string>('')
  const [textoBusqueda, setTextoBusqueda] = useState<string>('')
  const [soloActivos, setSoloActivos] = useState<boolean>(true)

  // ─── Carga inicial ───
  const cargarDatos = useCallback(async () => {
    setCargando(true)
    setError(null)

    try {
      // Sincronizar desde Supabase si está disponible
      await vademecumService.sincronizarDesdeSupabase()

      // Cargar todo desde el servicio
      setVademecum(vademecumService.obtenerVademecum())
      setUrgencia(vademecumService.obtenerFarmacosUrgencia())
      setAntirresortivos(vademecumService.obtenerAntirresortivos())
      setAlergiasCruzadas(vademecumService.obtenerAlergiasCruzadas())
      setInteracciones(vademecumService.obtenerInteracciones())
      setProfilaxisEndocarditis(
        vademecumService.obtenerProfilaxisEndocarditis()
      )
      setManejoAnticoagulantes(vademecumService.obtenerManejoAnticoagulantes())
      setMetadata(vademecumService.obtenerMetadataCuracion())
    } catch (e: unknown) {
      const err = e as Error
      log.error('Error al cargar:', err)
      setError(err.message)
      notificationService.error(`Error al cargar vademécum: ${err.message}`, {
        titulo: 'Error'
      })
    } finally {
      setCargando(false)
    }
  }, [])

  // ─── Listeners de eventos realtime ───
  useEffect(() => {
    void cargarDatos()

    const handleVademecumChanged = () => {
      log.info('Vademécum actualizado desde otro dispositivo')
      void cargarDatos()
    }

    window.addEventListener(
      REALTIME_EVENTS.VADEMECUM_CHANGED,
      handleVademecumChanged
    )

    return () => {
      window.removeEventListener(
        REALTIME_EVENTS.VADEMECUM_CHANGED,
        handleVademecumChanged
      )
    }
  }, [cargarDatos])

  // ─── Filtros ───
  const vademecumFiltrado = useMemo(() => {
    let resultado = [...vademecum]

    if (soloActivos) {
      resultado = resultado.filter(f => f.activo !== false)
    }

    if (familiaSeleccionada) {
      resultado = resultado.filter(f => f.familia === familiaSeleccionada)
    }

    if (textoBusqueda.trim()) {
      const textoNorm = textoBusqueda.toLowerCase().trim()
      resultado = resultado.filter(
        f =>
          (f.nombre_generico || '').toLowerCase().includes(textoNorm) ||
          (f.nombre_comercial || '').toLowerCase().includes(textoNorm) ||
          (f.presentacion || '').toLowerCase().includes(textoNorm)
      )
    }

    return resultado.sort((a, b) => (a.numero || 0) - (b.numero || 0))
  }, [vademecum, familiaSeleccionada, textoBusqueda, soloActivos])

  // ─── Familias disponibles ───
  const familiasDisponibles = useMemo(() => {
    const familias = new Set<string>()
    vademecum.forEach(f => {
      if (f.familia) familias.add(f.familia)
    })
    return Array.from(familias).sort()
  }, [vademecum])

  // ─── Acciones CRUD ───
  const crearOFarmacoActualizar = useCallback(
    async (farmaco: FarmacoInput) => {
      const resultado = await vademecumService.guardarFarmaco(farmaco)
      if (resultado.exito) {
        await cargarDatos()
      }
      return resultado
    },
    [cargarDatos]
  )

  const reactivar = useCallback(
    async (numero: number) => {
      const resultado = await vademecumService.reactivarFarmaco(numero)
      if (resultado.exito) {
        await cargarDatos()
      }
      return resultado
    },
    [cargarDatos]
  )

  const guardarAlergia = useCallback(
    async (regla: AlergiaCruzadaInput) => {
      const resultado = await vademecumService.guardarAlergiaCruzada(regla)
      if (resultado.exito) {
        await cargarDatos()
      }
      return resultado
    },
    [cargarDatos]
  )

  const guardarInteraccionCb = useCallback(
    async (interaccion: InteraccionInput) => {
      const resultado = await vademecumService.guardarInteraccion(interaccion)
      if (resultado.exito) {
        await cargarDatos()
      }
      return resultado
    },
    [cargarDatos]
  )

  const refrescar = useCallback(() => cargarDatos(), [cargarDatos])

  const { desactivar } = useDesactivarFarmaco({
    cargarDatos,
    vademecumService
  })

  return {
    // Estado
    vademecum: vademecumFiltrado,
    vademecumCompleto: vademecum,
    urgencia,
    antirresortivos,
    alergiasCruzadas,
    interacciones,
    profilaxisEndocarditis,
    manejoAnticoagulantes,
    metadata,
    cargando,
    error,

    // Filtros
    familiaSeleccionada,
    setFamiliaSeleccionada,
    textoBusqueda,
    setTextoBusqueda,
    soloActivos,
    setSoloActivos,
    familiasDisponibles,

    // Acciones
    crearOFarmacoActualizar,
    desactivar,
    reactivar,
    guardarAlergia,
    guardarInteraccion: guardarInteraccionCb,
    refrescar
  }
}
