import { useState, useCallback } from 'react'
import type React from 'react'
import { bootstrapClinica, type BootstrapClinicaDatos } from '../../infrastructure/auth/authService'
import { sedesService } from '../../domains/organization/clinic/services/sedesService'
import { type Sede } from '../../domains/organization/clinic/schemas/sedeSchema'
import { createLogger } from '../../infrastructure/logging/logger'

const log = createLogger('useBootstrapClinica')

export type TipoActividad = 'individual' | 'clinica'

export interface MiembroInvitacionOnboarding {
  email: string
  rol: string
  sedes: string[]
}

export interface ExtendedBootstrapDatos extends BootstrapClinicaDatos {
  comuna?: string
  region?: string
  especialidad?: string
  logoUrl?: string
}

export interface UseBootstrapClinicaReturn {
  paso: number
  tipoActividad: TipoActividad
  datos: ExtendedBootstrapDatos
  sedes: Sede[]
  equipo: MiembroInvitacionOnboarding[]
  errores: Record<string, string | null>
  procesando: boolean
  errorGeneral: string | null
  completado: boolean
  setTipoActividad: (tipo: TipoActividad) => void
  actualizarCampo: (campo: keyof ExtendedBootstrapDatos, valor: string) => void
  agregarSede: (sede: Sede) => void
  eliminarSede: (index: number) => void
  agregarMiembro: (miembro: MiembroInvitacionOnboarding) => void
  eliminarMiembro: (index: number) => void
  avanzarPaso: () => void
  retrocederPaso: () => void
  handleSubmit: (e?: React.FormEvent) => Promise<void>
  finalizarBienvenida: () => void
}

export const useBootstrapClinica = (
  onComplete?: (clinicaId?: string | number) => void
): UseBootstrapClinicaReturn => {
  const [paso, setPaso] = useState<number>(1)
  const [tipoActividad, setTipoActividad] = useState<TipoActividad>('clinica')
  const [datos, setDatos] = useState<ExtendedBootstrapDatos>({
    nombre: '',
    rutEmpresa: '',
    direccion: '',
    comuna: '',
    region: '',
    telefono: '',
    emailContacto: '',
    especialidad: '',
  })
  const [sedes, setSedes] = useState<Sede[]>([])
  const [equipo, setEquipo] = useState<MiembroInvitacionOnboarding[]>([])
  const [errores, setErrores] = useState<Record<string, string | null>>({})
  const [procesando, setProcesando] = useState<boolean>(false)
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null)
  const [completado, setCompletado] = useState<boolean>(false)

  const actualizarCampo = (campo: keyof ExtendedBootstrapDatos, valor: string): void => {
    setDatos((prev) => ({ ...prev, [campo]: valor }))
    if (errores[campo]) setErrores((prev) => ({ ...prev, [campo]: null }))
  }

  const validarPaso = (p: number): boolean => {
    const errs: Record<string, string | null> = {}
    if (p === 1) return true
    if (p === 2) {
      if (!datos.nombre || datos.nombre.trim().length < 3) errs.nombre = 'Nombre obligatorio (mínimo 3 caracteres)'
      if (!datos.direccion || datos.direccion.trim().length < 3) errs.direccion = 'Dirección obligatoria'
    }
    if (p === 3 && sedes.length === 0) {
      // Si no definió sedes, inicializar automáticamente 1 sede con los datos del paso 2
      const sedeAuto: Sede = {
        nombre: 'Sede Principal',
        direccion: datos.direccion || 'Dirección Principal',
        comuna: datos.comuna || 'Comuna Central',
        region: datos.region || 'Región Metropolitana',
        telefono: datos.telefono || '',
        activa: true,
      }
      setSedes([sedeAuto])
    }
    setErrores(errs)
    return Object.keys(errs).length === 0
  }

  const avanzarPaso = (): void => {
    if (validarPaso(paso)) {
      if (paso === 2 && sedes.length === 0) {
        setSedes([{
          nombre: 'Sede Principal',
          direccion: datos.direccion || 'Dirección Principal',
          comuna: datos.comuna || 'Comuna Central',
          region: datos.region || 'Región Metropolitana',
          telefono: datos.telefono || '',
          activa: true,
        }])
      }
      setPaso((prev) => Math.min(prev + 1, 4))
      setErrorGeneral(null)
    }
  }

  const retrocederPaso = (): void => {
    if (paso > 1) {
      setPaso((prev) => prev - 1)
      setErrorGeneral(null)
    }
  }

  const agregarSede = (s: Sede) => setSedes((prev) => [...prev, s])
  const eliminarSede = (idx: number) => setSedes((prev) => prev.filter((_, i) => i !== idx))
  const agregarMiembro = (m: MiembroInvitacionOnboarding) => setEquipo((prev) => [...prev, m])
  const eliminarMiembro = (idx: number) => setEquipo((prev) => prev.filter((_, i) => i !== idx))

  const handleSubmit = async (e?: React.FormEvent): Promise<void> => {
    if (e) e.preventDefault()
    setProcesando(true)
    setErrorGeneral(null)
    try {
      const res = await bootstrapClinica(datos)
      if (!res.success) {
        setErrorGeneral(res.error || 'Error al crear la clínica')
        setProcesando(false)
        return
      }
      const sedesAGuardar = sedes.length > 0 ? sedes : [{
        nombre: 'Sede Principal',
        direccion: datos.direccion || 'Principal',
        comuna: datos.comuna || 'Comuna',
        region: datos.region || 'Región',
        activa: true,
      }]
      sedesService.guardarSedes(sedesAGuardar)
      if (sedesAGuardar[0]?.id) sedesService.establecerSedeActiva(sedesAGuardar[0].id)
      setCompletado(true)
    } catch (err: unknown) {
      log.error('Error en bootstrap:', err)
      setErrorGeneral('Error inesperado al inicializar la clínica')
    } finally {
      setProcesando(false)
    }
  }

  const finalizarBienvenida = useCallback(() => {
    if (onComplete) onComplete()
  }, [onComplete])

  return {
    paso,
    tipoActividad,
    datos,
    sedes,
    equipo,
    errores,
    procesando,
    errorGeneral,
    completado,
    setTipoActividad,
    actualizarCampo,
    agregarSede,
    eliminarSede,
    agregarMiembro,
    eliminarMiembro,
    avanzarPaso,
    retrocederPaso,
    handleSubmit,
    finalizarBienvenida,
  }
}
