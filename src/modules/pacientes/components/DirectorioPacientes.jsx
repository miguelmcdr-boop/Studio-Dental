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
import React, { memo, useState } from 'react'
import { Trash2, Plus, Search, Users, FileText } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Badge } from '../../../components/ui/Badge'
import { PageHeader } from '../../../components/ui/PageHeader'
import { EmptyState } from '../../../components/ui/EmptyState'
import { usePacientesStore } from '../../../store/pacientesStore'
import { ModalNuevoPaciente } from './ModalNuevoPaciente'
import { ModalPapelera } from './ModalPapelera'
import { usePapelera } from '../hooks/usePapelera'
import { useRBAC } from '../../../hooks/useRBAC'
import { PERMISOS } from '../../../constants/rbacConstants'

export const DirectorioPacientes = memo(({ alSeleccionarPaciente, alEliminarPaciente, alPacienteCreado }) => {
  const pacientes = usePacientesStore((state) => state.pacientes)
  const setPacientes = usePacientesStore((state) => state.setPacientes)

  const [busqueda, setBusqueda] = useState('')
  const [mostrarModalNuevo, setMostrarModalNuevo] = useState(false)
  const [mostrarPapelera, setMostrarPapelera] = useState(false)

  // F6-L: Papelera de reciclaje (solo admin)
  const { puede } = useRBAC()
  const { 
    pacientesEliminados, cargando, contador, restaurar, 
    vaciar, contadorElegibles, aniosRetencion, refrescar
  } = usePapelera()

  const handleEliminarConPapelera = async (id) => {
    const exito = await alEliminarPaciente(id)
    if (exito) {
      await refrescar()
    }
  }

  const puedeVaciar = puede(PERMISOS.VACIAR_PAPELERA)

  const pacientesFiltrados = pacientes.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.rut.includes(busqueda)
  )

  const handleCrearPaciente = (nuevoPaciente) => {
    setPacientes([nuevoPaciente, ...pacientes])
    setMostrarModalNuevo(false)
    if (alPacienteCreado) alPacienteCreado(nuevoPaciente)
  }

  return (
    <div>
      {/* PageHeader con acciones */}
      <PageHeader
        title="Directorio de Pacientes"
        description="Busca, administra, edita o elimina registros de pacientes."
        actions={
          <div className="flex gap-2">
            {puede(PERMISOS.VER_PAPELERA) && (
              <Button
                data-testid="btn-papelera"
                onClick={() => setMostrarPapelera(true)}
                variant="warning"
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
              className="p-5 border border-graphite-200 dark:border-graphite-700 rounded-lg hover:border-graphite-900 dark:hover:border-graphite-100 transition-all bg-graphite-50 dark:bg-graphite-800 flex justify-between items-center group"
            >
              <div onClick={() => alSeleccionarPaciente(p)} className="cursor-pointer flex-1">
                <h3 className="font-bold text-graphite-900 dark:text-graphite-50 text-sm group-hover:text-graphite-700 dark:group-hover:text-graphite-200 transition-colors">
                  {p.nombre}
                </h3>
                <p className="text-xs text-graphite-500 dark:text-graphite-400">RUT: {p.rut}</p>
                <p className="text-xs text-graphite-500 dark:text-graphite-400">Tel: {p.telefono || 'Sin teléfono'}</p>
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
