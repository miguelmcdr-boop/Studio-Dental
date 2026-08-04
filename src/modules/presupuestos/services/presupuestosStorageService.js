/**
 * Persistencia en LocalStorage para Presupuestos y Fichas de Pacientes
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
    } catch (e) {
      console.error('Error al guardar presupuestos globales:', e)
    }
  },

  // Consolida automáticamente los tratamientos guardados en las fichas individuales
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
          estado: total - abonado <= 0 ? 'Aprobado' : 'EnTratamiento',
          items,
          observacion: 'Presupuesto vinculado desde la Ficha Médica del paciente.'
        })
      }
    })

    return consolidados
  }
}