import React, { memo, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { FirmaDigitalCanvas } from '../../../components/FirmaDigitalCanvas'
import { ConsentimientoImprimible } from './ConsentimientoImprimible'
import { useAppDialog } from '../../../hooks/useAppDialog'
import { useConsentimientosPDF } from '../hooks/useConsentimientosPDF.jsx'
import { configuracionStorageService } from '../../configuracion/services/configuracionStorageService'
import { CLINICA_DEFAULT } from '../../configuracion/constants/configuracionConstants'
import { PLANTILLAS_CONSENTIMIENTO } from '../constants/plantillasConsentimiento'
import { createLogger } from '../../../services/logger'

const log = createLogger('ConsentimientosSection')

export const ConsentimientosSection = memo(({ paciente, userProfile }) => {
  const [plantillaId, setPlantillaId] = useState(PLANTILLAS_CONSENTIMIENTO[0].id)
  const { alert: dialogAlert } = useAppDialog()
  const [firmaBase64, setFirmaBase64] = useState('')
  const [firmaResetCounter, setFirmaResetCounter] = useState(0)
  const [historialConsentimientos, setHistorialConsentimientos] = useState([])
  const [datosClinica, setDatosClinica] = useState(CLINICA_DEFAULT)

  // Cargar configuración de clínica al montar
  useEffect(() => {
    try {
      const config = configuracionStorageService.obtenerClinica(CLINICA_DEFAULT)
      if (config) setDatosClinica(config)
    } catch (e) {
      log.warn('Error cargando configuración de clínica:', e)
    }
  }, [])

  const {
    generandoPDF,
    consentimientoParaImprimir,
    generarYSubirPDF,
    descargarPDF,
    imprimir
  } = useConsentimientosPDF(paciente, userProfile, datosClinica)

  const plantillaActual = PLANTILLAS_CONSENTIMIENTO.find(p => p.id === plantillaId) || PLANTILLAS_CONSENTIMIENTO[0]

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

    const nuevoRegistro = {
      id: Date.now(),
      fecha: new Date().toLocaleDateString('es-CL') + ' ' + new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
      titulo: plantillaActual.nombre,
      contenido: plantillaActual.texto,
      firma: firmaBase64,
      pacienteNombre: paciente.nombre,
      pacienteRut: paciente.rut,
      profesional: userProfile?.nombreCompleto || 'Dr. Miguel Díaz Rodríguez'
    }

    // M4a: Generar PDF y subir a R2
    const respaldo = await generarYSubirPDF(nuevoRegistro)

    if (respaldo) {
      nuevoRegistro.r2ArchivoId = respaldo.archivoId
      nuevoRegistro.r2ObjectKey = respaldo.objectKey
    } else {
      log.warn('No se pudo generar/subir PDF a R2, guardando solo metadata')
    }

    // Guardar en memoria (M4: sin localStorage, todo en R2)
    const actualizados = [nuevoRegistro, ...historialConsentimientos]
    setHistorialConsentimientos(actualizados)
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

  const handleDescargarPDF = async (consentimiento) => {
    const actualizarConsentimiento = (id, cambios) => {
      setHistorialConsentimientos(prev =>
        prev.map(c => (c.id === id ? { ...c, ...cambios } : c))
      )
    }

    const ok = await descargarPDF(consentimiento, actualizarConsentimiento)
    if (!ok) {
      await dialogAlert({
        title: 'Error al descargar',
        description: 'No se pudo descargar el PDF del consentimiento.',
        variant: 'error',
        confirmText: 'Entendido'
      })
    }
  }

  return (
    <div className="space-y-6 text-xs">
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-4 print:hidden">
        <h4 className="font-bold text-xs text-gray-800 uppercase tracking-wider">
          📄 Emitir Consentimiento Informado con Firma Digital en Pantalla
        </h4>

        <div>
          <label className="block font-bold text-gray-700 mb-1">Seleccionar Tipo de Procedimiento</label>
          <select
            value={plantillaId}
            onChange={(e) => setPlantillaId(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-gray-300 bg-white font-bold"
          >
            {PLANTILLAS_CONSENTIMIENTO.map(p => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-300 leading-relaxed text-gray-800">
          <p className="font-semibold mb-2">{plantillaActual.nombre}</p>
          <p className="text-[11px] text-gray-600">{plantillaActual.texto}</p>
        </div>

        {/* Componente Firma Digital Canvas */}
        <div>
          <label className="block font-bold text-gray-800 mb-2">✍️ Firma Táctil / Digital del Paciente:</label>
          <FirmaDigitalCanvas alGuardarFirma={setFirmaBase64} resetSignal={firmaResetCounter} />
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleGuardarConsentimiento}
            disabled={generandoPDF}
            className="bg-black text-white font-bold px-5 py-2.5 rounded-xl hover:bg-gray-800 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generandoPDF ? '⏳ Generando PDF...' : '🔒 Registrar Consentimiento Inmutable'}
          </button>
        </div>
      </div>

      {/* Historial de Consentimientos Firmados */}
      {historialConsentimientos.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3 print:hidden">
          <h4 className="font-bold text-xs text-gray-800 uppercase tracking-wider">
            📜 Consentimientos Firmados del Paciente ({historialConsentimientos.length})
          </h4>
          <div className="space-y-3">
            {historialConsentimientos.map(c => (
              <div key={c.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex justify-between items-start flex-wrap gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-gray-900 block">{c.titulo}</span>
                    <span className="text-[10px] text-gray-500">Firmado el: {c.fecha} — Profesional: {c.profesional}</span>
                  </div>
                  {c.firma && (
                    <img src={c.firma} alt="Firma Paciente" className="h-12 border bg-white rounded p-1 flex-shrink-0" />
                  )}
                </div>

                {/* M4a: Botones Descargar e Imprimir */}
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => handleDescargarPDF(c)}
                    disabled={generandoPDF}
                    className="bg-gray-100 text-gray-800 font-semibold px-3 py-1.5 rounded-lg hover:bg-gray-200 border border-gray-300 text-[10px] disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Descargar PDF del consentimiento"
                  >
                    📥 Descargar PDF
                  </button>
                  <button
                    onClick={() => imprimir(c)}
                    disabled={generandoPDF}
                    className="bg-gray-100 text-gray-800 font-semibold px-3 py-1.5 rounded-lg hover:bg-gray-200 border border-gray-300 text-[10px] disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Imprimir consentimiento en formato Letter"
                  >
                    🖨️ Imprimir
                  </button>
                  {c.r2ArchivoId && (
                    <span className="ml-auto flex items-center gap-1 text-[10px] text-green-700 bg-green-50 px-2 py-1 rounded border border-green-200">
                      🔒 R2
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
