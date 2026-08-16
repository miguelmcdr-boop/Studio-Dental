/**
 * ErrorFallback — UI de fallback cuando un ErrorBoundary captura un error.
 *
 * F6-01 — Error Boundary global + por módulo crítico
 *
 * Decisiones de diseño:
 *   - Mensaje amigable, sin tecnicismos al usuario final.
 *   - Stack trace solo visible en desarrollo (import.meta.env.DEV).
 *   - Botón "Volver al inicio" llama a onReset() sin cerrar la sesión.
 *   - Coherente visualmente con el resto de la app (Tailwind, rounded-2xl).
 *   - Cumple criterio 3 del roadmap: no expone stack trace en producción.
 */
import React from 'react'

export function ErrorFallback({ error, onReset, modulo }) {
  const titulo = modulo
    ? `Error en el módulo "${modulo}"`
    : 'Error inesperado'

  const descripcion = modulo
    ? 'Ocurrió un problema al cargar este módulo. El resto de la aplicación sigue funcionando normalmente. Puedes volver al inicio o esperar mientras el equipo lo revisa.'
    : 'La aplicación encontró un error inesperado. Por favor, recarga la página. Si el problema persiste, contacta al equipo técnico.'

  return (
    <div
      className="flex items-center justify-center min-h-[400px] p-8"
      role="alert"
      aria-live="assertive"
    >
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 border border-red-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg
              className="w-6 h-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{titulo}</h2>
            <p className="text-sm text-gray-600">Este contenido no pudo cargarse</p>
          </div>
        </div>

        <p className="text-gray-700 mb-6 leading-relaxed">
          {descripcion}
        </p>

        <div className="flex flex-col gap-2">
          {onReset && (
            <button
              onClick={onReset}
              type="button"
              className="w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {modulo ? 'Volver al inicio' : 'Reintentar'}
            </button>
          )}

          {typeof window !== 'undefined' && (
            <button
              onClick={() => window.location.reload()}
              type="button"
              className="w-full bg-gray-100 text-gray-700 font-semibold py-3 px-6 rounded-xl hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
            >
              Recargar la página
            </button>
          )}
        </div>

        {/* Detalles técnicos SOLO en desarrollo — cumple criterio 3 del roadmap */}
        {import.meta.env.DEV && error && (
          <details className="mt-6 text-xs border-t border-gray-200 pt-4">
            <summary className="cursor-pointer text-gray-500 hover:text-gray-700 font-medium">
              Detalles técnicos (solo desarrollo)
            </summary>
            <pre className="mt-2 p-3 bg-gray-50 rounded text-gray-700 overflow-auto max-h-40 text-[10px] leading-relaxed">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}
