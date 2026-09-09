/**
 * PageHeader — Componente base del Design System (F10-A3)
 *
 * Header estándar de módulo/página con breadcrumb, título sentence case,
 * descripción y slot de acciones. Reemplaza los headers ad-hoc de cada módulo.
 *
 * Uso:
 *   <PageHeader
 *     breadcrumb={[{ label: 'Pacientes', onClick: fn }, { label: 'María González' }]}
 *     title="Ficha clínica"
 *     description="Historial, odontograma y presupuesto del paciente."
 *     actions={<Button variant="primary">Nueva cita</Button>}
 *   />
 *
 * Accesibilidad:
 *   - <nav aria-label="breadcrumb"> con <ol> y aria-current="page" en el último item
 *   - Items clicables del breadcrumb son <button type="button">
 *
 * Tokens DS v2 consumidos vía style inline (namespace --ds-* no genera
 * utilidades Tailwind): --ds-text-2xl, --ds-text-base, --ds-text-xs,
 * --ds-weight-semibold.
 */
import React from 'react'
import { ChevronRight } from 'lucide-react'
import { Icon } from '../Icon'

export const PageHeader = ({
  breadcrumb = [],
  title,
  description,
  actions,
  className = '',
  ...rest
}) => {
  return (
    <header className={`mb-6 ${className}`.trim()} {...rest}>
      {/* Breadcrumb */}
      {breadcrumb.length > 0 && (
        <nav aria-label="breadcrumb" className="mb-2">
          <ol
            className="flex items-center flex-wrap gap-1 text-graphite-500 dark:text-graphite-400"
            style={{ fontSize: 'var(--ds-text-xs)' }}
          >
            {breadcrumb.map((crumb, idx) => {
              const isLast = idx === breadcrumb.length - 1
              return (
                <li key={`${crumb.label}-${idx}`} className="flex items-center gap-1">
                  {idx > 0 && (
                    <Icon
                      icon={ChevronRight}
                      size="xs"
                      className="text-graphite-400 dark:text-graphite-600"
                    />
                  )}
                  {isLast || !crumb.onClick ? (
                    <span
                      aria-current={isLast ? 'page' : undefined}
                      className={
                        isLast
                          ? 'text-graphite-700 dark:text-graphite-300 font-medium'
                          : 'text-graphite-500 dark:text-graphite-400'
                      }
                    >
                      {crumb.label}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={crumb.onClick}
                      className="text-graphite-500 dark:text-graphite-400 hover:text-graphite-900 dark:hover:text-graphite-100 transition-colors"
                    >
                      {crumb.label}
                    </button>
                  )}
                </li>
              )
            })}
          </ol>
        </nav>
      )}

      {/* Título + descripción + acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h1
            className="text-graphite-900 dark:text-graphite-50 tracking-tight"
            style={{ fontSize: 'var(--ds-text-2xl)', fontWeight: 'var(--ds-weight-semibold)' }}
          >
            {title}
          </h1>
          {description && (
            <p
              className="mt-1 text-graphite-500 dark:text-graphite-400"
              style={{ fontSize: 'var(--ds-text-base)' }}
            >
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
            {actions}
          </div>
        )}
      </div>
    </header>
  )
}

PageHeader.displayName = 'PageHeader'
