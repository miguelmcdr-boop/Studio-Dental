import React, { memo } from 'react'

export const RespaldoDatosSection = memo(({ alExportarBackup, alImportarBackup }) => {
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target.result)
          alImportarBackup(parsed)
        } catch (err) {
          alert('❌ El archivo seleccionado no es un JSON válido.')
        }
      }
      reader.readAsText(file)
    }
  }

  const handleLimpiarSistema = () => {
    if (window.confirm('⚠️ ADVERTENCIA DE SEGURIDAD:\n¿Estás completamente seguro de borrar TODA la información local? Se perderán pacientes, fichas y agenda.')) {
      localStorage.clear()
      alert('💥 Sistema reiniciado a estado inicial. Se recargará la aplicación.')
      window.location.reload()
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4 text-xs">
      <div className="border-b pb-3">
        <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider">💾 Respaldo & Restauración de la Base de Datos</h3>
        <p className="text-gray-500 text-[11px]">Garantiza la seguridad de la información mediante copias de seguridad portátiles.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
          <h4 className="font-bold text-emerald-900 text-sm">📤 Exportar Copia de Seguridad</h4>
          <p className="text-gray-600 text-[11px]">Descarga un archivo JSON cifrado localmente con todas las fichas clínicas, anamnesis y movimientos financieros.</p>
          <button
            type="button"
            onClick={alExportarBackup}
            className="w-full bg-emerald-700 text-white font-bold py-2.5 rounded-xl hover:bg-emerald-800 transition-colors shadow-xs"
          >
            Descargar Respaldo JSON
          </button>
        </div>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl space-y-2">
          <h4 className="font-bold text-blue-900 text-sm">📥 Restaurar Respaldo JSON</h4>
          <p className="text-gray-600 text-[11px]">Carga un archivo de respaldo previo para migrar o recuperar datos de la consulta.</p>
          <input
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="w-full p-2 border rounded-xl bg-white font-bold"
          />
        </div>
      </div>

      <div className="pt-4 border-t flex justify-between items-center flex-wrap gap-2">
        <span className="text-red-600 font-semibold text-[11px]">⚠️ Zona de Peligro Administrador:</span>
        <button
          type="button"
          onClick={handleLimpiarSistema}
          className="bg-red-50 text-red-700 border border-red-200 font-bold px-4 py-2 rounded-xl hover:bg-red-100 transition-colors"
        >
          🗑️ Reiniciar / Borrar Datos Locales
        </button>
      </div>
    </div>
  )
})

RespaldoDatosSection.displayName = 'RespaldoDatosSection'