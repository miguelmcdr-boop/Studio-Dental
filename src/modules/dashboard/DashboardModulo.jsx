import React, { memo } from 'react'
import { useDashboard } from './hooks/useDashboard'
import { DashboardHeader } from './components/DashboardHeader'
import { DashboardKpiCards } from './components/DashboardKpiCards'
import { CitasHoyWidget } from './components/CitasHoyWidget'
import { AccesosRapidosWidget } from './components/AccesosRapidosWidget'

export const DashboardModulo = memo(({ userProfile, pacientes = [], setPacienteSeleccionado, setActiveSection }) => {
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CitasHoyWidget
          citasHoy={resumen.citasHoy}
          pacientes={pacientes}
          alSeleccionarPaciente={handleVerFichaPaciente}
        />

        <AccesosRapidosWidget setActiveSection={setActiveSection} />
      </div>
    </div>
  )
})

DashboardModulo.displayName = 'DashboardModulo'