import React, { memo, useState } from 'react'
import { Printer, MessageCircle } from 'lucide-react'
import { INDICACIONES_POST_OPERATORIAS } from '../../../data/plantillas'

export const PostOperatorioSection = memo(({ paciente, userProfile }) => {
  const [tipoPostOp, setTipoPostOp] = useState('Exodoncia y Cirugía Oral')
  const [textoPostOp, setTextoPostOp] = useState(INDICACIONES_POST_OPERATORIAS[0].texto)

  const handleCambiarTipo = (tipo) => {
    setTipoPostOp(tipo)
    const encontrado = INDICACIONES_POST_OPERATORIAS.find(i => i.tipo === tipo)
    if (encontrado) setTextoPostOp(encontrado.texto)
  }

  const enviarWhatsApp = () => {
    let numeroTel = paciente?.telefono || ''
    numeroTel = numeroTel.replace(/\s+/g, '').replace('+', '').replace(/-/g, '')
    const textoMensaje = `Hola ${paciente.nombre}, te enviamos tus Indicaciones Postoperatorias (${tipoPostOp}) del ${userProfile?.nombreCompleto || 'Dr. Miguel Díaz'}:\n\n${textoPostOp}\n\nAnte cualquier duda o sangrado excesivo, comunícate con nosotros.`
    const urlWhatsApp = `https://api.whatsapp.com/send?phone=${numeroTel}&text=${encodeURIComponent(textoMensaje)}`
    window.open(urlWhatsApp, '_blank')
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-graphite-800 border border-gray-200 dark:border-graphite-700 rounded-2xl p-6 print:hidden space-y-4 text-xs">
        <h3 className="font-bold text-sm text-gray-900 dark:text-graphite-50 uppercase tracking-wider">Generar Indicaciones Postoperatorias Impresas / WhatsApp</h3>
        
        <div className="flex gap-2 overflow-x-auto">
          {INDICACIONES_POST_OPERATORIAS.map(i => (
            <button
              key={i.tipo}
              onClick={() => handleCambiarTipo(i.tipo)}
              className={`px-3 py-2 rounded-xl font-bold border transition-all ${
                tipoPostOp === i.tipo ? 'bg-black text-white border-black' : 'bg-gray-50 dark:bg-graphite-800 text-gray-700 dark:text-graphite-300 hover:bg-gray-100 dark:hover:bg-graphite-700'
              }`}
            >
              {i.tipo}
            </button>
          ))}
        </div>

        <textarea
          rows="8"
          value={textoPostOp}
          onChange={(e) => setTextoPostOp(e.target.value)}
          className="w-full p-3 rounded-xl border border-gray-300 dark:border-graphite-600 font-mono text-xs leading-relaxed"
        />

        <div className="flex gap-3">
          <button onClick={() => window.print()} className="bg-black text-white font-bold px-4 py-2.5 rounded-xl hover:bg-gray-800">
            <span className="inline-flex items-center gap-1"><Printer size={14} />Imprimir Hoja de Cuidados (PDF)</span>
          </button>
          <button onClick={enviarWhatsApp} className="bg-emerald-600 text-white font-bold px-4 py-2.5 rounded-xl hover:bg-emerald-700">
            <span className="inline-flex items-center gap-1"><MessageCircle size={14} />Enviar por WhatsApp</span>
          </button>
        </div>
      </div>

      <div className="hidden print:block bg-white dark:bg-graphite-800 border border-gray-200 dark:border-graphite-700 rounded-2xl p-10 print:border-none print:p-0">
        <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-graphite-50">{userProfile?.nombreCompleto || 'Dr. Miguel Díaz Rodríguez'}</h1>
            <p className="text-xs text-gray-600 dark:text-graphite-400">{userProfile?.especialidad || 'Cirujano Dentista'} | RUT: {userProfile?.rut || 'N/I'}</p>
            <p className="text-xs text-gray-500 dark:text-graphite-400">Consulta Odontológica</p>
          </div>
          <div className="text-right">
            <h2 className="text-base font-bold text-gray-800 dark:text-graphite-100 uppercase">Cuidados Postoperatorios</h2>
            <p className="text-xs text-gray-500 dark:text-graphite-400">Fecha: {new Date().toLocaleDateString('es-CL')}</p>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 dark:border-graphite-700 mb-6 text-xs print:bg-white dark:bg-graphite-800 print:border">
          <p><span className="font-bold">Paciente:</span> {paciente.nombre} | RUT: {paciente.rut}</p>
          <p><span className="font-bold">Procedimiento:</span> {tipoPostOp}</p>
        </div>

        <div className="text-xs text-gray-800 dark:text-graphite-100 whitespace-pre-line leading-relaxed p-4 border rounded-xl">
          {textoPostOp}
        </div>

        <div className="mt-20 pt-10 border-t border-gray-300 dark:border-graphite-600 text-center">
          <div className="w-64 mx-auto border-t border-black pt-2">
            <p className="font-bold text-xs">{userProfile?.nombreCompleto}</p>
            <p className="text-[10px] text-gray-600 dark:text-graphite-400">Firma y Timbre del Cirujano Dentista</p>
          </div>
        </div>
      </div>
    </div>
  )
})

PostOperatorioSection.displayName = 'PostOperatorioSection'