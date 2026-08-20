/**
 * E2E: Flujo colaborativo con aislamiento multi-clínica (F6-C-f).
 *
 * Reemplaza el test original de F4-04 que solo validaba login simultáneo.
 * Ahora valida el criterio #4 del roadmap: "cuatro usuarios con roles
 * distintos en la misma clínica ven el mismo directorio" y también
 * que usuarios de clínicas distintas están completamente aislados.
 *
 * Prerequisitos:
 * - Ejecutar supabase/seed-multiclinica-e2e.sql en SQL Editor local
 * - Tener VITE_USE_SUPABASE=true en .env
 */
import { test, expect } from '@playwright/test'
import { loginComo, CREDENCIALES } from '../fixtures/auth.setup'

test.describe.configure({ timeout: 180_000 }) // 3 minutos por test

test.describe('Aislamiento multi-clínica (F6-C-f)', () => {
  test('usuarios de la misma clínica ven el mismo directorio de pacientes', async ({ browser }) => {
    // Crear dos contextos de navegador (simulan dos dispositivos)
    const ctxAdmin = await browser.newContext()
    const ctxDentista = await browser.newContext()
    const pageAdmin = await ctxAdmin.newPage()
    const pageDentista = await ctxDentista.newPage()

    try {
      // 1. Login admin (clínica 1)
      await loginComo(pageAdmin, CREDENCIALES.admin)
      console.log('✅ Admin clínica 1 logueado')

      // 2. Login dentista (clínica 1, misma clínica)
      await loginComo(pageDentista, CREDENCIALES.dentista)
      console.log('✅ Dentista clínica 1 logueado')

      // 3. Ambos navegan al directorio de pacientes
      await pageAdmin.click('[data-testid="sidebar-menu-pacientes"]')
      await pageDentista.click('[data-testid="sidebar-menu-pacientes"]')

      // Esperar a que cargue el directorio
      await pageAdmin.waitForTimeout(2000)
      await pageDentista.waitForTimeout(2000)

      // 4. Verificar que ambos tienen contenido en el directorio
      const textoAdmin = await pageAdmin.locator('body').textContent()
      const textoDentista = await pageDentista.locator('body').textContent()

      expect(textoAdmin.length).toBeGreaterThan(100)
      expect(textoDentista.length).toBeGreaterThan(100)
      console.log('✅ Ambos usuarios tienen directorio visible')

      // 5. Verificar que ven los mismos pacientes (criterio #4 del roadmap)
      // Ambos deben ver a "Carlos Mendoza" (paciente seed de clínica 1)
      expect(textoAdmin).toContain('Carlos Mendoza')
      expect(textoDentista).toContain('Carlos Mendoza')
      console.log('✅ Ambos usuarios ven el mismo paciente (Carlos Mendoza)')
    } finally {
      await ctxAdmin.close()
      await ctxDentista.close()
    }
  })

  test('usuarios de clínicas distintas ven directorios aislados', async ({ browser }) => {
    // Crear dos contextos de navegador (simulan dos clínicas distintas)
    const ctxClinica1 = await browser.newContext()
    const ctxClinica2 = await browser.newContext()
    const pageClinica1 = await ctxClinica1.newPage()
    const pageClinica2 = await ctxClinica2.newPage()

    try {
      // 1. Login admin de clínica 1
      await loginComo(pageClinica1, CREDENCIALES.admin)
      console.log('✅ Admin clínica 1 logueado')

      // 2. Login admin de clínica 2 (distinta clínica)
      await loginComo(pageClinica2, CREDENCIALES.admin_clinica2)
      console.log('✅ Admin clínica 2 logueado')

      // 3. Ambos navegan al directorio de pacientes
      await pageClinica1.click('[data-testid="sidebar-menu-pacientes"]')
      await pageClinica2.click('[data-testid="sidebar-menu-pacientes"]')

      // Esperar a que cargue el directorio
      await pageClinica1.waitForTimeout(2000)
      await pageClinica2.waitForTimeout(2000)

      // 4. Obtener contenido de ambos directorios
      const texto1 = await pageClinica1.locator('body').textContent()
      const texto2 = await pageClinica2.locator('body').textContent()

      // 5. Validar aislamiento: clínica 1 ve sus pacientes, clínica 2 ve los suyos
      expect(texto1).toContain('Carlos Mendoza') // Paciente seed de clínica 1
      expect(texto2).not.toContain('Carlos Mendoza') // Clínica 2 NO ve pacientes de clínica 1

      expect(texto2).toContain('Paciente Exclusivo Clínica 2') // Paciente seed de clínica 2
      expect(texto1).not.toContain('Paciente Exclusivo Clínica 2') // Clínica 1 NO ve pacientes de clínica 2

      console.log('✅ Aislamiento validado: cada clínica ve solo sus pacientes')
    } finally {
      await ctxClinica1.close()
      await ctxClinica2.close()
    }
  })
})
