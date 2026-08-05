import React, { memo, useState } from 'react'
import { BOXES_DENTALES } from './constants/agendaConstants'
import { useAgenda } from './hooks/useAgenda'
import { AgendaSummaryCards } from './components/AgendaSummaryCards'
import { AgendaViewSelector } from './components/AgendaViewSelector'
import { CitaCard } from './components/CitaCard'
import { ModalNuevaCita } from './components/ModalNuevaCita'

export const AgendaModulo = memo(({ pacientes = [], userProfile, alSeleccionarPaciente, alCrearPacienteRapido }) => {
  const [modalAbierto, setModalAbierto] = useState(false)
  const [citaEditar, setCitaEditar] = useState(null)

  const {
    citas,
    resumen,
    fechaSeleccionadaIso,
    setFechaSeleccionadaIso,
    boxFiltro,
    setBoxFiltro,
    agendarOActualizarCita,
    cambiarEstadoCita,
    eliminarCita
  } = useAgenda()

  const handleAbrirNuevo = () => {
    setCitaEditar(null)
    setModalAbierto(true)
  }

  const handleAbrirEditar = (cita) => {
    setCitaEditar(cita)
    setModalAbierto(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-gray-900 uppercase tracking-wider">📅 Agenda Multi-Box & Control de Sillones</h2>
          <p className="text-xs text-gray-500">Gestión de flujo de pacientes, sala de espera y asignación de boxes odontológicos.</p>
        </div>

        <button
          onClick={handleAbrirNuevo}
          className="bg-black text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-gray-800 transition-colors shadow-xs cursor-pointer"
        >
          + Agendar Nueva Cita
        </button>
      </div>

      <div className="print:hidden">
        <AgendaSummaryCards resumen={resumen} />
      </div>

      <AgendaViewSelector
        fechaSeleccionadaIso={fechaSeleccionadaIso}
        setFechaSeleccionadaIso={setFechaSeleccionadaIso}
        boxFiltro={boxFiltro}
        setBoxFiltro={setBoxFiltro}
      />

      {citas.length === 0 ? (
        <div className="p-10 text-center text-xs text-gray-400 bg-white border border-gray-200 rounded-2xl">
          No hay citas agendadas para la fecha y box seleccionado.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {citas.map(cita => (
            <CitaCard
              key={cita.id}
              cita={cita}
              pacientes={pacientes}
              onCambiarEstado={cambiarEstadoCita}
              onEditar={handleAbrirEditar}
              onEliminar={eliminarCita}
              alSeleccionarPaciente={alSeleccionarPaciente}
            />
          ))}
        </div>
      )}

      {modalAbierto && (
        <ModalNuevaCita
          citaEditar={citaEditar}
          pacientes={pacientes}
          userProfile={userProfile}
          alGuardar={agendarOActualizarCita}
          alCrearPacienteRapido={alCrearPacienteRapido}
          alCerrar={() => setModalAbierto(false)}
        />
      )}
    </div>
  )
})

AgendaModulo.displayName = 'AgendaModulo'