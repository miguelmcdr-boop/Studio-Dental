import React, { useState } from 'react'

export const ConfiguracionModulo = ({ userProfile, setUserProfile, pacientes = [] }) => {
  const [formData, setFormData] = useState({
    nombreCompleto: userProfile?.nombreCompleto || '',
    rut: userProfile?.rut || '',
    especialidad: userProfile?.especialidad || '',
    email: userProfile?.email || ''
  })
  const [mensajeGuardado, setMensajeGuardado] = useState(false)

  const handleGuardarConfig = (e) => {
    e.preventDefault()
    const actualizado = { ...userProfile, ...formData }
    setUserProfile(actualizado)
    localStorage.setItem(`profile_${userProfile.email}`, JSON.stringify(actualizado))
    setMensajeGuardado(true)
    setTimeout(() => setMensajeGuardado(false), 3000)
  }

  const handleExportarBackup = () => {
    const backupData = {
      fechaBackup: new Date().toISOString(),
      userProfile,
      pacientes,
      citas: JSON.parse(localStorage.getItem('clinica_citas_agenda') || '[]'),
      prestaciones: JSON.parse(localStorage.getItem('clinica_arancel_prestaciones') || '[]'),
      urgencias: JSON.parse(localStorage.getItem('clinica_urgencias_registradas') || '[]'),
      laboratorios: JSON.parse(localStorage.getItem('clinica_ordenes_laboratorio') || '[]'),
      inventario: JSON.parse(localStorage.getItem('clinica_inventario_insumos') || '[]'),
      esterilizacion: JSON.parse(localStorage.getItem('clinica_ciclos_esterilizacion') || '[]')
    }

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute("href", dataStr)
    downloadAnchor.setAttribute("download", `BACKUP_CLINICA_${new Date().toISOString().split('T')[0]}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  const handleImportarBackup = (e) => {
    const fileReader = new FileReader()
    if (e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8")
      fileReader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target.result)
          if (imported.pacientes) localStorage.setItem('clinica_lista_pacientes', JSON.stringify(imported.pacientes))
          if (imported.citas) localStorage.setItem('clinica_citas_agenda', JSON.stringify(imported.citas))
          if (imported.prestaciones) localStorage.setItem('clinica_arancel_prestaciones', JSON.stringify(imported.prestaciones))
          if (imported.urgencias) localStorage.setItem('clinica_urgencias_registradas', JSON.stringify(imported.urgencias))
          if (imported.laboratorios) localStorage.setItem('clinica_ordenes_laboratorio', JSON.stringify(imported.laboratorios))
          if (imported.inventario) localStorage.setItem('clinica_inventario_insumos', JSON.stringify(imported.inventario))
          if (imported.esterilizacion) localStorage.setItem('clinica_ciclos_esterilizacion', JSON.stringify(imported.esterilizacion))
          alert("¡Copia de seguridad restaurada con éxito! La página se recargará.")
          window.location.reload()
        } catch (error) {
          alert("El archivo seleccionado no es un respaldo válido de la clínica.")
        }
      }
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Configuración y Copias de Seguridad</h2>
          <p className="text-xs text-gray-500">Personaliza los datos del membrete y realiza respaldos de la clínica.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
          <h3 className="font-bold text-sm text-gray-900 mb-4 border-b pb-2">Perfil Profesional y Membrete</h3>
          {mensajeGuardado && (
            <div className="bg-green-100 border border-green-200 text-green-800 text-xs font-bold p-3 rounded-xl mb-4">
              ✓ Datos guardados exitosamente.
            </div>
          )}

          <form onSubmit={handleGuardarConfig} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-gray-600 uppercase mb-1">Nombre Completo *</label>
              <input
                type="text"
                required
                value={formData.nombreCompleto}
                onChange={(e) => setFormData({ ...formData, nombreCompleto: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm font-semibold text-gray-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-gray-600 uppercase mb-1">RUT / Licencia</label>
                <input
                  type="text"
                  value={formData.rut}
                  onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-600 uppercase mb-1">Especialidad</label>
                <input
                  type="text"
                  value={formData.especialidad}
                  onChange={(e) => setFormData({ ...formData, especialidad: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-gray-600 uppercase mb-1">Correo Electrónico</label>
              <input
                type="email"
                disabled
                value={formData.email}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-100 text-sm text-gray-500"
              />
            </div>

            <button
              type="submit"
              className="bg-black text-white font-semibold text-xs px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors pt-2"
            >
              Guardar Cambios de Perfil
            </button>
          </form>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-gray-900 border-b pb-2">Copia de Seguridad y Resguardo de Datos (Backup)</h3>
          <p className="text-xs text-gray-600 leading-relaxed">
            Descarga un respaldo completo en 1 clic para mantener a salvo la información de tus pacientes, odontogramas, finanzas e inventario ante cualquier eventualidad.
          </p>

          <div className="pt-2 space-y-3">
            <button
              onClick={handleExportarBackup}
              className="w-full bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl hover:bg-emerald-800 transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <span>💾</span> Descargar Respaldo Completo de la Clínica (.JSON)
            </button>

            <div className="border-t pt-3">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Restaurar Fichas desde un Respaldo (.JSON)</label>
              <input
                type="file"
                accept=".json"
                onChange={handleImportarBackup}
                className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}