/**
 * E2E: Flujo clínico básico.
 * Crear paciente → abrir ficha → emitir receta.
 * F4-04 / Fase 4-04c (versión robusta, misma estrategia que flujo-seguridad)
 */
import { test, expect } from '@playwright/test'
import { loginComo, CREDENCIALES } from '../fixtures/auth.setup'

test.describe.configure({ timeout: 180_000 }) // 3 minutos por test

test.describe('Flujo clínico básico', () => {
  
  test('debe permitir crear paciente y emitir receta', async ({ page }) => {
    const nombrePaciente = `Clinico Test ${Date.now()}`
    const rutPaciente = '11.222.333-4'
    
    // 1. Login como dentista
    await loginComo(page, CREDENCIALES.dentista)
    
    // 2. Navegar a pacientes
    await page.click('[data-testid="sidebar-menu-pacientes"]')
    await page.waitForTimeout(1500)
    
    // 3. Abrir modal de nuevo paciente
    await page.click('[data-testid="btn-nuevo-paciente"]')
    await page.waitForSelector('[data-testid="paciente-nombre"]', { timeout: 5_000 })
    
    // 4. Llenar formulario
    await page.fill('[data-testid="paciente-nombre"]', nombrePaciente)
    await page.fill('[data-testid="paciente-rut"]', rutPaciente)
    
    // 5. Guardar paciente
    await page.click('[data-testid="paciente-crear"]')
    
    // 6. Esperar a que el modal desaparezca
    await page.waitForSelector('[data-testid="paciente-nombre"]', { 
      state: 'detached',
      timeout: 5_000 
    })
    console.log('✅ Modal cerrado')
    
    // 7. Esperar a que el paciente aparezca en la lista
    const pacienteCard = page.locator(`text=${nombrePaciente}`).first()
    await expect(pacienteCard).toBeVisible({ timeout: 15_000 })
    console.log('✅ Paciente apareció en la lista')
    
    // 8. Hacer click en el card (abre ficha)
    await pacienteCard.click()
    await page.waitForTimeout(2000)
    
    // 9. Verificar que estamos en la ficha del paciente
    await expect(page.locator(`text=${nombrePaciente}`).first()).toBeVisible({ timeout: 10_000 })
    console.log('✅ Ficha del paciente abierta')
    
    // 10. Buscar y hacer click en el tab "Recetas Médicas"
    const tabRecetas = page.locator('button:has-text("Recetas")').first()
    await expect(tabRecetas).toBeVisible({ timeout: 5_000 })
    await tabRecetas.click()
    await page.waitForTimeout(1000)
    console.log('✅ Tab Recetas Médicas seleccionado')
    
    // 11. Escribir un fármaco sin restricciones (Ibuprofeno - paciente sin alergias)
    await page.fill('[data-testid="receta-farmaco"]', 'Ibuprofeno')
    await page.waitForTimeout(1500)
    
    // 12. Seleccionar la primera sugerencia del autocompletado
    const sugerencia = page.locator('.absolute >> text=Ibuprofeno').first()
    await expect(sugerencia).toBeVisible({ timeout: 5_000 })
    await sugerencia.click()
    await page.waitForTimeout(500)
    console.log('✅ Fármaco seleccionado del autocompletado')
    
    // 13. Completar indicación si está vacía
    const indicacion = await page.locator('[data-testid="receta-indicacion"]').inputValue()
    if (!indicacion || indicacion.trim() === '') {
      await page.fill('[data-testid="receta-indicacion"]', 'Tomar 1 comprimido cada 8 horas por 5 días vía oral.')
    }
    console.log('✅ Indicación completada')
    
    // 14. Emitir receta
    await page.click('[data-testid="btn-emitir-receta"]')
    await page.waitForTimeout(1000)
    
    // 15. Verificar que la receta aparece en la lista
    await expect(page.locator('text=Ibuprofeno').last()).toBeVisible({ timeout: 5_000 })
    console.log('✅ Receta emitida y visible en la lista')
  })
})
