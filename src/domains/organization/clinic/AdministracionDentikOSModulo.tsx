import React, { useState } from 'react'
import { Building2, MapPin, Users, Stethoscope, ShieldCheck, Plus, Trash2 } from 'lucide-react'
import { DatosClinicaForm } from './components/DatosClinicaForm'
import { GestionMiembrosModulo } from '../team/GestionMiembrosModulo'
import { PrestacionesModulo } from '../prestations/PrestacionesModulo'
import { RespaldoDatosSection } from '../../../infrastructure/persistence/components/RespaldoDatosSection'
import { useSedes } from './hooks/useSedes'
import { Button } from '../../../shared/ui/ui/Button'
import type { PerfilUsuario } from '../../../infrastructure/auth/authService'

export interface AdministracionDentikOSProps {
  userProfile?: PerfilUsuario | null
}

type TabAdmin = 'practica' | 'sedes' | 'equipo' | 'prestaciones' | 'avanzado'

export const AdministracionDentikOSModulo: React.FC<AdministracionDentikOSProps> = ({ userProfile }) => {
  const [tabActiva, setTabActiva] = useState<TabAdmin>('practica')
  const { sedes, agregarSede, eliminarSede } = useSedes()

  const [nuevaSedeNombre, setNuevaSedeNombre] = useState('')
  const [nuevaSedeDir, setNuevaSedeDir] = useState('')
  const [nuevaSedeComuna, setNuevaSedeComuna] = useState('')
  const [nuevaSedeRegion, setNuevaSedeRegion] = useState('')

  const handleCrearSede = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nuevaSedeNombre.trim() || !nuevaSedeDir.trim()) return
    agregarSede({
      nombre: nuevaSedeNombre.trim(),
      direccion: nuevaSedeDir.trim(),
      comuna: nuevaSedeComuna.trim() || 'Comuna Central',
      region: nuevaSedeRegion.trim() || 'Región Metropolitana',
      activa: true,
    })
    setNuevaSedeNombre('')
    setNuevaSedeDir('')
    setNuevaSedeComuna('')
    setNuevaSedeRegion('')
  }

  return (
    <div className="space-y-6">
      {/* Header del Módulo */}
      <div className="bg-surface border border-surface rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-graphite-900 dark:text-white flex items-center gap-2.5">
            <Building2 className="text-[#D4AF37]" size={26} />
            <span>Administración DentikOS</span>
          </h1>
          <p className="text-xs text-graphite-500 dark:text-slate-400 mt-1">
            Control maestro de práctica clínica, sedes operativas, equipo humano, aranceles y respaldo avanzado.
          </p>
        </div>

        {/* Tabs de Navegación */}
        <div className="flex flex-wrap gap-1 p-1 bg-gray-100 dark:bg-slate-900 rounded-xl border border-surface text-xs">
          <button
            type="button"
            onClick={() => setTabActiva('practica')}
            className={`py-1.5 px-3 rounded-lg font-medium transition flex items-center gap-1.5 ${
              tabActiva === 'practica' ? 'bg-white dark:bg-slate-800 text-[#D4AF37] font-semibold shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 size={13} /> <span>Mi Clínica</span>
          </button>
          <button
            type="button"
            onClick={() => setTabActiva('sedes')}
            className={`py-1.5 px-3 rounded-lg font-medium transition flex items-center gap-1.5 ${
              tabActiva === 'sedes' ? 'bg-white dark:bg-slate-800 text-[#D4AF37] font-semibold shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <MapPin size={13} /> <span>Sedes</span>
          </button>
          <button
            type="button"
            onClick={() => setTabActiva('equipo')}
            className={`py-1.5 px-3 rounded-lg font-medium transition flex items-center gap-1.5 ${
              tabActiva === 'equipo' ? 'bg-white dark:bg-slate-800 text-[#D4AF37] font-semibold shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users size={13} /> <span>Equipo</span>
          </button>
          <button
            type="button"
            onClick={() => setTabActiva('prestaciones')}
            className={`py-1.5 px-3 rounded-lg font-medium transition flex items-center gap-1.5 ${
              tabActiva === 'prestaciones' ? 'bg-white dark:bg-slate-800 text-[#D4AF37] font-semibold shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Stethoscope size={13} /> <span>Prestaciones</span>
          </button>
          <button
            type="button"
            onClick={() => setTabActiva('avanzado')}
            className={`py-1.5 px-3 rounded-lg font-medium transition flex items-center gap-1.5 ${
              tabActiva === 'avanzado' ? 'bg-white dark:bg-slate-800 text-[#D4AF37] font-semibold shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck size={13} /> <span>Avanzado</span>
          </button>
        </div>
      </div>

      {/* Contenido según Tab */}
      {tabActiva === 'practica' && (
        <DatosClinicaForm userProfile={userProfile} />
      )}

      {tabActiva === 'sedes' && (
        <div className="bg-surface border border-surface rounded-2xl p-6 shadow-xs space-y-6">
          <div className="border-b border-surface pb-3">
            <h2 className="text-base font-bold text-graphite-900 dark:text-white">Gestión de Sedes DentikOS</h2>
            <p className="text-xs text-graphite-500 dark:text-slate-400">Sucursales, boxes y centros de atención clínica habilitados.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sedes.map((s) => (
              <div key={s.id || s.nombre} className="p-4 rounded-xl border border-surface bg-gray-50/50 dark:bg-slate-900/50 flex justify-between items-start text-xs">
                <div>
                  <h3 className="font-bold text-sm text-graphite-900 dark:text-white flex items-center gap-1.5">
                    <MapPin size={14} className="text-[#D4AF37]" /> {s.nombre}
                  </h3>
                  <p className="text-graphite-600 dark:text-slate-300 mt-1">{s.direccion}</p>
                  <p className="text-graphite-400 dark:text-slate-500 text-[11px]">{s.comuna}, {s.region}</p>
                </div>
                {sedes.length > 1 && s.id && (
                  <button type="button" onClick={() => eliminarSede(s.id!)} className="text-red-400 hover:text-red-500 p-1">
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleCrearSede} className="border border-dashed border-gray-300 dark:border-slate-700 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-semibold text-graphite-800 dark:text-slate-200">Agregar Nueva Sede</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <input
                type="text"
                required
                placeholder="Nombre de sede (ej. Sede El Golf)"
                value={nuevaSedeNombre}
                onChange={(e) => setNuevaSedeNombre(e.target.value)}
                className="p-2 rounded-lg border border-surface bg-white dark:bg-slate-900"
              />
              <input
                type="text"
                required
                placeholder="Dirección completa"
                value={nuevaSedeDir}
                onChange={(e) => setNuevaSedeDir(e.target.value)}
                className="p-2 rounded-lg border border-surface bg-white dark:bg-slate-900"
              />
              <input
                type="text"
                placeholder="Comuna"
                value={nuevaSedeComuna}
                onChange={(e) => setNuevaSedeComuna(e.target.value)}
                className="p-2 rounded-lg border border-surface bg-white dark:bg-slate-900"
              />
              <input
                type="text"
                placeholder="Región"
                value={nuevaSedeRegion}
                onChange={(e) => setNuevaSedeRegion(e.target.value)}
                className="p-2 rounded-lg border border-surface bg-white dark:bg-slate-900"
              />
            </div>
            <Button type="submit" size="sm" variant="primary" className="text-xs">
              <Plus size={14} className="mr-1" /> Registrar Sede
            </Button>
          </form>
        </div>
      )}

      {tabActiva === 'equipo' && (
        <GestionMiembrosModulo />
      )}

      {tabActiva === 'prestaciones' && (
        <PrestacionesModulo />
      )}

      {tabActiva === 'avanzado' && (
        <div className="space-y-4">
          <RespaldoDatosSection />
          <div className="p-4 rounded-xl border border-surface bg-surface text-xs text-graphite-500 dark:text-slate-400">
            <h4 className="font-semibold text-graphite-900 dark:text-white mb-1">Auditoría y Seguridad</h4>
            <p>Todas las mutaciones críticas quedan registradas en el log criptográfico audit_log según Ley 19.628.</p>
          </div>
        </div>
      )}
    </div>
  )
}
