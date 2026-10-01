import React, { useMemo } from 'react'
import { UsersRound } from 'lucide-react'
import { useGestionMiembros } from './useGestionMiembros'
import { NOMBRES_ROLES } from '../../constants/rbacConstants'

/**
 * F7-11: Módulo de gestión de miembros de la clínica.
 * Componente puramente presentacional — toda la lógica está en useGestionMiembros.
 */
export const GestionMiembrosModulo = () => {
  const {
    miembros, invitaciones, loading, error, mensajeExito,
    emailInvitar, setEmailInvitar, rolInvitar, setRolInvitar,
    invitando, urlCopiada, rolesDisponibles,
    handleInvitar, handleRevocar, handleCopiarLink
  } = useGestionMiembros()

  // BUG-GESTION-MIEMBROS: Filtrar solo invitaciones pendientes
  const invitacionesPendientes = useMemo(() => {
    return invitaciones.filter(i => i.status === 'pending')
  }, [invitaciones])

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-graphite-700 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-graphite-700 rounded w-3/4 mb-8"></div>
          <div className="h-64 bg-gray-200 dark:bg-graphite-700 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-graphite-900 dark:text-graphite-50 surgical:text-black mb-2 inline-flex items-center gap-3">
          <UsersRound size={28} className="text-[#B88E3A]" />
          Gestión de Miembros
        </h1>
        <p className="text-graphite-600 dark:text-graphite-400 surgical:text-graphite-800">
          Administra el personal de tu clínica. Invita nuevos miembros y gestiona los roles.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 rounded-lg">
          <p className="text-rose-800 dark:text-rose-300">{error}</p>
        </div>
      )}

      {mensajeExito && (
        <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 rounded-lg">
          <p className="text-emerald-800 dark:text-emerald-300">{mensajeExito}</p>
        </div>
      )}

      <div className="bg-white dark:bg-[#0F172A] surgical:bg-[#F1F5F9] rounded-lg shadow-sm border border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] p-6 mb-8">
        <h2 className="text-xl font-semibold text-graphite-900 dark:text-graphite-50 surgical:text-black mb-4">Invitar Nuevo Miembro</h2>
        <form onSubmit={handleInvitar} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-graphite-700 dark:text-graphite-300 surgical:text-graphite-900 mb-1">Email</label>
              <input type="email" id="email" value={emailInvitar} onChange={(e) => setEmailInvitar(e.target.value)}
                placeholder="ejemplo@clinica.com" required
                className="w-full px-3 py-2 border border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] bg-white dark:bg-[#070B14] surgical:bg-[#E2E8F0] text-graphite-900 dark:text-graphite-100 surgical:text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B88E3A]/40 focus:border-[#B88E3A]"
                disabled={invitando} />
            </div>

            <div>
              <label htmlFor="rol" className="block text-sm font-medium text-graphite-700 dark:text-graphite-300 surgical:text-graphite-900 mb-1">Rol</label>
              <select id="rol" value={rolInvitar} onChange={(e) => setRolInvitar(e.target.value)}
                className="w-full px-3 py-2 border border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] bg-white dark:bg-[#070B14] surgical:bg-[#E2E8F0] text-graphite-900 dark:text-graphite-100 surgical:text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B88E3A]/40 focus:border-[#B88E3A]"
                disabled={invitando}>
                {rolesDisponibles.map((rol) => (
                  <option key={rol.key} value={rol.value}>{rol.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-graphite-600 dark:text-graphite-400 surgical:text-graphite-800">
              {rolesDisponibles.find(r => r.value === rolInvitar)?.descripcion}
            </div>
            <button type="submit" disabled={invitando || !emailInvitar}
              className="px-6 py-2 bg-[#B88E3A] hover:bg-[#99732B] dark:bg-[#E5C378] dark:hover:bg-[#B88E3A] text-white dark:text-graphite-950 font-medium rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {invitando ? 'Invitando...' : 'Enviar Invitación'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white dark:bg-[#0F172A] surgical:bg-[#F1F5F9] rounded-lg shadow-sm border border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] mb-8 overflow-hidden">
        <div className="p-6 border-b border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569]">
          <h2 className="text-xl font-semibold text-graphite-900 dark:text-graphite-50 surgical:text-black">
            Miembros Actuales (<span className="tabular-nums">{miembros.length}</span>)
          </h2>
        </div>

        {miembros.length === 0 ? (
          <div className="p-8 text-center text-graphite-500 dark:text-graphite-400">No hay miembros en esta clínica</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-[#1E293B] surgical:bg-[#E2E8F0] border-b border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-graphite-600 dark:text-graphite-300 surgical:text-graphite-900 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-graphite-600 dark:text-graphite-300 surgical:text-graphite-900 uppercase tracking-wider">Rol</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-graphite-600 dark:text-graphite-300 surgical:text-graphite-900 uppercase tracking-wider">Estado</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-[#0F172A] surgical:bg-[#F1F5F9] divide-y divide-[#E2E8F0] dark:divide-[#24334A] surgical:divide-[#475569]">
                {miembros.map((miembro) => (
                  <tr key={miembro.id || miembro.user_id} className="hover:bg-slate-50 dark:hover:bg-[#1E293B]/60 surgical:hover:bg-[#E2E8F0]">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-graphite-900 dark:text-graphite-50 surgical:text-black">{miembro.email || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
                        {NOMBRES_ROLES[miembro.rol] || miembro.rol}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full border ${
                        miembro.activo 
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50' 
                          : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/50'
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

      <div className="bg-white dark:bg-[#0F172A] surgical:bg-[#F1F5F9] rounded-lg shadow-sm border border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] overflow-hidden">
        <div className="p-6 border-b border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569]">
          <h2 className="text-xl font-semibold text-graphite-900 dark:text-graphite-50 surgical:text-black">
            Invitaciones Pendientes (<span className="tabular-nums">{invitacionesPendientes.length}</span>)
          </h2>
        </div>

        {invitacionesPendientes.length === 0 ? (
          <div className="p-8 text-center text-graphite-500 dark:text-graphite-400">No hay invitaciones pendientes</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-[#1E293B] surgical:bg-[#E2E8F0] border-b border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-graphite-600 dark:text-graphite-300 surgical:text-graphite-900 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-graphite-600 dark:text-graphite-300 surgical:text-graphite-900 uppercase tracking-wider">Rol</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-graphite-600 dark:text-graphite-300 surgical:text-graphite-900 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-graphite-600 dark:text-graphite-300 surgical:text-graphite-900 uppercase tracking-wider">Enviada</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-graphite-600 dark:text-graphite-300 surgical:text-graphite-900 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-[#0F172A] surgical:bg-[#F1F5F9] divide-y divide-[#E2E8F0] dark:divide-[#24334A] surgical:divide-[#475569]">
                {invitacionesPendientes.map((invitacion) => (
                  <tr key={invitacion.id} className="hover:bg-slate-50 dark:hover:bg-[#1E293B]/60 surgical:hover:bg-[#E2E8F0]">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-graphite-900 dark:text-graphite-50 surgical:text-black">{invitacion.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
                        {NOMBRES_ROLES[invitacion.rol] || invitacion.rol}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                        Pendiente
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm tabular-nums text-graphite-600 dark:text-graphite-300 surgical:text-graphite-900">
                      {new Date(invitacion.creada_en).toLocaleDateString('es-CL')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                      <button onClick={() => handleCopiarLink(invitacion.token)} 
                        className="text-[#B88E3A] hover:text-[#99732B] dark:text-[#E5C378] transition-colors"
                        title="Copiar link de invitación">
                        {urlCopiada === invitacion.token ? '✓ Copiado' : 'Copiar Link'}
                      </button>
                      <button 
                        onClick={() => handleRevocar(invitacion.id)} 
                        className="text-rose-600 hover:text-rose-800 dark:text-rose-400 transition-colors"
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
