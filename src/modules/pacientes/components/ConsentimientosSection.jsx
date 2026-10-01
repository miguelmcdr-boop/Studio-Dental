import React, { memo, useState } from 'react'
import { FileText, PenLine, Loader2, Lock } from 'lucide-react'
import { createPortal } from 'react-dom'
import { FirmaDigitalCanvas } from '../../../components/FirmaDigitalCanvas'
import { ConsentimientoImprimible } from './ConsentimientoImprimible'
import { TarjetaConsentimiento } from './TarjetaConsentimiento'
import { PapeleraArchivos } from './PapeleraArchivos'
import { useAppDialog } from '../../../hooks/useAppDialog'
import { useRBAC } from '../../../hooks/useRBAC'
import { PERMISOS } from '../../../constants/rbacConstants'
import { useArchivosClinicos } from '../hooks/useArchivosClinicos'
import { useConsentimientosPDF } from '../hooks/useConsentimientosPDF.jsx'
import { useConsentimientosInit } from '../hooks/useConsentimientosInit'
import { PLANTILLAS_CONSENTIMIENTO } from '../constants/plantillasConsentimiento'
import { createLogger } from '../../../services/logger'
import { ScrollText } from 'lucide-react'
const log = createLogger('ConsentimientosSection')

export const ConsentimientosSection = memo(({ paciente, userProfile }) => {
  const [plantillaId, setPlantillaId] = useState(PLANTILLAS_CONSENTIMIENTO[0].id)
  const { alert: dialogAlert } = useAppDialog()
  const [firmaBase64, setFirmaBase64] = useState('')
  const [firmaResetCounter, setFirmaResetCounter] = useState(0)

  // M4b: Integración con useArchivosClinicos para papelera M2
  const {
    archivos,
    cargando,
    error,
    permisos,
    eliminarArchivo,
    archivosEliminados,
    cargandoPapelera,
    cargarPapelera,
    restaurarArchivo,
    vaciarPapelera,
    recargar
  } = useArchivosClinicos(paciente.id, 'consentimiento')

  // M4b: Hook de inicialización (config clínica, papelera, limpieza legacy)
  const { datosClinica } = useConsentimientosInit(paciente.id, cargarPapelera)

  const { puede } = useRBAC()
  const puedeVaciar = puede(PERMISOS.VACIAR_PAPELERA)

  const {
    generandoPDF,
    consentimientoParaImprimir,
    generarYSubirPDF,
    descargarPDF,
    imprimir
  } = useConsentimientosPDF(paciente, userProfile, datosClinica)

  const plantillaActual = PLANTILLAS_CONSENTIMIENTO.find(p => p.id === plantillaId) || PLANTILLAS_CONSENTIMIENTO[0]

  // M4b: Filtrar solo consentimientos (no otros PDFs)
  const consentimientos = archivos.filter(a => a.metadata?.subcategoria === 'consentimiento')

  const handleGuardarConsentimiento = async () => {
    if (!firmaBase64) {
      await dialogAlert({
        title: 'Firma requerida',
        description: 'Por favor solicita al paciente que firme en el recuadro digital antes de guardar.',
        variant: 'warning',
        confirmText: 'Entendido'
      })
      return
    }

    const fechaActual = new Date().toLocaleDateString('es-CL') + ' ' + new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })

    const nuevoRegistro = {
      id: Date.now(),
      fecha: fechaActual,
      titulo: plantillaActual.nombre,
      contenido: plantillaActual.texto,
      firma: firmaBase64,
      pacienteNombre: paciente.nombre,
      pacienteRut: paciente.rut,
      profesional: userProfile?.nombreCompleto || 'Dr. Miguel Díaz Rodríguez'
    }

    // M4b: Generar PDF y subir a R2 con metadata
    const metadata = {
      titulo: plantillaActual.nombre,
      contenido: plantillaActual.texto,
      firma: firmaBase64,
      pacienteNombre: paciente.nombre,
      pacienteRut: paciente.rut,
      profesional: userProfile?.nombreCompleto || 'Dr. Miguel Díaz Rodríguez',
      fecha: fechaActual
    }

    const respaldo = await generarYSubirPDF(nuevoRegistro, metadata)

    if (respaldo) {
      log.info(`Consentimiento respaldado en R2: ${respaldo.archivoId}`)
      await recargar()
    } else {
      log.warn('No se pudo generar/subir PDF a R2')
    }

    setFirmaBase64('')
    setFirmaResetCounter(c => c + 1)

    await dialogAlert({
      title: 'Consentimiento guardado',
      description: respaldo
        ? 'Consentimiento informado firmado, generado PDF y respaldado en R2.'
        : 'Consentimiento informado firmado. El PDF no pudo ser respaldado en R2.',
      variant: respaldo ? 'success' : 'warning',
      confirmText: 'Entendido'
    })
  }

  const handleDescargarPDF = async (archivo) => {
    const consentimiento = {
      id: archivo.id,
      titulo: archivo.metadata?.titulo || 'Consentimiento',
      contenido: archivo.metadata?.contenido || '',
      firma: archivo.metadata?.firma || '',
      pacienteNombre: archivo.metadata?.pacienteNombre || '',
      pacienteRut: archivo.metadata?.pacienteRut || '',
      profesional: archivo.metadata?.profesional || '',
      fecha: archivo.metadata?.fecha || '',
      r2ArchivoId: archivo.id
    }

    const ok = await descargarPDF(consentimiento)
    if (!ok) {
      await dialogAlert({
        title: 'Error al descargar',
        description: 'No se pudo descargar el PDF del consentimiento.',
        variant: 'error',
        confirmText: 'Entendido'
      })
    }
  }

  const handleImprimir = (archivo) => {
    const consentimiento = {
      titulo: archivo.metadata?.titulo || 'Consentimiento',
      contenido: archivo.metadata?.contenido || '',
      firma: archivo.metadata?.firma || '',
      pacienteNombre: archivo.metadata?.pacienteNombre || '',
      pacienteRut: archivo.metadata?.pacienteRut || '',
      profesional: archivo.metadata?.profesional || '',
      fecha: archivo.metadata?.fecha || ''
    }
    imprimir(consentimiento)
  }

  return (
    <div className="space-y-6 text-xs">
      <div className="bg-gray-50 dark:bg-graphite-800 border border-gray-200 dark:border-graphite-700 rounded-2xl p-5 space-y-4 print:hidden">
        <h4 className="font-bold text-xs text-gray-800 dark:text-graphite-100 uppercase tracking-wider">
          <span className="inline-flex items-center gap-1"><FileText size={14} />Emitir Consentimiento Informado con Firma Digital en Pantalla</span>
        </h4>

        <div>
          <label className="block font-bold text-gray-700 dark:text-graphite-300 mb-1">Seleccionar Tipo de Procedimiento</label>
          <select
            value={plantillaId}
            onChange={(e) => setPlantillaId(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-graphite-600 bg-white dark:bg-graphite-800 font-bold"
          >
            {PLANTILLAS_CONSENTIMIENTO.map(p => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        </div>

        <div className="bg-white dark:bg-graphite-800 p-4 rounded-xl border border-gray-300 dark:border-graphite-600 leading-relaxed text-gray-800 dark:text-graphite-100">
          <p className="font-semibold mb-2">{plantillaActual.nombre}</p>
          <p className="text-[11px] text-gray-600 dark:text-graphite-400">{plantillaActual.texto}</p>
        </div>

        <div>
          <label className="block font-bold text-gray-800 dark:text-graphite-100 mb-2"><span className="inline-flex items-center gap-1"><PenLine size={12} />Firma Táctil / Digital del Paciente:</span></label>
          <FirmaDigitalCanvas alGuardarFirma={setFirmaBase64} resetSignal={firmaResetCounter} />
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleGuardarConsentimiento}
            disabled={generandoPDF}
            className="bg-black text-white font-bold px-5 py-2.5 rounded-xl hover:bg-gray-800 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
          >
            {generandoPDF ? <span className='inline-flex items-center gap-1'><Loader2 size={14} className='animate-spin' />Generando PDF...</span> : <span className='inline-flex items-center gap-1'><Lock size={14} />Registrar Consentimiento Inmutable</span>}
          </button>
        </div>
      </div>

      {/* M4b: Historial de Consentimientos desde R2 */}
      {cargando ? (
        <div className="bg-white dark:bg-graphite-800 border border-gray-200 dark:border-graphite-700 rounded-2xl p-5 text-center text-gray-500 dark:text-graphite-400">
          Cargando consentimientos...
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center text-red-700">
          Error: {error}
        </div>
      ) : consentimientos.length > 0 ? (
        <div className="bg-white dark:bg-graphite-800 border border-gray-200 dark:border-graphite-700 rounded-2xl p-5 space-y-3 print:hidden">
          <h4 className="font-bold text-xs text-gray-800 dark:text-graphite-100 uppercase tracking-wider">
            <span className="inline-flex items-center gap-1"><ScrollText size={12} />Consentimientos Firmados del Paciente ({consentimientos.length})</span>
          </h4>
          <div className="space-y-3">
            {consentimientos.map(archivo => (
              <TarjetaConsentimiento
                key={archivo.id}
                archivo={archivo}
                onDescargar={handleDescargarPDF}
                onImprimir={handleImprimir}
                onEliminar={eliminarArchivo}
                disabled={generandoPDF}
              />
            ))}
          </div>
        </div>
      ) : null}

      {/* M4b: Papelera de archivos M2 */}
      <PapeleraArchivos
        archivosEliminados={archivosEliminados}
        cargando={cargandoPapelera}
        onRestaurar={restaurarArchivo}
        onVaciar={vaciarPapelera}
        puedeVaciar={puedeVaciar}
        permisos={permisos}
      />

      {/* M4a: Portal de impresión aislada */}
      {consentimientoParaImprimir && createPortal(
        <div className="certificado-print-portal">
          <ConsentimientoImprimible
            consentimiento={consentimientoParaImprimir}
            paciente={paciente}
            datosClinica={datosClinica}
            userProfile={userProfile}
          />
        </div>,
        document.body
      )}
    </div>
  )
})

ConsentimientosSection.displayName = 'ConsentimientosSection'
