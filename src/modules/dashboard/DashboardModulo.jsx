import React, { memo } from 'react'
import { useDashboard } from './hooks/useDashboard'
import { DashboardHeader } from './components/DashboardHeader'
import { DashboardKpiCards } from './components/DashboardKpiCards'
import { SalaEsperaWidget } from './components/SalaEsperaWidget'
import { CitasHoyWidget } from './components/CitasHoyWidget'
import { AccesosRapidosWidget } from './components/AccesosRapidosWidget'
import { AlertasOperativasWidget } from './components/AlertasOperativasWidget'
import { TareasClinicasWidget } from './components/TareasClinicasWidget'
import { TendenciasWidget } from './components/TendenciasWidget'
import { NoShowWidget } from './components/NoShowWidget'
import { usePacientesStore } from '../../store/pacientesStore'
import { useSesionStore } from '../../store/sesionStore'

export const DashboardModulo = memo(({ setPacienteSeleccionado, setActiveSection }) => {
  // (F2-02) — pacientes y userProfile ya no llegan como prop desde App.jsx: se leen directo de los stores.
  const pacientes = usePacientesStore((state) => state.pacientes)
  const userProfile = useSesionStore((state) => state.userProfile)

  const { resumen, metricasAvanzadas } = useDashboard(pacientes)

  const handleVerFichaPaciente = (paciente) => {
    if (setPacienteSeleccionado && setActiveSection) {
      setPacienteSeleccionado(paciente)
      setActiveSection('Pacientes')
    }
  }

  const handleNavegarAlerta = (alerta) => {
    // Navegar al contexto según tipo de alerta
    if (alerta.pacienteId && setPacienteSeleccionado && setActiveSection) {
      const paciente = pacientes.find((p) => p.id === alerta.pacienteId)
      if (paciente) {
        handleVerFichaPaciente(paciente)
      }
    } else if (alerta.citaId && setActiveSection) {
      setActiveSection('Agenda')
    }
  }

  const handleNavegarTarea = (tarea) => {
    // Navegar al paciente/módulo según tipo de tarea
    if (tarea.pacienteId && setPacienteSeleccionado && setActiveSection) {
      const paciente = pacientes.find((p) => p.id === tarea.pacienteId)
      if (paciente) {
        handleVerFichaPaciente(paciente)
      }
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

      {/* F7-27: Widgets de alertas y tareas operativas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AlertasOperativasWidget
          alertas={metricasAvanzadas?.alertas || []}
          onNavegarAlerta={handleNavegarAlerta}
        />
        <TareasClinicasWidget
          tareas={metricasAvanzadas?.tareas || []}
          onNavegarTarea={handleNavegarTarea}
        />
      </div>

      {/* F7-27: Widgets de tendencias y no-show */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TendenciasWidget
          tendenciaCitas7Dias={metricasAvanzadas?.tendenciaCitas7Dias || []}
          tendenciaCitas30Dias={metricasAvanzadas?.tendenciaCitas30Dias || []}
        />
        <NoShowWidget citas={resumen.citasHoy || []} />
      </div>

      <AccesosRapidosWidget setActiveSection={setActiveSection} />
    </div>
  )
})

DashboardModulo.displayName = 'DashboardModulo'