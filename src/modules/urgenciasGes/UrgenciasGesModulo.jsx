import React, { memo } from 'react'
import { Siren, FileText, Trash2 } from 'lucide-react'
import { Icon } from '../../components/Icon'
import { useUrgenciasGes } from './hooks/useUrgenciasGes'
import { FormRegistroGes } from './components/FormRegistroUrgencia'
import { DocumentoImpresoGes } from './components/DocumentoImpresoGes'
import { usePacientesStore } from '../../store/pacientesStore'
import { useSesionStore } from '../../store/sesionStore'

export const UrgenciasGesModulo = memo(() => {
  // (F2-02) — pacientes y userProfile ya no llegan como prop desde App.jsx: se leen directo de los stores.
  const pacientes = usePacientesStore((state) => state.pacientes)
  const userProfile = useSesionStore((state) => state.userProfile)

  const {
    atenciones,
    atencionSeleccionada,
    setAtencionSeleccionada,
    registrarAtencion,
    eliminarAtencion
  } = useUrgenciasGes()

  return (
    <div className="space-y-6">
      <div className="border-b border-surface pb-3 print:hidden">
        <h2 className="text-xl font-bold text-gray-900 dark:text-graphite-50 uppercase tracking-wider flex items-center gap-2">
          <Icon icon={Siren} size="md" />
          Atenciones de Urgencia y Notificaciones GES / AUGE
        </h2>
        <p className="text-xs text-gray-500 dark:text-graphite-400">Gestión de Urgencia Odontológica Ambulatoria y emisión de constancias normadas Ley 19.966.</p>
      </div>

      <div className="print:hidden">
        <FormRegistroGes pacientes={pacientes} alRegistrar={registrarAtencion} />
      </div>

      {atencionSeleccionada ? (
        <DocumentoImpresoGes
          atencion={atencionSeleccionada}
          userProfile={userProfile}
          alCerrar={() => setAtencionSeleccionada(null)}
        />
      ) : (
        <div className="bg-surface border border-surface rounded-2xl p-6 shadow-xs space-y-3 print:hidden text-xs">
          <h4 className="font-bold text-xs text-graphite-800 dark:text-graphite-100 surgical:text-black uppercase tracking-wider">Historial de Notificaciones GES Emitidas ({atenciones.length})</h4>
          
          {atenciones.length === 0 ? (
            <p className="text-graphite-400 dark:text-graphite-500 py-4 text-center">No hay constancias GES emitidas aún.</p>
          ) : (
            <div className="divide-y divide-surface">
              {atenciones.map((item) => (
                <div key={item.id} className="py-3 flex justify-between items-center flex-wrap gap-2 hover:bg-slate-50 dark:hover:bg-graphite-800/50 surgical:hover:bg-graphite-200 p-2 rounded-lg transition-micro">
                  <div>
                    <span className="font-bold text-graphite-900 dark:text-graphite-50 surgical:text-black block">{item.pacienteNombre} (<span className="tabular-nums">{item.pacienteRut}</span>)</span>
                    <span className="text-[10px] font-semibold text-sky-800 dark:text-sky-300 block">[{item.patologiaCodigo}] {item.patologiaNombre} — Folio: <span className="tabular-nums font-mono">{item.folio}</span></span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setAtencionSeleccionada(item)}
                      className="bg-primary hover:bg-champagne-600 dark:bg-gold-satin dark:hover:bg-primary text-white dark:text-graphite-950 px-3 py-1.5 rounded-lg text-xs font-bold transition-micro cursor-pointer"
                    >
                      <span className="inline-flex items-center gap-1"><FileText size={12} />Ver / Imprimir</span>
                    </button>
                    <button
                      onClick={() => eliminarAtencion(item.id)}
                      className="bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 px-2 py-1.5 rounded-lg text-xs font-bold transition-micro cursor-pointer"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
})

UrgenciasGesModulo.displayName = 'UrgenciasGesModulo'