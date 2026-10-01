import { describe, it, expect } from 'vitest'
import { SECCIONES_SIDEBAR } from './sidebarConstants'

describe('sidebarConstants', () => {
  it('contiene 4 secciones principales', () => {
    expect(SECCIONES_SIDEBAR).toHaveLength(4)
    expect(SECCIONES_SIDEBAR.map(s => s.label)).toEqual([
      'Clínica',
      'Operaciones',
      'Finanzas',
      'Admin',
    ])
  })

  it('todos los items tienen nombre e icono', () => {
    SECCIONES_SIDEBAR.forEach(seccion => {
      expect(seccion.items.length).toBeGreaterThan(0)
      seccion.items.forEach(item => {
        expect(typeof item.name).toBe('string')
        expect(item.icon).toBeDefined()
      })
    })
  })

  it('items con permisos requeridos tienen permisos válidos', () => {
    const itemsConPermiso = SECCIONES_SIDEBAR
      .flatMap(s => s.items)
      .filter(i => i.permisoRequerido)

    expect(itemsConPermiso.length).toBeGreaterThan(0)
    itemsConPermiso.forEach(item => {
      expect(typeof item.permisoRequerido).toBe('string')
    })
  })
})
