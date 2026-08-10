import React, { memo, useState } from 'react'
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
        <button
          onClick={() => setTabActual('perfil')}
          className={`px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
            tabActual === 'perfil' ? 'bg-black text-white shadow-xs' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          👤 Perfil Profesional
        </button>

        <button
          onClick={() => setTabActual('clinica')}
          className={`px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
            tabActual === 'clinica' ? 'bg-black text-white shadow-xs' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          🏢 Membrete Clínica
        </button>

        <button
          onClick={() => setTabActual('agenda')}
          className={`px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
            tabActual === 'agenda' ? 'bg-black text-white shadow-xs' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          📅 Parámetros Agenda
        </button>

        <button
          onClick={() => setTabActual('respaldo')}
          className={`px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
            tabActual === 'respaldo' ? 'bg-black text-white shadow-xs' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          💾 Respaldos JSON
        </button>
      </div>

      {tabActual === 'perfil' && (
        <PerfilProfesionalForm userProfile={userProfile} alGuardar={guardarPerfilProfesional} />
      )}

      {tabActual === 'clinica' && (
        <DatosClinicaForm datosClinica={datosClinica} alGuardar={guardarDatosClinica} />
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