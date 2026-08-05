/**
 * Persistencia en LocalStorage para Presupuestos y Fichas de Pacientes
 * Cumple con la norma de resiliencia Offline-First (Constitución v3.0.0)
 */

const STORAGE_KEY_PRESUPUESTOS = 'studio_dental_presupuestos_globales'

export const presupuestosStorageService = {
  obtenerPresupuestos: (defaults = []) => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PRESUPUESTOS)
      return saved ? JSON.parse(saved) : defaults
    } catch (e) {
      console.error('Error al leer presupuestos globales:', e)
      return defaults
    }
  },

  guardarPresupuestos: (presupuestos) => {
    try {
      localStorage.setItem(STORAGE_KEY_PRESUPUESTOS, JSON.stringify(presupuestos))
      window.dispatchEvent(new Event('storage'))
      window.dispatchEvent(new CustomEvent('presupuestos_actualizados'))
    } catch (e) {
      console.error('Error al guardar presupuestos globales:', e)
    }
  },

  // Vincula los ítems creados en el presupuesto global hacia la Ficha Médica del paciente
  sincronizarConFichaPaciente: (pacienteId, items, convenio = 'Particular') => {
    if (!pacienteId) return
    try {
      const keyItems = `presupuesto_items_${pacienteId}`
      const existentesRaw = localStorage.getItem(keyItems)
      const existentes = existentesRaw ? JSON.parse(existentesRaw) : []

      const idsExistentes = new Set(existentes.map(i => i.id))
      const nuevosAjustados = items.map(it => ({
        ...it,
        convenio: it.convenio || convenio,
        estado: it.estado || 'Pendiente'
      })).filter(it => !idsExistentes.has(it.id))

      const consolidados = [...existentes, ...nuevosAjustados]
      localStorage.setItem(keyItems, JSON.stringify(consolidados))
      window.dispatchEvent(new Event('storage'))
    } catch (e) {
      console.error('Error al sincronizar con la Ficha del Paciente:', e)
    }
  },

  // Eliminación Bidireccional: Borra el presupuesto global y sus ítems en el plan de tratamiento del paciente
  eliminarPresupuestoYFicha: (presupuestoId, pacienteId, itemsABorrar = []) => {
    try {
      // 1. Borrar del registro de presupuestos globales
      const guardados = presupuestosStorageService.obtenerPresupuestos([])
      const actualizados = guardados.filter(p => p.id !== presupuestoId)
      presupuestosStorageService.guardarPresupuestos(actualizados)

      // 2. Borrar del Plan de Tratamiento del paciente si existe pacienteId
      if (pacienteId) {
        const keyItems = `presupuesto_items_${pacienteId}`
        const existentesRaw = localStorage.getItem(keyItems)
        if (existentesRaw) {
          const existentes = JSON.parse(existentesRaw)
          
          if (itemsABorrar.length > 0) {
            const idsABorrar = new Set(itemsABorrar.map(i => i.id))
            const filtrados = existentes.filter(i => !idsABorrar.has(i.id))
            localStorage.setItem(keyItems, JSON.stringify(filtrados))
          } else {
            // Si no se especifican ítems, se vacía la ficha vinculada
            localStorage.removeItem(keyItems)
          }
        }
      }

      window.dispatchEvent(new Event('storage'))
      window.dispatchEvent(new CustomEvent('presupuestos_actualizados'))
    } catch (e) {
      console.error('Error al eliminar presupuesto bidireccionalmente:', e)
    }
  },

  consolidarPresupuestosDesdePacientes: (pacientes = []) => {
    const consolidados = []

    pacientes.forEach(p => {
      const savedItems = localStorage.getItem(`presupuesto_items_${p.id}`)
      const savedAbonos = localStorage.getItem(`abonos_${p.id}`)

      const items = savedItems ? JSON.parse(savedItems) : []
      const abonos = savedAbonos ? JSON.parse(savedAbonos) : []

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
          fechaEmision: new Date().toISOString().split('T')[0],
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