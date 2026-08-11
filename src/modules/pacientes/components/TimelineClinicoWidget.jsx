import React, { memo, useState, useMemo } from 'react'

export const TimelineClinicoWidget = memo(({
  evolucionesNotas = [],
  itemsPresupuesto = [],
  recetas = [],
  certificados = [],
  _adjuntos = []
}) => {
  const [filtroTipo, setFiltroTipo] = useState('todos')

  // Consolidador de eventos cronológicos
  const eventosConsolidados = useMemo(() => {
    const lista = []

    // 1. Evoluciones de Bitácora
    evolucionesNotas.forEach(ev => {
      lista.push({
        id: `ev_${ev.id}`,
        tipo: 'Evolución',
        icono: '📝',
        badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
        fecha: ev.fecha,
        timestamp: ev.id,
        titulo: 'Nota Clínica de Evolución',
        detalle: ev.texto
      })
    })

    // 2. Tratamientos Realizados en Presupuestos
    itemsPresupuesto.filter(i => i.estado === 'Realizado').forEach(tr => {
      lista.push({
        id: `tr_${tr.id}`,
        tipo: 'Tratamiento',
        icono: '🟢',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        fecha: new Date(tr.id).toLocaleDateString('es-CL'),
        timestamp: tr.id,
        titulo: `Tratamiento Completado: ${tr.prestacion}`,
        detalle: `Pieza: ${tr.pieza} | Convenio: ${tr.convenio || 'Particular'} | Valor: $${tr.valor?.toLocaleString('es-CL')} CLP`
      })
    })

    // 3. Recetas Emitidas
    recetas.forEach(rec => {
      lista.push({
        id: `rec_${rec.id}`,
        tipo: 'Receta',
        icono: '💊',
        badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
        fecha: rec.fecha || new Date(rec.id).toLocaleDateString('es-CL'),
        timestamp: rec.id,
        titulo: 'Receta Médica Emitida',
        detalle: Array.isArray(rec.fármacos)
          ? rec.fármacos.map(f => `${f.nombre} (${f.posologia})`).join(' — ')
          : rec.indicaciones || 'Prescripción estándar'
      })
    })

    // 4. Certificados Emitidos
    certificados.forEach(cert => {
      lista.push({
        id: `cert_${cert.id}`,
        tipo: 'Certificado',
        icono: '📄',
        badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
        fecha: cert.fechaEmision,
        timestamp: cert.id,
        titulo: cert.tipo === 'asistencia' ? 'Certificado de Asistencia' : 'Certificado de Reposo Médico',
        detalle: cert.diagnosticoMotivo
      })
    })

    // Ordenar de más reciente a más antiguo
    return lista.sort((a, b) => b.timestamp - a.timestamp)
  }, [evolucionesNotas, itemsPresupuesto, recetas, certificados])

  const eventosFiltrados = useMemo(() => {
    if (filtroTipo === 'todos') return eventosConsolidados
    return eventosConsolidados.filter(e => e.tipo === filtroTipo)
  }, [eventosConsolidados, filtroTipo])

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4 text-xs">
      <div className="flex justify-between items-center border-b pb-3 flex-wrap gap-2">
        <div>
          <h3 className="font-bold text-gray-900 uppercase tracking-wider text-sm flex items-center gap-2">
            <span>⏱️</span> Línea de Tiempo Cronológica del Expediente ({eventosFiltrados.length})
          </h3>
          <p className="text-[11px] text-gray-500">Historial unificado de atenciones, notas, fármacos y certificados.</p>
        </div>

        {/* Filtros de Eventos */}
        <div className="flex gap-1.5 flex-wrap">
          {['todos', 'Evolución', 'Tratamiento', 'Receta', 'Certificado'].map(cat => (
            <button
              key={cat}
              onClick={() => setFiltroTipo(cat)}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] capitalize transition-all cursor-pointer ${
                filtroTipo === cat
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {eventosFiltrados.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed text-gray-400">
          No existen registros clínicos asociados al filtro seleccionado.
        </div>
      ) : (
        <div className="relative border-l-2 border-gray-200 ml-4 pl-6 space-y-6 py-2">
          {eventosFiltrados.map(ev => (
            <div key={ev.id} className="relative group">
              {/* Punto en la línea del tiempo */}
              <div className="absolute -left-[31px] top-0 bg-white border-2 border-black rounded-full w-5 h-5 flex items-center justify-center text-[10px]">
                {ev.icono}
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 hover:border-gray-400 transition-all space-y-1">
                <div className="flex justify-between items-center flex-wrap gap-1">
                  <span className="font-bold text-gray-900 text-xs">{ev.titulo}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${ev.badgeColor}`}>
                      {ev.tipo}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400">🗓️ {ev.fecha}</span>
                  </div>
                </div>
                <p className="text-gray-700 text-[11px] whitespace-pre-wrap pt-1">{ev.detalle}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
})

TimelineClinicoWidget.displayName = 'TimelineClinicoWidget'