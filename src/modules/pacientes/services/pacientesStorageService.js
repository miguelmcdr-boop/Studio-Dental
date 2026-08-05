export const pacientesStorageService = {
  // Clave única global para pacientes en la aplicación
  PACIENTES_KEY: 'clinica_lista_pacientes',

  obtenerPacientes: () => {
    try {
      const saved = localStorage.getItem('clinica_lista_pacientes')
      return saved ? JSON.parse(saved) : []
    } catch (e) {
      console.error('Error al leer pacientes:', e)
      return []
    }
  },

  guardarPacientes: (pacientes) => {
    try {
      localStorage.setItem('clinica_lista_pacientes', JSON.stringify(pacientes))
      // Notificar a otras pestañas/módulos
      window.dispatchEvent(new Event('storage'))
    } catch (e) {
      console.error('Error al guardar pacientes:', e)
    }
  },

  obtenerItem: (key, fallback = []) => {
    try {
      const saved = localStorage.getItem(key)
      return saved ? JSON.parse(saved) : fallback
    } catch (e) {
      console.error(`Error leyendo ${key} de localStorage:`, e)
      return fallback
    }
  },

  guardarItem: (key, data) => {
    try {
      localStorage.setItem(key, JSON.stringify(data))
    } catch (e) {
      console.error(`Error guardando ${key} en localStorage:`, e)
    }
  }
}