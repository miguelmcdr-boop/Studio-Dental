/**
 * ErrorBoundary — captura errores de render en componentes hijos.
 *
 * F6-01 — Error Boundary global + por módulo crítico
 *
 * Limitación conocida (documentada):
 *   ErrorBoundary solo captura errores lanzados DURANTE EL RENDER,
 *   en event handlers, y en métodos de ciclo de vida.
 *   NO captura errores dentro de useEffect / async / setTimeout.
 *   Para esos casos, cada módulo debe usar try/catch propio.
 *
 * Uso:
 *   <ErrorBoundary modulo="odontograma" onReset={() => setSection('Dashboard')}>
 *     <OdontogramaModulo />
 *   </ErrorBoundary>
 */
import React from 'react'
import { ErrorFallback } from './ErrorFallback'
import { createLogger } from '../services/logger.js'

const log = createLogger('ErrorBoundary')

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    // Registro estructurado (F6-03 — logger centralizado)
    log.error({
      modulo: this.props.modulo || 'global',
      mensaje: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString()
    })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    if (typeof this.props.onReset === 'function') {
      this.props.onReset()
    }
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || ErrorFallback
      return (
        <FallbackComponent
          error={this.state.error}
          onReset={this.handleReset}
          modulo={this.props.modulo}
        />
      )
    }
    return this.props.children
  }
}
