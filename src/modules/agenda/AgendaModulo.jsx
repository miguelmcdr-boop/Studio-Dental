import React, { memo, useState } from 'react'
import { useAgenda } from './hooks/useAgenda'
import { AgendaCalendarioHeader } from './components/AgendaCalendarioHeader'
import { CitaCard } from './components/CitaCard'
import { ModalNuevaCita } from './components/ModalNuevaCita'

export const AgendaModulo = memo(({ pacientes = [], userProfile, alSeleccionarPaciente }) => {
  const [modalAbierto, setModalAbierto] = useState(false)

  const {
    citasFiltradas,
    fechaSeleccionada,
    setFechaSeleccionada,
    boxFiltro,
    setBoxFiltro,
    busquedaPaciente,
    setBusquedaPaciente,
    agregarCita,
    actualizarEstadoCita,
    eliminarCita
  } = useAgenda()

  return (
    <div className="space-y-6">
      <AgendaCalendarioHeader
        fechaSeleccionada={fechaSeleccionada}
        setFechaSeleccionada={setFechaSeleccionada}
        boxFiltro={boxFiltro}
        setBoxFiltro={setBoxFiltro}
        busquedaPaciente={busquedaPaciente}
        setBusquedaPaciente={setBusquedaPaciente}
        onAbrirModalNuevaCita={() => setModalAbierto(true)}
      />

      <div className="space-y-3">
        <h4 className="font-bold text-xs text-gray-700 uppercase tracking-wider">
          Citas Programadas ({citasFiltradas.length})
        </h4>

        {citasFiltradas.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center text-xs text-gray-400">
            <p className="text-2xl mb-1">📅</p>
            <p className="font-semibold">No hay citas registradas para los filtros seleccionados.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {citasFiltradas.map(cita => (
              <CitaCard
                key={cita.id}
                cita={cita}
                pacientes={pacientes}
                userProfile={userProfile}
                onActualizarEstado={actualizarEstadoCita}
                onEliminarCita={eliminarCita}
                onAbrirFichaPaciente={alSeleccionarPaciente}
              />
            ))}
          </div>
        )}
      </div>

      {modalAbierto && (
        <ModalNuevaCita
          pacientes={pacientes}
          fechaDefecto={fechaSeleccionada}
          alGuardar={agregarCita}
          alCerrar={() => setModalAbierto(false)}
        />
      )}
    </div>
  )
})

AgendaModulo.displayName = 'AgendaModulo'