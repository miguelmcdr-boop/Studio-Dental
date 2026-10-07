/**
 * DirectorioPacientes v2 — Listado de pacientes (F10-C1)
 *
 * Migración al Design System v2:
 * - <PageHeader> con acciones (papelera + nuevo paciente)
 * - <Input> con icono Search (reemplaza placeholder con emoji)
 * - <Badge> para contador de papelera
 * - <EmptyState> cuando no hay resultados
 * - Iconos lucide (Trash2, Plus, Search, Users, FileText) reemplazan emojis
 *
 * Contratos preservados:
 * - 6 data-testid (btn-papelera, btn-nuevo-paciente, input-busqueda-paciente,
 *   paciente-card-${id}, btn-ficha-${id}, btn-eliminar-${id})
 * - API de props (alSeleccionarPaciente, alEliminarPaciente, alPacienteCreado)
 * - Filtros por nombre/RUT
 * - RBAC para papelera
 */
import React, { memo, useState, useEffect, useMemo } from 'react'
import { Trash2, Plus, Search, Users, FileText } from 'lucide-react'
import { Button } from '../../../../shared/ui/ui/Button'
import { Input } from '../../../../shared/ui/ui/Input'
import { Badge } from '../../../../shared/ui/ui/Badge'
import { PageHeader } from '../../../../shared/ui/ui/PageHeader'
import { EmptyState } from '../../../../shared/ui/ui/EmptyState'
import { usePacientesStore } from '../../../../app/stores/pacientesStore'
import { ModalNuevoPaciente, type NuevoPacienteFormData } from './ModalNuevoPaciente'
import { ModalPapelera } from './ModalPapelera'
import { usePapelera } from '../hooks/usePapelera'
import { useRBAC } from '../../../../shared/hooks/useRBAC'
import { PERMISOS } from '../../../../constants/rbacConstants'
import type { Paciente } from '../schemas/pacienteSchema'

export interface DirectorioPacientesProps {
  alSeleccionarPaciente: (paciente: Paciente) => void
  alEliminarPaciente: (id: string | number) => Promise<boolean> | boolean
  alPacienteCreado?: (nuevoPaciente: NuevoPacienteFormData | Paciente) => void
}

