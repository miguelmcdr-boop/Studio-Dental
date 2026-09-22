import React, { memo, useState, useMemo } from 'react'
import { formatearCLP } from '../../../utils/formatoMoneda'
import { FileText, Pill, File, CheckCircle, Clock, Calendar, Sparkles, Star } from 'lucide-react'

// F7-26: Configuración visual por tipo de evento (colores + iconos)
const CONFIG_TIPO_EVENTO = {
  Evolución: {
    color: 'blue',
    chipBg: 'bg-blue-100 dark:bg-blue-900/30',
    chipText: 'text-blue-800 dark:text-blue-300',
    chipBorder: 'border-blue-200 dark:border-blue-800',
    icon: FileText,
  },
  Tratamiento: {
    color: 'emerald',
    chipBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    chipText: 'text-emerald-800 dark:text-emerald-300',
    chipBorder: 'border-emerald-200 dark:border-emerald-800',
    icon: CheckCircle,
  },
  Receta: {
    color: 'purple',
    chipBg: 'bg-purple-100 dark:bg-purple-900/30',
    chipText: 'text-purple-800 dark:text-purple-300',
    chipBorder: 'border-purple-200 dark:border-purple-800',
    icon: Pill,
  },
  Certificado: {
    color: 'amber',
    chipBg: 'bg-amber-100 dark:bg-amber-900/30',
    chipText: 'text-amber-800 dark:text-amber-300',
    chipBorder: 'border-amber-200 dark:border-amber-800',
    icon: File,
  },
}

