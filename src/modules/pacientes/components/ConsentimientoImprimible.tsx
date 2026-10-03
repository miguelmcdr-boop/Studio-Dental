import React, { memo } from 'react'
import { DentikOSMicroSeal } from '../../../components/brand/DentikOSMicroSeal'

export interface ConsentimientoDoc {
  id?: string | number
  titulo: string
  contenido: string
  fecha?: string
  firma?: string | null
  profesional?: string
  r2ArchivoId?: string
  r2ObjectKey?: string
  [key: string]: unknown
}

export interface PacienteConsentimientoRef {
  id?: string | number
  nombre?: string
  rut?: string
  [key: string]: unknown
}

export interface DatosClinicaRef {
  nombreClinica?: string
  rutClinica?: string
  direccion?: string
  ciudad?: string
  telefono?: string
  logoUrl?: string
  emailContacto?: string
}

export interface UserProfileRef {
  nombreCompleto?: string
  rut?: string
  especialidad?: string
  [key: string]: unknown
}

export interface ConsentimientoImprimibleProps {
  consentimiento?: ConsentimientoDoc | null
  paciente?: PacienteConsentimientoRef | null
  datosClinica?: DatosClinicaRef | null
  userProfile?: UserProfileRef | null
}

export const ConsentimientoImprimible: React.FC<ConsentimientoImprimibleProps> = memo(({
  consentimiento,
  paciente,
  datosClinica = {},
  userProfile = {}
}) => {
  if (!consentimiento) return null

  const profesional = consentimiento.profesional || userProfile?.nombreCompleto || 'Dr. Miguel Díaz Rodríguez'
  const especialidad = userProfile?.especialidad || 'Cirujano Dentista'
  const rutProfesional = userProfile?.rut || 'N/I'

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-10 print:border-none print:p-0 print:bg-white print:text-black min-h-[500px] flex flex-col justify-between">
      <div>
        {/* Membrete con logo y datos de clínica */}
        <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-start gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {datosClinica?.logoUrl && (
              <img
                src={datosClinica.logoUrl}
                alt="Logo Clínica"
                className="h-16 w-16 object-contain flex-shrink-0 print:h-12 print:w-12"
              />
            )}
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-gray-900 truncate">
                {datosClinica?.nombreClinica || 'Clínica Odontológica'}
              </h1>
              <p className="text-[10px] text-gray-600 truncate">
                RUT: <span className="tabular-nums">{datosClinica?.rutClinica || 'N/I'}</span>
              </p>
              <p className="text-[10px] text-gray-500 truncate">
                {datosClinica?.direccion || ''}
              </p>
              <p className="text-[10px] text-gray-500 truncate">
                {datosClinica?.ciudad || ''}
              </p>
              {datosClinica?.telefono && (
                <p className="text-[10px] text-gray-500">
                  Tel: <span className="tabular-nums">{datosClinica.telefono}</span>
                </p>
              )}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest">
              CONSENTIMIENTO INFORMADO
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Fecha: <span className="tabular-nums">{consentimiento.fecha}</span>
            </p>
          </div>
        </div>

        {/* Título del consentimiento */}
        <div className="mb-6">
          <h3 className="text-base font-bold text-gray-900 mb-2">
            {consentimiento.titulo}
          </h3>
        </div>

        {/* Datos del paciente */}
        <div className="mb-6 space-y-2 text-sm text-gray-800">
          <p>
            Yo, <strong>{paciente?.nombre || 'Paciente'}</strong>, RUT{' '}
            <strong className="tabular-nums">{paciente?.rut || 'N/I'}</strong>, declaro lo siguiente:
          </p>
        </div>

        {/* Texto del consentimiento */}
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 print:bg-transparent print:border-none mb-6">
          <p className="text-sm leading-relaxed text-gray-800 whitespace-pre-line">
            {consentimiento.contenido}
          </p>
        </div>

        {/* Declaración de comprensión */}
        <div className="space-y-4 text-sm text-gray-700 mb-8">
          <p>
            He leído y comprendido el contenido de este documento. He tenido la
            oportunidad de hacer preguntas y todas mis dudas han sido aclaradas
            de manera satisfactoria.
          </p>
          <p>
            Autorizo voluntariamente al profesional a realizar el procedimiento
            descrito, entendiendo los riesgos y beneficios asociados.
          </p>
        </div>

        {/* Firma digital del paciente */}
        {consentimiento.firma && (
          <div className="mb-6">
            <p className="text-xs font-bold text-gray-700 mb-2">
              Firma del Paciente:
            </p>
            <img
              src={consentimiento.firma}
              alt="Firma del Paciente"
              className="h-20 border border-gray-300 bg-white p-2 rounded print:border-gray-400"
            />
          </div>
        )}
      </div>

      {/* Firma del profesional al pie y Micro-Sello DentikOS */}
      <div className="pt-12">
        <div className="w-64 mx-auto border-t border-black pt-2 text-center">
          <p className="font-bold text-xs text-gray-900">{profesional}</p>
          <p className="text-[10px] text-gray-600">{especialidad}</p>
          <p className="text-[10px] text-gray-500">RUT: <span className="tabular-nums">{rutProfesional}</span></p>
        </div>
        <DentikOSMicroSeal className="mt-8" />
      </div>
    </div>
  )
})

ConsentimientoImprimible.displayName = 'ConsentimientoImprimible'
