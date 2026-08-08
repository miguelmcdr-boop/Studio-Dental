/**
 * Tests — authService (hashing y bloqueo por intentos fallidos)
 * Archivo: src/services/authService.js
 * Tarea MASTER_ROADMAP: F1-01
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  crearCredencial,
  verificarPassword,
  estaBloqueado,
  registrarIntentoFallido,
  limpiarIntentosFallidos,
  MAX_INTENTOS_FALLIDOS,
} from './authService'

describe('crearCredencial / verificarPassword', () => {
  it('una contraseña correcta se verifica exitosamente contra su propia credencial', async () => {
    const cred = await crearCredencial('miContraseñaSegura123')
    expect(await verificarPassword('miContraseñaSegura123', cred)).toBe(true)
  })

  it('una contraseña incorrecta se rechaza', async () => {
    const cred = await crearCredencial('miContraseñaSegura123')
    expect(await verificarPassword('otraCosaDistinta', cred)).toBe(false)
  })

  it('nunca se persiste la contraseña en texto plano dentro de la credencial', async () => {
    const cred = await crearCredencial('miContraseñaSegura123')
    const serializado = JSON.stringify(cred)
    expect(serializado).not.toContain('miContraseñaSegura123')
  })

  it('la misma contraseña genera hashes distintos en credenciales distintas (salt aleatorio)', async () => {
    const cred1 = await crearCredencial('igualParaAmbos')
    const cred2 = await crearCredencial('igualParaAmbos')
    expect(cred1.salt).not.toBe(cred2.salt)
    expect(cred1.hash).not.toBe(cred2.hash)
  })

  it('verificarPassword retorna false (no lanza excepción) ante credencial vacía, null o incompleta', async () => {
    expect(await verificarPassword('cualquiera', {})).toBe(false)
    expect(await verificarPassword('cualquiera', null)).toBe(false)
    expect(await verificarPassword('cualquiera', undefined)).toBe(false)
    expect(await verificarPassword('cualquiera', { salt: 'x' })).toBe(false) // sin hash
  })
})

describe('bloqueo por intentos fallidos', () => {
  const email = 'test-lockout@example.com'

  beforeEach(() => {
    limpiarIntentosFallidos(email)
  })

  it('un email sin intentos previos no está bloqueado', () => {
    expect(estaBloqueado(email).bloqueado).toBe(false)
  })

  it('tras menos de MAX_INTENTOS_FALLIDOS, el email no se bloquea', () => {
    for (let i = 0; i < MAX_INTENTOS_FALLIDOS - 1; i++) {
      registrarIntentoFallido(email)
    }
    expect(estaBloqueado(email).bloqueado).toBe(false)
  })

  it(`al alcanzar ${MAX_INTENTOS_FALLIDOS} intentos fallidos, el email se bloquea`, () => {
    for (let i = 0; i < MAX_INTENTOS_FALLIDOS; i++) {
      registrarIntentoFallido(email)
    }
    const estado = estaBloqueado(email)
    expect(estado.bloqueado).toBe(true)
    expect(estado.restanteMs).toBeGreaterThan(0)
  })

  it('limpiarIntentosFallidos desbloquea el email (login exitoso resetea el contador)', () => {
    for (let i = 0; i < MAX_INTENTOS_FALLIDOS; i++) {
      registrarIntentoFallido(email)
    }
    expect(estaBloqueado(email).bloqueado).toBe(true)

    limpiarIntentosFallidos(email)
    expect(estaBloqueado(email).bloqueado).toBe(false)
  })
})