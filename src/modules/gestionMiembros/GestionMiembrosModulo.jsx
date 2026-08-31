import React, { useState, useEffect, useMemo } from 'react'
import { 
  invitarMiembro, 
  listarInvitaciones, 
  revocarInvitacion, 
  generarUrlInvitacion,
  listarMiembros
} from '../../services/authService'
import { ROLES, NOMBRES_ROLES, DESCRIPCIONES_ROLES } from '../../constants/rbacConstants'
import { useSesionStore } from '../../store/sesionStore'
import { createLogger } from '../../services/logger'

const log = createLogger('GestionMiembrosModulo')

/**
 * F7-11: Módulo de gestión de miembros de la clínica.
 * 
 * Permite a los admins:
 * - Ver miembros actuales de la clínica
 * - Invitar nuevos miembros (email + rol)
 * - Revocar invitaciones pendientes
 * - Copiar link de invitación para compartir
 * 
 * Solo visible para usuarios con permiso GESTIONAR_USUARIOS (admins).
 */
export const GestionMiembrosModulo = () => {
  const userProfile = useSesionStore((state) => state.userProfile)
  
  // Estados
  const [miembros, setMiembros] = useState([])
  const [invitaciones, setInvitaciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Formulario de invitación
  const [emailInvitar, setEmailInvitar] = useState('')
  const [rolInvitar, setRolInvitar] = useState(ROLES.RECEPCION)
  const [invitando, setInvitando] = useState(false)
  const [mensajeExito, setMensajeExito] = useState('')
  
  // URL copiada
  const [urlCopiada, setUrlCopiada] = useState(null)
  
  // Cargar datos al montar
  useEffect(() => {
    cargarDatos()
  }, [])
  
  const cargarDatos = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const [resultMiembros, resultInvitaciones] = await Promise.all([
        listarMiembros(),
        listarInvitaciones()
      ])
      
      if (resultMiembros.success) {
        setMiembros(resultMiembros.miembros || [])
      } else {
        log.error('Error cargando miembros:', resultMiembros.error)
      }
      
      if (resultInvitaciones.success) {
        setInvitaciones(resultInvitaciones.invitaciones || [])
      } else {
        log.error('Error cargando invitaciones:', resultInvitaciones.error)
      }
    } catch (err) {
      log.error('Excepción cargando datos:', err)
      setError('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }
  
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
      key,
      value,
      nombre: NOMBRES_ROLES[value],
      descripcion: DESCRIPCIONES_ROLES[value]
    }))
  }, [])
  
  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-8"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Miembros</h1>
        <p className="text-gray-600">
          Administra el personal de tu clínica. Invita nuevos miembros y gestiona los roles.
        </p>
      </div>
      
      {/* Mensajes */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}
      
      {mensajeExito && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800">{mensajeExito}</p>
        </div>
      )}
      
      {/* Formulario de invitación */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Invitar Nuevo Miembro</h2>
        <form onSubmit={handleInvitar} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={emailInvitar}
                onChange={(e) => setEmailInvitar(e.target.value)}
                placeholder="ejemplo@clinica.com"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={invitando}
              />
            </div>
            
            <div>
              <label htmlFor="rol" className="block text-sm font-medium text-gray-700 mb-1">
                Rol
              </label>
              <select
                id="rol"
                value={rolInvitar}
                onChange={(e) => setRolInvitar(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={invitando}
              >
                {rolesDisponibles.map((rol) => (
                  <option key={rol.key} value={rol.value}>
                    {rol.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {rolesDisponibles.find(r => r.value === rolInvitar)?.descripcion}
            </div>
            <button
              type="submit"
              disabled={invitando || !emailInvitar}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {invitando ? 'Invitando...' : 'Enviar Invitación'}
            </button>
          </div>
        </form>
      </div>
      
      {/* Tabla de miembros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Miembros Actuales ({miembros.length})
          </h2>
        </div>
        
        {miembros.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No hay miembros en esta clínica
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {miembros.map((miembro) => (
                  <tr key={miembro.id || miembro.user_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {miembro.email || miembro.user_email || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {NOMBRES_ROLES[miembro.rol] || miembro.rol}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        miembro.activo 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {miembro.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Tabla de invitaciones pendientes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Invitaciones Pendientes ({invitaciones.length})
          </h2>
        </div>
        
        {invitaciones.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No hay invitaciones pendientes
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Enviada
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invitaciones.map((invitacion) => (
                  <tr key={invitacion.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {invitacion.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                        {NOMBRES_ROLES[invitacion.rol] || invitacion.rol}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(invitacion.creada_en).toLocaleDateString('es-CL')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleCopiarLink(invitacion.token)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Copiar link de invitación"
                      >
                        {urlCopiada === invitacion.token ? '✓ Copiado' : 'Copiar Link'}
                      </button>
                      <button
                        onClick={() => handleRevocar(initacion.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Revocar invitación"
                      >
                        Revocar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
