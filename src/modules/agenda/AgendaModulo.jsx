import React, { memo } from 'react'
import { useAgenda } from './hooks/useAgenda'
import { AgendaSummaryCards } from './components/AgendaSummaryCards'
import { CitaCard } from './components/CitaCard'
import { ModalNuevaCita } from './components/ModalNuevaCita'
import { ModalNuevoBloqueo } from './components/ModalNuevoBloqueo'
import { SILLONES_DENTALES } from './constants/agendaConstants'

export const AgendaModulo = memo(({ pacientes: pacientesProp = [], alSeleccionarPaciente, alVerFichaPaciente }) => {
  const {
    citas,
    pacientes,
    fechaSeleccionada,
    setFechaSeleccionada,
    irAHoy,
    modalNuevaCitaAbierto,
    setModalNuevaCitaAbierto,
    modalNuevoBloqueoAbierto,
    setModalNuevoBloqueoAbierto,
    guardarCita,
    eliminarCita,
    cambiarEstadoCita,
    enviarWhatsAppConfirmacion
  } = useAgenda(pacientesProp)

  const citasDelDia = citas.filter(c => c.fecha === fechaSeleccionada)
  const funcionVerFicha = alSeleccionarPaciente || alVerFichaPaciente

  return (
    <div className="space-y-6">
      {/* Cabecera Principal */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
            <span>📅</span> AGENDA MULTI-BOX & CONTROL DE SILLONES
          </h2>
          <p className="text-xs text-gray-500">
            Gestión inteligente de citas, ocupación de Boxes y confirmación omnicanal.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={irAHoy}
            className="px-3.5 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 font-extrabold text-xs hover:bg-blue-100 cursor-pointer shadow-2xs flex items-center gap-1.5 transition-all"
          >
            📅 Hoy
          </button>

          <input
            type="date"
            value={fechaSeleccionada}
            onChange={(e) => setFechaSeleccionada(e.target.value)}
            className="p-2.5 rounded-xl border border-gray-300 font-bold text-xs bg-white focus:outline-none focus:border-black shadow-2xs cursor-pointer"
          />

          <button
            type="button"
            onClick={() => setModalNuevoBloqueoAbierto(true)}
            className="px-3.5 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-800 text-xs font-bold border border-red-200 transition-all cursor-pointer flex items-center gap-1.5"
          >
            ⛔ Añadir Bloqueo
          </button>

          <button
            type="button"
            onClick={() => setModalNuevaCitaAbierto(true)}
            className="px-4 py-2.5 rounded-xl bg-black hover:bg-gray-800 text-white text-xs font-black transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            ➕ Agendar Nueva Cita
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <AgendaSummaryCards citas={citasDelDia} />

      {/* Parrilla Multi-Box */}
      <div className="bg-gray-50 border border-gray-200 rounded-3xl p-6 overflow-x-auto shadow-2xs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 min-w-[800px]">
          {SILLONES_DENTALES.map(box => {
            const citasBox = citasDelDia.filter(
              c => c.boxAsignado === box.nombre || c.boxAsignado === 'Todos los Boxes' || (!c.boxAsignado && box.id === 'sillon_1')
            )

            return (
              <div key={box.id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-2xs space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b pb-2">
                    <div>
                      <h3 className="font-extrabold text-xs text-gray-900 uppercase tracking-wider">{box.nombre}</h3>
                      <span className="text-[10px] font-semibold text-gray-500">{box.especialidad}</span>
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Sillón Operativo"></span>
                  </div>

                  <div className="space-y-3 min-h-[300px]">
                    {citasBox.length === 0 ? (
                      <div className="h-full min-h-[250px] flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-4 text-center">
                        <span className="text-2xl mb-1">🪑</span>
                        <span className="text-xs font-bold text-gray-400">Sin citas agendadas en este Box</span>
                        <span className="text-[10px] text-gray-400 mt-0.5">Disponible para reservas</span>
                      </div>
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
        />
      )}
    </div>
  )
})

AgendaModulo.displayName = 'AgendaModulo'