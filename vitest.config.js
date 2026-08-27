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
 * Para las funciones puras de F1-06 bastaba 'node', pero configurar
 * jsdom ahora evita tener que modificar esta config en fases posteriores.
 *
 * setupFiles: './src/test/setup.js' ejecuta el setup global antes de cada
 * suite de tests (F3-04): importa matchers de jest-dom, limpia localStorage
 * entre tests, y restaura mocks automáticamente.
 *
 * coverage.exclude incluye 'src/test/**' para que los archivos de setup
 * no aparezcan en el reporte de cobertura (F3-04 fix).
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
      // Umbrales mínimos de cobertura (F6-K)
      // Bloquea el CI si la cobertura cae por debajo de estos valores
      thresholds: {
        statements: 20,  // Baseline: 25.52% (2026-01-26)
        branches: 50,    // Baseline: 73.36%
        functions: 30,   // Baseline: 45.83%
        lines: 20        // Baseline: 25.5%
      }
    },
  },
})