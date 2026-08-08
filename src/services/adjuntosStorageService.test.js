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
import { describe, it, expect, beforeEach } from 'vitest'
import {
  guardarAdjunto,
  obtenerAdjuntosPorPaciente,
  eliminarAdjunto,
  eliminarTodosPorPaciente
} from './adjuntosStorageService'

const blobDePrueba = (contenido = 'contenido-de-prueba') =>
  new Blob([contenido], { type: 'image/png' })

describe('adjuntosStorageService', () => {

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
})