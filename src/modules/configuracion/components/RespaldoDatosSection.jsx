import React, { memo } from 'react'
import { configuracionStorageService } from '../services/configuracionStorageService'
import { useAppDialog } from '../../../hooks/useAppDialog'
import { AlertTriangle, Trash2 } from 'lucide-react'
import { Save, Upload, Download } from 'lucide-react'

export const RespaldoDatosSection = memo(({ alExportarBackup, alImportarBackup }) => {
  const { confirm, alert: dialogAlert } = useAppDialog()
  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = async (event) => {
        try {
          const parsed = JSON.parse(event.target.result)
          alImportarBackup(parsed)
        } catch {
          await dialogAlert({
            title: 'Archivo inválido',
            description: 'El archivo seleccionado no es un JSON válido.',
            variant: 'error',
            confirmText: 'Entendido'
          })
        }
      }
      reader.readAsText(file)
    }
  }

  const handleLimpiarSistema = async () => {
    const confirmado = await confirm({
      title: 'Advertencia de seguridad',
      description: '¿Estás completamente seguro de borrar TODA la información local? Se perderán pacientes, fichas y agenda.',
      variant: 'danger',
      confirmText: 'Borrar todo'
    })
    if (confirmado) {
      // F2-07: migrado a servicio, no acceso directo a localStorage
      const ok = configuracionStorageService.limpiarBaseDeDatosCompleta()
      if (ok) {
        await dialogAlert({
          title: 'Sistema reiniciado',
          description: 'Sistema reiniciado a estado inicial. Se recargará la aplicación.',
          variant: 'info',
          confirmText: 'Entendido'
        })
        window.location.reload()
      } else {
        await dialogAlert({
          title: 'Error al limpiar',
          description: 'Error al limpiar la base de datos. Verifica el almacenamiento del navegador.',
          variant: 'error',
          confirmText: 'Entendido'
        })
      }
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4 text-xs">
      <div className="border-b pb-3">
        <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider inline-flex items-center gap-2"><Save size={14} />Respaldo & Restauración de la Base de Datos</h3>
        <p className="text-gray-500 text-[11px]">Garantiza la seguridad de la información mediante copias de seguridad portátiles.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
          <h4 className="font-bold text-emerald-900 text-sm inline-flex items-center gap-1"><Upload size={14} />Exportar Copia de Seguridad</h4>
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
          <h4 className="font-bold text-blue-900 text-sm inline-flex items-center gap-1"><Download size={14} />Restaurar Respaldo JSON</h4>
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
        <span className="text-red-600 font-semibold text-[11px] inline-flex items-center gap-1"><AlertTriangle size={12} />Zona de Peligro Administrador:</span>
        <button
          type="button"
          onClick={handleLimpiarSistema}
          className="bg-red-50 text-red-700 border border-red-200 font-bold px-4 py-2 rounded-xl hover:bg-red-100 transition-colors"
        >
          <span className="inline-flex items-center gap-1"><Trash2 size={12} />Reiniciar / Borrar Datos Locales</span>
        </button>
      </div>
    </div>
  )
})

RespaldoDatosSection.displayName = 'RespaldoDatosSection'