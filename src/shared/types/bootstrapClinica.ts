import type React from 'react'
import { type BootstrapClinicaDatos } from '../../infrastructure/auth/authService'
import { type Sede } from '../../domains/organization/clinic/schemas/sedeSchema'

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
  cancelarConfiguracion: () => Promise<void>
  handleSubmit: (e?: React.FormEvent) => Promise<void>
  finalizarBienvenida: () => void
}
