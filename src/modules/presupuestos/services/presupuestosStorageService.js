import { obtenerFechaLocalISO } from '../../../utils/dateUtils'
import { leerJSON, escribirJSON, createLocalStorageRepository } from '../../../services/localStorageRepository'
import { validarListaPresupuestos } from '../schemas/presupuestoSchema'

/**
 * Persistencia en LocalStorage para Presupuestos y Fichas de Pacientes
 * Cumple con la norma de resiliencia Offline-First (Constitución v3.0.0)
 */

const STORAGE_KEY_PRESUPUESTOS = 'studio_dental_presupuestos_globales'
const presupuestosRepo = createLocalStorageRepository(STORAGE_KEY_PRESUPUESTOS, [], {
  notify: true,
  eventos: ['presupuestos_actualizados']
})

export const presupuestosStorageService = {
  obtenerPresupuestos: (defaults = []) => presupuestosRepo.obtener(defaults),

 /**
 * Valida la lista de presupuestos con presupuestoSchema antes de persistir.
 * Si la validación falla, NO escribe en localStorage y retorna false.
 * Si la validación pasa, persiste los datos validados y retorna true.
 *
 * @param {Array} presupuestos - Lista de presupuestos a persistir.
 * @returns {boolean} true si se guardó exitosamente, false si la validación falló.
 */
 guardarPresupuestos: (presupuestos) => {
  const validacion = validarListaPresupuestos(presupuestos)
  if (!validacion.valido) {
    console.error(
      'Error de validación al guardar presupuestos (F2-04e):',
      validacion.error
    )
    return false
  }
  return presupuestosRepo.guardar(validacion.datos)
},

  // Lee los ítems de presupuesto de un paciente específico (clave dinámica)
  obtenerItemsPorPaciente: (pacienteId) => {
    if (!pacienteId) return []
    return leerJSON(`presupuesto_items_${pacienteId}`, [])
  },

  // Vincula los ítems creados en el presupuesto global hacia la Ficha Médica del paciente
  sincronizarConFichaPaciente: (pacienteId, items, convenio = 'Particular') => {
    if (!pacienteId) return
    const keyItems = `presupuesto_items_${pacienteId}`
    const existentes = leerJSON(keyItems, [])

    const idsExistentes = new Set(existentes.map(i => i.id))
    const nuevosAjustados = items.map(it => ({
      ...it,
      convenio: it.convenio || convenio,
      estado: it.estado || 'Pendiente'
    })).filter(it => !idsExistentes.has(it.id))

    const consolidados = [...existentes, ...nuevosAjustados]
    escribirJSON(keyItems, consolidados, { notify: true })
  },

  // Eliminación Bidireccional: Borra el presupuesto global y sus ítems en el plan de tratamiento del paciente
  eliminarPresupuestoYFicha: (presupuestoId, pacienteId, itemsABorrar = []) => {
    // 1. Borrar del registro de presupuestos globales
    const guardados = presupuestosRepo.obtener([])
    const actualizados = guardados.filter(p => p.id !== presupuestoId)
    presupuestosRepo.guardar(actualizados)

    // 2. Borrar del Plan de Tratamiento del paciente si existe pacienteId
    if (pacienteId) {
      const keyItems = `presupuesto_items_${pacienteId}`
      const existentes = leerJSON(keyItems, null)
      if (existentes !== null) {
        if (itemsABorrar.length > 0) {
          const idsABorrar = new Set(itemsABorrar.map(i => i.id))
          const filtrados = existentes.filter(i => !idsABorrar.has(i.id))
          escribirJSON(keyItems, filtrados)
        } else {
          // Si no se especifican ítems, se vacía la ficha vinculada
          try {
            localStorage.removeItem(keyItems)
          } catch (e) {
            console.error(`Error al eliminar "${keyItems}" de localStorage:`, e)
          }
        }
      }
    }

    presupuestosRepo.guardar(presupuestosRepo.obtener([]))
  },

  // Actualiza el estado (Emitido, Aprobado, Rechazado, etc.) de un presupuesto creado directamente
  actualizarEstadoPresupuesto: (presupuestoId, nuevoEstado) => {
    const guardados = presupuestosRepo.obtener([])
    const actualizados = guardados.map(p =>
      p.id === presupuestoId ? { ...p, estado: nuevoEstado } : p
    )
    presupuestosRepo.guardar(actualizados)
  },

  // Elimina todos los ítems de presupuesto de un paciente (F2-07d)
  eliminarItemsDePaciente: (pacienteId) => {
    if (!pacienteId) return
    try {
      localStorage.removeItem(`presupuesto_items_${pacienteId}`)
    } catch (e) {
      console.error(`Error al eliminar items de presupuesto del paciente ${pacienteId}:`, e)
    }
  },

  consolidarPresupuestosDesdePacientes: (pacientes = []) => {
    const consolidados = []

    pacientes.forEach(p => {
      const items = leerJSON(`presupuesto_items_${p.id}`, [])
      const abonos = leerJSON(`abonos_${p.id}`, [])

      if (items.length > 0) {
        const total = items.reduce((acc, curr) => acc + (parseFloat(curr.valor) || 0), 0)
        const abonado = abonos.reduce((acc, curr) => acc + (parseFloat(curr.monto) || 0), 0)

        const todosRealizados = items.every(i => i.estado === 'Realizado')
        const saldoRestante = total - abonado

        let estadoCalculado = 'Emitido'
        if (todosRealizados || saldoRestante <= 0) {
          estadoCalculado = 'Aprobado'
        } else if (items.some(i => i.estado === 'En Proceso' || i.estado === 'Realizado') || abonado > 0) {
          estadoCalculado = 'EnTratamiento'
        }

        consolidados.push({
          id: `paciente_${p.id}`,
          folio: `PRES-PAC-${p.id}`,
          pacienteId: p.id,
          pacienteNombre: p.nombre,
          pacienteRut: p.rut,
          fechaEmision: obtenerFechaLocalISO(),
          convenio: p.prevision || 'Particular',
          montoTotal: total,
          montoAbonado: abonado,
          estado: estadoCalculado,
          items,
          observacion: 'Presupuesto vinculado desde la Ficha Médica del paciente.'
        })
      }
    })

    return consolidados
  }
}