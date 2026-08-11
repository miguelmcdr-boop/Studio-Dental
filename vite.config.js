import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

/**
 * Configuración de Vitest — Studio Dental
 *
 * Separada de vite.config.js para mantener responsabilidades claras:
 *   vite.config.js   → pipeline de build y desarrollo
 *   vitest.config.js → pipeline de testing
 *
 * environment: 'jsdom' habilita APIs del navegador (localStorage, DOM)
 * necesarias para los tests de servicios e integración en F3-04.
 *
 * setupFiles: './src/test/setup.js' ejecuta el setup global antes de cada
 * suite de tests (F3-04): importa matchers de jest-dom, limpia localStorage
 * entre tests, y restaura mocks automáticamente.
 *
 * Para las funciones puras de F1-06 bastaba 'node', pero configurar
 * jsdom ahora evita tener que modificar esta config en fases posteriores.
 */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    include: ['src/**/*.test.{js,jsx}'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{js,jsx}'],
      exclude: [
        'src/**/*.test.{js,jsx}',
        'src/main.jsx',
        'src/**/*.constants.js',
        'src/data/**',
        'src/test/**',
      ],
    },
  },
})