/**
 * Configuración de Playwright para tests E2E de Studio Dental.
 * F4-04
 */
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './specs',
  
  // Timeout global por test
  timeout: 60_000,
  
  // Reintentos en CI
  retries: process.env.CI ? 2 : 0,
  
  // Ejecución paralela
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter
  reporter: process.env.CI ? 'github' : 'list',
  
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry'
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],

  // Servidor de desarrollo automático
  webServer: {
    command: 'npm run dev',
    port: 5173,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI
  }
})
