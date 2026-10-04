/**
 * Tests de regresión F7-36: no-fallback-cross-clinic
 *
 * Garantiza que los 4 storage services con fallback peligroso
 * (finanzas, agenda, pagos, presupuestos) NO conservan cache
 * de clínica anterior cuando Supabase retorna [] sin error.
 *
 * Patrón real de la app (legacy):
 *   1. localStorage.setItem(STORAGE_KEY, datosClinicaA)
 *   2. servicio.obtenerX() → inicializa cache en memoria desde localStorage
 *   3. servicio.sincronizarDesdeSupabase() → Supabase retorna []
 *   4. DEBE retornar [] (NO los datos de clínica A)
 *
 * Patrón tenant-aware (Commit 1.5b+):
 *   Los servicios migrados a createTenantRepository usan claves
 *   sd_<clinicaId>_<baseKey> en lugar de las legacy studio_dental_*.
 *   El test de agendaStorageService usa este patrón; los otros 3 aún
 *   usan el patrón legacy hasta ser migrados (Commits 1.5c-1.5e).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Claves de localStorage usadas por cada servicio (deben coincidir con las
// constantes STORAGE_KEY_* en cada archivo).
const STORAGE_KEYS = {
  finanzas: 'studio_dental_finanzas_movimientos',
  agenda: 'studio_dental_agenda_citas_v3',
  pagos: 'studio_dental_pagos_historial_v3',
  presupuestos: 'studio_dental_presupuestos_globales',
}

/**
 * Crea un mock de supabase que soporta cadenas de múltiples .order()
 * (necesario para agendaStorageService que hace .order('fecha').order('hora_inicio'))
 * 
 * Estructura: from() → select() → order() → order() → ... → Promise.resolve({ data, error })
 * Cada .order() retorna un objeto que tiene otro .order() como método.
 */
const crearMockSupabase = (dataRespuesta, errorRespuesta = null) => {
  // Nodo terminal: resuelve la promesa y también tiene .order() para permitir más encadenamiento
  const terminalNode = {
    order: vi.fn(),
    then: vi.fn((resolve) => resolve({ data: dataRespuesta, error: errorRespuesta })),
  }
  // El .order() del terminal retorna el mismo terminal (permite encadenar infinitamente)
  terminalNode.order.mockReturnValue(terminalNode)

  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue(terminalNode),
      }),
    }),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }),
    },
  }
}
/**
 * Crea un mock de tenantCache que simula una clínica activa.
 * Necesario para los servicios migrados a createTenantRepository.
 *
 * @param {string} clinicaId - ID de la clínica activa simulada
 */
const crearMockTenantCache = (clinicaId) => ({
  getClinicaId: vi.fn(() => clinicaId),
  claveTenant: (baseKey) => `sd_${clinicaId}_${baseKey}`,
  leerTenant: (baseKey, fallback) => {
    const key = `sd_${clinicaId}_${baseKey}`
    const saved = localStorage.getItem(key)
    return saved !== null ? JSON.parse(saved) : fallback
  },
  escribirTenant: (baseKey, value) => {
    const key = `sd_${clinicaId}_${baseKey}`
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch {
      return false
    }
  },
  eliminarTenant: (baseKey) => {
    const key = `sd_${clinicaId}_${baseKey}`
    const existia = localStorage.getItem(key) !== null
    localStorage.removeItem(key)
    return existia
  },
  existeTenant: (baseKey) => {
    return localStorage.getItem(`sd_${clinicaId}_${baseKey}`) !== null
  },
})


