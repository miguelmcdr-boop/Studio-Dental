import { useState, useEffect, useMemo } from 'react'
import {
  invitarMiembro,
  listarInvitaciones,
  revocarInvitacion,
  generarUrlInvitacion,
  listarMiembros,
  type MiembroItem,
  type InvitacionItem
} from '../../../services/authService'
import { ROLES, NOMBRES_ROLES, DESCRIPCIONES_ROLES } from '../../../constants/rbacConstants'
import { createLogger } from '../../../services/logger'
import { useAppDialog } from '../../../hooks/useAppDialog'

const log = createLogger('useGestionMiembros')

export interface RolDisponible {
  key: string
  value: string
  nombre: string
  descripcion: string
}

export interface UseGestionMiembrosReturn {
  miembros: MiembroItem[]
  invitaciones: InvitacionItem[]
  loading: boolean
  error: string | null
  mensajeExito: string
  emailInvitar: string
  setEmailInvitar: React.Dispatch<React.SetStateAction<string>>
  rolInvitar: string
  setRolInvitar: React.Dispatch<React.SetStateAction<string>>
  invitando: boolean
  urlCopiada: string | null
  rolesDisponibles: RolDisponible[]
  handleInvitar: (e: React.FormEvent<HTMLFormElement>) => Promise<void>
  handleRevocar: (invitacionId: string) => Promise<void>
  handleCopiarLink: (token: string) => void
}

/**
 * F7-11: Hook que maneja la lógica de gestión de miembros.
 * Extraído de GestionMiembrosModulo.jsx para cumplir con límite de 250 líneas JSX.
 */
export const useGestionMiembros = (): UseGestionMiembrosReturn => {
  const { confirm } = useAppDialog()
  const [miembros, setMiembros] = useState<MiembroItem[]>([])
  const [invitaciones, setInvitaciones] = useState<InvitacionItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [emailInvitar, setEmailInvitar] = useState<string>('')
  const [rolInvitar, setRolInvitar] = useState<string>(ROLES.RECEPCION)
  const [invitando, setInvitando] = useState<boolean>(false)
  const [mensajeExito, setMensajeExito] = useState<string>('')
  const [urlCopiada, setUrlCopiada] = useState<string | null>(null)

  const cargarDatos = async (): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      const [resultMiembros, resultInvitaciones] = await Promise.all([
        listarMiembros(),
        listarInvitaciones()
      ])
      if (resultMiembros.success) setMiembros(resultMiembros.miembros || [])
      if (resultInvitaciones.success) setInvitaciones(resultInvitaciones.invitaciones || [])
    } catch (err) {
      log.error('Excepción cargando datos:', err)
      setError('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  const handleInvitar = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    setInvitando(true)
    setError(null)
    setMensajeExito('')
    try {
      const result = await invitarMiembro(emailInvitar, rolInvitar)
      if (result.success) {
        setMensajeExito(`Invitación enviada a ${emailInvitar}`)
        setEmailInvitar('')
        setRolInvitar(ROLES.RECEPCION)
        cargarDatos()
      } else {
        setError(result.error || 'Error al invitar')
      }
    } catch (err) {
      log.error('Error invitando:', err)
      setError('Error al invitar miembro')
    } finally {
      setInvitando(false)
    }
  }

  const handleRevocar = async (invitacionId: string): Promise<void> => {
    const ok = await confirm({
      title: 'Revocar invitación',
      description: '¿Revocar esta invitación?',
      variant: 'warning',
      confirmText: 'Revocar'
    })
    if (!ok) return
    try {
      const result = await revocarInvitacion(invitacionId)
      if (result.success) {
        setMensajeExito('Invitación revocada')
        cargarDatos()
      } else {
        setError(result.error || 'Error al revocar')
      }
    } catch (err) {
      log.error('Error revocando:', err)
      setError('Error al revocar invitación')
    }
  }

  const handleCopiarLink = (token: string): void => {
    const url = generarUrlInvitacion(token)
    navigator.clipboard.writeText(url)
    setUrlCopiada(token)
    setTimeout(() => setUrlCopiada(null), 2000)
  }

  const rolesDisponibles = useMemo<RolDisponible[]>(() => {
    return Object.entries(ROLES).map(([key, value]) => ({
      key,
      value,
      nombre: NOMBRES_ROLES[value] || value,
      descripcion: DESCRIPCIONES_ROLES[value] || ''
    }))
  }, [])

  return {
    miembros,
    invitaciones,
    loading,
    error,
    mensajeExito,
    emailInvitar,
    setEmailInvitar,
    rolInvitar,
    setRolInvitar,
    invitando,
    urlCopiada,
    rolesDisponibles,
    handleInvitar,
    handleRevocar,
    handleCopiarLink
  }
}
