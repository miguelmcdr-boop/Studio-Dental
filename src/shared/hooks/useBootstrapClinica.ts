import { useState, useCallback } from 'react'
import type React from 'react'
import { bootstrapClinica, supabaseSignOut } from '../../infrastructure/auth/authService'
import { sedesService } from '../../domains/organization/clinic/services/sedesService'
import { createLogger } from '../../infrastructure/logging/logger'
import { useBootstrapSedes, crearSedePrincipal } from './useBootstrapSedes'
import type {
  TipoActividad,
  MiembroInvitacionOnboarding,
  ExtendedBootstrapDatos,
  UseBootstrapClinicaReturn,
} from '../types/bootstrapClinica'

export type { TipoActividad, MiembroInvitacionOnboarding, ExtendedBootstrapDatos, UseBootstrapClinicaReturn }

const log = createLogger('useBootstrapClinica')

const DATOS_INIT: ExtendedBootstrapDatos = {
  nombre: '', rutEmpresa: '', direccion: '', comuna: '', region: '', telefono: '', emailContacto: '', especialidad: '',
}

export const useBootstrapClinica = (
  onComplete?: (clinicaId?: string | number) => void
): UseBootstrapClinicaReturn => {
  const [paso, setPaso] = useState<number>(1)
  const [tipoActividad, setTipoActividad] = useState<TipoActividad>('clinica')
  const [datos, setDatos] = useState<ExtendedBootstrapDatos>(DATOS_INIT)
  const { sedes, agregarSede, eliminarSede, asegurarSedePrincipal } = useBootstrapSedes([])
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
    if (p === 3 && sedes.length === 0) asegurarSedePrincipal(datos)
    setErrores(errs)
    return Object.keys(errs).length === 0
  }

  const avanzarPaso = (): void => {
    if (validarPaso(paso)) {
      if (paso === 2 && sedes.length === 0) asegurarSedePrincipal(datos)
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

  const cancelarConfiguracion = async (): Promise<void> => {
    try {
      await supabaseSignOut()
    } catch (e: unknown) {
      log.warn('Error al cerrar sesión durante cancelación:', e)
    }
    if (typeof window !== 'undefined' && window.location?.reload) {
      window.location.reload()
    }
  }

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
      const sedesAGuardar = sedes.length > 0 ? sedes : [crearSedePrincipal(datos)]
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
    paso, tipoActividad, datos, sedes, equipo, errores, procesando, errorGeneral, completado,
    setTipoActividad, actualizarCampo, agregarSede, eliminarSede, agregarMiembro, eliminarMiembro,
    avanzarPaso, retrocederPaso, cancelarConfiguracion, handleSubmit, finalizarBienvenida,
  }
}
