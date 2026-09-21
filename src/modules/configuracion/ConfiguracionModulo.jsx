import React, { memo, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { useConfiguracion } from './hooks/useConfiguracion'
import { PerfilProfesionalForm } from './components/PerfilProfesionalForm'
import { DatosClinicaForm } from './components/DatosClinicaForm'
import { ParametrosAgendaForm } from './components/ParametrosAgendaForm'
import { RespaldoDatosSection } from './components/RespaldoDatosSection'
import { useSesionStore } from '../../store/sesionStore'
import { Zap, User, Building2, Calendar, Save } from 'lucide-react'

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
          <h2 className="text-xl font-bold text-gray-900 dark:text-graphite-50 uppercase tracking-wider inline-flex items-center gap-2"><Zap size={20} />Configuración del Sistema & Respaldos</h2>
          <p className="text-xs text-gray-500 dark:text-graphite-400">Personalización de membrete, perfil profesional, firma digital y copias de seguridad.</p>
        </div>
      </div>

      <div className="flex gap-2 border-b pb-1 print:hidden text-xs overflow-x-auto">
        <Button
          onClick={() => setTabActual('perfil')}
          variant={tabActual === 'perfil' ? 'primary' : 'secondary'}
          size="sm"
        >
          <span className="inline-flex items-center gap-1"><User size={12} />Perfil Profesional</span>
        </Button>

        <Button
          onClick={() => setTabActual('clinica')}
          variant={tabActual === 'clinica' ? 'primary' : 'secondary'}
          size="sm"
        >
          <span className="inline-flex items-center gap-1"><Building2 size={12} />Membrete Clínica</span>
        </Button>

        <Button
          onClick={() => setTabActual('agenda')}
          variant={tabActual === 'agenda' ? 'primary' : 'secondary'}
          size="sm"
        >
          <span className="inline-flex items-center gap-1"><Calendar size={12} />Parámetros Agenda</span>
        </Button>

        <Button
          onClick={() => setTabActual('respaldo')}
          variant={tabActual === 'respaldo' ? 'primary' : 'secondary'}
          size="sm"
        >
          <span className="inline-flex items-center gap-1"><Save size={12} />Respaldos JSON</span>
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