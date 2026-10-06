/**
 * @vitest-environment node
 *
 * Tests unitarios y de integración para la cola offline de pacientes (P1-3)
 * Valida el patrón pending-* con pendingPacientes y protección contra purga.
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
    user: { id: 'user-dentista-123' },
    supabaseError: null,
    remotePacientes: [],
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
  pacientesStorageService,
  guardarPaciente,
  procesarColaPacientes,
  obtenerPendingPacientes,
  sincronizarDesdeSupabase
} from './pacientesStorageService'

const configurarClinica = (clinicaId) => {
  estadoMock.clinicaId = clinicaId
}

describe('P1-3: Cola de Pacientes (pendingPacientes)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageStore.clear()
    configurarClinica('clinica-A')
    pacientesStorageService.resetCache()
    estadoMock.supabaseError = null
    estadoMock.remotePacientes = []
    estadoMock.softDeletedIds = []

    mockFrom.mockImplementation((tabla) => {
      if (tabla !== 'pacientes') return {}

      return {
        select: vi.fn(() => ({
          is: vi.fn(() => ({
            order: vi.fn(async () => {
              if (estadoMock.supabaseError) {
                return { data: null, error: estadoMock.supabaseError }
              }
              return { data: estadoMock.remotePacientes, error: null }
            }),
            then: (resolve) => {
              if (estadoMock.supabaseError) {
                resolve({ data: null, error: estadoMock.supabaseError })
              } else {
                resolve({ data: estadoMock.remotePacientes, error: null })
              }
            }
          })),
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(async () => ({ data: null, error: null }))
            })),
            is: vi.fn(() => ({
              order: vi.fn(async () => {
                if (estadoMock.supabaseError) {
                  return { data: null, error: estadoMock.supabaseError }
                }
                return { data: estadoMock.remotePacientes, error: null }
              }),
              then: (resolve) => {
                if (estadoMock.supabaseError) {
                  resolve({ data: null, error: estadoMock.supabaseError })
                } else {
                  resolve({ data: estadoMock.remotePacientes, error: null })
                }
              }
            }))
          }))
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(async () => {
              if (estadoMock.supabaseError) {
                return { data: null, error: estadoMock.supabaseError }
              }
              return {
                data: { id: 'uuid-paciente-1111-2222-3333-444455556666' },
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
          in: vi.fn((col, ids) => {
            if (payload?.deleted_at && Array.isArray(ids)) {
              estadoMock.softDeletedIds.push(...ids)
            }
            return {
              is: vi.fn(async () => ({ error: null }))
            }
          })
        }))
      }
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 1: Encolado offline
  // ──────────────────────────────────────────────────────────────────────────
  it('1. Encolado offline: crear/editar paciente sin conexión lo guarda en localStorage con sincronizado: false y registra su ID en pendingPacientes', async () => {
    // Simular que Supabase está offline o da error de red
    estadoMock.supabaseError = new Error('Network error (offline)')

    const pacienteNuevo = {
      id: 101,
      nombre: 'Valeria Donoso',
      rut: '12.345.678-5',
      telefono: '+56 9 9876 5432'
    }

    const resultado = await guardarPaciente(pacienteNuevo)
    expect(resultado).toBeDefined()

    // 1. Debe estar en localStorage y caché con sincronizado: false
    const locales = pacientesStorageService.obtenerPacientes()
    const encontrado = locales.find((p) => p.id === 101 || p.rut === pacienteNuevo.rut)
    expect(encontrado).toBeDefined()
    expect(encontrado.sincronizado).toBe(false)

    // 2. Debe figurar en pendingPacientes
    const pending = obtenerPendingPacientes()
    const estaEnCola = pending.some((item) =>
      typeof item === 'object' ? item.id === 101 : item === 101
    )
    expect(estaEnCola).toBe(true)
  })

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 2: Procesamiento diferido exitoso
  // ──────────────────────────────────────────────────────────────────────────
  it('2. Procesamiento diferido: al recuperar conexión y llamar procesarColaPacientes, el paciente se sube a Supabase, se marca sincronizado: true y se retira de pendingPacientes', async () => {
    // Paso 1: guardar offline
    estadoMock.supabaseError = new Error('Network error (offline)')
    const pacienteNuevo = {
      id: 202,
      nombre: 'Rodrigo Fuentes',
      rut: '12.345.670-K',
      telefono: '+56 9 8765 1234'
    }
    await guardarPaciente(pacienteNuevo)

    const pendingAntes = obtenerPendingPacientes()
    expect(pendingAntes.some((i) => (typeof i === 'object' ? i.id === 202 : i === 202))).toBe(true)

    // Paso 2: vuelve conexión a Supabase
    estadoMock.supabaseError = null

    const resultado = await procesarColaPacientes()
    expect(resultado.procesados).toBeGreaterThanOrEqual(1)

    // Paso 3: el paciente ahora está sincronizado
    const locales = pacientesStorageService.obtenerPacientes()
    const actualizado = locales.find((p) => p.rut === pacienteNuevo.rut)
    expect(actualizado).toBeDefined()
    expect(actualizado.sincronizado).toBe(true)
    expect(actualizado.id).toBe('uuid-paciente-1111-2222-3333-444455556666')

    // Paso 4: retirado de pendingPacientes
    const pendingDespues = obtenerPendingPacientes()
    expect(pendingDespues.some((i) => (typeof i === 'object' ? i.id === 202 : i === 202))).toBe(false)
  })

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 3: Resiliencia ante fallos
  // ──────────────────────────────────────────────────────────────────────────
  it('3. Resiliencia ante fallos: si Supabase rechaza, el paciente permanece en localStorage y en pendingPacientes', async () => {
    // Guardar offline primero
    estadoMock.supabaseError = new Error('Offline inicial')
    const pacienteNuevo = {
      id: 303,
      nombre: 'Claudia Morales',
      rut: '15.432.109-8',
      telefono: '+56 9 7654 3210'
    }
    await guardarPaciente(pacienteNuevo)

    // Simular que el intento de drenaje falla (ej: 500 internal server error)
    estadoMock.supabaseError = new Error('Supabase 500 error')

    const resultado = await procesarColaPacientes()
    expect(resultado.fallidos).toBeGreaterThanOrEqual(1)

    // Debe permanecer en local con sincronizado: false
    const locales = pacientesStorageService.obtenerPacientes()
    const encontrado = locales.find((p) => p.id === 303)
    expect(encontrado).toBeDefined()
    expect(encontrado.sincronizado).toBe(false)

    // Debe seguir en pendingPacientes para reintentar después
    const pending = obtenerPendingPacientes()
    expect(pending.some((i) => (typeof i === 'object' ? i.id === 303 : i === 303))).toBe(true)
  })

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 4: Protección contra purga
  // ──────────────────────────────────────────────────────────────────────────
  it('4. Protección contra purga: sincronizarDesdeSupabase NO debe borrar pacientes locales en pendingPacientes', async () => {
    // Guardar paciente offline
    estadoMock.supabaseError = new Error('Offline')
    const pacienteOffline = {
      id: 404,
      nombre: 'Felipe Araya',
      rut: '7.654.321-6',
      telefono: '+56 9 6543 2109'
    }
    await guardarPaciente(pacienteOffline)

    // Supabase tiene solo pacientes históricos en la nube (sin incluir el creado offline)
    estadoMock.supabaseError = null
    estadoMock.remotePacientes = [
      {
        id: 'aaaa1111-bbbb-2222-cccc-333333333333',
        nombre: 'Paciente Remoto Existente',
        rut: '12.345.678-5',
        telefono: '+56 9 1111 2222',
        deleted_at: null,
        created_at: new Date().toISOString()
      }
    ]

    // Ejecutar sincronización desde Supabase
    await sincronizarDesdeSupabase()

    // El resultado DEBE contener tanto el paciente remoto COMO el creado offline preservado
    const locales = pacientesStorageService.obtenerPacientes()
    expect(locales.some((p) => p.id === 'aaaa1111-bbbb-2222-cccc-333333333333')).toBe(true)
    expect(locales.some((p) => p.id === 404 || p.rut === pacienteOffline.rut)).toBe(true)
  })

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 5: Aislamiento multi-tenant
  // ──────────────────────────────────────────────────────────────────────────
  it('5. Aislamiento multi-tenant: pendingPacientes de Clínica A no se procesa cuando la sesión activa es Clínica B', async () => {
    // Paso 1: Encolar paciente en Clínica A
    configurarClinica('clinica-A')
    estadoMock.supabaseError = new Error('Offline')
    const pacienteClinicaA = {
      id: 505,
      nombre: 'Paciente Clínica A',
      rut: '11.111.111-1',
      telefono: '+56 9 5432 1098'
    }
    await guardarPaciente(pacienteClinicaA)

    const pendingA = obtenerPendingPacientes()
    expect(pendingA.some((i) => (typeof i === 'object' ? i.id === 505 : i === 505))).toBe(true)

    // Paso 2: Cambiar a Clínica B
    configurarClinica('clinica-B')
    pacientesStorageService.resetCache()

    // En Clínica B la cola debe estar limpia
    const pendingB = obtenerPendingPacientes()
    expect(pendingB.some((i) => (typeof i === 'object' ? i.id === 505 : i === 505))).toBe(false)

    // Procesar cola en Clínica B no debe procesar nada de Clínica A
    estadoMock.supabaseError = null
    const resB = await procesarColaPacientes()
    expect(resB.procesados).toBe(0)

    // Paso 3: Al volver a Clínica A, el paciente sigue pendiente
    configurarClinica('clinica-A')
    pacientesStorageService.resetCache()
    const pendingARetorno = obtenerPendingPacientes()
    expect(pendingARetorno.some((i) => (typeof i === 'object' ? i.id === 505 : i === 505))).toBe(true)
  })

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 6: Regresión multi-usuario en guardarPacientes (batch)
  // ──────────────────────────────────────────────────────────────────────────
  it('6. Regresión multi-usuario: guardarPacientes (batch) NO debe eliminar pacientes ausentes en memoria local', async () => {
    // Usuario A crea paciente P-100 en Supabase
    const ID_PACIENTE_A = '11111111-aaaa-4111-8111-111111111111'
    estadoMock.remotePacientes = [
      {
        id: ID_PACIENTE_A,
        nombre: 'Paciente de Usuario A (P-100)',
        rut: '7.654.321-6',
        telefono: '+56 9 1234 5678',
        deleted_at: null
      }
    ]

    // Usuario B tiene únicamente su paciente local en memoria (P-100 NO está en su memoria)
    const pacienteB = {
      id: '22222222-bbbb-4222-8222-222222222222',
      nombre: 'Paciente de Usuario B',
      rut: '12.345.670-K',
      telefono: '+56 9 9876 5432'
    }

    // Usuario B ejecuta guardarPacientes con su array local
    await pacientesStorageService.guardarPacientes([pacienteB])

    // Resultado esperado: P-100 NO se elimina (queda intacto en Supabase)
    expect(estadoMock.softDeletedIds).not.toContain(ID_PACIENTE_A)
  })
})
