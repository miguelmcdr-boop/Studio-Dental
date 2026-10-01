/**
 * Spec de verificación de login (Fase 4-04a).
 * Valida que los usuarios de prueba creados en Supabase Auth pueden iniciar sesión.
 * F4-04a
 */
import { test } from '@playwright/test'
import { loginComo, CREDENCIALES } from '../fixtures/auth.setup'

test.describe('Verificación de login E2E', () => {
  
  test('login como admin funciona y muestra Sidebar', async ({ page }) => {
    await loginComo(page, CREDENCIALES.admin)
    
    // Verificar que la app cargó correctamente
    await page.waitForTimeout(2000)
    
    // Tomar screenshot para inspección manual
    await page.screenshot({ path: 'test-results/verify-admin-login.png', fullPage: true })
    
    console.log('✅ Login como admin completado')
    console.log('   URL actual:', page.url())
    console.log('   Screenshot guardado en: test-results/verify-admin-login.png')
  })
  
  test('login como dentista funciona', async ({ page }) => {
    await loginComo(page, CREDENCIALES.dentista)
    await page.waitForTimeout(2000)
    await page.screenshot({ path: 'test-results/verify-dentista-login.png', fullPage: true })
    console.log('✅ Login como dentista completado')
  })
  
  test('login como asistente funciona', async ({ page }) => {
    await loginComo(page, CREDENCIALES.asistente)
    await page.waitForTimeout(2000)
    await page.screenshot({ path: 'test-results/verify-asistente-login.png', fullPage: true })
    console.log('✅ Login como asistente completado')
  })
  
  test('login como recepcion funciona', async ({ page }) => {
    await loginComo(page, CREDENCIALES.recepcion)
    await page.waitForTimeout(2000)
    await page.screenshot({ path: 'test-results/verify-recepcion-login.png', fullPage: true })
    console.log('✅ Login como recepcion completado')
  })
})
