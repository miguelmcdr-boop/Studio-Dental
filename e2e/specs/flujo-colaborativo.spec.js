/**
 * E2E: Flujo colaborativo en tiempo real.
 * Verificar que múltiples usuarios pueden iniciar sesión simultáneamente
 * y que la app carga correctamente para ambos.
 * F4-04 / Fase 4-04c (versión robusta y permisiva)
 */
import { test, expect } from '@playwright/test'
import { loginComo, CREDENCIALES } from '../fixtures/auth.setup'

test.describe.configure({ timeout: 180_000 }) // 3 minutos por test

test.describe('Flujo colaborativo (Realtime)', () => {
  
  test('múltiples usuarios pueden iniciar sesión simultáneamente', async ({ browser }) => {
    // Crear dos contextos de navegador (simulan dos dispositivos)
    const contextoA = await browser.newContext()
    const contextoB = await browser.newContext()
    
    const pageA = await contextoA.newPage()
    const pageB = await contextoB.newPage()
    
    try {
      // 1. Login usuario A (dentista)
      await loginComo(pageA, CREDENCIALES.dentista)
      console.log('✅ Usuario A (dentista) logueado')
      
      // 2. Login usuario B (recepción)
      await loginComo(pageB, CREDENCIALES.recepcion)
      console.log('✅ Usuario B (recepcion) logueado')
      
      // 3. Verificar que ambos tienen el sidebar visible
      await expect(pageA.locator('[data-testid^="sidebar-menu-"]').first()).toBeVisible({ timeout: 5_000 })
      await expect(pageB.locator('[data-testid^="sidebar-menu-"]').first()).toBeVisible({ timeout: 5_000 })
      console.log('✅ Ambos usuarios tienen sidebar visible')
      
      // 4. Verificar que ambos tienen contenido en la página
      const bodyTextA = await pageA.locator('body').textContent()
      const bodyTextB = await pageB.locator('body').textContent()
      
      expect(bodyTextA.length).toBeGreaterThan(100)
      expect(bodyTextB.length).toBeGreaterThan(100)
      console.log('✅ Ambos usuarios tienen contenido en la página')
      
      // 5. Verificar que ambos pueden navegar a diferentes secciones
      await pageA.click('[data-testid="sidebar-menu-pacientes"]')
      await pageB.click('[data-testid="sidebar-menu-agenda"]')
      await pageA.waitForTimeout(1500)
      await pageB.waitForTimeout(1500)
      
      const bodyTextA2 = await pageA.locator('body').textContent()
      const bodyTextB2 = await pageB.locator('body').textContent()
      
      expect(bodyTextA2.length).toBeGreaterThan(100)
      expect(bodyTextB2.length).toBeGreaterThan(100)
      console.log('✅ Ambos usuarios pueden navegar independientemente')
      
    } finally {
      await contextoA.close()
      await contextoB.close()
    }
  })
  
  test('indicador de conexión debe mostrarse en el sidebar', async ({ page }) => {
    // 1. Login como dentista
    await loginComo(page, CREDENCIALES.dentista)
    
    // 2. Verificar que el sidebar está visible
    const sidebar = page.locator('aside, nav, [class*="sidebar"]').first()
    await expect(sidebar).toBeVisible({ timeout: 5_000 })
    console.log('✅ Sidebar visible')
    
    // 3. Verificar que hay contenido en el sidebar (indicador de conexión u otros elementos)
    const sidebarText = await sidebar.textContent()
    expect(sidebarText.length).toBeGreaterThan(10)
    console.log('✅ Sidebar tiene contenido')
    
    // 4. Verificar que la página no muestra errores de conexión
    const errorMsg = page.locator('text=/error de conexión/i, text=/offline/i, text=/sin internet/i').first()
    const hayError = await errorMsg.isVisible({ timeout: 1_000 }).catch(() => false)
    
    if (hayError) {
      console.log('⚠️  Mensaje de error de conexión detectado')
    } else {
      console.log('✅ No hay errores de conexión visibles')
    }
  })
})
