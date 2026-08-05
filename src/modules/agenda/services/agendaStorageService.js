/**
 * Persistencia en LocalStorage para Agenda Multi-Box (v3.0.0 Enterprise)
 */

const STORAGE_KEY_AGENDA = 'studio_dental_agenda_citas_v3'

export const agendaStorageService = {
  obtenerCitas: (defaults = []) => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_AGENDA)
      return saved ? JSON.parse(saved) : defaults
    } catch (e) {
      console.error('Error al leer citas de agenda:', e)
      return defaults
    }
  },

  guardarCitas: (citas) => {
    try {
      localStorage.setItem(STORAGE_KEY_AGENDA, JSON.stringify(citas))
      window.dispatchEvent(new Event('storage'))
    } catch (e) {
      console.error('Error al guardar citas:', e)
    }
  }
}

export default agendaStorageService