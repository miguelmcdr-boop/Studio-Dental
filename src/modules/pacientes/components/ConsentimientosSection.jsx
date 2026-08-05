import React, { memo, useState } from 'react'
import { FirmaDigitalCanvas } from '../../../components/FirmaDigitalCanvas'
import { pacientesStorageService } from '../services/pacientesStorageService'

const PLANTILLAS_CONSENTIMIENTO = [
  {
    id: 'cirugia_exodoncia',
    nombre: 'Consentimiento para Cirugía Bucal / Exodoncia',
    texto: 'Declaro haber sido informado/a adecuadamente sobre la necesidad de realizar la exodoncia/cirugía bucal. Se me han explicado los riesgos potenciales (hemorragia, infección, alveolitis, parestesia temporal/definitiva) y acepto de manera voluntaria la realización del procedimiento.'
  },
  {
    id: 'endodoncia',
    nombre: 'Consentimiento para Tratamiento de Conducto (Endodoncia)',
    texto: 'Declaro comprender la naturaleza del tratamiento endodóntico para conservar la pieza dental. Comprendo que puede requerirse más de una sesión y que existen riesgos de fractura de instrumento, sobreobturación o dolor post-tratamiento temporal.'
  },
  {
    id: 'implante',
    nombre: 'Consentimiento para Implantología Oral',
    texto: 'Autorizo la colocación de implante(s) osteointegrados. Acepto cumplir estrictamente las normas de higiene y controles peri-implantarios, comprendiendo que el consumo de tabaco o mala higiene reducen la tasa de éxito.'
  }
]

export const ConsentimientosSection = memo(({ paciente, userProfile }) => {
  const [plantillaId, setPlantillaId] = useState(PLANTILLAS_CONSENTIMIENTO[0].id)
  const [firmaBase64, setFirmaBase64] = useState('')
  const [historialConsentimientos, setHistorialConsentimientos] = useState(() =>
    pacientesStorageService.obtenerItem(`consentimientos_${paciente.id}`, [])
  )

  const plantillaActual = PLANTILLAS_CONSENTIMIENTO.find(p => p.id === plantillaId) || PLANTILLAS_CONSENTIMIENTO[0]

  const handleGuardarConsentimiento = () => {
    if (!firmaBase64) {
      alert('Por favor solicita al paciente que firme en el recuadro digital antes de guardar.')
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

    const actualizados = [nuevoRegistro, ...historialConsentimientos]
    setHistorialConsentimientos(actualizados)
    pacientesStorageService.guardarItem(`consentimientos_${paciente.id}`, actualizados)
    setFirmaBase64('')
    alert('✅ Consentimiento informado firmado y guardado inmutablemente.')
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
          <FirmaDigitalCanvas alGuardarFirma={setFirmaBase64} />
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleGuardarConsentimiento}
            className="bg-black text-white font-bold px-5 py-2.5 rounded-xl hover:bg-gray-800 cursor-pointer"
          >
            🔒 Registrar Consentimiento Inmutable
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
              <div key={c.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex justify-between items-center flex-wrap gap-2">
                <div>
                  <span className="font-bold text-gray-900 block">{c.titulo}</span>
                  <span className="text-[10px] text-gray-500">Firmado el: {c.fecha} — Profesional: {c.profesional}</span>
                </div>
                {c.firma && (
                  <img src={c.firma} alt="Firma Paciente" className="h-12 border bg-white rounded p-1" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
})

ConsentimientosSection.displayName = 'ConsentimientosSection'