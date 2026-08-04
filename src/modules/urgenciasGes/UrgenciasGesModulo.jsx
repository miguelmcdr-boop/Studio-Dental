import React, { memo } from 'react'
import { useUrgenciasGes } from './hooks/useUrgenciasGes'
import { FormConstanciaGes } from './components/FormConstanciaGes'
import { DocumentoImpresoGes } from './components/DocumentoImpresoGes'

export const UrgenciasGesModulo = memo(({ pacientes = [], userProfile }) => {
  const {
    atenciones,
    atencionSeleccionada,
    setAtencionSeleccionada,
    registrarAtencion,
    eliminarAtencion
  } = useUrgenciasGes()

  return (
    <div className="space-y-6">
      <div className="border-b pb-3 print:hidden">
        <h2 className="text-xl font-bold text-gray-900 uppercase tracking-wider">🚨 Atenciones de Urgencia y Notificaciones GES / AUGE</h2>
        <p className="text-xs text-gray-500">Gestión de Urgencia Odontológica Ambulatoria y emisión de constancias normadas Ley 19.966.</p>
      </div>

      <div className="print:hidden">
        <FormConstanciaGes pacientes={pacientes} alRegistrar={registrarAtencion} />
      </div>

      {atencionSeleccionada ? (
        <DocumentoImpresoGes
          atencion={atencionSeleccionada}
          userProfile={userProfile}
          alCerrar={() => setAtencionSeleccionada(null)}
        />
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-3 print:hidden text-xs">
          <h4 className="font-bold text-xs text-gray-800 uppercase tracking-wider">Historial de Notificaciones GES Emitidas ({atenciones.length})</h4>
          
          {atenciones.length === 0 ? (
            <p className="text-gray-400 py-4 text-center">No hay constancias GES emitidas aún.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {atenciones.map((item) => (
                <div key={item.id} className="py-3 flex justify-between items-center flex-wrap gap-2 hover:bg-gray-50 p-2 rounded-xl">
                  <div>
                    <span className="font-bold text-gray-900 block">{item.pacienteNombre} ({item.pacienteRut})</span>
                    <span className="text-[10px] font-semibold text-blue-900 block">[{item.patologiaCodigo}] {item.patologiaNombre} — Folio: {item.folio}</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setAtencionSeleccionada(item)}
                      className="bg-black text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-800"
                    >
                      📄 Ver / Imprimir
                    </button>
                    <button
                      onClick={() => eliminarAtencion(item.id)}
                      className="bg-red-50 text-red-700 px-2 py-1.5 rounded-lg text-xs font-bold hover:bg-red-100"
                    >
                      🗑️
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