/**
 * @vitest-environment node
 *
 * Este archivo se ejecuta en entorno Node (no jsdom) a propósito: jsdom no
 * implementa `structuredClone` (jsdom/jsdom#3363), y fake-indexeddb depende
 * de él para clonar internamente los valores guardados. Sin este override,
 * el campo `blob` se pierde silenciosamente al leer un registro — un falso
 * negativo que no refleja el comportamiento real en un navegador (que sí
 * implementa structuredClone de forma nativa). Este archivo no necesita DOM,
 * solo la API de IndexedDB, así que Node es además el entorno correcto.
 *
 * Tests — adjuntosStorageService
 * Archivo: src/services/adjuntosStorageService.js
 * Tarea MASTER_ROADMAP: F1-02
 *
 * Usa fake-indexeddb como polyfill de IndexedDB para el entorno de test.
 * Import 'fake-indexeddb/auto' configura los globals (indexedDB, IDBKeyRange)
 * automáticamente.
 */

import 'fake-indexeddb/auto'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Polyfill de localStorage para entorno Node (requerido por pendingUploadsRepo)
if (typeof global.localStorage === 'undefined') {
  const store = new Map()
  global.localStorage = {
    getItem: (k) => store.get(k) ?? null,
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
    get length() { return store.size },
    key: (i) => Array.from(store.keys())[i] ?? null
  }
}
import {
  guardarAdjunto,
  obtenerAdjuntosPorPaciente,
  eliminarAdjunto,
  eliminarTodosPorPaciente,
  eliminarAdjuntosPorClinica
} from './adjuntosStorageService'

// F7-36 FASE 1 (Commit 1.6): mock global de useSesionStore con clínica por defecto.
// Los tests existentes que NO configuraban clinicaId ahora usan 'clinica-test-default'
// como valor por defecto, preservando su comportamiento original.
vi.mock('../../store/sesionStore', () => ({
  useSesionStore: {
    getState: vi.fn(() => ({
      userProfile: { clinicaId: 'clinica-test-default' }
    }))
  }
}))

/**
 * Helper F7-36: configura la clínica activa simulada para tests específicos.
 * @param {string|null} clinicaId - UUID de la clínica a simular, o null para "sin clínica"
 */
const configurarClinica = async (clinicaId) => {
  const { useSesionStore } = await import('../../store/sesionStore')
  useSesionStore.getState.mockReturnValue({
    userProfile: clinicaId ? { clinicaId } : null
  })
}

const blobDePrueba = (contenido = 'contenido-de-prueba') =>
  new Blob([contenido], { type: 'image/png' })

