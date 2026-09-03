import React, { memo, useRef } from 'react'

/**
 * Botón/input de subida de archivos clínicos a R2.
 *
 * F7-22 Fase 8:
 * - Oculta el input file real
 * - Muestra progreso cuando hay upload activo
 * - Respeta RBAC: si no puedeSubir, no renderiza botón
 */
export const ArchivoUploader = memo(({
  tipoArchivo,
  permisos,
  subiendo,
  progreso,
  onSubirArchivos,
}) => {
  const inputRef = useRef(null)

  if (!permisos?.puedeSubir) {
    return null
  }

  const config = {
    foto: {
      label: '📸 Subir Fotos',
      accept: 'image/*',
    },
    rx: {
      label: '🩻 Subir Radiografías',
      accept: 'image/*,.pdf',
    },
    consentimiento: {
      label: '📄 Adjuntar Documento',
      accept: 'image/*,.pdf',
    },
  }

  const cfg = config[tipoArchivo] || {
    label: '📎 Subir Archivo',
    accept: 'image/*,.pdf',
  }

  const handleChange = async (e) => {
    const files = e.target.files
    if (files && files.length > 0) {
      await onSubirArchivos(files)
    }
    e.target.value = ''
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={subiendo}
        className="bg-black text-white text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {subiendo ? 'Subiendo…' : cfg.label}
      </button>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={cfg.accept}
        onChange={handleChange}
        className="hidden"
      />

      {subiendo && (
        <div className="w-40">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-black transition-all duration-200"
              style={{ width: `${Math.min(Math.max(progreso, 0), 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-gray-500 text-right mt-1">{progreso}%</p>
        </div>
      )}
    </div>
  )
})

ArchivoUploader.displayName = 'ArchivoUploader'
