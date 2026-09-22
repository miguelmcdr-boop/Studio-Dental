/**
 * AgendaModulo v2 — Parrilla multi-box de citas (F10-C2)
 *
 * Migración al Design System v2:
 * - <PageHeader> con título sentence case (retira UPPERCASE + font-black)
 * - <Button> variant="danger" + icono Ban para bloqueos
 * - <Button> variant="primary" + icono Plus para nueva cita
 * - <EmptyState> compact para boxes sin citas
 * - Iconos lucide reemplazan emojis 📅 ⛔ ➕ 🪑
 *
 * Componentes auxiliares NO tocados (iteración posterior si se requiere):
 * - AgendaViewSelector, AgendaSummaryCards, CitaCard
 * - ModalNuevaCita, ModalNuevoBloqueo
 *
 * Contratos: no hay data-testid en este archivo, preservación de API de props.
 */
import React, { memo, useMemo } from 'react'
import { Ban, Plus, Armchair, Calendar } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { PageHeader } from '../../components/ui/PageHeader'
import { EmptyState } from '../../components/ui/EmptyState'
import { useAgenda } from './hooks/useAgenda'
import { AgendaSummaryCards } from './components/AgendaSummaryCards'
import { AgendaViewSelector } from './components/AgendaViewSelector'
import { CitaCard } from './components/CitaCard'
import { ModalNuevaCita } from './components/ModalNuevaCita'
import { ModalNuevoBloqueo } from './components/ModalNuevoBloqueo'
import { SILLONES_DENTALES } from './constants/agendaConstants'
import { usePacientesStore } from '../../store/pacientesStore'

export const AgendaModulo = memo(({ alSeleccionarPaciente, alVerFichaPaciente }) => {
  const pacientesProp = usePacientesStore((state) => state.pacientes)

  const {
    citas,
    pacientes,
    fechaSeleccionada,
    setFechaSeleccionada,
    boxFiltro,
    setBoxFiltro,
    doctorFiltro,
    setDoctorFiltro,
    modalNuevaCitaAbierto,
    setModalNuevaCitaAbierto,
    modalNuevoBloqueoAbierto,
    setModalNuevoBloqueoAbierto,
    guardarCita,
    eliminarCita,
    cambiarEstadoCita,
    enviarWhatsAppConfirmacion
  } = useAgenda(pacientesProp)

  const citasDelDia = useMemo(() => citas.filter(c => c.fecha === fechaSeleccionada), [citas, fechaSeleccionada])
  const funcionVerFicha = alSeleccionarPaciente || alVerFichaPaciente

  const boxesAMostrar = boxFiltro === 'Todos'
    ? SILLONES_DENTALES
    : SILLONES_DENTALES.filter(b => b.nombre === boxFiltro)

  return (
    <div className="space-y-6" role="main" aria-label="Agenda de citas">
      {/* PageHeader con acciones */}
      <PageHeader
        icon={Calendar}
        title="Agenda multi-box y control de sillones"
        description="Gestión inteligente de citas, ocupación de Boxes y confirmación omnicanal."
        actions={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
            <Button
              type="button"
              onClick={() => setModalNuevoBloqueoAbierto(true)}
              variant="danger"
              size="sm"
              icon={Ban}
            >
              Añadir bloqueo
            </Button>
            <Button
              type="button"
              onClick={() => setModalNuevaCitaAbierto(true)}
              variant="primary"
              icon={Plus}
            >
              Agendar nueva cita
            </Button>
          </div>
        }
      />

      {/* Selector de Fecha + Filtro por Box/Doctor */}
      <AgendaViewSelector
        fechaSeleccionadaIso={fechaSeleccionada}
        setFechaSeleccionadaIso={setFechaSeleccionada}
        boxFiltro={boxFiltro}
        setBoxFiltro={setBoxFiltro}
        doctorFiltro={doctorFiltro}
        setDoctorFiltro={setDoctorFiltro}
        doctoresDisponibles={[]}
      />

      {/* KPI Cards */}
      <AgendaSummaryCards citas={citasDelDia} />

      {/* Parrilla Multi-Box */}
      <div className="bg-graphite-50 dark:bg-graphite-900 border border-graphite-200 dark:border-graphite-700 rounded-xl p-4 md:p-6" role="region" aria-label="Parrilla de sillones dentales">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {boxesAMostrar.map(box => {
            const citasBox = citasDelDia.filter(
              c => c.boxAsignado === box.nombre || c.boxAsignado === 'Todos los Boxes' || (!c.boxAsignado && box.id === 'sillon_1')
            )

            return (
              <div key={box.id} className="bg-white dark:bg-graphite-800 border border-graphite-200 dark:border-graphite-700 rounded-lg p-4 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-graphite-200 dark:border-graphite-700 pb-2">
                    <div>
                      <h3 className="font-semibold text-xs text-graphite-900 dark:text-graphite-50 uppercase tracking-wider">
                        {box.nombre}
                      </h3>
                      <span className="text-[10px] font-medium text-graphite-500 dark:text-graphite-400">
                        {box.especialidad}
                      </span>
                    </div>
                    <span
                      className="w-2.5 h-2.5 rounded-full bg-clinical-success animate-pulse"
                      title="Sillón Operativo"
                    />
                  </div>

                  <div className="space-y-3 min-h-[300px]">
                    {citasBox.length === 0 ? (
                      <EmptyState
                        compact
                        icon={Armchair}
                        title="Sin citas agendadas en este Box"
                        description="Disponible para reservas"
                        aria-live="polite"
                      />
                    ) : (
                      citasBox.map(cita => (
                        <CitaCard
                          key={cita.id}
                          cita={cita}
                          alCambiarEstado={cambiarEstadoCita}
                          alEnviarWhatsApp={enviarWhatsAppConfirmacion}
                          alVerFicha={funcionVerFicha}
                          alEliminar={eliminarCita}
                        />
                      ))
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Modales */}
      {modalNuevaCitaAbierto && (
        <ModalNuevaCita
          pacientes={pacientes}
          fechaPredeterminada={fechaSeleccionada}
          alGuardar={guardarCita}
          alCerrar={() => setModalNuevaCitaAbierto(false)}
        />
      )}

      {modalNuevoBloqueoAbierto && (
        <ModalNuevoBloqueo
          fechaPredeterminada={fechaSeleccionada}
          alGuardar={guardarCita}
          alCerrar={() => setModalNuevoBloqueoAbierto(false)}
          citasExistentes={citas}
        />
      )}
    </div>
  )
})

AgendaModulo.displayName = 'AgendaModulo'
