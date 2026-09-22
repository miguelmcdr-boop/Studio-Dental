/**
 * ResumenClinicoHeader — KPIs del paciente en ficha premium (F7-26)
 *
 * Renderiza 5 tarjetas compactas con métricas clínicas:
 * 1. Última visita (fecha + días transcurridos)
 * 2. Próxima cita (fecha + hora + box)
 * 3. Presupuesto pendiente (valor + progreso)
 * 4. Tratamientos (realizados / total)
 * 5. Alertas activas (alergias, enfermedades, medicamentos)
 *
 * Diseño:
 * - Grid responsive (1 col mobile, 2 tablet, 5 desktop)
 * - Iconos lucide + colores semánticos por tipo de métrica
 * - Accesible: cada tarjeta tiene role="region" + aria-label
 * - Dark mode completo
 *
 * Contrato:
 * - Recibe métricas del hook useMetricasClinicas
 * - Componente puramente presentacional (cero lógica de negocio)
 */
import React from 'react'
import {
  Calendar,
  Clock,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Activity,
} from 'lucide-react'
import { Icon } from '../../../components/Icon'

const TarjetaMetrica = ({ icono, label, valor, sublabel, color = 'graphite', ariaLabel }) => {
  const colorClasses = {
    graphite: 'text-graphite-700 dark:text-graphite-300 bg-graphite-100 dark:bg-graphite-800',
    azul: 'text-clinical-info dark:text-sky-300 bg-clinical-info/10 dark:bg-sky-400/15',
    verde: 'text-clinical-success dark:text-emerald-300 bg-clinical-success/10 dark:bg-emerald-400/15',
    ambar: 'text-clinical-warning dark:text-amber-300 bg-clinical-warning/10 dark:bg-amber-400/15',
    rojo: 'text-clinical-error dark:text-red-300 bg-clinical-error/10 dark:bg-red-400/15',
  }

  return (
    <div
      role="region"
      aria-label={ariaLabel || label}
      className="bg-white dark:bg-graphite-800 border border-graphite-200 dark:border-graphite-700 rounded-xl p-3 flex items-start gap-3 hover:border-graphite-300 dark:hover:border-graphite-600 transition-colors"
    >
      <div className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
        <Icon icon={icono} size="sm" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-wider font-semibold text-graphite-500 dark:text-graphite-400 mb-0.5">
          {label}
        </p>
        <p className="text-sm font-bold text-graphite-900 dark:text-graphite-50 truncate">
          {valor}
        </p>
        {sublabel && (
          <p className="text-[10px] text-graphite-500 dark:text-graphite-400 truncate mt-0.5">
            {sublabel}
          </p>
        )}
      </div>
    </div>
  )
}

export const ResumenClinicoHeader = ({ metricas }) => {
  if (!metricas) return null

  const {
    ultimaVisita,
    diasDesdeUltimaVisita,
    totalVisitas,
    proximaCita,
    presupuestoPendienteFormateado,
    progresoTratamiento,
    itemsRealizados,
    totalItems,
    alertasActivas,
  } = metricas

  // Formato de fecha para mostrar
  const formatoFecha = (fecha) => {
    if (!fecha) return '—'
    return fecha.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  // Determinar color de "última visita" según antigüedad
  const colorUltimaVisita =
    diasDesdeUltimaVisita === null
      ? 'graphite'
      : diasDesdeUltimaVisita <= 30
      ? 'verde'
      : diasDesdeUltimaVisita <= 180
      ? 'ambar'
      : 'rojo'

  const textoUltimaVisita =
    diasDesdeUltimaVisita === null
      ? 'Sin registros'
      : diasDesdeUltimaVisita === 0
      ? 'Hoy'
      : diasDesdeUltimaVisita === 1
      ? 'Ayer'
      : `Hace ${diasDesdeUltimaVisita} días`

  // Color de presupuesto pendiente
  const colorPresupuesto =
    progresoTratamiento === 100
      ? 'verde'
      : progresoTratamiento >= 50
      ? 'ambar'
      : 'graphite'

  return (
    <div
      className="mb-6 print:hidden"
      role="region"
      aria-label="Resumen clínico del paciente"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* 1. Última visita */}
        <TarjetaMetrica
          icono={Clock}
          label="Última visita"
          valor={textoUltimaVisita}
          sublabel={formatoFecha(ultimaVisita)}
          color={colorUltimaVisita}
          ariaLabel={`Última visita: ${textoUltimaVisita}`}
        />

        {/* 2. Próxima cita */}
        <TarjetaMetrica
          icono={Calendar}
          label="Próxima cita"
          valor={proximaCita ? formatoFecha(new Date(proximaCita.fecha)) : 'Sin agendar'}
          sublabel={
            proximaCita
              ? `${proximaCita.hora || '—'} · ${proximaCita.box || 'Box'}`
              : 'Agendar cita'
          }
          color={proximaCita ? 'azul' : 'graphite'}
          ariaLabel={
            proximaCita
              ? `Próxima cita el ${formatoFecha(new Date(proximaCita.fecha))}`
              : 'Sin citas agendadas'
          }
        />

        {/* 3. Presupuesto pendiente */}
        <TarjetaMetrica
          icono={DollarSign}
          label="Pendiente"
          valor={presupuestoPendienteFormateado}
          sublabel={`${progresoTratamiento}% pagado`}
          color={colorPresupuesto}
          ariaLabel={`Presupuesto pendiente: ${presupuestoPendienteFormateado}`}
        />

        {/* 4. Progreso de tratamiento */}
        <TarjetaMetrica
          icono={CheckCircle2}
          label="Tratamiento"
          valor={`${itemsRealizados} / ${totalItems}`}
          sublabel={totalItems > 0 ? `${progresoTratamiento}% completado` : 'Sin plan'}
          color={progresoTratamiento === 100 ? 'verde' : 'graphite'}
          ariaLabel={`Progreso de tratamiento: ${itemsRealizados} de ${totalItems} realizados`}
        />

        {/* 5. Alertas activas */}
        <TarjetaMetrica
          icono={alertasActivas.length > 0 ? AlertTriangle : Activity}
          label="Alertas clínicas"
          valor={alertasActivas.length > 0 ? `${alertasActivas.length} activa${alertasActivas.length === 1 ? '' : 's'}` : 'Sin alertas'}
          sublabel={
            alertasActivas.length > 0
              ? alertasActivas[0].texto.substring(0, 30) + (alertasActivas[0].texto.length > 30 ? '…' : '')
              : 'Paciente sano'
          }
          color={alertasActivas.length > 0 ? 'rojo' : 'verde'}
          ariaLabel={
            alertasActivas.length > 0
              ? `${alertasActivas.length} alertas clínicas activas`
              : 'Sin alertas clínicas'
          }
        />
      </div>

      {/* Contador de visitas totales (inline, sutil) */}
      <div className="mt-2 flex items-center justify-end gap-3 text-[10px] text-graphite-500 dark:text-graphite-400">
        <span>
          <strong className="font-semibold text-graphite-700 dark:text-graphite-300">
            {totalVisitas}
          </strong>{' '}
          visita{totalVisitas === 1 ? '' : 's'} registrada{totalVisitas === 1 ? '' : 's'}
        </span>
      </div>
    </div>
  )
}

ResumenClinicoHeader.displayName = 'ResumenClinicoHeader'
