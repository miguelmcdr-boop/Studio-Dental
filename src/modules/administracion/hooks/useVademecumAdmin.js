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
import { vademecumService } from '../../../services/vademecumService'
import { notificationService } from '../../../services/notificationService'
import { REALTIME_EVENTS } from '../../../services/realtimeEvents'

export const useVademecumAdmin = () => {
  const [vademecum, setVademecum] = useState([])
  const [urgencia, setUrgencia] = useState([])
  const [antirresortivos, setAntirresortivos] = useState([])
  const [alergiasCruzadas, setAlergiasCruzadas] = useState([])
  const [interacciones, setInteracciones] = useState([])
  const [profilaxisEndocarditis, setProfilaxisEndocarditis] = useState([])
  const [manejoAnticoagulantes, setManejoAnticoagulantes] = useState([])
  const [metadata, setMetadata] = useState(null)
  
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  
  // Filtros
  const [familiaSeleccionada, setFamiliaSeleccionada] = useState('')
  const [textoBusqueda, setTextoBusqueda] = useState('')
  const [soloActivos, setSoloActivos] = useState(true)
  
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
      setProfilaxisEndocarditis(vademecumService.obtenerProfilaxisEndocarditis())
      setManejoAnticoagulantes(vademecumService.obtenerManejoAnticoagulantes())
      setMetadata(vademecumService.obtenerMetadataCuracion())
    } catch (e) {
      console.error('[useVademecumAdmin] Error al cargar:', e)
      setError(e.message)
      notificationService.error(`Error al cargar vademécum: ${e.message}`, { titulo: 'Error' })
    } finally {
      setCargando(false)
    }
  }, [])
  
  // ─── Listeners de eventos realtime ───
  useEffect(() => {
    cargarDatos()
    
    const handleVademecumChanged = () => {
      console.log('[useVademecumAdmin] Vademécum actualizado desde otro dispositivo')
      cargarDatos()
    }
    
    window.addEventListener(REALTIME_EVENTS.VADEMECUM_CHANGED, handleVademecumChanged)
    
    return () => {
      window.removeEventListener(REALTIME_EVENTS.VADEMECUM_CHANGED, handleVademecumChanged)
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
      resultado = resultado.filter(f =>
        (f.nombre_generico || '').toLowerCase().includes(textoNorm) ||
        (f.nombre_comercial || '').toLowerCase().includes(textoNorm) ||
        (f.presentacion || '').toLowerCase().includes(textoNorm)
      )
    }
    
    return resultado.sort((a, b) => (a.numero || 0) - (b.numero || 0))
  }, [vademecum, familiaSeleccionada, textoBusqueda, soloActivos])
  
  // ─── Familias disponibles ───
  const familiasDisponibles = useMemo(() => {
    const familias = new Set()
    vademecum.forEach(f => {
      if (f.familia) familias.add(f.familia)
    })
    return Array.from(familias).sort()
  }, [vademecum])
  
  // ─── Acciones CRUD ───
  const crearOFarmacoActualizar = useCallback(async (farmaco) => {
    const resultado = await vademecumService.guardarFarmaco(farmaco)
    if (resultado.exito) {
      await cargarDatos()
    }
    return resultado
  }, [cargarDatos])
  
  const desactivar = useCallback(async (numero) => {
    if (!window.confirm(`¿Desactivar fármaco #${numero}? (no se borra, solo se oculta)`)) {
      return { exito: false, error: 'Cancelado por el usuario' }
    }
    
    const resultado = await vademecumService.desactivarFarmaco(numero)
    if (resultado.exito) {
      await cargarDatos()
    }
    return resultado
  }, [cargarDatos])
  
  const reactivar = useCallback(async (numero) => {
    const resultado = await vademecumService.reactivarFarmaco(numero)
    if (resultado.exito) {
      await cargarDatos()
    }
    return resultado
  }, [cargarDatos])
  
  const guardarAlergia = useCallback(async (regla) => {
    const resultado = await vademecumService.guardarAlergiaCruzada(regla)
    if (resultado.exito) {
      await cargarDatos()
    }
    return resultado
  }, [cargarDatos])
  
  const guardarInteraccionCb = useCallback(async (interaccion) => {
    const resultado = await vademecumService.guardarInteraccion(interaccion)
    if (resultado.exito) {
      await cargarDatos()
    }
    return resultado
  }, [cargarDatos])
  
  const refrescar = useCallback(() => cargarDatos(), [cargarDatos])
  
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