describe('F7-36: No-fallback cross-clinic en storage services', () => {
  beforeEach(() => {
    vi.resetModules()
    localStorage.clear()
  })

  afterEach(() => {
    vi.doUnmock('../../services/supabaseClient')
    vi.restoreAllMocks()
  })

  describe('Caso 1: Supabase [] no recupera cache de clínica anterior', () => {
    it('finanzasStorageService: Supabase [] sobrescribe cache antiguo (tenant-aware)', async () => {
      // F7-36 FASE 1 (Commit 1.5c): finanzasStorageService fue migrado a createTenantRepository
      const CLINICA_ID = 'clinica-A'
      const CLAVE_TENANT = `sd_${CLINICA_ID}_${STORAGE_KEYS.finanzas}`

      // Simular cache con datos de clínica A en clave tenant-aware
      localStorage.setItem(
        CLAVE_TENANT,
        JSON.stringify([
          { id: 'a-1', monto: 100, descripcion: 'Clínica A' },
          { id: 'a-2', monto: 200, descripcion: 'Clínica A' },
        ])
      )

      // Mockear tenantCache ANTES de importar el servicio
      vi.doMock('../../services/tenantCache', () => ({
        tenantCache: crearMockTenantCache(CLINICA_ID),
      }))

      // Mockear supabase
      const mockSupabase = crearMockSupabase([], null)
      vi.doMock('../../services/supabaseClient', () => ({
        supabase: mockSupabase,
        USE_SUPABASE: true,
      }))

      const { finanzasStorageService } = await import(
        '../../domains/billing/cash-register/services/finanzasStorageService.js'
      )

      const inicial = finanzasStorageService.obtenerMovimientos()
      expect(inicial).toHaveLength(2)

      const result = await finanzasStorageService.sincronizarDesdeSupabase()

      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(0)

      // Cache en clave tenant-aware debe estar vacío
      expect(JSON.parse(localStorage.getItem(CLAVE_TENANT) || 'null')).toEqual([])
    })

    it('agendaStorageService: Supabase [] sobrescribe cache antiguo (tenant-aware)', async () => {
      // F7-36 FASE 1 (Commit 1.5b): agendaStorageService fue migrado a createTenantRepository.
      // Los datos se almacenan en clave tenant-aware: sd_<clinicaId>_<baseKey>
      const CLINICA_ID = 'clinica-A'
      const CLAVE_TENANT = `sd_${CLINICA_ID}_${STORAGE_KEYS.agenda}`

      // Simular cache con datos de clínica A en clave tenant-aware
      localStorage.setItem(
        CLAVE_TENANT,
        JSON.stringify([{ id: 'a-1', paciente: 'Clínica A' }])
      )

      // Mockear tenantCache ANTES de importar el servicio
      vi.doMock('../../services/tenantCache', () => ({
        tenantCache: crearMockTenantCache(CLINICA_ID),
      }))

      // Mockear supabase
      const mockSupabase = crearMockSupabase([], null)
      vi.doMock('../../services/supabaseClient', () => ({
        supabase: mockSupabase,
        USE_SUPABASE: true,
      }))

      const { agendaStorageService } = await import(
        '../../domains/operations/agenda/services/agendaStorageService.js'
      )

      // Obtener citas (lee de clave tenant-aware)
      const inicial = agendaStorageService.obtenerCitas()
      expect(inicial).toHaveLength(1)

      // Sincronizar desde Supabase (retorna [])
      const result = await agendaStorageService.sincronizarDesdeSupabase()

      expect(result).toHaveLength(0)
      // Cache en localStorage debe estar vacío (en clave tenant-aware)
      expect(JSON.parse(localStorage.getItem(CLAVE_TENANT) || 'null')).toEqual([])
    })

    it('pagosStorageService: Supabase [] sobrescribe cache antiguo (tenant-aware)', async () => {
      // F7-36 FASE 1 (Commit 1.5c): pagosStorageService fue migrado a createTenantRepository
      const CLINICA_ID = 'clinica-A'
      const CLAVE_TENANT = `sd_${CLINICA_ID}_${STORAGE_KEYS.pagos}`

      localStorage.setItem(
        CLAVE_TENANT,
        JSON.stringify([{ id: 'a-1', monto: 50000, paciente: 'Clínica A' }])
      )

      vi.doMock('../../services/tenantCache', () => ({
        tenantCache: crearMockTenantCache(CLINICA_ID),
      }))

      const mockSupabase = crearMockSupabase([], null)
      vi.doMock('../../services/supabaseClient', () => ({
        supabase: mockSupabase,
        USE_SUPABASE: true,
      }))

      const { pagosStorageService } = await import(
        '../../modules/pagos/services/pagosStorageService.js'
      )
      const inicial = pagosStorageService.obtenerPagos()
      expect(inicial).toHaveLength(1)

      const result = await pagosStorageService.sincronizarDesdeSupabase()

      expect(result).toHaveLength(0)
      expect(JSON.parse(localStorage.getItem(CLAVE_TENANT) || 'null')).toEqual([])
    })

    it('presupuestosStorageService: Supabase [] sobrescribe cache antiguo (tenant-aware)', async () => {
      // F7-36 FASE 1 (Commit 1.5c): presupuestosStorageService fue migrado a createTenantRepository
      const CLINICA_ID = 'clinica-A'
      const CLAVE_TENANT = `sd_${CLINICA_ID}_${STORAGE_KEYS.presupuestos}`

      localStorage.setItem(
        CLAVE_TENANT,
        JSON.stringify([{ id: 'a-1', total: 150000, paciente: 'Clínica A' }])
      )

      vi.doMock('../../services/tenantCache', () => ({
        tenantCache: crearMockTenantCache(CLINICA_ID),
      }))

      const mockSupabase = crearMockSupabase([], null)
      vi.doMock('../../services/supabaseClient', () => ({
        supabase: mockSupabase,
        USE_SUPABASE: true,
      }))

      const { presupuestosStorageService } = await import(
        '../../modules/presupuestos/services/presupuestosStorageService.js'
      )
      const inicial = presupuestosStorageService.obtenerPresupuestos()
      expect(inicial).toHaveLength(1)

      const result = await presupuestosStorageService.sincronizarDesdeSupabase()

      expect(result).toHaveLength(0)
      expect(JSON.parse(localStorage.getItem(CLAVE_TENANT) || 'null')).toEqual([])
    })
  })

  describe('Caso 2: Error de red SÍ conserva cache (offline-first)', () => {
    it('finanzasStorageService: error de red retorna cache existente (tenant-aware)', async () => {
      // F7-36 FASE 1 (Commit 1.5c): finanzasStorageService fue migrado a createTenantRepository
      const CLINICA_ID = 'clinica-A'
      const CLAVE_TENANT = `sd_${CLINICA_ID}_${STORAGE_KEYS.finanzas}`

      const datosCache = [
        { id: 'a-1', monto: 100, descripcion: 'Clínica A' },
        { id: 'a-2', monto: 200, descripcion: 'Clínica A' },
      ]
      localStorage.setItem(CLAVE_TENANT, JSON.stringify(datosCache))

      vi.doMock('../../services/tenantCache', () => ({
        tenantCache: crearMockTenantCache(CLINICA_ID),
      }))

      // Mockear supabase con error
      const mockSupabase = crearMockSupabase(null, new Error('Network error'))
      vi.doMock('../../services/supabaseClient', () => ({
        supabase: mockSupabase,
        USE_SUPABASE: true,
      }))

      const { finanzasStorageService } = await import(
        '../../domains/billing/cash-register/services/finanzasStorageService.js'
      )

      const inicial = finanzasStorageService.obtenerMovimientos()
      expect(inicial).toEqual(datosCache)

      const result = await finanzasStorageService.sincronizarDesdeSupabase()

      // DEBE retornar los datos del cache (offline-first correcto)
      expect(result).toEqual(datosCache)
    })
  })

  describe('Caso 3: Supabase con datos válidos sobrescribe cache', () => {
    it('finanzasStorageService: datos nuevos reemplazan cache (tenant-aware)', async () => {
      // F7-36 FASE 1 (Commit 1.5c): finanzasStorageService fue migrado a createTenantRepository
      const CLINICA_ID = 'clinica-A'
      const CLAVE_TENANT = `sd_${CLINICA_ID}_${STORAGE_KEYS.finanzas}`

      const datosCache = [{ id: 'a-1', monto: 100, descripcion: 'Clínica A (viejo)' }]
      localStorage.setItem(CLAVE_TENANT, JSON.stringify(datosCache))

      vi.doMock('../../services/tenantCache', () => ({
        tenantCache: crearMockTenantCache(CLINICA_ID),
      }))

      // Datos en formato snake_case (como vienen de la BD)
      const datosSupabase = [
        {
          id: 'b-1',
          monto: 500,
          descripcion: 'Clínica B (nuevo)',
          tipo: 'ingreso',
          categoria: 'consulta',
          fecha: '2026-09-01',
          created_at: '2026-09-01T10:00:00Z',
          updated_at: '2026-09-01T10:00:00Z',
        },
      ]

      const mockSupabase = crearMockSupabase(datosSupabase, null)
      vi.doMock('../../services/supabaseClient', () => ({
        supabase: mockSupabase,
        USE_SUPABASE: true,
      }))

      const { finanzasStorageService } = await import(
        '../../domains/billing/cash-register/services/finanzasStorageService.js'
      )

      const inicial = finanzasStorageService.obtenerMovimientos()
      expect(inicial).toHaveLength(1)
      expect(inicial[0].id).toBe('a-1')

      const result = await finanzasStorageService.sincronizarDesdeSupabase()

      // DEBE retornar los datos nuevos (transformados desde snake_case)
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)

      // Verificar que los IDs de clínica A NO están en el resultado
      const idsEnResultado = result.map((r) => r.id)
      expect(idsEnResultado).not.toContain('a-1')
    })
  })
})
