import React, { memo, useState } from 'react'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { obtenerFechaLocalISO } from '../../../utils/dateUtils'

/**
 * Formulario para emitir nuevo certificado médico (F6-D-6 refactor)
 * 
 * Componente extraído de CertificadosSection.jsx para respetar el límite
 * arquitectónico de 285 líneas. Encapsula:
 * - Estado del formulario
 * - Lógica de generación de certificados
 * - Renderizado del formulario
 */
export const FormularioNuevoCertificado = memo(({ userProfile, onGenerarCertificado }) => {
  const [tipoCertificado, setTipoCertificado] = useState('asistencia')
  const [fechaAtencion, setFechaAtencion] = useState(obtenerFechaLocalISO())
  const [horaInicio, setHoraInicio] = useState('10:00')
  const [horaFin, setHoraFin] = useState('11:00')
  const [diasReposo, setDiasReposo] = useState('1')
  const [diagnosticoMotivo, setDiagnosticoMotivo] = useState('')
  const [observaciones, setObservaciones] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!diagnosticoMotivo) {
      alert('Por favor ingresa el motivo o diagnóstico de la atención.')
      return
    }

    const nuevoCertificado = {
      id: Date.now(),
      fechaEmision: new Date().toLocaleDateString('es-CL'),
      tipo: tipoCertificado,
      fechaAtencion,
      horaInicio,
      horaFin,
      diasReposo: tipoCertificado === 'reposo' ? diasReposo : null,
      diagnosticoMotivo,
      observaciones,
      profesional: userProfile?.nombreCompleto || 'Dr. Miguel Díaz Rodríguez',
      rutProfesional: userProfile?.rut || 'N/I',
      especialidad: userProfile?.especialidad || 'Cirujano Dentista'
    }

    onGenerarCertificado(nuevoCertificado)
    setDiagnosticoMotivo('')
    setObservaciones('')
  }

  return (
    <div className="bg-gray-50 p-5 border border-gray-200 rounded-2xl print:hidden">
      <h4 className="font-bold text-xs text-gray-800 mb-4 uppercase tracking-wider">Emitir Nuevo Certificado / Constancia Médica</h4>
      
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="flex gap-4">
          <Input
            type="radio"
            name="tipoCert"
            value="asistencia"
            checked={tipoCertificado === 'asistencia'}
            onChange={() => setTipoCertificado('asistencia')}
            className="accent-black"
          />
          <span className="font-bold">📋 Certificado de Asistencia</span>
          <Input
            type="radio"
            name="tipoCert"
            value="reposo"
            checked={tipoCertificado === 'reposo'}
            onChange={() => setTipoCertificado('reposo')}
            className="accent-black"
          />
          <span className="font-bold">🛌 Certificado de Reposo / Licencia Médica</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-gray-600 mb-1 font-semibold">Fecha de Atención</label>
            <Input
              type="date"
              value={fechaAtencion}
              onChange={(e) => setFechaAtencion(e.target.value)}
            />
          </div>

          {tipoCertificado === 'asistencia' ? (
            <>
              <div>
                <label className="block text-gray-600 mb-1 font-semibold">Hora Inicio</label>
                <Input
                  type="time"
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-gray-600 mb-1 font-semibold">Hora Término</label>
                <Input
                  type="time"
                  value={horaFin}
                  onChange={(e) => setHoraFin(e.target.value)}
                />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-gray-600 mb-1 font-semibold">Días de Reposo Indicados</label>
              <Input
                type="number"
                min="1"
                max="30"
                value={diasReposo}
                onChange={(e) => setDiasReposo(e.target.value)}
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-gray-600 mb-1 font-semibold">
            {tipoCertificado === 'asistencia' ? 'Procedimiento / Atención Realizada' : 'Diagnóstico Clínico / Causa del Reposo'}
          </label>
          <Input
            type="text"
            placeholder={tipoCertificado === 'asistencia' ? 'Ej: Exodoncia de pieza 3.8 y sutura' : 'Ej: Cirugía de terceros molares e inflamación moderada'}
            value={diagnosticoMotivo}
            onChange={(e) => setDiagnosticoMotivo(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-gray-600 mb-1 font-semibold">Observaciones o Indicaciones Adicionales (Opcional)</label>
          <Input
            type="text"
            placeholder="Ej: Se sugiere no realizar actividad física intensa por 48 hrs."
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" variant="primary">
            📄 Generar y Guardar Certificado
          </Button>
        </div>
      </form>
    </div>
  )
})

FormularioNuevoCertificado.displayName = 'FormularioNuevoCertificado'
