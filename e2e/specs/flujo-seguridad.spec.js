/**
 * E2E: Flujo de seguridad clínica.
 * Paciente con alergias → prescribir fármaco contraindicado → alerta crítica.
 * F4-04 / Fase 4-04c (versión robusta)
 */
import { test, expect } from '@playwright/test'
import { loginComo, CREDENCIALES } from '../fixtures/auth.setup'

test.describe.configure({ timeout: 180_000 }) // 3 minutos por test

test.describe('Flujo de seguridad clínica (alergias)', () => {
  
  test('debe mostrar alerta crítica al prescribir Amoxicilina a paciente alérgico a Penicilina', async ({ page }) => {
    const nombrePaciente = `Alergico Test ${Date.now()}`
    const rutPaciente = '12.345.678-9'
    
    // 1. Login como dentista
    await loginComo(page, CREDENCIALES.dentista)
    
    // 2. Navegar a pacientes
    await page.click('[data-testid="sidebar-menu-pacientes"]')
    await page.waitForTimeout(1500)
    
    // 3. Abrir modal de nuevo paciente
    await page.click('[data-testid="btn-nuevo-paciente"]')
    await page.waitForSelector('[data-testid="paciente-nombre"]', { timeout: 5_000 })
    
    // 4. Llenar formulario (nombre + RUT obligatorios, alergias para el test)
    await page.fill('[data-testid="paciente-nombre"]', nombrePaciente)
    await page.fill('[data-testid="paciente-rut"]', rutPaciente)
    await page.fill('[data-testid="paciente-alergias"]', 'Alergia a Penicilina')
    
    // 5. Guardar paciente
    await page.click('[data-testid="paciente-crear"]')
    
    // 6. Esperar a que el modal desaparezca
    await page.waitForSelector('[data-testid="paciente-nombre"]', { 
      state: 'detached',
      timeout: 5_000 
    })
    console.log('✅ Modal cerrado')
    
    // 7. Esperar a que el paciente aparezca en la lista
    // Estrategia: buscar por el nombre específico (más robusto que data-testid genérico)
    const pacienteCard = page.locator(`text=${nombrePaciente}`).first()
    await expect(pacienteCard).toBeVisible({ timeout: 15_000 })
    console.log('✅ Paciente apareció en la lista')
    
    // 8. Hacer click en el card (abre ficha) - no en el botón "Ficha"
    // (Click en el card es más robusto porque todo el card es clickeable según el código)
    await pacienteCard.click()
    await page.waitForTimeout(2000)
    
    // 9. Verificar que estamos en la ficha del paciente (debe aparecer su nombre como título)
    await expect(page.locator(`text=${nombrePaciente}`).first()).toBeVisible({ timeout: 10_000 })
    console.log('✅ Ficha del paciente abierta')
    
    // 10. Buscar y hacer click en el tab "Recetas Médicas"
    // Usar selector más específico: el botón del tab
    const tabRecetas = page.locator('button:has-text("Recetas")').first()
    await expect(tabRecetas).toBeVisible({ timeout: 5_000 })
    await tabRecetas.click()
    await page.waitForTimeout(1000)
    console.log('✅ Tab Recetas Médicas seleccionado')
    
    // 11. Escribir Amoxicilina en el campo de fármaco
    await page.fill('[data-testid="receta-farmaco"]', 'Amoxicilina')
    await page.waitForTimeout(1500)
    
    // 12. VERIFICAR ALERTA CRÍTICA
    await expect(page.locator('[data-testid="alerta-alergia"]')).toBeVisible({ timeout: 5_000 })
    console.log('✅ Alerta de alergia apareció')
    
    // 13. Verificar que menciona la alergia a Penicilina
    await expect(page.locator('text=Penicilina').first()).toBeVisible({ timeout: 3_000 })
    console.log('✅ Mención a Penicilina visible')
    
    // 14. Verificar que hay alternativas seguras
    await expect(page.locator('[data-testid^="alerta-alternativa-"]').first()).toBeVisible({ timeout: 3_000 })
    console.log('✅ Alternativas seguras visibles')
  })
})
