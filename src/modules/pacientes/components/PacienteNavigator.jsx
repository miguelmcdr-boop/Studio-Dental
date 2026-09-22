/**
 * PacienteNavigator — Barra de navegación entre pacientes (F7-26)
 *
 * Muestra botones ← Anterior / Siguiente → y el indicador
 * "Paciente X de Y" para navegar sin volver al directorio.
 *
 * Diseño:
 * - Compacto y no intrusivo (barra delgada sobre el contenido)
 * - Botones deshabilitados en extremos (inicio/fin de lista)
 * - Responsive: se oculta en mobile pequeño (< sm) para ahorrar espacio
 * - Atajos de teclado: ← y → (se suscriben cuando el componente está montado)
 *
 * Accesibilidad:
 * - role="navigation" + aria-label en contenedor
 * - Botones con aria-label descriptivo
 * - Atajos de teclado con preventDefault (no rompen inputs)
 *
 * Contrato:
 * - Recibe props del hook useNavegacionClinica (App.jsx)
 * - No tiene estado interno (controlado externamente)
 * - data-testid preservados para tests de integración
 */
import React, { useEffect } from 'react'
import { ChevronLeft, ChevronRight, Users } from 'lucide-react'
import { Icon } from '../../../components/Icon'

export const PacienteNavigator = ({
  indiceActual,
  total,
  hayAnterior,
  haySiguiente,
  anterior,
  siguiente,
}) => {
  const posicionHumana = indiceActual + 1

  // F7-26: Atajos de teclado (← y →) solo cuando no hay foco en input
  useEffect(() => {
    const handleKeyDown = (e) => {
      const target = e.target
      const esInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable

      if (esInput) return

      if (e.key === 'ArrowLeft' && hayAnterior) {
        e.preventDefault()
        anterior()
      } else if (e.key === 'ArrowRight' && haySiguiente) {
        e.preventDefault()
        siguiente()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [hayAnterior, haySiguiente, anterior, siguiente])

  if (total === 0) return null

  return (
    <nav
      role="navigation"
      aria-label="Navegación entre pacientes"
      className="flex items-center justify-between gap-3 bg-graphite-50 dark:bg-graphite-800/50 border border-graphite-200 dark:border-graphite-700 rounded-xl px-3 py-2 mb-4 print:hidden"
    >
      {/* Botón Anterior */}
      <button
        type="button"
        data-testid="nav-paciente-anterior"
        onClick={anterior}
        disabled={!hayAnterior}
        aria-label={hayAnterior ? 'Ir al paciente anterior (tecla ←)' : 'No hay paciente anterior'}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-graphite-700 dark:text-graphite-300 hover:bg-graphite-200/60 dark:hover:bg-graphite-700 enabled:cursor-pointer"
      >
        <Icon icon={ChevronLeft} size="sm" />
        <span className="hidden sm:inline">Anterior</span>
      </button>

      {/* Indicador de posición */}
      <div
        className="flex items-center gap-2 text-xs text-graphite-600 dark:text-graphite-400"
        aria-live="polite"
        aria-atomic="true"
      >
        <Icon icon={Users} size="sm" />
        <span className="font-semibold">
          Paciente {posicionHumana} de {total}
        </span>
        <span className="hidden md:inline text-[10px] text-graphite-400 dark:text-graphite-500">
          (← → para navegar)
        </span>
      </div>

      {/* Botón Siguiente */}
      <button
        type="button"
        data-testid="nav-paciente-siguiente"
        onClick={siguiente}
        disabled={!haySiguiente}
        aria-label={haySiguiente ? 'Ir al paciente siguiente (tecla →)' : 'No hay paciente siguiente'}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-graphite-700 dark:text-graphite-300 hover:bg-graphite-200/60 dark:hover:bg-graphite-700 enabled:cursor-pointer"
      >
        <span className="hidden sm:inline">Siguiente</span>
        <Icon icon={ChevronRight} size="sm" />
      </button>
    </nav>
  )
}

PacienteNavigator.displayName = 'PacienteNavigator'
