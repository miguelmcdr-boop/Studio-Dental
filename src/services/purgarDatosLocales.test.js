/**
 * Tests de purgarDatosLocales (F7-05).
 *
 * Valida que la función purga todas las capas de persistencia local
 * sin fallar y sin borrar datos de otras apps.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mockear los stores antes de importar el servicio
vi.mock('../store/pacientesStore', () => ({
  usePacientesStore: {
    setState: vi.fn(),
  },
}))

vi.mock('../store/prestacionesStore', () => ({
  usePrestacionesStore: {
    setState: vi.fn(),
  },
}))

vi.mock('./logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}))

// Mocks globales para localStorage, indexedDB, caches
const mockLocalStorage = (() => {
  const store = new Map()
  return {
    get length() { return store.size },
    key: (i) => Array.from(store.keys())[i] ?? null,
    getItem: (k) => store.get(k) ?? null,
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
    _size: () => store.size,
  }
})()

Object.defineProperty(globalThis, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
  configurable: true,
})

// Importar DESPUÉS de mockear
const { purgarDatosLocales } = await import('./purgarDatosLocales.js')
const { usePacientesStore } = await import('../store/pacientesStore')
const { usePrestacionesStore } = await import('../store/prestacionesStore')

describe('purgarDatosLocales (F7-05)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.clear()

    // Restaurar caches e indexedDB reales para cada test
    if (typeof caches !== 'undefined') {
      // se mockea por test si es necesario
    }
  })

  describe('Paso 1: stores Zustand en memoria', () => {
    it('resetea usePacientesStore y usePrestacionesStore', async () => {
      await purgarDatosLocales()
      expect(usePacientesStore.setState).toHaveBeenCalledWith({ pacientes: [] })
      expect(usePrestacionesStore.setState).toHaveBeenCalledWith({ prestaciones: [] })
    })

    it('retorna los nombres de los stores reseteados', async () => {
      const r = await purgarDatosLocales()
      expect(r.stores).toContain('pacientesStore')
      expect(r.stores).toContain('prestacionesStore')
    })

    it('sigue funcionando si un store falla', async () => {
      usePacientesStore.setState.mockImplementationOnce(() => {
        throw new Error('boom')
      })
      const r = await purgarDatosLocales()
      // prestacionesStore sí se resetea
      expect(usePrestacionesStore.setState).toHaveBeenCalled()
      // pacientesStore no aparece en stores reseteados
      expect(r.stores).not.toContain('pacientesStore')
    })
  })

  describe('Paso 2: localStorage (solo claves de la app)', () => {
    it('borra claves de la app y preserva claves ajenas', async () => {
      // Claves de la app
      mockLocalStorage.setItem('studio_dental_pacientes_v3', '[]')
      mockLocalStorage.setItem('clinica_active_section', 'agenda')
      mockLocalStorage.setItem('clinica_paciente_seleccionado_id', '42')
      mockLocalStorage.setItem('profile_user@example.com', '{}')
      mockLocalStorage.setItem('recetas_123', '[]')
      mockLocalStorage.setItem('evoluciones_notas_456', '[]')
      mockLocalStorage.setItem('sb-abc123-auth-token', '{}')
      mockLocalStorage.setItem('goTrue-token', 'legacy')

      // Claves de otras apps (NO deben tocarse)
      mockLocalStorage.setItem('otra_app_session', 'x')
      mockLocalStorage.setItem('analytics_id', 'y')

      const r = await purgarDatosLocales()

      // 8 claves de la app borradas
      expect(r.localStorageKeys).toBe(8)
      expect(mockLocalStorage.getItem('studio_dental_pacientes_v3')).toBeNull()
      expect(mockLocalStorage.getItem('clinica_active_section')).toBeNull()
      expect(mockLocalStorage.getItem('sb-abc123-auth-token')).toBeNull()

      // Claves ajenas preservadas
      expect(mockLocalStorage.getItem('otra_app_session')).toBe('x')
      expect(mockLocalStorage.getItem('analytics_id')).toBe('y')
    })

    it('retorna 0 si localStorage no tiene claves de la app', async () => {
      mockLocalStorage.setItem('otra_app_session', 'x')
      const r = await purgarDatosLocales()
      expect(r.localStorageKeys).toBe(0)
    })
  })

  describe('Paso 3: IndexedDB', () => {
    it('retorna { eliminada: false, razon: "indexedDB no disponible" } cuando indexedDB no existe', async () => {
      const original = globalThis.indexedDB
      delete globalThis.indexedDB
      try {
        const r = await purgarDatosLocales()
        expect(r.indexedDB.eliminada).toBe(false)
        expect(r.indexedDB.razon).toMatch(/indexedDB no disponible/)
      } finally {
        if (original !== undefined) globalThis.indexedDB = original
      }
    })

    it('llama a indexedDB.deleteDatabase con el nombre correcto', async () => {
      const deleteDatabase = vi.fn(() => ({
        onsuccess: null,
        onerror: null,
        onblocked: null,
      }))
      globalThis.indexedDB = { deleteDatabase }

      const promise = purgarDatosLocales()
      // Simular success asíncrono
      await Promise.resolve()
      const req = deleteDatabase.mock.results[0].value
      req.onsuccess()

      const r = await promise
      expect(deleteDatabase).toHaveBeenCalledWith('studio_dental_adjuntos')
      expect(r.indexedDB.eliminada).toBe(true)

      delete globalThis.indexedDB
    })
  })

  describe('Paso 4: Cache Storage', () => {
    it('borra todas las caches y retorna el conteo', async () => {
      const cachesBorradas = []
      globalThis.caches = {
        keys: vi.fn(async () => ['supabase-cache', 'static-resources']),
        delete: vi.fn(async (name) => { cachesBorradas.push(name); return true }),
      }

      const r = await purgarDatosLocales()
      expect(r.cacheStorageKeys).toBe(2)
      expect(cachesBorradas).toEqual(['supabase-cache', 'static-resources'])

      delete globalThis.caches
    })

    it('retorna 0 si caches no está disponible', async () => {
      const original = globalThis.caches
      delete globalThis.caches
      try {
        const r = await purgarDatosLocales()
        expect(r.cacheStorageKeys).toBe(0)
      } finally {
        if (original !== undefined) globalThis.caches = original
      }
    })
  })

  describe('Integración: resumen completo', () => {
    it('retorna un objeto con las 4 capas', async () => {
      mockLocalStorage.setItem('clinica_active_user', 'a@b.c')
      const r = await purgarDatosLocales()

      expect(r).toHaveProperty('stores')
      expect(r).toHaveProperty('localStorageKeys')
      expect(r).toHaveProperty('indexedDB')
      expect(r).toHaveProperty('cacheStorageKeys')
      expect(Array.isArray(r.stores)).toBe(true)
      expect(typeof r.localStorageKeys).toBe('number')
      expect(typeof r.indexedDB).toBe('object')
      expect(typeof r.cacheStorageKeys).toBe('number')
    })
  })
})
