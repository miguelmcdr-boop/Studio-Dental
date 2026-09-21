import React, { memo } from 'react'
import { Printer, Trash2 } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { useAppDialog } from '../../../hooks/useAppDialog'
import { Download } from 'lucide-react'

/**
 * M4b: Tarjeta individual de consentimiento con metadata desde archivos_clinicos.
 *
 * Props:
 * - archivo: objeto de archivos_clinicos con metadata JSONB
 * - onDescargar: callback para descargar PDF
 * - onImprimir: callback para imprimir en formato Letter
 * - onEliminar: callback para eliminar (soft delete M2)
 * - disabled: boolean para deshabilitar botones durante operaciones
 */
export const TarjetaConsentimiento = memo(({
  archivo,
  onDescargar,
  onImprimir,
  onEliminar,
  disabled = false
}) => {
  const { confirm } = useAppDialog()

  const metadata = archivo.metadata || {}
  const titulo = metadata.titulo || 'Consentimiento sin título'
  const contenido = metadata.contenido || ''
  const firma = metadata.firma || ''
  const pacienteNombre = metadata.pacienteNombre || ''
  const pacienteRut = metadata.pacienteRut || ''
  const profesional = metadata.profesional || ''
  const fechaCreacion = new Date(archivo.created_at).toLocaleDateString('es-CL')

  const handleEliminar = async () => {
    const ok = await confirm({
      title: 'Mover a papelera',
      description: `¿Eliminar el consentimiento "${titulo}"? Se moverá a la papelera y podrá restaurarse posteriormente.`,
      variant: 'danger',
      confirmText: 'Eliminar'
    })
    if (ok) {
      onEliminar(archivo.id)
    }
  }

  return (
    <div className="p-4 bg-gray-50 dark:bg-graphite-800 rounded-xl border border-gray-200 dark:border-graphite-700">
      <div className="flex justify-between items-start flex-wrap gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <span className="font-bold text-gray-900 dark:text-graphite-50 block">{titulo}</span>
          <span className="text-[10px] text-gray-500 dark:text-graphite-400">
            Firmado el: {fechaCreacion} — Profesional: {profesional}
          </span>
          {pacienteNombre && pacienteRut && (
            <span className="text-[10px] text-gray-500 dark:text-graphite-400 block mt-1">
              Paciente: {pacienteNombre} ({pacienteRut})
            </span>
          )}
        </div>
        {firma && (
          <img src={firma} alt="Firma Paciente" className="h-12 border bg-white dark:bg-graphite-800 rounded p-1 flex-shrink-0" />
        )}
      </div>

      {contenido && (
        <p className="text-[10px] text-gray-600 dark:text-graphite-400 mb-3 line-clamp-2">
          {contenido}
        </p>
      )}

      <div className="flex gap-2 flex-wrap">
        <Button
          onClick={() => onDescargar(archivo)}
          disabled={disabled}
          variant="secondary"
          size="xs"
          title="Descargar PDF del consentimiento"
        >
          <span className="inline-flex items-center gap-1"><Download size={12} />Descargar PDF</span>
        </Button>
        <Button
          onClick={() => onImprimir(archivo)}
          disabled={disabled}
          variant="secondary"
          size="xs"
          title="Imprimir consentimiento en formato Letter"
        >
          <span className="inline-flex items-center gap-1"><Printer size={12} />Imprimir</span>
        </Button>
        <Button
          onClick={handleEliminar}
          disabled={disabled}
          variant="danger"
          size="xs"
          title="Mover a papelera"
        >
          <span className="inline-flex items-center gap-1"><Trash2 size={12} />Eliminar</span>
        </Button>
      </div>
    </div>
  )
})

TarjetaConsentimiento.displayName = 'TarjetaConsentimiento'
