import React, { memo, useState } from 'react'
import { Mail, MessageCircle, ScrollText, Bell, ClipboardList } from 'lucide-react'
import { CANALES_COMUNICACION, ESTADOS_CONFIRMACION_CITA } from './constants/comunicacionesConstants'
import { useComunicaciones } from './hooks/useComunicaciones'
import { ComunicacionesSummaryCards } from './components/ComunicacionesSummaryCards'
import { TablaHistorialMensajes } from './components/TablaHistorialMensajes'
import { PlantillasManager } from './components/PlantillasManager'
import { RecallPacientesSection } from './components/RecallPacientesSection'
import { ModalEnviarMensaje } from './components/ModalEnviarMensaje'
import { ModalEditarBitacora } from './components/ModalEditarBitacora'
import { usePacientesStore } from '../../store/pacientesStore'
import { useSesionStore } from '../../store/sesionStore'

export const ComunicacionesModulo = memo(() => {
  // (F2-02) — pacientes y userProfile ya no llegan como prop desde App.jsx: se leen directo de los stores.
  const pacientes = usePacientesStore((state) => state.pacientes)
  const userProfile = useSesionStore((state) => state.userProfile)

  const [tabActual, setTabActual] = useState('historial') // 'historial' | 'plantillas' | 'recall'
  const [modalNuevoAbierto, setModalNuevoAbierto] = useState(false)
  const [registroEditarBitacora, setRegistroEditarBitacora] = useState(null)

  const {
    plantillas,
    historial,
    resumen,
    busqueda,
    setBusqueda,
    canalFiltro,
    setCanalFiltro,
    estadoFiltro,
    setEstadoFiltro,
    registrarOActualizarEnvio,
    cambiarEstadoConfirmacion,
    eliminarRegistroBitacora,
    agregarOEditarPlantilla,
    eliminarPlantilla
  } = useComunicaciones()

  const handleEnviarRecall = (paciente, mensaje) => {
    const registro = {
      id: Date.now(),
      pacienteId: paciente.id,
      pacienteNombre: paciente.nombre,
      pacienteTelefono: paciente.telefono || 'N/I',
      pacienteEmail: paciente.email || 'N/I',
      canal: 'whatsapp',
      plantillaNombre: 'Recall / Control 6 Meses',
      mensajeEnviado: mensaje,
      fechaEnvio: new Date().toLocaleDateString('es-CL'),
      horaEnvio: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
      estado: 'Enviado',
      notaBitacora: 'Recall preventivo enviado desde panel de comunicaciones.'
    }
    registrarOActualizarEnvio(registro)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3 print:hidden">
        <div>
          {/* 💡 Título actualizado sin "Gold Standard" */}
          <h2 className="text-xl font-bold text-gray-900 dark:text-graphite-50 uppercase tracking-wider inline-flex items-center gap-2"><Mail size={20} />Comunicaciones & Fidelización</h2>
          <p className="text-xs text-gray-500 dark:text-graphite-400">Recordatorios de citas, confirmaciones bidireccionales, recalls de 6 meses y bitácora.</p>
        </div>

        <button
          onClick={() => setModalNuevoAbierto(true)}
          className="bg-black text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-gray-800 transition-colors shadow-xs cursor-pointer"
        >
          <span className="inline-flex items-center gap-1"><MessageCircle size={12} />Transmitir Mensaje</span>
        </button>
      </div>

      <div className="print:hidden">
        <ComunicacionesSummaryCards resumen={resumen} />
      </div>

      <div className="flex gap-2 border-b pb-1 print:hidden text-xs overflow-x-auto">
        <button
          onClick={() => setTabActual('historial')}
          className={`px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
            tabActual === 'historial' ? 'bg-black text-white shadow-xs' : 'bg-gray-100 dark:bg-graphite-800 text-gray-600 dark:text-graphite-400 hover:bg-gray-200'
          }`}
        >
          <span className="inline-flex items-center gap-1"><ScrollText size={12} />Bitácora & Confirmaciones</span>
        </button>

        <button
          onClick={() => setTabActual('recall')}
          className={`px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
            tabActual === 'recall' ? 'bg-black text-white shadow-xs' : 'bg-gray-100 dark:bg-graphite-800 text-gray-600 dark:text-graphite-400 hover:bg-gray-200'
          }`}
        >
          <span className="inline-flex items-center gap-1"><Bell size={12} />Citación Recall (6 Meses)</span>
        </button>

        <button
          onClick={() => setTabActual('plantillas')}
          className={`px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
            tabActual === 'plantillas' ? 'bg-black text-white shadow-xs' : 'bg-gray-100 dark:bg-graphite-800 text-gray-600 dark:text-graphite-400 hover:bg-gray-200'
          }`}
        >
          <span className="inline-flex items-center gap-1"><ClipboardList size={12} />Gestor de Plantillas</span>
        </button>
      </div>

      {tabActual === 'historial' && (
        <>
          <div className="bg-gray-50 dark:bg-graphite-800 p-4 border border-gray-200 dark:border-graphite-700 rounded-2xl flex justify-between items-center flex-wrap gap-3 text-xs print:hidden">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="font-semibold text-gray-600 dark:text-graphite-400">Canal:</span>
              <select
                value={canalFiltro}
                onChange={(e) => setCanalFiltro(e.target.value)}
                className="p-2 border rounded-xl bg-white dark:bg-graphite-800 font-semibold"
              >
                <option value="Todos">Todos los canales</option>
                {CANALES_COMUNICACION.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>

              <span className="font-semibold text-gray-600 dark:text-graphite-400 ml-2">Confirmación:</span>
              <select
                value={estadoFiltro}
                onChange={(e) => setEstadoFiltro(e.target.value)}
                className="p-2 border rounded-xl bg-white dark:bg-graphite-800 font-semibold"
              >
                <option value="Todos">Todos los estados</option>
                {ESTADOS_CONFIRMACION_CITA.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
            </div>

            <input
              type="text"
              placeholder="Buscar por paciente o contenido..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="p-2 border rounded-xl bg-white dark:bg-graphite-800 w-full sm:w-64"
            />
          </div>

          <TablaHistorialMensajes
            historial={historial}
            onCambiarEstado={cambiarEstadoConfirmacion}
            onEditarBitacora={setRegistroEditarBitacora}
            onEliminarBitacora={eliminarRegistroBitacora}
          />
        </>
      )}

      {tabActual === 'recall' && (
        <RecallPacientesSection
          pacientes={pacientes}
          alEnviarRecall={handleEnviarRecall}
        />
      )}

      {tabActual === 'plantillas' && (
        <PlantillasManager
          plantillas={plantillas}
          alGuardarPlantilla={agregarOEditarPlantilla}
          alEliminarPlantilla={eliminarPlantilla}
        />
      )}

      {modalNuevoAbierto && (
        <ModalEnviarMensaje
          pacientes={pacientes}
          plantillas={plantillas}
          userProfile={userProfile}
          alRegistrarEnvio={registrarOActualizarEnvio}
          alCerrar={() => setModalNuevoAbierto(false)}
        />
      )}

      {registroEditarBitacora && (
        <ModalEditarBitacora
          registroEditar={registroEditarBitacora}
          alGuardar={registrarOActualizarEnvio}
          alCerrar={() => setRegistroEditarBitacora(null)}
        />
      )}
    </div>
  )
})

ComunicacionesModulo.displayName = 'ComunicacionesModulo'