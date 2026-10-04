/**
 * @vitest-environment node
 *
 * Tests unitarios y de integración para la cola offline de evoluciones clínicas (P1-3)
 * Valida el patrón pending-* con pendingEvoluciones y protección contra purga.
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

const { estadoMock } = vi.hoisted(() => ({
  estadoMock: { clinicaId: 'clinica-A' }
}))

// Mock de authService y sesionStore
vi.mock('../../../../services/authService', () => ({
  getClinicaActiva: vi.fn(() => estadoMock.clinicaId),
  setClinicaActiva: vi.fn(async (id) => {
    estadoMock.clinicaId = id
  }),
  listarMisClinicas: vi.fn(async () => []),
  obtenerPerfil: vi.fn(() => null)
}))

vi.mock('../../../../store/sesionStore', () => ({
  useSesionStore: {
    getState: vi.fn(() => ({
      userProfile: { clinicaId: estadoMock.clinicaId }
    }))
  }
}))

// Mock de datosClinicosSupabase
const { mockSupabaseService } = vi.hoisted(() => ({
  mockSupabaseService: {
    guardarEvolucionClinica: vi.fn(),
    obtenerDatoClinico: vi.fn(),
    obtenerEvolucionesRemotas: vi.fn()
  }
}))

vi.mock('../../../../services/datosClinicosSupabase', () => ({
  guardarEvolucionClinica: mockSupabaseService.guardarEvolucionClinica,
  obtenerDatoClinico: mockSupabaseService.obtenerDatoClinico,
  obtenerEvolucionesRemotas: mockSupabaseService.obtenerEvolucionesRemotas
}))

import {
  evolucionesStorageService,
  guardarEvolucionClinica,
  procesarColaEvoluciones,
  sincronizarDesdeSupabase,
  obtenerPendingEvoluciones
} from './evolucionesStorageService'

const configurarClinica = (clinicaId) => {
  estadoMock.clinicaId = clinicaId
}

describe('P1-3: Cola de Evoluciones Clínicas (pendingEvoluciones)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageStore.clear()
    configurarClinica('clinica-A')
    mockSupabaseService.obtenerDatoClinico.mockReturnValue(null)
  })

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 1: Encolado offline
  // ──────────────────────────────────────────────────────────────────────────
  it('1. Encolado offline: guardar evolución sin conexión la guarda en localStorage y registra su ID en pendingEvoluciones', async () => {
    // Simular que Supabase falla o no hay conexión
    mockSupabaseService.guardarEvolucionClinica.mockRejectedValueOnce(new Error('Network error (offline)'))

    const pacienteId = 'paciente-offline-01'
    const nuevaEvo = {
      id: 101,
      fecha: '2026-10-01 10:00',
      texto: 'Paciente acude con dolor en pieza 1.4',
      tipo: 'evolucion'
    }

    const resultado = await guardarEvolucionClinica(pacienteId, nuevaEvo)
    expect(resultado).toBeDefined()

    // 1. Debe estar guardada en localStorage
    const locales = evolucionesStorageService.obtenerEvoluciones(pacienteId)
    const encontrada = locales.find((e) => e.id === 101 || e.texto === nuevaEvo.texto)
    expect(encontrada).toBeDefined()
    expect(encontrada.sincronizado).toBe(false)

    // 2. Debe figurar en pendingEvoluciones
    const pending = obtenerPendingEvoluciones()
    const estaEnCola = pending.some((item) =>
      typeof item === 'object' ? item.id === 101 : item === 101
    )
    expect(estaEnCola).toBe(true)
  })

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 2: Procesamiento diferido exitoso
  // ──────────────────────────────────────────────────────────────────────────
  it('2. Procesamiento diferido: al recuperar conexión sube a Supabase, marca sincronizado: true y retira de pendingEvoluciones', async () => {
    // Paso 1: guardar offline
    mockSupabaseService.guardarEvolucionClinica.mockRejectedValueOnce(new Error('Network error (offline)'))
    const pacienteId = 'paciente-offline-02'
    const nuevaEvo = {
      id: 202,
      fecha: '2026-10-01 11:30',
      texto: 'Evolución diferida para procesar',
      tipo: 'evolucion'
    }
    await guardarEvolucionClinica(pacienteId, nuevaEvo)

    const pendingAntes = obtenerPendingEvoluciones()
    expect(pendingAntes.some((i) => (typeof i === 'object' ? i.id === 202 : i === 202))).toBe(true)

    // Paso 2: vuelve la conexión, Supabase responde con UUID
    const uuidRemoto = '11111111-2222-3333-4444-555555555555'
    mockSupabaseService.guardarEvolucionClinica.mockResolvedValueOnce({
      id: uuidRemoto,
      texto: nuevaEvo.texto,
      fecha_hora: '2026-10-01T11:30:00.000Z',
      tipo: 'evolucion'
    })

    const resultado = await procesarColaEvoluciones()
    expect(resultado.procesados).toBeGreaterThanOrEqual(1)

    // Paso 3: verificar que la evolución local ahora está sincronizada
    const locales = evolucionesStorageService.obtenerEvoluciones(pacienteId)
    const evoActualizada = locales.find((e) => e.texto === nuevaEvo.texto)
    expect(evoActualizada).toBeDefined()
    expect(evoActualizada.sincronizado).toBe(true)

    // Paso 4: verificar que fue retirada de pendingEvoluciones
    const pendingDespues = obtenerPendingEvoluciones()
    expect(pendingDespues.some((i) => (typeof i === 'object' ? i.id === 202 : i === 202))).toBe(false)
  })

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 3: Resiliencia ante fallos
  // ──────────────────────────────────────────────────────────────────────────
  it('3. Resiliencia ante fallos: si Supabase rechaza la subida, la evolución permanece en localStorage y en pendingEvoluciones', async () => {
    mockSupabaseService.guardarEvolucionClinica.mockRejectedValue(new Error('Supabase 500 error'))

    const pacienteId = 'paciente-offline-03'
    const nuevaEvo = {
      id: 303,
      fecha: '2026-10-01 12:00',
      texto: 'Evolución con fallo persistente',
      tipo: 'evolucion'
    }
    await guardarEvolucionClinica(pacienteId, nuevaEvo)

    // Intentar procesar cola y debe fallar
    const resultado = await procesarColaEvoluciones()
    expect(resultado.fallidos).toBeGreaterThanOrEqual(1)

    // Debe permanecer en localStorage con sincronizado: false
    const locales = evolucionesStorageService.obtenerEvoluciones(pacienteId)
    const encontrada = locales.find((e) => e.id === 303)
    expect(encontrada).toBeDefined()
    expect(encontrada.sincronizado).toBe(false)

    // Debe seguir en pendingEvoluciones para futuros reintentos
    const pending = obtenerPendingEvoluciones()
    expect(pending.some((i) => (typeof i === 'object' ? i.id === 303 : i === 303))).toBe(true)
  })

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 4: Protección contra purga
  // ──────────────────────────────────────────────────────────────────────────
  it('4. Protección contra purga: sincronizarDesdeSupabase NO borra evoluciones locales en pendingEvoluciones', async () => {
    // Guardar una evolución offline
    mockSupabaseService.guardarEvolucionClinica.mockRejectedValueOnce(new Error('Offline'))
    const pacienteId = 'paciente-offline-04'
    const evoOffline = {
      id: 404,
      fecha: '2026-10-01 13:00',
      texto: 'Evolución offline que no debe borrarse al sincronizar',
      tipo: 'evolucion'
    }
    await guardarEvolucionClinica(pacienteId, evoOffline)

    // Simular que Supabase devuelve solo evoluciones previas existentes en la nube
    const evolucionesRemotas = [
      {
        id: 'aaaa1111-bbbb-2222-cccc-333333333333',
        fecha_hora: '2026-09-20T10:00:00.000Z',
        texto: 'Evolución histórica remota',
        tipo: 'evolucion'
      }
    ]
    mockSupabaseService.obtenerEvolucionesRemotas.mockResolvedValueOnce(evolucionesRemotas)

    // Ejecutar sincronización desde Supabase
    await sincronizarDesdeSupabase(pacienteId)

    // Verificar que la lista resultante contiene TANTO la remota COMO la offline preservada
    const locales = evolucionesStorageService.obtenerEvoluciones(pacienteId)
    expect(locales.some((e) => e.id === 'aaaa1111-bbbb-2222-cccc-333333333333')).toBe(true)
    expect(locales.some((e) => e.id === 404 || e.texto === evoOffline.texto)).toBe(true)
  })

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 5: Aislamiento multi-tenant
  // ──────────────────────────────────────────────────────────────────────────
  it('5. Aislamiento multi-tenant: pendingEvoluciones de Clínica A no se procesa cuando la sesión activa es Clínica B', async () => {
    // Paso 1: Encolar evolución en Clínica A
    configurarClinica('clinica-A')
    mockSupabaseService.guardarEvolucionClinica.mockRejectedValueOnce(new Error('Offline'))
    const pacienteId = 'paciente-tenant-05'
    const evoClinicaA = {
      id: 505,
      fecha: '2026-10-01 14:00',
      texto: 'Evolución privada Clínica A',
      tipo: 'evolucion'
    }
    await guardarEvolucionClinica(pacienteId, evoClinicaA)

    const pendingA = obtenerPendingEvoluciones()
    expect(pendingA.some((i) => (typeof i === 'object' ? i.id === 505 : i === 505))).toBe(true)

    // Paso 2: Cambiar a Clínica B
    configurarClinica('clinica-B')

    // En Clínica B, la cola debe estar vacía
    const pendingB = obtenerPendingEvoluciones()
    expect(pendingB.some((i) => (typeof i === 'object' ? i.id === 505 : i === 505))).toBe(false)

    // Si se procesa la cola en Clínica B, no debe procesar nada de Clínica A
    const resB = await procesarColaEvoluciones()
    expect(resB.procesados).toBe(0)

    // Paso 3: Al volver a Clínica A, la evolución sigue pendiente
    configurarClinica('clinica-A')
    const pendingARetorno = obtenerPendingEvoluciones()
    expect(pendingARetorno.some((i) => (typeof i === 'object' ? i.id === 505 : i === 505))).toBe(true)
  })
})
