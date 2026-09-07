import React, { memo, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { useConfiguracion } from './hooks/useConfiguracion'
import { PerfilProfesionalForm } from './components/PerfilProfesionalForm'
import { DatosClinicaForm } from './components/DatosClinicaForm'
import { ParametrosAgendaForm } from './components/ParametrosAgendaForm'
import { RespaldoDatosSection } from './components/RespaldoDatosSection'
import { useSesionStore } from '../../store/sesionStore'

export const ConfiguracionModulo = memo(() => {
  // (F2-02) — userProfile/setUserProfile ya no llegan como prop desde App.jsx: se leen directo del store.
  const userProfile = useSesionStore((state) => state.userProfile)
  const setUserProfile = useSesionStore((state) => state.actualizarPerfil)

  const [tabActual, setTabActual] = useState('perfil')

  const {
    datosClinica,
    parametrosAgenda,
    guardarPerfilProfesional,
    guardarDatosClinica,
    guardarParametrosAgenda,
    ejecutarExportacionBackup,
    ejecutarImportacionBackup
  } = useConfiguracion(userProfile, setUserProfile)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-gray-900 uppercase tracking-wider">⚡ Configuración del Sistema & Respaldos</h2>
          <p className="text-xs text-gray-500">Personalización de membrete, perfil profesional, firma digital y copias de seguridad.</p>
        </div>
      </div>

      <div className="flex gap-2 border-b pb-1 print:hidden text-xs overflow-x-auto">
        <Button
          onClick={() => setTabActual('perfil')}
          variant={tabActual === 'perfil' ? 'primary' : 'secondary'}
          size="sm"
        >
          👤 Perfil Profesional
        </Button>

        <Button
          onClick={() => setTabActual('clinica')}
          variant={tabActual === 'clinica' ? 'primary' : 'secondary'}
          size="sm"
        >
          🏢 Membrete Clínica
        </Button>

        <Button
          onClick={() => setTabActual('agenda')}
          variant={tabActual === 'agenda' ? 'primary' : 'secondary'}
          size="sm"
        >
          📅 Parámetros Agenda
        </Button>

        <Button
          onClick={() => setTabActual('respaldo')}
          variant={tabActual === 'respaldo' ? 'primary' : 'secondary'}
          size="sm"
        >
          💾 Respaldos JSON
        </Button>
      </div>

      {tabActual === 'perfil' && (
        <PerfilProfesionalForm userProfile={userProfile} alGuardar={guardarPerfilProfesional} />
      )}

      {tabActual === 'clinica' && (
        <DatosClinicaForm datosClinica={datosClinica} alGuardar={guardarDatosClinica} userProfile={userProfile} />
      )}

      {tabActual === 'agenda' && (
        <ParametrosAgendaForm parametrosAgenda={parametrosAgenda} alGuardar={guardarParametrosAgenda} />
      )}

      {tabActual === 'respaldo' && (
        <RespaldoDatosSection
          alExportarBackup={ejecutarExportacionBackup}
          alImportarBackup={ejecutarImportacionBackup}
        />
      )}
    </div>
  )
})

ConfiguracionModulo.displayName = 'ConfiguracionModulo'