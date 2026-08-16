/**
 * Fixture de autenticación para tests E2E.
 * F4-04 / Fase 4-04c (mejorado con esperas de hidratación)
 */

/**
 * Helper para hacer login como un rol específico.
 * Incluye múltiples estrategias de espera para compensar:
 * - Carga inicial lenta de Vite
 * - Hidratación de React
 * - Caché del navegador
 */
export async function loginComo(page, { email, password, rol }) {
  // Navegar con espera de network idle
  await page.goto('/', { 
    waitUntil: 'networkidle',
    timeout: 60_000 
  })
  
  // Esperar a que el DOM esté estable
  await page.waitForLoadState('domcontentloaded')
  
  // Estrategia 1: esperar por data-testid directo
  // Estrategia 2 (fallback): esperar cualquier input de email
  let emailInput = page.locator('[data-testid="login-email"]')
  
  const emailVisible = await emailInput.isVisible({ timeout: 5_000 }).catch(() => false)
  
  if (!emailVisible) {
    // Fallback: buscar input por type="email" y agregar data-testid en runtime
    // (Esto nos permite diagnosticar si el problema es el atributo)
    console.log('⚠️  data-testid="login-email" no encontrado, buscando por type="email"...')
    const fallbackInput = page.locator('input[type="email"]')
    const fallbackVisible = await fallbackInput.isVisible({ timeout: 5_000 }).catch(() => false)
    
    if (fallbackVisible) {
      console.log('✅ Input de email encontrado por type, usando fallback')
      emailInput = fallbackInput
    } else {
      // Diagnóstico: tomar screenshot y listar todos los inputs visibles
      const allInputs = await page.locator('input').all()
      console.log(`⚠️  Encontrados ${allInputs.length} inputs en la página`)
      for (let i = 0; i < Math.min(allInputs.length, 5); i++) {
        const attrs = await allInputs[i].evaluate(el => ({
          type: el.type,
          placeholder: el.placeholder,
          name: el.name,
          testid: el.getAttribute('data-testid')
        }))
        console.log(`   Input ${i}:`, attrs)
      }
      throw new Error('No se encontró input de email ni por data-testid ni por type')
    }
  }
  
  // Completar credenciales
  await emailInput.fill(email)
  await page.locator('[data-testid="login-password"], input[type="password"]').first().fill(password)
  
  // Seleccionar rol si es visible
  const rolSelector = page.locator('[data-testid="login-rol"]').first()
  if (await rolSelector.isVisible({ timeout: 500 }).catch(() => false)) {
    await rolSelector.selectOption(rol)
  }
  
  // Click en submit
  await page.locator('[data-testid="login-submit"], button[type="submit"]').first().click()
  
  // Esperar a que aparezca el sidebar
  await page.waitForSelector('[data-testid^="sidebar-menu-"]', { 
    timeout: 15_000,
    state: 'visible'
  })
}

/**
 * Credenciales de prueba para cada rol.
 */
export const CREDENCIALES = {
  admin: {
    email: 'e2e_admin@studiodental.com',
    password: 'E2eTest2026!',
    rol: 'admin'
  },
  dentista: {
    email: 'e2e_dentista@studiodental.com',
    password: 'E2eTest2026!',
    rol: 'dentista'
  },
  asistente: {
    email: 'e2e_asistente@studiodental.com',
    password: 'E2eTest2026!',
    rol: 'asistente'
  },
  recepcion: {
    email: 'e2e_recepcion@studiodental.com',
    password: 'E2eTest2026!',
    rol: 'recepcion'
  }
}