export const DirectorioPacientes: React.FC<DirectorioPacientesProps> = memo(({
  alSeleccionarPaciente,
  alEliminarPaciente,
  alPacienteCreado
}) => {
  const pacientes = usePacientesStore((state: { pacientes: Paciente[] }) => state.pacientes)
  const setPacientes = usePacientesStore((state: { setPacientes: (pacientes: Paciente[]) => void }) => state.setPacientes)

  const [busqueda, setBusqueda] = useState<string>('')
  const [mostrarModalNuevo, setMostrarModalNuevo] = useState<boolean>(false)
  const [mostrarPapelera, setMostrarPapelera] = useState<boolean>(false)

  useEffect(() => {
    const handleAbrirModal = () => setMostrarModalNuevo(true)
    window.addEventListener('abrir_nuevo_paciente', handleAbrirModal)
    return () => window.removeEventListener('abrir_nuevo_paciente', handleAbrirModal)
  }, [])

  // F6-L: Papelera de reciclaje (solo admin)
  const { puede } = useRBAC()
  const { 
    pacientesEliminados, cargando, contador, restaurar, 
    vaciar, contadorElegibles, aniosRetencion, refrescar
  } = usePapelera()

  const handleEliminarConPapelera = async (id: string | number): Promise<void> => {
    const exito = await alEliminarPaciente(id)
    if (exito) {
      await refrescar()
    }
  }

  const puedeVaciar = puede(PERMISOS.VACIAR_PAPELERA)

  const pacientesFiltrados = useMemo(() => pacientes.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.rut.includes(busqueda)
  ), [pacientes, busqueda])

  const handleCrearPaciente = (nuevoPaciente: NuevoPacienteFormData): void => {
    const pacienteFormateado = nuevoPaciente as unknown as Paciente
    setPacientes([pacienteFormateado, ...pacientes])
    setMostrarModalNuevo(false)
    if (alPacienteCreado) alPacienteCreado(pacienteFormateado)
  }

  return (
    <div>
      {/* PageHeader con acciones */}
      <PageHeader
        icon={Users}
        title="Directorio de Pacientes"
        description="Busca, administra, edita o elimina registros de pacientes."
        actions={
          <div className="flex gap-2">
            {puede(PERMISOS.VER_PAPELERA) && (
              <Button
                data-testid="btn-papelera"
                onClick={() => setMostrarPapelera(true)}
                variant="secondary"
                size="sm"
                icon={Trash2}
              >
                Papelera
                {contador > 0 && (
                  <Badge size="sm" variant="neutral" className="ml-2">
                    {contador}
                  </Badge>
                )}
              </Button>
            )}
            <Button
              data-testid="btn-nuevo-paciente"
              onClick={() => setMostrarModalNuevo(true)}
              variant="primary"
              icon={Plus}
            >
              Nuevo Paciente
            </Button>
          </div>
        }
      />

      {/* Búsqueda */}
      <div className="mb-6">
        <Input
          data-testid="input-busqueda-paciente"
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o RUT del paciente..."
          icon={Search}
          iconPosition="left"
        />
      </div>

      {/* Grid de pacientes o EmptyState */}
      {pacientesFiltrados.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Sin pacientes"
          description={
            busqueda
              ? `No hay pacientes que coincidan con "${busqueda}".`
              : 'Aún no hay pacientes registrados. Crea el primero para comenzar.'
          }
          action={
            !busqueda && (
              <Button
                variant="primary"
                icon={Plus}
                onClick={() => setMostrarModalNuevo(true)}
              >
                Crear primer paciente
              </Button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pacientesFiltrados.map(p => (
            <div
              key={p.id}
              data-testid={`paciente-card-${p.id}`}
              className="relative overflow-hidden p-5 border border-surface rounded-2xl transition-all duration-150 bg-surface/90 backdrop-blur-md shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-primary/40 flex justify-between items-center group before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-gradient-to-r before:from-transparent before:via-[#B88E3A]/40 before:to-transparent"
            >
              <div onClick={() => alSeleccionarPaciente(p)} className="cursor-pointer flex-1">
                <h3 className="font-extrabold text-graphite-900 dark:text-graphite-50 surgical:text-black text-sm group-hover:text-primary dark:group-hover:text-gold-satin transition-colors">
                  {p.nombre}
                </h3>
                <p className="text-xs text-graphite-500 dark:text-graphite-400 mt-1">
                  RUT: <span className="tabular-nums font-medium text-graphite-700 dark:text-graphite-300">{p.rut}</span>
                </p>
                <p className="text-xs text-graphite-500 dark:text-graphite-400">
                  Tel: <span className="tabular-nums font-medium text-graphite-700 dark:text-graphite-300">{p.telefono ? String(p.telefono) : 'Sin teléfono'}</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  data-testid={`btn-ficha-${p.id}`}
                  onClick={() => alSeleccionarPaciente(p)}
                  size="sm"
                  variant="secondary"
                  icon={FileText}
                >
                  Ver ficha
                </Button>
                <Button
                  data-testid={`btn-eliminar-${p.id}`}
                  onClick={(e) => { e.stopPropagation(); handleEliminarConPapelera(p.id); }}
                  size="sm"
                  variant="ghost"
                  icon={Trash2}
                  className="text-clinical-error hover:bg-clinical-error/10"
                  aria-label="Eliminar paciente"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modales */}
      {mostrarModalNuevo && (
        <ModalNuevoPaciente
          pacientes={pacientes}
          alGuardar={handleCrearPaciente}
          alCerrar={() => setMostrarModalNuevo(false)}
        />
      )}

      {mostrarPapelera && (
        <ModalPapelera
          pacientesEliminados={pacientesEliminados}
          cargando={cargando}
          onRestaurar={restaurar}
          onVaciar={vaciar}
          contadorElegibles={contadorElegibles}
          aniosRetencion={aniosRetencion}
          puedeVaciar={puedeVaciar}
          onCerrar={() => setMostrarPapelera(false)}
        />
      )}
    </div>
  )
})

DirectorioPacientes.displayName = 'DirectorioPacientes'