export const TimelineClinicoWidget = memo(({
  evolucionesNotas = [],
  itemsPresupuesto = [],
  recetas = [],
  certificados = [],
  _adjuntos = []
}) => {
  const [filtroTipo, setFiltroTipo] = useState('todos')

  // F7-26: Helper para parsear fechas en formato "DD-MM-YYYY HH:MM" o ISO
  const parseFechaSimple = (fecha) => {
    if (!fecha) return new Date(0)
    if (typeof fecha === 'string') {
      if (fecha.includes('T')) return new Date(fecha)
      const m = fecha.match(/^(\d{2})[-/](\d{2})[-/](\d{4})/)
      if (m) return new Date(`${m[3]}-${m[2]}-${m[1]}T00:00:00`)
    }
    return new Date(0)
  }

  // Consolidador de eventos cronológicos
  const eventosConsolidados = useMemo(() => {
    const lista = []

    // 1. Evoluciones de Bitácora
    evolucionesNotas.forEach(ev => {
      lista.push({
        id: `ev_${ev.id}`,
        tipo: 'Evolución',
        icono: 'FileText',
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
        icono: 'CheckCircle',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        fecha: new Date(tr.id).toLocaleDateString('es-CL'),
        timestamp: tr.id,
        titulo: `Tratamiento Completado: ${tr.prestacion}`,
        detalle: `Pieza: ${tr.pieza} | Convenio: ${tr.convenio || 'Particular'} | Valor: ${formatearCLP(tr.valor)}`
      })
    })

    // 3. Recetas Emitidas
    recetas.forEach(rec => {
      lista.push({
        id: `rec_${rec.id}`,
        tipo: 'Receta',
        icono: 'Pill',
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
        icono: 'File',
        badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
        fecha: cert.fechaEmision,
        timestamp: cert.id,
        titulo: cert.tipo === 'asistencia' ? 'Certificado de Asistencia' : 'Certificado de Reposo Médico',
        detalle: cert.diagnosticoMotivo
      })
    })

    // F7-26: Eventos hito sintéticos (agregados al final del timeline)
    // 1. "Primera visita" (si hay al menos 1 evolución)
    if (evolucionesNotas.length > 0) {
      const primeraEvolucion = [...evolucionesNotas].sort((a, b) => {
        const fa = parseFechaSimple(a.fecha)
        const fb = parseFechaSimple(b.fecha)
        return fa.getTime() - fb.getTime()
      })[0]
      if (primeraEvolucion) {
        lista.push({
          id: 'hito_primera_visita',
          tipo: 'hito',
          icono: 'Sparkles',
          badgeColor: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800/30 dark:text-slate-300 dark:border-slate-700',
          fecha: primeraEvolucion.fecha,
          timestamp: 0, // Se ordenará al final (más antiguo)
          titulo: 'Primera visita registrada',
          detalle: 'Inicio del expediente clínico de este paciente',
          esHito: true,
        })
      }
    }

    // 2. Ordenar de más reciente a más antiguo
    return lista.sort((a, b) => b.timestamp - a.timestamp)
  }, [evolucionesNotas, itemsPresupuesto, recetas, certificados])

  // F7-26: Conteos por tipo para la barra de estadísticas (chips clickeables)
  const conteosPorTipo = useMemo(() => {
    const conteos = { todos: eventosConsolidados.length }
    eventosConsolidados.forEach((e) => {
      conteos[e.tipo] = (conteos[e.tipo] || 0) + 1
    })
    return conteos
  }, [eventosConsolidados])

  const eventosFiltrados = useMemo(() => {
    if (filtroTipo === 'todos') return eventosConsolidados
    // F7-26: el filtro 'hito' también es válido (mostrar solo hitos)
    return eventosConsolidados.filter(e => e.tipo === filtroTipo)
  }, [eventosConsolidados, filtroTipo])

  return (
    <div className="bg-white dark:bg-graphite-800 border border-gray-200 dark:border-graphite-700 rounded-2xl p-6 space-y-4 text-xs">
      <div className="flex justify-between items-center border-b pb-3 flex-wrap gap-2">
        <div>
          <h3 className="font-bold text-gray-900 dark:text-graphite-50 uppercase tracking-wider text-sm flex items-center gap-2">
            <Clock size={16} /> Línea de Tiempo Cronológica del Expediente ({eventosFiltrados.length})
          </h3>
          <p className="text-[11px] text-gray-500 dark:text-graphite-400">Historial unificado de atenciones, notas, fármacos y certificados.</p>
        </div>

        {/* F7-26: Chips de filtro con estadísticas */}
        <div className="flex gap-1.5 flex-wrap" role="tablist" aria-label="Filtros de eventos">
          {[
            { key: 'todos', label: 'Todos' },
            ...Object.keys(CONFIG_TIPO_EVENTO).map(tipo => ({ key: tipo, label: tipo })),
          ].map(({ key, label }) => {
            const activo = filtroTipo === key
            const config = CONFIG_TIPO_EVENTO[key]
            const Icono = config?.icon
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={activo}
                onClick={() => setFiltroTipo(key)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-all cursor-pointer border ${
                  activo
                    ? 'bg-graphite-900 text-white border-graphite-900 dark:bg-graphite-50 dark:text-graphite-900 dark:border-graphite-50'
                    : `${config?.chipBg || 'bg-gray-100 dark:bg-graphite-800'} ${config?.chipText || 'text-gray-600 dark:text-graphite-400'} ${config?.chipBorder || 'border-gray-200 dark:border-graphite-700'} hover:opacity-80`
                }`}
              >
                {Icono && <Icono size={11} />}
                <span className="capitalize">{label}</span>
                <span
                  className={`ml-0.5 px-1.5 py-0 rounded-full text-[10px] font-bold ${
                    activo
                      ? 'bg-white/20 text-current'
                      : 'bg-black/10 dark:bg-white/10 text-current'
                  }`}
                >
                  {conteosPorTipo[key] || 0}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {eventosFiltrados.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 dark:bg-graphite-800 rounded-xl border border-dashed text-gray-400 dark:text-graphite-500">
          No existen registros clínicos asociados al filtro seleccionado.
        </div>
      ) : (
        <div className="relative border-l-2 border-gray-200 dark:border-graphite-700 ml-4 pl-6 space-y-6 py-2">
          {eventosFiltrados.map(ev => (
            <div key={ev.id} className="relative group">
              {/* Punto en la línea del tiempo */}
              <div className={`absolute -left-[31px] top-0 bg-white dark:bg-graphite-800 border-2 rounded-full w-5 h-5 flex items-center justify-center text-[10px] ${
                ev.esHito ? 'border-slate-400 dark:border-slate-500' : 'border-black'
              }`}>
                {ev.icono === 'FileText' && <FileText size={16} />}
                {ev.icono === 'CheckCircle' && <CheckCircle size={16} />}
                {ev.icono === 'Pill' && <Pill size={16} />}
                {ev.icono === 'File' && <File size={16} />}
                {ev.icono === 'Sparkles' && <Sparkles size={16} className="text-slate-500 dark:text-slate-300" />}
              </div>

              <div className={`p-4 rounded-xl border transition-all space-y-1 ${
              ev.esHito
                ? 'bg-gradient-to-br from-slate-50 to-blue-50/50 dark:from-slate-800/30 dark:to-blue-900/20 border-slate-300 dark:border-slate-600'
                : 'bg-gray-50 dark:bg-graphite-800 border-gray-200 dark:border-graphite-700 hover:border-gray-400'
            }`}>
                <div className="flex justify-between items-center flex-wrap gap-1">
                  <div className="flex items-center gap-1.5">
                    {ev.esHito && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-900">
                        <span className="inline-flex items-center gap-0.5"><Star size={9} />Hito</span>
                      </span>
                    )}
                    <span className="font-bold text-gray-900 dark:text-graphite-50 text-xs">{ev.titulo}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${ev.badgeColor}`}>
                      {ev.tipo}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 dark:text-graphite-500"><span className="inline-flex items-center gap-1"><Calendar size={10} />{ev.fecha}</span></span>
                  </div>
                </div>
                <p className="text-gray-700 dark:text-graphite-300 text-[11px] whitespace-pre-wrap pt-1">{ev.detalle}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
})

TimelineClinicoWidget.displayName = 'TimelineClinicoWidget'