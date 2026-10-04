/**
 * @vitest-environment node
 *
 * Tests unitarios y de integración de la cola de subida diferida (P0-2)
 * y protección de adjuntos clínicos en IndexedDB.
 *
 * Entorno Node requerido por fake-indexeddb y structuredClone para Blobs.
 */

import 'fake-indexeddb/auto'
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
vi.mock('../auth/authService', () => ({
  getClinicaActiva: vi.fn(() => estadoMock.clinicaId),
  setClinicaActiva: vi.fn(async (id) => {
    estadoMock.clinicaId = id
  }),
  listarMisClinicas: vi.fn(async () => []),
  obtenerPerfil: vi.fn(() => null)
}))

vi.mock('../../store/sesionStore', () => ({
  useSesionStore: {
    getState: vi.fn(() => ({
      userProfile: { clinicaId: estadoMock.clinicaId }
    }))
  }
}))

vi.mock('../../store/pacientesStore', () => ({
  usePacientesStore: {
    getState: vi.fn(() => ({ pacientes: [], setPacientes: vi.fn() })),
    setState: vi.fn(),
    subscribe: vi.fn()
  }
}))

// Mock de adjuntosSupabaseService
vi.mock('./adjuntosSupabaseService', () => ({
  storageDisponible: vi.fn(() => false),
  subirAdjunto: vi.fn(),
  eliminarAdjuntoDeStorage: vi.fn().mockResolvedValue(true)
}))

import {
  guardarAdjunto,
  obtenerAdjuntosPorPaciente,
  obtenerPendingUploads,
  procesarColaSubidas,
  invalidarCacheAdjuntos,
  eliminarAdjuntosPorClinica
} from './adjuntosStorageService'
import * as adjuntosSupabaseService from './adjuntosSupabaseService'
import { invalidarCacheCambioClinica } from '../supabase/invalidarCacheCambioClinica'

const configurarClinica = (clinicaId) => {
  estadoMock.clinicaId = clinicaId
}

const blobDePrueba = (contenido = 'radiografia-data') =>
  new Blob([contenido], { type: 'image/png' })

