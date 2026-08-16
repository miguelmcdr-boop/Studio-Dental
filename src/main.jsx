import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
// F6-01: ErrorBoundary global captura cualquier error no manejado
// y evita pantalla blanca. El fallback mantiene la app montada.
import { ErrorBoundary } from './components/ErrorBoundary'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary modulo="global">
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
