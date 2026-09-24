import { describe, it, expect } from 'vitest'
import { obtenerTareasClinicas } from './tareasClinicas'

describe('tareasClinicas', () => {
  describe('obtenerTareasClinicas', () => {
    it('retorna array vacío si no hay tareas', () => {
      const tareas = obtenerTareasClinicas([], [], [], [])
      expect(tareas).toEqual([])
    })

    it('detecta recetas pendientes para citas finalizadas hoy', () => {
      const hoy = new Date().toISOString().split('T')[0]
      const citas = [
        { fecha: hoy, estado: 'Completado', pacienteId: 'pac_1', pacienteNombre: 'Juan Pérez' },
      ]
      const tareas = obtenerTareasClinicas(citas, [], [], [])
      const tareasReceta = tareas.filter((t) => t.tipo === 'receta_pendiente')
      expect(tareasReceta).toHaveLength(1)
      expect(tareasReceta[0].titulo).toBe('Emitir receta médica')
    })

    it('no duplica tareas si ya hay receta emitida hoy', () => {
      const hoy = new Date().toISOString().split('T')[0]
      const citas = [
        { fecha: hoy, estado: 'Completado', pacienteId: 'pac_1', pacienteNombre: 'Juan Pérez' },
      ]
      const recetas = [{ fechaEmision: hoy, pacienteId: 'pac_1' }]
      const evoluciones = [{ fecha: hoy, pacienteId: 'pac_1', texto: 'Control rutinario' }]
      const tareas = obtenerTareasClinicas(citas, evoluciones, recetas, [])
      const tareasReceta = tareas.filter((t) => t.tipo === 'receta_pendiente')
      expect(tareasReceta).toHaveLength(0)
    })

    it('detecta evoluciones pendientes para citas finalizadas', () => {
      const hoy = new Date().toISOString().split('T')[0]
      const citas = [
        { fecha: hoy, estado: 'Atendido', pacienteId: 'pac_1', pacienteNombre: 'Juan Pérez' },
      ]
      const tareas = obtenerTareasClinicas(citas, [], [], [])
      const tareasEvolucion = tareas.filter((t) => t.tipo === 'evolucion_pendiente')
      expect(tareasEvolucion).toHaveLength(1)
      expect(tareasEvolucion[0].titulo).toBe('Registrar evolución clínica')
    })

    it('detecta certificados pendientes si cita lo solicitó', () => {
      const hoy = new Date().toISOString().split('T')[0]
      const citas = [
        { fecha: hoy, estado: 'Completado', pacienteId: 'pac_1', pacienteNombre: 'Juan Pérez', solicitoCertificado: true },
      ]
      const tareas = obtenerTareasClinicas(citas, [], [], [])
      const tareasCertificado = tareas.filter((t) => t.tipo === 'certificado_pendiente')
      expect(tareasCertificado).toHaveLength(1)
    })

    it('no duplica certificados si ya fue emitido hoy', () => {
      const hoy = new Date().toISOString().split('T')[0]
      const citas = [
        { fecha: hoy, estado: 'Completado', pacienteId: 'pac_1', pacienteNombre: 'Juan Pérez', solicitoCertificado: true },
      ]
      const certificados = [{ fechaEmision: hoy, pacienteId: 'pac_1' }]
      const evoluciones = [{ fecha: hoy, pacienteId: 'pac_1', texto: 'Control' }]
      const recetas = [{ fechaEmision: hoy, pacienteId: 'pac_1' }]
      const tareas = obtenerTareasClinicas(citas, evoluciones, recetas, certificados)
      const tareasCertificado = tareas.filter((t) => t.tipo === 'certificado_pendiente')
      expect(tareasCertificado).toHaveLength(0)
    })
  })
})
