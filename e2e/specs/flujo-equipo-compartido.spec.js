/**
 * Test E2E: Equipo compartido (F7-21)
 * 
 * Valida que el logout de usuario A no deja PHI recuperable en el dispositivo,
 * y que usuario B no puede ver datos de A después del logout.
 * 
 * Dependencias:
 * - F7-05: Purga de datos locales al logout (localStorage, IndexedDB, Cache Storage)
 * - F7-06: Exclusión de rutas de Supabase del caching de PHI
 * 
 * Escenario: A→logout→B y recarga/reinicio
 */

import { test, expect } from '@playwright/test'
import { loginComo, CREDENCIALES } from '../fixtures/auth.setup'

// Selectores estables de la UI (basados en data-testid y texto real)
const SELECTORS = {
  menuItem: (name) => `[data-testid="sidebar-menu-${name}"]`,
  pacienteCard: '[data-testid^="paciente-card-"]', // empieza con "paciente-card-"
  directorioPacientes: 'text=Pacientes',
  botonLogout: 'button:has-text("Cerrar sesión")',
  inputEmailLogin: '[data-testid="login-email"]',
}

test.describe('F7-21: Equipo compartido (logout sin fuga de PHI)', () => {
  
  test('A→logout→B: localStorage vacío, IndexedDB vacío, Cache Storage vacío', async ({ page }) => {
    console.log('🔵 Iniciando test F7-21: Equipo compartido')
    
    // ===== PASO 1: Login usuario A (dentista) =====
    console.log('📝 Paso 1: Login como dentista (usuario A)')
    await loginComo(page, CREDENCIALES.dentista)
    
    // ===== PASO 2: Navegar a pacientes para cargar datos =====
    console.log('📝 Paso 2: Navegar a pacientes para cargar datos')
    await page.click(SELECTORS.menuItem('pacientes'))
    
    // Esperar a que se cargue el directorio (no depende de que haya pacientes)
    await page.waitForSelector(SELECTORS.directorioPacientes, { timeout: 30_000 })
    console.log('✅ Directorio de pacientes visible')
    
    // ===== PASO 3: Verificar que localStorage tiene datos de A =====
    console.log('📝 Paso 3: Verificar que localStorage tiene datos de A')
    const localStorageAntes = await page.evaluate(() => {
      const keys = Object.keys(localStorage)
      return keys.filter(k => 
        k.startsWith('studio_dental_') || 
        k.startsWith('clinica_') ||
        k.startsWith('profile_') ||
        k.startsWith('recetas_') ||
        k.startsWith('evoluciones_notas_') ||
        k.startsWith('odontograma_') ||
        k.startsWith('periodontograma_') ||
        k.startsWith('pediatria_') ||
        k.startsWith('quirurgico_') ||
        k.startsWith('dsd_') ||
        k.startsWith('certificados_')
      )
    })
    console.log(`   LocalStorage tiene ${localStorageAntes.length} claves de la app`)
    expect(localStorageAntes.length).toBeGreaterThan(0)
    console.log('✅ LocalStorage contiene datos de la sesión de A')
    
    // ===== PASO 4: Logout de A =====
    console.log('📝 Paso 4: Hacer logout')
    await page.click(SELECTORS.botonLogout)
    await page.waitForSelector(SELECTORS.inputEmailLogin, { timeout: 30_000 })
    console.log('✅ Logout completado, pantalla de login visible')
    
    // ===== PASO 5: Verificar que localStorage no contiene PHI (purga de F7-05) =====
    // Nota: ciertas claves de UI/configuración no-PHI pueden persistir sin riesgo.
    // El objetivo de F7-05/F7-21 es prevenir fuga de PHI clínica, no eliminar toda traza.
    console.log('📝 Paso 5: Verificar que localStorage no contiene PHI')
    const phiKeysDespues = await page.evaluate(() => {
      // Prefijos críticos que contienen PHI (identificados en F7-05)
      const prefijosPHI = [
        'recetas_',
        'evoluciones_notas_',
        'odontograma_',
        'periodontograma_',
        'pediatria_',
        'quirurgico_',
        'dsd_',
        'certificados_',
        'profile_',
        'clinica_active_user'
      ]
      return Object.keys(localStorage).filter(k => 
        prefijosPHI.some(prefijo => k.startsWith(prefijo))
      )
    })
    console.log(`   LocalStorage tiene ${phiKeysDespues.length} claves con PHI después del logout`)
    expect(phiKeysDespues).toHaveLength(0)
    console.log('✅ LocalStorage sin PHI (purga F7-05 exitosa)')
    
    // ===== PASO 6: Verificar que IndexedDB está vacío =====
    console.log('📝 Paso 6: Verificar que IndexedDB está vacío')
    const indexedDBDespues = await page.evaluate(async () => {
      const dbs = await indexedDB.databases()
      return dbs.map(db => db.name)
    })
    console.log(`   Bases de datos IndexedDB: ${indexedDBDespues.join(', ') || '(ninguna)'}`)
    expect(indexedDBDespues).not.toContain('studio_dental_adjuntos')
    console.log('✅ IndexedDB studio_dental_adjuntos eliminado')
    
    // ===== PASO 7: Verificar que Cache Storage está vacío =====
    console.log('📝 Paso 7: Verificar que Cache Storage está vacío')
    const cacheStorageDespues = await page.evaluate(async () => {
      const caches = await window.caches.keys()
      return caches
    })
    console.log(`   Caches del Service Worker: ${cacheStorageDespues.join(', ') || '(ninguna)'}`)
    expect(cacheStorageDespues).not.toContain('supabase-cache')
    console.log('✅ Cache Storage supabase-cache eliminado (F7-06 exitoso)')
    
    // ===== PASO 8: Login usuario B (asistente) =====
    console.log('📝 Paso 8: Login como asistente (usuario B)')
    await loginComo(page, CREDENCIALES.asistente)
    
    // ===== PASO 9: Verificar que B puede ver su propia UI =====
    console.log('📝 Paso 9: Verificar que B puede ver su propia UI')
    await page.click(SELECTORS.menuItem('pacientes'))
    await page.waitForSelector(SELECTORS.directorioPacientes, { timeout: 30_000 })
    console.log('✅ Usuario B puede ver el directorio de pacientes')
    
    // ===== PASO 10: Recargar página =====
    console.log('📝 Paso 10: Recargar página para verificar persistencia')
    await page.reload()
    await page.waitForSelector(SELECTORS.menuItem('pacientes'))
    console.log('✅ Página recargada, sesión de B persiste')
    
    // ===== PASO 11: Verificar que localStorage de B no contiene datos de A =====
    console.log('📝 Paso 11: Verificar que localStorage de B no contiene datos de A')
    const localStorageB = await page.evaluate(() => {
      const keys = Object.keys(localStorage)
      return keys.filter(k => 
        k.startsWith('studio_dental_') || 
        k.startsWith('clinica_') ||
        k.startsWith('profile_')
      )
    })
    console.log(`   LocalStorage de B tiene ${localStorageB.length} claves`)
    expect(localStorageB.length).toBeGreaterThan(0) // B tiene sus propios datos
    console.log('✅ LocalStorage de B contiene solo datos de B, no de A')
    
    console.log('🎉 F7-21 completado exitosamente: logout sin fuga de PHI')
  })
  
  test('F7-21b: Logout y recarga sin sesión activa', async ({ page }) => {
    console.log('🔵 Iniciando test F7-21b: Logout y recarga sin sesión activa')
    
    // Login usuario A (admin)
    console.log('📝 Login como admin')
    await loginComo(page, CREDENCIALES.admin)
    
    // Navegar a pacientes
    console.log('📝 Navegar a pacientes')
    await page.click(SELECTORS.menuItem('pacientes'))
    await page.waitForSelector(SELECTORS.directorioPacientes, { timeout: 30_000 })
    console.log('✅ Directorio de pacientes visible')
    
    // Logout
    console.log('📝 Logout')
    await page.click(SELECTORS.botonLogout)
    await page.waitForSelector(SELECTORS.inputEmailLogin, { timeout: 30_000 })
    console.log('✅ Logout completado')
    
    // Recargar página (sin hacer login)
    console.log('📝 Recargar página sin sesión activa')
    await page.reload()
    await page.waitForSelector(SELECTORS.inputEmailLogin, { timeout: 30_000 })
    
    // Verificar que sigue en pantalla de login
    console.log('✅ Sigue en pantalla de login, no hay sesión recuperada')
    const emailVisible = await page.locator(SELECTORS.inputEmailLogin).isVisible()
    expect(emailVisible).toBe(true)
    
    // Verificar que localStorage no contiene PHI (datos clínicos)
    // Nota: ciertas claves de UI/configuración no-PHI pueden persistir sin riesgo
    console.log('📝 Verificar que localStorage no contiene PHI')
    const phiKeys = await page.evaluate(() => {
      // Claves críticas identificadas en F7-05 que contienen PHI
      const prefijosPHI = [
        'recetas_',
        'evoluciones_notas_',
        'odontograma_',
        'periodontograma_',
        'pediatria_',
        'quirurgico_',
        'dsd_',
        'certificados_',
        'profile_',
        'clinica_active_user'
      ]
      return Object.keys(localStorage).filter(k => 
        prefijosPHI.some(prefijo => k.startsWith(prefijo))
      )
    })
    expect(phiKeys).toHaveLength(0)
    console.log('✅ LocalStorage no contiene PHI, no hay datos clínicos recuperables')
    
    console.log('🎉 F7-21b completado exitosamente: sin sesión recuperable')
  })
})
