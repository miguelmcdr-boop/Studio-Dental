export const pacientesStorageService = {
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