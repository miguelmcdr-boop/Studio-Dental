const STORAGE_KEY_CITAS = 'studio_dental_citas_agenda'

export const agendaStorageService = {
  obtenerCitas: () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CITAS)
      return saved ? JSON.parse(saved) : []
    } catch (e) {
      console.error('Error al leer citas de localStorage:', e)
      return []
    }
  },

  guardarCitas: (citas) => {
    try {
      localStorage.setItem(STORAGE_KEY_CITAS, JSON.stringify(citas))
    } catch (e) {
      console.error('Error al guardar citas en localStorage:', e)
    }
  }
}