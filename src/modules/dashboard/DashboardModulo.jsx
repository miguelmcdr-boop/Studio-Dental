import React, { memo } from 'react'
import { useDashboard } from './hooks/useDashboard'
import { DashboardHeader } from './components/DashboardHeader'
import { DashboardKpiCards } from './components/DashboardKpiCards'
import { SalaEsperaWidget } from './components/SalaEsperaWidget'
import { CitasHoyWidget } from './components/CitasHoyWidget'
import { AccesosRapidosWidget } from './components/AccesosRapidosWidget'
import { usePacientesStore } from '../../store/pacientesStore'
import { useSesionStore } from '../../store/sesionStore'

export const DashboardModulo = memo(({ setPacienteSeleccionado, setActiveSection }) => {
  // (F2-02) — pacientes y userProfile ya no llegan como prop desde App.jsx: se leen directo de los stores.
  const pacientes = usePacientesStore((state) => state.pacientes)
  const userProfile = useSesionStore((state) => state.userProfile)

  const { resumen } = useDashboard(pacientes)

  const handleVerFichaPaciente = (paciente) => {
    if (setPacienteSeleccionado && setActiveSection) {
      setPacienteSeleccionado(paciente)
      setActiveSection('Pacientes')
    }
  }

  return (
    <div className="space-y-6">
      <DashboardHeader userProfile={userProfile} />

      <DashboardKpiCards resumen={resumen} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalaEsperaWidget
          enEspera={resumen.enEspera}
          enAtencion={resumen.enAtencion}
          pacientes={pacientes}
          alSeleccionarPaciente={handleVerFichaPaciente}
        />

        <CitasHoyWidget
          citasHoy={resumen.citasHoy}
          pacientes={pacientes}
          alSeleccionarPaciente={handleVerFichaPaciente}
        />
      </div>

      <AccesosRapidosWidget setActiveSection={setActiveSection} />
    </div>
  )
})

DashboardModulo.displayName = 'DashboardModulo'