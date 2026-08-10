/**
 * Tests — localStorageRepository (repositorio genérico de LocalStorage)
 * Archivo: src/services/localStorageRepository.js
 * Tarea MASTER_ROADMAP: F2-03
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { leerJSON, escribirJSON, createLocalStorageRepository } from './localStorageRepository'

beforeEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('leerJSON', () => {
  it('retorna el fallback si la clave no existe', () => {
    expect(leerJSON('clave_inexistente', 'valor_por_defecto')).toBe('valor_por_defecto')
  })

  it('parsea y retorna el valor guardado si la clave existe', () => {
    localStorage.setItem('mi_clave', JSON.stringify({ a: 1 }))
    expect(leerJSON('mi_clave', null)).toEqual({ a: 1 })
  })

  it('retorna el fallback y registra el error si el JSON está corrupto', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    localStorage.setItem('mi_clave', '{esto no es json valido')
    expect(leerJSON('mi_clave', 'fallback_seguro')).toBe('fallback_seguro')
    expect(spy).toHaveBeenCalled()
  })

  it('distingue un array vacío guardado explícitamente del caso "no existe"', () => {
    localStorage.setItem('lista_vacia', JSON.stringify([]))
    expect(leerJSON('lista_vacia', ['no debería verse'])).toEqual([])
  })
})

describe('escribirJSON', () => {
  it('guarda el valor serializado y retorna true en éxito', () => {
    const ok = escribirJSON('mi_clave', { b: 2 })
    expect(ok).toBe(true)
    expect(JSON.parse(localStorage.getItem('mi_clave'))).toEqual({ b: 2 })
  })

  it('no dispara el evento "storage" si notify no está activado', () => {
    const listener = vi.fn()
    window.addEventListener('storage', listener)
    escribirJSON('mi_clave', { c: 3 })
    expect(listener).not.toHaveBeenCalled()
    window.removeEventListener('storage', listener)
  })

  it('dispara el evento "storage" si notify: true', () => {
    const listener = vi.fn()
    window.addEventListener('storage', listener)
    escribirJSON('mi_clave', { c: 3 }, { notify: true })
    expect(listener).toHaveBeenCalledTimes(1)
    window.removeEventListener('storage', listener)
  })

  it('dispara eventos custom adicionales listados en `eventos`', () => {
    const listener = vi.fn()
    window.addEventListener('presupuestos_actualizados', listener)
    escribirJSON('mi_clave', { d: 4 }, { eventos: ['presupuestos_actualizados'] })
    expect(listener).toHaveBeenCalledTimes(1)
    window.removeEventListener('presupuestos_actualizados', listener)
  })

  it('retorna false y registra el error si localStorage.setItem falla (ej. cuota excedida)', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError simulado')
    })
    const ok = escribirJSON('mi_clave', { e: 5 })
    expect(ok).toBe(false)
    expect(spy).toHaveBeenCalled()
    setItemSpy.mockRestore()
  })
})

describe('createLocalStorageRepository', () => {
  it('guardar → obtener conserva el dato de forma íntegra (roundtrip)', () => {
    const repo = createLocalStorageRepository('citas_test', [])
    repo.guardar([{ id: 1, hora: '09:00' }])
    expect(repo.obtener()).toEqual([{ id: 1, hora: '09:00' }])
  })

  it('obtener() usa el defaultValue de creación si la clave no existe', () => {
    const repo = createLocalStorageRepository('citas_test', ['default'])
    expect(repo.obtener()).toEqual(['default'])
  })

  it('obtener(fallback) permite sobreescribir el default por llamada', () => {
    const repo = createLocalStorageRepository('citas_test', ['default_creacion'])
    expect(repo.obtener(['default_llamada'])).toEqual(['default_llamada'])
  })

  it('guardar() con opciones.notify propaga el evento "storage"', () => {
    const listener = vi.fn()
    window.addEventListener('storage', listener)
    const repo = createLocalStorageRepository('citas_test', [], { notify: true })
    repo.guardar([{ id: 1 }])
    expect(listener).toHaveBeenCalledTimes(1)
    window.removeEventListener('storage', listener)
  })

  it('dos repositorios con distinta clave no interfieren entre sí', () => {
    const repoA = createLocalStorageRepository('clave_a', [])
    const repoB = createLocalStorageRepository('clave_b', [])
    repoA.guardar(['solo_a'])
    repoB.guardar(['solo_b'])
    expect(repoA.obtener()).toEqual(['solo_a'])
    expect(repoB.obtener()).toEqual(['solo_b'])
  })

  it('ante JSON corrupto en la clave, obtener() retorna el fallback en vez de lanzar excepción', () => {
    localStorage.setItem('citas_test', 'no-es-json{{{')
    const repo = createLocalStorageRepository('citas_test', ['seguro'])
    expect(() => repo.obtener()).not.toThrow()
    expect(repo.obtener()).toEqual(['seguro'])
  })
})