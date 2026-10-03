import React, { memo, useState } from 'react'
import { Mail, MessageCircle, ScrollText, Bell, ClipboardList } from 'lucide-react'
import {
  CANALES_COMUNICACION,
  ESTADOS_CONFIRMACION_CITA,
  type MensajeHistorial
} from './constants/comunicacionesConstants'
import { useComunicaciones } from './hooks/useComunicaciones'
import { ComunicacionesSummaryCards } from './components/ComunicacionesSummaryCards'
import { TablaHistorialMensajes } from './components/TablaHistorialMensajes'
import { PlantillasManager } from './components/PlantillasManager'
import { RecallPacientesSection, type PacienteRecall } from './components/RecallPacientesSection'
import { ModalEnviarMensaje } from './components/ModalEnviarMensaje'
import { ModalEditarBitacora } from './components/ModalEditarBitacora'
import { usePacientesStore } from '../../store/pacientesStore'
import { useSesionStore } from '../../store/sesionStore'

type TabComunicaciones = 'historial' | 'plantillas' | 'recall'

export const ComunicacionesModulo: React.FC = memo(() => {
  // (F2-02) — pacientes y userProfile ya no llegan como prop desde App.jsx: se leen directo de los stores.
  const pacientes = usePacientesStore((state) => state.pacientes)
  const userProfile = useSesionStore((state: { userProfile: { nombreCompleto?: string } | null }) => state.userProfile)

  const [tabActual, setTabActual] = useState<TabComunicaciones>('historial')
  const [modalNuevoAbierto, setModalNuevoAbierto] = useState<boolean>(false)
  const [registroEditarBitacora, setRegistroEditarBitacora] = useState<MensajeHistorial | null>(null)

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

  const handleEnviarRecall = (paciente: PacienteRecall, mensaje: string): void => {
    const registro: MensajeHistorial = {
      id: Date.now(),
      pacienteId: paciente.id,
      pacienteNombre: paciente.nombre,
      pacienteTelefono: String(paciente.telefono || 'N/I'),
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
          <h2 className="text-xl font-bold text-gray-900 dark:text-graphite-50 uppercase tracking-wider inline-flex items-center gap-2">
            <Mail size={20} />
            Comunicaciones & Fidelización
          </h2>
          <p className="text-xs text-gray-500 dark:text-graphite-400">
            Recordatorios de citas, confirmaciones bidireccionales, recalls de 6 meses y bitácora.
          </p>
        </div>

        <button
          onClick={() => setModalNuevoAbierto(true)}
          className="bg-primary hover:bg-champagne-600 dark:bg-gold-satin dark:hover:bg-primary text-white dark:text-graphite-950 text-xs font-bold px-4 py-2.5 rounded-lg transition-micro shadow-xs cursor-pointer"
        >
          <span className="inline-flex items-center gap-1">
            <MessageCircle size={12} />
            Transmitir Mensaje
          </span>
        </button>
      </div>

      <div className="print:hidden">
        <ComunicacionesSummaryCards resumen={resumen} />
      </div>

      <div className="flex gap-2 border-b border-surface pb-1 print:hidden text-xs overflow-x-auto">
        <button
          onClick={() => setTabActual('historial')}
          className={`px-4 py-2 rounded-lg font-bold transition-micro whitespace-nowrap cursor-pointer ${
            tabActual === 'historial'
              ? 'bg-primary dark:bg-gold-satin text-white dark:text-graphite-950 shadow-xs'
              : 'bg-slate-100 dark:bg-graphite-800 surgical:bg-surface text-graphite-600 dark:text-graphite-300 surgical:text-black hover:bg-slate-200 dark:hover:bg-graphite-900'
          }`}
        >
          <span className="inline-flex items-center gap-1">
            <ScrollText size={12} />
            Bitácora & Confirmaciones
          </span>
        </button>

        <button
          onClick={() => setTabActual('recall')}
          className={`px-4 py-2 rounded-lg font-bold transition-micro whitespace-nowrap cursor-pointer ${
            tabActual === 'recall'
              ? 'bg-primary dark:bg-gold-satin text-white dark:text-graphite-950 shadow-xs'
              : 'bg-slate-100 dark:bg-graphite-800 surgical:bg-surface text-graphite-600 dark:text-graphite-300 surgical:text-black hover:bg-slate-200 dark:hover:bg-graphite-900'
          }`}
        >
          <span className="inline-flex items-center gap-1">
            <Bell size={12} />
            Citación Recall (6 Meses)
          </span>
        </button>

        <button
          onClick={() => setTabActual('plantillas')}
          className={`px-4 py-2 rounded-lg font-bold transition-micro whitespace-nowrap cursor-pointer ${
            tabActual === 'plantillas'
              ? 'bg-primary dark:bg-gold-satin text-white dark:text-graphite-950 shadow-xs'
              : 'bg-slate-100 dark:bg-graphite-800 surgical:bg-surface text-graphite-600 dark:text-graphite-300 surgical:text-black hover:bg-slate-200 dark:hover:bg-graphite-900'
          }`}
        >
          <span className="inline-flex items-center gap-1">
            <ClipboardList size={12} />
            Gestor de Plantillas
          </span>
        </button>
      </div>

      {tabActual === 'historial' && (
        <>
          <div className="bg-slate-50 dark:bg-surface surgical:bg-surface p-4 border border-surface rounded-2xl flex justify-between items-center flex-wrap gap-3 text-xs print:hidden">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="font-semibold text-graphite-600 dark:text-graphite-400 surgical:text-black">
                Canal:
              </span>
              <select
                value={canalFiltro}
                onChange={(e) => setCanalFiltro(e.target.value)}
                className="p-2 border border-surface rounded-lg bg-white dark:bg-graphite-800 surgical:bg-graphite-200 text-graphite-900 dark:text-graphite-100 surgical:text-black font-semibold focus:ring-2 focus:ring-primary/40"
              >
                <option value="Todos">Todos los canales</option>
                {CANALES_COMUNICACION.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>

              <span className="font-semibold text-graphite-600 dark:text-graphite-400 surgical:text-black ml-2">
                Confirmación:
              </span>
              <select
                value={estadoFiltro}
                onChange={(e) => setEstadoFiltro(e.target.value)}
                className="p-2 border border-surface rounded-lg bg-white dark:bg-graphite-800 surgical:bg-graphite-200 text-graphite-900 dark:text-graphite-100 surgical:text-black font-semibold focus:ring-2 focus:ring-primary/40"
              >
                <option value="Todos">Todos los estados</option>
                {ESTADOS_CONFIRMACION_CITA.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nombre}
                  </option>
                ))}
              </select>
            </div>

            <input
              type="text"
              placeholder="Buscar por paciente o contenido..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="p-2 border border-surface rounded-lg bg-white dark:bg-graphite-800 surgical:bg-graphite-200 text-graphite-900 dark:text-graphite-100 surgical:text-black w-full sm:w-64 focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <TablaHistorialMensajes
            historial={historial}
            onCambiarEstado={cambiarEstadoConfirmacion}
            onEditarBitacora={setRegistroEditarBitacora}
            onEliminarBitacora={(id) => void eliminarRegistroBitacora(id)}
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
          alEliminarPlantilla={(id) => void eliminarPlantilla(id)}
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
export default ComunicacionesModulo
