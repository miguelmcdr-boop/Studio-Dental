/**
 * @vitest-environment node
 *
 * Tests unitarios y de integración para la cola offline de pagos (P1-3)
 * Valida el patrón pending-* con pendingPagos, pendingDeletesPagos y protección contra purga.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Polyfill de localStorage para entorno Node
const localStorageStore = new Map()
global.localStorage = {
  getItem: (k) => localStorageStore.get(k) ?? null,
  setItem: (k, v) => localStorageStore.set(k, String(v)),
  removeItem: (k) => localStorageStore.delete(k),
  clear: () => localStorageStore.clear(),
  get length() { return localStorageStore.size },
  key: (i) => Array.from(localStorageStore.keys())[i] ?? null
}

const { estadoMock, mockFrom } = vi.hoisted(() => ({
  estadoMock: {
    clinicaId: 'clinica-A',
    user: { id: 'user-cajero-123' },
    supabaseError: null,
    remotePagos: [],
    softDeletedIds: []
  },
  mockFrom: vi.fn()
}))

// Mock de authService
vi.mock('../../../../infrastructure/auth/authService', () => ({
  getClinicaActiva: vi.fn(() => estadoMock.clinicaId),
  getClinicaActivaSync: vi.fn(() => estadoMock.clinicaId),
  setClinicaActiva: vi.fn(async (id) => {
    estadoMock.clinicaId = id
  }),
  listarMisClinicas: vi.fn(async () => []),
  obtenerPerfil: vi.fn(() => null)
}))

// Mock de supabaseClient
vi.mock('../../../../infrastructure/supabase/supabaseClient', () => ({
  USE_SUPABASE: true,
  supabase: {
    auth: {
      getUser: vi.fn(async () => ({ data: { user: estadoMock.user }, error: null }))
    },
    from: mockFrom
  }
}))

import {
  pagosStorageService,
  registrarPago,
  procesarColaPagos,
  obtenerPendingPagos,
  obtenerPendingDeletesPagos,
  sincronizarDesdeSupabase,
  eliminarPago
} from './pagosStorageService'

const configurarClinica = (clinicaId) => {
  estadoMock.clinicaId = clinicaId
}

describe('P1-3: Cola de Pagos (pendingPagos)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageStore.clear()
    configurarClinica('clinica-A')
    pagosStorageService.resetCache()
    estadoMock.supabaseError = null
    estadoMock.remotePagos = []
    estadoMock.softDeletedIds = []

    mockFrom.mockImplementation((tabla) => {
      if (tabla !== 'pagos') return {}

      return {
        select: vi.fn(() => ({
          order: vi.fn(async () => {
            if (estadoMock.supabaseError) {
              return { data: null, error: estadoMock.supabaseError }
            }
            return { data: estadoMock.remotePagos, error: null }
          }),
          then: (resolve) => {
            if (estadoMock.supabaseError) {
              resolve({ data: null, error: estadoMock.supabaseError })
            } else {
              resolve({ data: estadoMock.remotePagos, error: null })
            }
          }
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(async () => {
              if (estadoMock.supabaseError) {
                return { data: null, error: estadoMock.supabaseError }
              }
              return {
                data: { id: 'a1b2c3d4-1111-2222-3333-444455556666' },
                error: null
              }
            })
          }))
        })),
        upsert: vi.fn(async () => {
          if (estadoMock.supabaseError) {
            return { error: estadoMock.supabaseError }
          }
          return { error: null }
        }),
        update: vi.fn((payload) => ({
          eq: vi.fn((col, val) => {
            if (payload?.estado === 'Purgado' || payload?.deleted_at) {
              estadoMock.softDeletedIds.push(val)
            }
            return Promise.resolve({
              error: estadoMock.supabaseError
            })
          })
        })),
        delete: vi.fn(() => ({
          eq: vi.fn((col, val) => {
            if (estadoMock.supabaseError) {
              return Promise.resolve({ error: estadoMock.supabaseError })
            }
            estadoMock.softDeletedIds.push(val)
            return Promise.resolve({ error: null })
          })
        }))
      }
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 1: Encolado offline
  // ──────────────────────────────────────────────────────────────────────────
  it('1. Encolado offline: registrar pago sin conexión lo guarda en localStorage con sincronizado: false y registra su ID en pendingPagos', async () => {
    // Simular desconexión / fallo en Supabase
    estadoMock.supabaseError = new Error('Network error (offline)')

    const pagoNuevo = {
      id: 991,
      folioComprobante: 'REC-2026-991',
      pacienteId: 'uuid-paciente-1',
      pacienteNombre: 'Constanza Morales',
      monto: 45000,
      metodoPago: 'Transferencia',
      concepto: 'Control semestral'
    }

    const resultado = await registrarPago(pagoNuevo)
    expect(resultado).toBeDefined()
    expect(resultado.sincronizado).toBe(false)

    // Verificar que está en el almacenamiento local de pagos
    const locales = pagosStorageService.obtenerPagos()
    const guardado = locales.find((p) => p.id === 991 || p.folioComprobante === 'REC-2026-991')
    expect(guardado).toBeDefined()
    expect(guardado.monto).toBe(45000)

    // Verificar que el ID está en la cola pendingPagos
    const pending = obtenerPendingPagos()
    const encolado = pending.some((item) => (typeof item === 'object' ? item.id === 991 : item === 991))
    expect(encolado).toBe(true)
  })

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 2: Procesamiento diferido exitoso
  // ──────────────────────────────────────────────────────────────────────────
  it('2. Procesamiento diferido exitoso: al recuperar conexión y llamar procesarColaPagos(), el pago se sube a Supabase, se marca como sincronizado: true y se retira de pendingPagos', async () => {
    // Primero, creamos offline
    estadoMock.supabaseError = new Error('Network error (offline)')

    await registrarPago({
      id: 992,
      folioComprobante: 'REC-2026-992',
      pacienteId: 'uuid-paciente-2',
      pacienteNombre: 'Felipe Ramos',
      monto: 80000,
      metodoPago: 'Efectivo',
      concepto: 'Endodoncia sesión 1'
    })

    expect(obtenerPendingPagos().length).toBe(1)

    // Ahora se recupera la conexión
    estadoMock.supabaseError = null

    const resumenProceso = await procesarColaPagos()
    expect(resumenProceso.procesados).toBe(1)
    expect(resumenProceso.fallidos).toBe(0)

    // Debe haberse retirado de pendingPagos
    const pendingDespues = obtenerPendingPagos()
    expect(pendingDespues.length).toBe(0)

    // Debe estar marcado como sincronizado: true en el almacenamiento local
    const locales = pagosStorageService.obtenerPagos()
    const pagoSincronizado = locales.find((p) => p.folioComprobante === 'REC-2026-992')
    expect(pagoSincronizado).toBeDefined()
    expect(pagoSincronizado.sincronizado).toBe(true)
  })

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 3: Resiliencia ante fallos
  // ──────────────────────────────────────────────────────────────────────────
  it('3. Resiliencia ante fallos: si Supabase rechaza, el pago permanece en localStorage y su ID sigue en pendingPagos', async () => {
    // Simular error al registrar
    estadoMock.supabaseError = new Error('Supabase 500: Internal Server Error')

    await registrarPago({
      id: 993,
      folioComprobante: 'REC-2026-993',
      pacienteId: 'uuid-paciente-3',
      pacienteNombre: 'Daniela Soto',
      monto: 30000,
      metodoPago: 'Débito',
      concepto: 'Destartraje'
    })

    // Sigue fallando en el drenaje diferido
    estadoMock.supabaseError = new Error('Supabase timeout')

    const resumenProceso = await procesarColaPagos()
    expect(resumenProceso.fallidos).toBeGreaterThan(0)

    // El ID debe continuar en pendingPagos
    const pending = obtenerPendingPagos()
    expect(pending.length).toBe(1)
    const encolado = pending.some((item) => (typeof item === 'object' ? item.id === 993 : item === 993))
    expect(encolado).toBe(true)

    // El pago debe continuar intacto en localStorage
    const locales = pagosStorageService.obtenerPagos()
    const pagoLocal = locales.find((p) => p.id === 993)
    expect(pagoLocal).toBeDefined()
    expect(pagoLocal.monto).toBe(30000)
    expect(pagoLocal.sincronizado).toBe(false)
  })

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 4: Protección contra purga
  // ──────────────────────────────────────────────────────────────────────────
  it('4. Protección contra purga: sincronizarDesdeSupabase() NO debe borrar pagos locales que estén en pendingPagos', async () => {
    // 1. Guardar pago offline (queda en pendingPagos y con sincronizado: false)
    estadoMock.supabaseError = new Error('Offline')

    await registrarPago({
      id: 994,
      folioComprobante: 'REC-2026-994',
      pacienteId: 'uuid-paciente-4',
      pacienteNombre: 'Rodrigo Vega',
      monto: 60000,
      metodoPago: 'Crédito',
      concepto: 'Corona provisoria'
    })

    // 2. Supabase vuelve online pero sólo contiene un pago remoto diferente
    estadoMock.supabaseError = null
    estadoMock.remotePagos = [
      {
        id: 'c1d2e3f4-5555-6666-7777-888899990000',
        folio: 'REC-2026-100',
        paciente_id: 'uuid-paciente-otro',
        monto: 25000,
        metodo_pago: 'Efectivo',
        fecha: '2026-09-20',
        concepto: 'Urgencia'
      }
    ]

    // 3. Ejecutar sincronizarDesdeSupabase
    const resultadoSync = await sincronizarDesdeSupabase()

    // El pago 994 NO debe haberse borrado
    const pagoProtegido = resultadoSync.find((p) => p.id === 994 || p.folioComprobante === 'REC-2026-994')
    expect(pagoProtegido).toBeDefined()
    expect(pagoProtegido.monto).toBe(60000)

    // Y el pago remoto también debe estar disponible
    const remotoEnCache = resultadoSync.find((p) => p.id === 'c1d2e3f4-5555-6666-7777-888899990000')
    expect(remotoEnCache).toBeDefined()
  })

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 5: Aislamiento multi-tenant
  // ──────────────────────────────────────────────────────────────────────────
  it('5. Aislamiento multi-tenant: pendingPagos de Clínica A no se procesa cuando la sesión activa es Clínica B', async () => {
    // 1. En Clínica A registramos un pago offline
    configurarClinica('clinica-A')
    estadoMock.supabaseError = new Error('Offline')

    await registrarPago({
      id: 995,
      folioComprobante: 'REC-2026-995',
      pacienteId: 'uuid-paciente-5',
      pacienteNombre: 'Paciente Clinica A',
      monto: 120000,
      metodoPago: 'Efectivo'
    })

    expect(obtenerPendingPagos().length).toBe(1)

    // 2. Cambiamos a Clínica B
    configurarClinica('clinica-B')
    pagosStorageService.resetCache()
    estadoMock.supabaseError = null

    // En Clínica B, la cola debe estar vacía para su tenant
    const pendingClinicaB = obtenerPendingPagos()
    expect(pendingClinicaB.length).toBe(0)

    // Procesar cola en Clínica B no debe subir ni alterar el pago de Clínica A
    const resB = await procesarColaPagos()
    expect(resB.procesados).toBe(0)

    // 3. Volvemos a Clínica A: su pago sigue intacto y pendiente
    configurarClinica('clinica-A')
    pagosStorageService.resetCache()
    const pendingClinicaA = obtenerPendingPagos()
    expect(pendingClinicaA.length).toBe(1)
    expect(pendingClinicaA.some((item) => (typeof item === 'object' ? item.id === 995 : item === 995))).toBe(true)
  })

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 6: Eliminación explícita
  // ──────────────────────────────────────────────────────────────────────────
  it('6. Eliminación explícita: eliminar pago encola su ID en pendingDeletesPagos para soft-delete diferido', async () => {
    // Creamos un pago con UUID
    const pagoIdUUID = 'e4b3c2a1-1234-5678-9012-345678901234'
    const pagoExistente = {
      id: pagoIdUUID,
      folioComprobante: 'REC-2026-996',
      pacienteId: 'uuid-paciente-6',
      monto: 15000,
      sincronizado: true
    }

    pagosStorageService.guardarPagos([pagoExistente])
    expect(pagosStorageService.obtenerPagos().length).toBe(1)

    // Simular que estamos offline al eliminar
    estadoMock.supabaseError = new Error('Offline al eliminar')

    await eliminarPago(pagoIdUUID)

    // El pago se elimina localmente
    expect(pagosStorageService.obtenerPagos().length).toBe(0)

    // Su ID queda en pendingDeletesPagos
    const pendingDeletes = obtenerPendingDeletesPagos()
    expect(pendingDeletes).toContain(pagoIdUUID)

    // Al restaurar conexión y ejecutar procesarColaPagos, se procesa la eliminación diferida
    estadoMock.supabaseError = null
    await procesarColaPagos()

    expect(estadoMock.softDeletedIds).toContain(pagoIdUUID)
    expect(obtenerPendingDeletesPagos().length).toBe(0)
  })
})