describe('adjuntosStorageService', () => {
  beforeEach(async () => {
    // Resetear clínica al valor por defecto antes de cada test
    await configurarClinica('clinica-test-default')
  })

  describe('guardarAdjunto / obtenerAdjuntosPorPaciente', () => {
    it('guarda un adjunto y lo puede recuperar por pacienteId', async () => {
      const pacienteId = `paciente-${Date.now()}-1`
      await guardarAdjunto({ pacienteId, tipo: 'foto', blob: blobDePrueba(), nombre: 'foto1.png' })

      const registros = await obtenerAdjuntosPorPaciente(pacienteId)
      expect(registros).toHaveLength(1)
      expect(registros[0].nombre).toBe('foto1.png')
      expect(registros[0].tipo).toBe('foto')
      expect(registros[0].pacienteId).toBe(pacienteId)
    })

    it('cada adjunto guardado tiene un id único', async () => {
      const pacienteId = `paciente-${Date.now()}-2`
      const r1 = await guardarAdjunto({ pacienteId, tipo: 'foto', blob: blobDePrueba(), nombre: 'a.png' })
      const r2 = await guardarAdjunto({ pacienteId, tipo: 'foto', blob: blobDePrueba(), nombre: 'b.png' })
      expect(r1.id).not.toBe(r2.id)
    })

    it('no mezcla adjuntos de pacientes distintos', async () => {
      const pacienteA = `paciente-${Date.now()}-A`
      const pacienteB = `paciente-${Date.now()}-B`
      await guardarAdjunto({ pacienteId: pacienteA, tipo: 'rx', blob: blobDePrueba(), nombre: 'rx-a.png' })
      await guardarAdjunto({ pacienteId: pacienteB, tipo: 'rx', blob: blobDePrueba(), nombre: 'rx-b.png' })

      const registrosA = await obtenerAdjuntosPorPaciente(pacienteA)
      expect(registrosA).toHaveLength(1)
      expect(registrosA[0].nombre).toBe('rx-a.png')
    })

    it('un paciente sin adjuntos retorna un arreglo vacío, no null ni excepción', async () => {
      const registros = await obtenerAdjuntosPorPaciente(`paciente-inexistente-${Date.now()}`)
      expect(registros).toEqual([])
    })

    it('guardarAdjunto sin pacienteId lanza un error explícito en vez de guardar huérfano', async () => {
      await expect(guardarAdjunto({ tipo: 'foto', blob: blobDePrueba(), nombre: 'x.png' })).rejects.toThrow()
    })

    it('el blob guardado se preserva íntegro (mismo tamaño y tipo)', async () => {
      const pacienteId = `paciente-${Date.now()}-blob`
      const blob = blobDePrueba('contenido específico de la imagen')
      await guardarAdjunto({ pacienteId, tipo: 'consentimiento', blob, nombre: 'consentimiento.pdf' })

      const [registro] = await obtenerAdjuntosPorPaciente(pacienteId)
      expect(registro.blob.size).toBe(blob.size)
      expect(registro.blob.type).toBe(blob.type)
    })
  })

  describe('eliminarAdjunto', () => {
    it('elimina un adjunto puntual sin afectar los demás del mismo paciente', async () => {
      const pacienteId = `paciente-${Date.now()}-del`
      const r1 = await guardarAdjunto({ pacienteId, tipo: 'foto', blob: blobDePrueba(), nombre: 'a.png' })
      await guardarAdjunto({ pacienteId, tipo: 'foto', blob: blobDePrueba(), nombre: 'b.png' })

      await eliminarAdjunto(r1.id)

      const restantes = await obtenerAdjuntosPorPaciente(pacienteId)
      expect(restantes).toHaveLength(1)
      expect(restantes[0].nombre).toBe('b.png')
    })
  })

  describe('eliminarTodosPorPaciente', () => {
    it('elimina todos los adjuntos de un paciente (evita huérfanos al eliminar el paciente)', async () => {
      const pacienteId = `paciente-${Date.now()}-purge`
      await guardarAdjunto({ pacienteId, tipo: 'foto', blob: blobDePrueba(), nombre: 'a.png' })
      await guardarAdjunto({ pacienteId, tipo: 'rx', blob: blobDePrueba(), nombre: 'b.png' })
      await guardarAdjunto({ pacienteId, tipo: 'consentimiento', blob: blobDePrueba(), nombre: 'c.pdf' })

      await eliminarTodosPorPaciente(pacienteId)

      const restantes = await obtenerAdjuntosPorPaciente(pacienteId)
      expect(restantes).toHaveLength(0)
    })

    it('no afecta los adjuntos de otros pacientes', async () => {
      const pacienteA = `paciente-${Date.now()}-purgeA`
      const pacienteB = `paciente-${Date.now()}-purgeB`
      await guardarAdjunto({ pacienteId: pacienteA, tipo: 'foto', blob: blobDePrueba(), nombre: 'a.png' })
      await guardarAdjunto({ pacienteId: pacienteB, tipo: 'foto', blob: blobDePrueba(), nombre: 'b.png' })

      await eliminarTodosPorPaciente(pacienteA)

      expect(await obtenerAdjuntosPorPaciente(pacienteA)).toHaveLength(0)
      expect(await obtenerAdjuntosPorPaciente(pacienteB)).toHaveLength(1)
    })
  })

  describe('F6-E: integración con Supabase Storage', () => {
    it('guardarAdjunto registra sincronizado=false cuando no hay clinicaId', async () => {
      const pacienteId = `paciente-${Date.now()}-f6e1`
      const registro = await guardarAdjunto({ 
        pacienteId, 
        tipo: 'foto', 
        blob: blobDePrueba(), 
        nombre: 'test.png' 
      })

      expect(registro.sincronizado).toBe(false)
      expect(registro.storagePath).toBeNull()
    })

    it('guardarAdjunto acepta clinicaId como parámetro explícito', async () => {
      const pacienteId = `paciente-${Date.now()}-f6e2`
      const clinicaId = 'clinica-test-123'
      
      // Sin Supabase configurado en tests, debe quedar sincronizado=false
      const registro = await guardarAdjunto({ 
        pacienteId, 
        tipo: 'rx', 
        blob: blobDePrueba(), 
        nombre: 'rx.dcm',
        clinicaId 
      })

      expect(registro.pacienteId).toBe(pacienteId)
      expect(registro.tipo).toBe('rx')
      expect(registro.sincronizado).toBe(false) // Supabase no disponible en tests
    })

    it('eliminarAdjunto no falla si storagePath es null', async () => {
      const pacienteId = `paciente-${Date.now()}-f6e3`
      const registro = await guardarAdjunto({ 
        pacienteId, 
        tipo: 'foto', 
        blob: blobDePrueba(), 
        nombre: 'test.png' 
      })

      // Debe eliminar sin error aunque no haya storagePath
      const resultado = await eliminarAdjunto(registro.id)
      expect(resultado).toBe(true)

      const restantes = await obtenerAdjuntosPorPaciente(pacienteId)
      expect(restantes).toHaveLength(0)
    })

    it('eliminarTodosPorPaciente no falla si adjuntos no tienen storagePath', async () => {
      const pacienteId = `paciente-${Date.now()}-f6e4`
      await guardarAdjunto({ pacienteId, tipo: 'foto', blob: blobDePrueba(), nombre: 'a.png' })
      await guardarAdjunto({ pacienteId, tipo: 'rx', blob: blobDePrueba(), nombre: 'b.png' })

      const resultado = await eliminarTodosPorPaciente(pacienteId)
      expect(resultado).toBe(true)

      const restantes = await obtenerAdjuntosPorPaciente(pacienteId)
      expect(restantes).toHaveLength(0)
    })

    it('registros guardados tienen campos F6-E (storagePath, sincronizado)', async () => {
      const pacienteId = `paciente-${Date.now()}-f6e5`
      await guardarAdjunto({ pacienteId, tipo: 'consentimiento', blob: blobDePrueba(), nombre: 'doc.pdf' })

      const registros = await obtenerAdjuntosPorPaciente(pacienteId)
      expect(registros).toHaveLength(1)
      expect(registros[0]).toHaveProperty('storagePath')
      expect(registros[0]).toHaveProperty('sincronizado')
      expect(typeof registros[0].sincronizado).toBe('boolean')
    })
  })



  describe('F7-36: aislamiento multi-tenant en IndexedDB', () => {
    // Suite de tests que valida la defensa en profundidad del Commit 1.6.
    // IndexedDB ahora almacena `clinicaId` en cada registro y filtra consultas
    // por clínica actual, previniendo contaminación cross-clinic incluso si
    // la limpieza de cambio de clínica fallara.

    it('1. adjunto guardado tiene campo clinicaId poblado desde sesionStore', async () => {
      const pacienteId = `paciente-${Date.now()}-campo`
      await configurarClinica('clinica-A')

      const registro = await guardarAdjunto({
        pacienteId,
        tipo: 'rx',
        blob: blobDePrueba(),
        nombre: 'rx.png'
      })

      expect(registro.clinicaId).toBe('clinica-A')
      expect(registro.pacienteId).toBe(pacienteId)
    })

    it('2. clinicaId pasado como parámetro tiene prioridad sobre sesionStore', async () => {
      const pacienteId = `paciente-${Date.now()}-param`
      await configurarClinica('clinica-A')

      const registro = await guardarAdjunto({
        pacienteId,
        tipo: 'foto',
        blob: blobDePrueba(),
        nombre: 'foto.png',
        clinicaId: 'clinica-explícita' // parámetro explícito
      })

      expect(registro.clinicaId).toBe('clinica-explícita')
    })

    it('3. obtenerAdjuntosPorPaciente filtra por clínica actual', async () => {
      const pacienteId = `paciente-${Date.now()}-filtro`

      // Guardar adjuntos en clínica A
      await configurarClinica('clinica-A')
      await guardarAdjunto({ pacienteId, tipo: 'foto', blob: blobDePrueba('a1'), nombre: 'a1.png' })
      await guardarAdjunto({ pacienteId, tipo: 'rx', blob: blobDePrueba('a2'), nombre: 'a2.png' })

      // Consultar desde clínica A: debe ver ambos adjuntos
      // F7-36 FIX: IndexedDB no garantiza orden de inserción, validar presencia
      await configurarClinica('clinica-A')
      const desdeA = await obtenerAdjuntosPorPaciente(pacienteId)
      expect(desdeA).toHaveLength(2)
      const nombresA = desdeA.map(r => r.nombre)
      expect(nombresA).toContain('a1.png')
      expect(nombresA).toContain('a2.png')
    })

    it('4. CRÍTICO: adjuntos de clínica A NO se ven al consultar desde clínica B', async () => {
      const pacienteId = `paciente-${Date.now()}-cruzado`

      // Guardar adjuntos en clínica A
      await configurarClinica('clinica-A')
      await guardarAdjunto({ pacienteId, tipo: 'foto', blob: blobDePrueba('a'), nombre: 'clinicaA.png' })

      // Guardar adjuntos en clínica B
      await configurarClinica('clinica-B')
      await guardarAdjunto({ pacienteId, tipo: 'rx', blob: blobDePrueba('b'), nombre: 'clinicaB.png' })

      // Consultar desde clínica B: SOLO debe ver su propio adjunto
      await configurarClinica('clinica-B')
      const desdeB = await obtenerAdjuntosPorPaciente(pacienteId)
      expect(desdeB).toHaveLength(1)
      expect(desdeB[0].nombre).toBe('clinicaB.png')
      expect(desdeB[0].clinicaId).toBe('clinica-B')

      // Consultar desde clínica A: SOLO debe ver su propio adjunto
      await configurarClinica('clinica-A')
      const desdeA = await obtenerAdjuntosPorPaciente(pacienteId)
      expect(desdeA).toHaveLength(1)
      expect(desdeA[0].nombre).toBe('clinicaA.png')
      expect(desdeA[0].clinicaId).toBe('clinica-A')
    })

    it('5. sin clínica activa, consultas retornan vacío (seguridad por defecto)', async () => {
      // F7-36: usar clínica única para evitar interferencia con tests anteriores.
      const pacienteId = `paciente-${Date.now()}-sin-clinica`
      const CLINICA_5 = 'clinica-5-sinclinica'

      // Guardar un adjunto en clínica única
      await configurarClinica(CLINICA_5)
      await guardarAdjunto({ pacienteId, tipo: 'foto', blob: blobDePrueba(), nombre: 'foto.png' })

      // "Cerrar sesión" / sin clínica activa
      await configurarClinica(null)

      // La consulta debe retornar vacío (no exponer datos de ninguna clínica)
      const sinClinica = await obtenerAdjuntosPorPaciente(pacienteId)
      expect(sinClinica).toEqual([])
    })

    it('6. eliminarAdjuntosPorClinica borra solo adjuntos de esa clínica', async () => {
      // F7-36: usar clínicas únicas para evitar interferencia con adjuntos
      // acumulados de tests anteriores (fake-indexeddb mantiene estado entre tests).
      const pacienteId = `paciente-${Date.now()}-borrado`
      const CLINICA_6A = 'clinica-6a-borrado'
      const CLINICA_6B = 'clinica-6b-borrado'

      // Guardar en clínica A y B
      await configurarClinica(CLINICA_6A)
      await guardarAdjunto({ pacienteId, tipo: 'foto', blob: blobDePrueba('a'), nombre: 'a.png' })
      await configurarClinica(CLINICA_6B)
      await guardarAdjunto({ pacienteId, tipo: 'rx', blob: blobDePrueba('b'), nombre: 'b.png' })

      // Eliminar solo los de clínica A
      await configurarClinica(CLINICA_6A)
      const eliminados = await eliminarAdjuntosPorClinica(CLINICA_6A)
      expect(eliminados).toBe(1)

      // Clínica A: vacío
      const enA = await obtenerAdjuntosPorPaciente(pacienteId)
      expect(enA).toEqual([])

      // Clínica B: intacta
      await configurarClinica(CLINICA_6B)
      const enB = await obtenerAdjuntosPorPaciente(pacienteId)
      expect(enB).toHaveLength(1)
      expect(enB[0].nombre).toBe('b.png')
    })

    it('7. eliminarAdjuntosPorClinica sin clinicaId retorna 0 (defensivo)', async () => {
      const resultado = await eliminarAdjuntosPorClinica(null)
      expect(resultado).toBe(0)

      const resultadoVacio = await eliminarAdjuntosPorClinica('')
      expect(resultadoVacio).toBe(0)
    })
  })

})
