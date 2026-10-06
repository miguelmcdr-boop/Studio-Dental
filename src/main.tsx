import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import './shared/utils/devNotify'
// F6-01: ErrorBoundary global captura cualquier error no manejado
// y evita pantalla blanca. El fallback mantiene la app montada.
import { ErrorBoundary } from './shared/ui/ErrorBoundary'

const rootElement = document.getElementById('root')
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary modulo="global">
        <App />
      </ErrorBoundary>
    </StrictMode>,
  )
}