describe('P0-2: Protección de Adjuntos Clínicos en IndexedDB y Cola de Subida Diferida', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    localStorageStore.clear()
    configurarClinica('clinica-A')
    adjuntosSupabaseService.storageDisponible.mockReturnValue(false)
  })

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 1: Encolado offline (guardar sin conexión → ID en pendingUploads)
  // ──────────────────────────────────────────────────────────────────────────
  it('1. Encolado offline: guardar sin conexión guarda en IndexedDB y encola ID en pendingUploads', async () => {
    adjuntosSupabaseService.storageDisponible.mockReturnValue(false)

    const pacienteId = `pac-offline-${Date.now()}`
    const registro = await guardarAdjunto({
      pacienteId,
      tipo: 'rx',
      blob: blobDePrueba('rx-offline-1'),
      nombre: 'rx-offline-1.png'
    })

    // Debe guardarse en IndexedDB con sincronizado: false
    expect(registro.id).toBeDefined()
    expect(registro.sincronizado).toBe(false)
    expect(registro.storagePath).toBeNull()

    // Debe figurar en pendingUploads
    const pending = obtenerPendingUploads()
    expect(pending.some((item) => (typeof item === 'string' ? item === registro.id : item.id === registro.id))).toBe(true)

    // Supabase NO debió ser llamado
    expect(adjuntosSupabaseService.subirAdjunto).not.toHaveBeenCalled()
  })

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 2: Procesamiento diferido exitoso (restaurar conexión → subida + sincronizado: true)
  // ──────────────────────────────────────────────────────────────────────────
  it('2. Procesamiento diferido: al recuperar conexión sube a Supabase Storage y actualiza sincronizado: true', async () => {
    // Paso 1: guardar offline
    adjuntosSupabaseService.storageDisponible.mockReturnValue(false)
    const pacienteId = `pac-sync-${Date.now()}`
    const registro = await guardarAdjunto({
      pacienteId,
      tipo: 'foto',
      blob: blobDePrueba('foto-offline-2'),
      nombre: 'foto-offline-2.png'
    })

    expect(registro.sincronizado).toBe(false)

    // Paso 2: vuelve internet
    adjuntosSupabaseService.storageDisponible.mockReturnValue(true)
    adjuntosSupabaseService.subirAdjunto.mockResolvedValueOnce({
      path: `clinica-A/${pacienteId}/foto/123-foto-offline-2.png`
    })

    // Ejecutar procesamiento diferido
    const resultado = await procesarColaSubidas()
    expect(resultado.subidos).toBeGreaterThanOrEqual(1)

    // El registro en IndexedDB ahora debe estar sincronizado
    const adjuntos = await obtenerAdjuntosPorPaciente(pacienteId)
    const actualizado = adjuntos.find((a) => a.id === registro.id)
    expect(actualizado).toBeDefined()
    expect(actualizado.sincronizado).toBe(true)
    expect(actualizado.storagePath).toContain('clinica-A')

    // Ya no debe estar en pendingUploads
    const pending = obtenerPendingUploads()
    expect(pending.some((item) => (typeof item === 'string' ? item === registro.id : item.id === registro.id))).toBe(false)
  })

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 3: Resiliencia ante fallos (Supabase rechaza → ID sigue en cola)
  // ──────────────────────────────────────────────────────────────────────────
  it('3. Resiliencia ante fallos: si Supabase Storage rechaza la subida, el ID permanece en la cola', async () => {
    // Guardar offline
    adjuntosSupabaseService.storageDisponible.mockReturnValue(false)
    const pacienteId = `pac-fail-${Date.now()}`
    const registro = await guardarAdjunto({
      pacienteId,
      tipo: 'consentimiento',
      blob: blobDePrueba('consent-fail'),
      nombre: 'consentimiento.pdf'
    })

    // Intentar sincronizar pero Supabase falla
    adjuntosSupabaseService.storageDisponible.mockReturnValue(true)
    adjuntosSupabaseService.subirAdjunto.mockRejectedValueOnce(new Error('Network upload error'))

    const resultado = await procesarColaSubidas()
    expect(resultado.fallidos).toBeGreaterThanOrEqual(1)

    // Sigue en cola
    const pending = obtenerPendingUploads()
    expect(pending.some((item) => (typeof item === 'string' ? item === registro.id : item.id === registro.id))).toBe(true)

    // Sigue en IndexedDB no sincronizado
    const adjuntos = await obtenerAdjuntosPorPaciente(pacienteId)
    const enIDB = adjuntos.find((a) => a.id === registro.id)
    expect(enIDB.sincronizado).toBe(false)
  })

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 4: Protección ante cambio de clínica (adjuntos pendientes NO se borran)
  // ──────────────────────────────────────────────────────────────────────────
  it('4. Protección ante cambio de clínica: invalidarCache NO destruye adjuntos pendientes ni borra la BD', async () => {
    configurarClinica('clinica-A')
    adjuntosSupabaseService.storageDisponible.mockReturnValue(false)

    const pacienteId = `pac-preserve-${Date.now()}`
    const reg = await guardarAdjunto({
      pacienteId,
      tipo: 'rx',
      blob: blobDePrueba('rx-preserve'),
      nombre: 'rx-importante.png'
    })

    // Cambiar a clínica B e invalidar caché
    await invalidarCacheCambioClinica('clinica-A')
    configurarClinica('clinica-B')

    // En clínica B no se ve
    const enB = await obtenerAdjuntosPorPaciente(pacienteId)
    expect(enB).toEqual([])

    // Volver a clínica A
    configurarClinica('clinica-A')
    const enA = await obtenerAdjuntosPorPaciente(pacienteId)
    expect(enA).toHaveLength(1)
    expect(enA[0].id).toBe(reg.id)
    expect(enA[0].nombre).toBe('rx-importante.png')
    expect(enA[0].sincronizado).toBe(false)
  })

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 5: Aislamiento multi-tenant de colas (Clínica B no procesa cola de Clínica A)
  // ──────────────────────────────────────────────────────────────────────────
  it('5. Aislamiento multi-tenant: Clínica B no procesa la cola de Clínica A', async () => {
    // Clínica A crea adjunto offline
    configurarClinica('clinica-A')
    adjuntosSupabaseService.storageDisponible.mockReturnValue(false)
    const pacienteIdA = `pac-a-${Date.now()}`
    const regA = await guardarAdjunto({
      pacienteId: pacienteIdA,
      tipo: 'foto',
      blob: blobDePrueba('foto-a'),
      nombre: 'foto-a.png'
    })

    // Cambiar a Clínica B
    configurarClinica('clinica-B')
    adjuntosSupabaseService.storageDisponible.mockReturnValue(true)

    // Clínica B ejecuta procesarColaSubidas
    await procesarColaSubidas()

    // No debe haber subido el adjunto de Clínica A
    expect(adjuntosSupabaseService.subirAdjunto).not.toHaveBeenCalledWith(
      expect.objectContaining({ clinicaId: 'clinica-A' })
    )

    // Volver a Clínica A y verificar que su cola sigue pendiente
    configurarClinica('clinica-A')
    const pendingA = obtenerPendingUploads()
    expect(pendingA.some((item) => (typeof item === 'string' ? item === regA.id : item.id === regA.id))).toBe(true)
  })

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 6: Limpieza local sin efectos remotos (NUNCA llama a eliminarAdjuntoDeStorage)
  // ──────────────────────────────────────────────────────────────────────────
  it('6. Limpieza local sin efectos remotos: invalidarCache o limpieza local NUNCA invoca eliminarAdjuntoDeStorage', async () => {
    configurarClinica('clinica-A')
    
    // Simular que existían adjuntos con storagePath
    await invalidarCacheAdjuntos('clinica-A')
    await eliminarAdjuntosPorClinica('clinica-A')

    // En NINGÚN caso debe llamar a la eliminación remota en Supabase
    expect(adjuntosSupabaseService.eliminarAdjuntoDeStorage).not.toHaveBeenCalled()
  })
})
