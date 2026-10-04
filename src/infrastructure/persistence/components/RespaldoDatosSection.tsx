import React, { memo } from 'react'
import { persistenceStorageService, descargarArchivoBackupJSON, type BackupBaseDeDatos } from '../services/persistenceStorageService'
import { useAppDialog } from '../../../../hooks/useAppDialog'
import { AlertTriangle, Trash2, Save, Upload, Download } from 'lucide-react'

export interface RespaldoDatosSectionProps {
  alExportarBackup?: () => void
  alImportarBackup?: (backup: BackupBaseDeDatos) => void | Promise<void>
}

export const RespaldoDatosSection: React.FC<RespaldoDatosSectionProps> = memo(({ alExportarBackup, alImportarBackup }) => {
  const { confirm, alert: dialogAlert } = useAppDialog()

  const exportarPorDefecto = () => {
    if (alExportarBackup) {
      alExportarBackup()
    } else {
      const backup = persistenceStorageService.exportarBaseDeDatosCompleta()
      descargarArchivoBackupJSON(backup, `studio_dental_backup_${new Date().toISOString().slice(0, 10)}.json`)
    }
  }

  const importarPorDefecto = async (parsed: BackupBaseDeDatos) => {
    if (alImportarBackup) {
      await alImportarBackup(parsed)
    } else {
      persistenceStorageService.importarBaseDeDatosCompleta(parsed)
      await dialogAlert({
        title: 'Restauración completada',
        description: 'La base de datos fue restaurada. La app se recargará.',
        variant: 'success',
        confirmText: 'Aceptar'
      })
      window.location.reload()
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = async (event: ProgressEvent<FileReader>) => {
        try {
          const content = event.target?.result as string
          const parsed = JSON.parse(content) as BackupBaseDeDatos
          await importarPorDefecto(parsed)
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
      const ok = persistenceStorageService.limpiarBaseDeDatosCompleta()
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
    <div className="bg-surface border border-surface rounded-2xl p-6 shadow-xs space-y-4 text-xs">
      <div className="border-b border-surface pb-3">
        <h3 className="font-bold text-sm text-gray-900 dark:text-graphite-50 surgical:text-black uppercase tracking-wider inline-flex items-center gap-2"><Save size={14} />Copia de Seguridad y Restauración</h3>
        <p className="text-gray-500 dark:text-graphite-400 text-[11px]">Exporta o importa el estado completo del sistema (pacientes, evoluciones, citas) en formato JSON local.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border border-dashed border-gray-300 dark:border-graphite-700 rounded-xl space-y-2">
          <h4 className="font-bold text-gray-800 dark:text-graphite-200 inline-flex items-center gap-1.5"><Download size={13} />Exportar Datos</h4>
          <p className="text-gray-500 dark:text-graphite-400 text-[11px]">Descarga una copia completa de toda la información guardada en tu navegador.</p>
          <button
            type="button"
            onClick={exportarPorDefecto}
            className="px-3 py-1.5 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition cursor-pointer text-xs"
          >
            Descargar Backup JSON
          </button>
        </div>

        <div className="p-4 border border-dashed border-gray-300 dark:border-graphite-700 rounded-xl space-y-2">
          <h4 className="font-bold text-gray-800 dark:text-graphite-200 inline-flex items-center gap-1.5"><Upload size={13} />Importar Datos</h4>
          <p className="text-gray-500 dark:text-graphite-400 text-[11px]">Restaura un archivo de backup previamente exportado. Esta acción reemplazará los datos locales.</p>
          <label className="inline-block px-3 py-1.5 bg-secondary text-white rounded-lg font-semibold hover:bg-secondary-dark transition cursor-pointer text-xs">
            Seleccionar Archivo JSON
            <input
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
      </div>

      <div className="pt-4 border-t border-red-100 dark:border-red-950/30">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h4 className="font-bold text-red-600 dark:text-red-400 inline-flex items-center gap-1.5"><AlertTriangle size={13} />Zona de Peligro: Reinicio Total</h4>
            <p className="text-gray-500 dark:text-graphite-400 text-[11px]">Elimina todos los datos guardados en este navegador y reinicia la aplicación.</p>
          </div>
          <button
            type="button"
            onClick={handleLimpiarSistema}
            className="px-3 py-1.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition cursor-pointer text-xs inline-flex items-center gap-1"
          >
            <Trash2 size={12} />Reiniciar Sistema
          </button>
        </div>
      </div>
    </div>
  )
})

RespaldoDatosSection.displayName = 'RespaldoDatosSection'
