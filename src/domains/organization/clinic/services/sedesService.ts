import { createTenantRepository } from '../../../../infrastructure/storage/localStorageRepository'
import { createLogger } from '../../../../infrastructure/logging/logger'
import { type Sede, sedeSchema } from '../schemas/sedeSchema'

const log = createLogger('sedesService')
const KEY_SEDES = 'clinica_sedes'
const KEY_SEDE_ACTIVA = 'clinica_sede_activa'

const sedesRepo = createTenantRepository<Sede[]>(KEY_SEDES, [], { notify: true })
const sedeActivaRepo = createTenantRepository<string | null>(KEY_SEDE_ACTIVA, null, { notify: true })

export const sedesService = {
  obtenerSedes: (): Sede[] => {
    try {
      const data = sedesRepo.obtener([])
      return Array.isArray(data) ? data : []
    } catch (e) {
      log.error('Error al obtener sedes:', e)
      return []
    }
  },

  guardarSedes: (sedes: Sede[]): boolean => {
    try {
      return sedesRepo.guardar(sedes)
    } catch (e) {
      log.error('Error al guardar sedes:', e)
      return false
    }
  },

  crearSede: (datosSede: Omit<Sede, 'id'>): Sede => {
    const validacion = sedeSchema.safeParse(datosSede)
    if (!validacion.success) {
      throw new Error(validacion.error.issues[0]?.message || 'Datos de sede inválidos')
    }

    const sedes = sedesService.obtenerSedes()
    const nuevaSede: Sede = {
      ...datosSede,
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `sede-${Date.now()}`,
      activa: datosSede.activa ?? true,
    }

    const nuevaLista = [...sedes, nuevaSede]
    sedesService.guardarSedes(nuevaLista)

    // Si es la primera sede, establecerla como activa automáticamente
    if (nuevaLista.length === 1) {
      sedesService.establecerSedeActiva(nuevaSede.id || '')
    }

    return nuevaSede
  },

  actualizarSede: (id: string, updates: Partial<Sede>): Sede => {
    const sedes = sedesService.obtenerSedes()
    const indice = sedes.findIndex((s) => s.id === id)
    if (indice === -1) {
      throw new Error(`Sede con id ${id} no encontrada`)
    }

    const sedeActualizada: Sede = {
      ...sedes[indice],
      ...updates,
    }

    const validacion = sedeSchema.safeParse(sedeActualizada)
    if (!validacion.success) {
      throw new Error(validacion.error.issues[0]?.message || 'Datos de sede inválidos')
    }

    sedes[indice] = sedeActualizada
    sedesService.guardarSedes(sedes)
    return sedeActualizada
  },

  eliminarSede: (id: string): boolean => {
    const sedes = sedesService.obtenerSedes()
    const filtradas = sedes.filter((s) => s.id !== id)
    const guardado = sedesService.guardarSedes(filtradas)

    // Si la sede eliminada era la activa, seleccionar otra o null
    const sedeActiva = sedesService.obtenerSedeActiva()
    if (sedeActiva === id) {
      sedesService.establecerSedeActiva(filtradas[0]?.id || '')
    }

    return guardado
  },

  obtenerSedeActiva: (): string | null => {
    try {
      const id = sedeActivaRepo.obtener(null)
      if (id) return id
      const sedes = sedesService.obtenerSedes()
      return sedes[0]?.id || null
    } catch {
      return null
    }
  },

  establecerSedeActiva: (sedeId: string): void => {
    try {
      sedeActivaRepo.guardar(sedeId || null)
    } catch (e) {
      log.error('Error al establecer sede activa:', e)
    }
  },
}
