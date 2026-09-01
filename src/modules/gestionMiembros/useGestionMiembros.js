import { useState, useEffect, useMemo } from 'react'
import {
  invitarMiembro,
  listarInvitaciones,
  revocarInvitacion,
  generarUrlInvitacion,
  listarMiembros
} from '../../services/authService'
import { ROLES, NOMBRES_ROLES, DESCRIPCIONES_ROLES } from '../../constants/rbacConstants'
import { createLogger } from '../../services/logger'

const log = createLogger('useGestionMiembros')

/**
 * F7-11: Hook que maneja la lógica de gestión de miembros.
 * Extraído de GestionMiembrosModulo.jsx para cumplir con límite de 250 líneas JSX.
 */
export const useGestionMiembros = () => {
  const [miembros, setMiembros] = useState([])
  const [invitaciones, setInvitaciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [emailInvitar, setEmailInvitar] = useState('')
  const [rolInvitar, setRolInvitar] = useState(ROLES.RECEPCION)
  const [invitando, setInvitando] = useState(false)
  const [mensajeExito, setMensajeExito] = useState('')
  const [urlCopiada, setUrlCopiada] = useState(null)

  const cargarDatos = async () => {
    setLoading(true)
    setError(null)
    try {
      const [resultMiembros, resultInvitaciones] = await Promise.all([
        listarMiembros(), listarInvitaciones()
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

  useEffect(() => { cargarDatos() }, [])

  const handleInvitar = async (e) => {
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

  const handleRevocar = async (invitacionId) => {
    if (!confirm('¿Revocar esta invitación?')) return
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

  const handleCopiarLink = (token) => {
    const url = generarUrlInvitacion(token)
    navigator.clipboard.writeText(url)
    setUrlCopiada(token)
    setTimeout(() => setUrlCopiada(null), 2000)
  }

  const rolesDisponibles = useMemo(() => {
    return Object.entries(ROLES).map(([key, value]) => ({
      key, value,
      nombre: NOMBRES_ROLES[value],
      descripcion: DESCRIPCIONES_ROLES[value]
    }))
  }, [])

  return {
    miembros, invitaciones, loading, error, mensajeExito,
    emailInvitar, setEmailInvitar,
    rolInvitar, setRolInvitar,
    invitando, urlCopiada, rolesDisponibles,
    handleInvitar, handleRevocar, handleCopiarLink
  }
}
