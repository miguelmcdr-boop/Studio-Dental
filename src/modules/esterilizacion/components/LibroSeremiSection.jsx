import React, { memo } from 'react'
import { BookOpen, Printer } from 'lucide-react'

export const LibroSeremiSection = memo(({ cargas, biologicos, userProfile }) => {
  const hoyStr = new Date().toLocaleDateString('es-CL')

  return (
    <div className="space-y-4 text-xs">
      <div className="flex justify-between items-center print:hidden bg-gray-50 dark:bg-graphite-800 p-4 border rounded-2xl">
        <div>
          <h3 className="font-bold text-sm text-gray-900 dark:text-graphite-50 flex items-center gap-2"><BookOpen size={16} />Libro Oficial Folia de Esterilización SEREMI</h3>
          <p className="text-gray-500 dark:text-graphite-400 text-[11px]">Vista de reporte diario oficial para inspección y auditoría de bioseguridad.</p>
        </div>

        <button
          onClick={() => window.print()}
          className="bg-black text-white px-4 py-2 rounded-xl font-bold hover:bg-gray-800 text-xs shadow-xs cursor-pointer transition-colors duration-150"
        >
          <span className="flex items-center gap-1"><Printer size={14} />Imprimir Reporte Diario SEREMI</span>
        </button>
      </div>

      <div className="bg-white dark:bg-graphite-800 border border-gray-300 dark:border-graphite-600 rounded-2xl p-8 print:border-none print:p-0 text-gray-900 dark:text-graphite-50 space-y-6">
        <div className="border-b-2 border-black pb-3 flex justify-between items-start">
          <div>
            <h1 className="text-base font-black uppercase tracking-wider">Libro Registro de Control de Esterilización</h1>
            <p className="text-[10px] text-gray-600 dark:text-graphite-400 font-bold">Norma Técnica de Esterilización N° 199 / SEREMI de Salud Chile</p>
            <p className="text-[10px] text-gray-500 dark:text-graphite-400 mt-1">Establecimiento: Studio Dental Clinical OS</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-black block">Fecha Reporte: {hoyStr}</span>
            <span className="text-[10px] text-gray-500 dark:text-graphite-400 block">Director Técnico: {userProfile?.nombreCompleto}</span>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-extrabold text-xs uppercase border-b pb-1">1. Registro de Cargas de Autoclave del Día</h4>
          
          <table className="w-full text-left border-collapse border border-gray-300 dark:border-graphite-600 text-[10px]">
            <thead>
              <tr className="bg-gray-100 dark:bg-graphite-800 border-b border-gray-300 dark:border-graphite-600 font-bold uppercase">
                <th className="p-2 border border-gray-300 dark:border-graphite-600">Lote</th>
                <th className="p-2 border border-gray-300 dark:border-graphite-600">Hora</th>
                <th className="p-2 border border-gray-300 dark:border-graphite-600">Equipo</th>
                <th className="p-2 border border-gray-300 dark:border-graphite-600">Temp / Tiempo</th>
                <th className="p-2 border border-gray-300 dark:border-graphite-600">Viraje Químico</th>
                <th className="p-2 border border-gray-300 dark:border-graphite-600">Estado</th>
                <th className="p-2 border border-gray-300 dark:border-graphite-600">Operador</th>
              </tr>
            </thead>
            <tbody>
              {cargas.map(c => (
                <tr key={c.id}>
                  <td className="p-2 border border-gray-300 dark:border-graphite-600 font-bold">{c.lote}</td>
                  <td className="p-2 border border-gray-300 dark:border-graphite-600">{c.hora}</td>
                  <td className="p-2 border border-gray-300 dark:border-graphite-600">{c.equipo}</td>
                  <td className="p-2 border border-gray-300 dark:border-graphite-600">{c.temperatura}°C / {c.tiempoMinutos}m</td>
                  <td className="p-2 border border-gray-300 dark:border-graphite-600">{c.indicadorQuimico}</td>
                  <td className="p-2 border border-gray-300 dark:border-graphite-600 font-bold">{c.estado}</td>
                  <td className="p-2 border border-gray-300 dark:border-graphite-600">{c.responsable}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-3">
          <h4 className="font-extrabold text-xs uppercase border-b pb-1">2. Control de Incubación Biológica y Test Diarios</h4>
          <table className="w-full text-left border-collapse border border-gray-300 dark:border-graphite-600 text-[10px]">
            <thead>
              <tr className="bg-gray-100 dark:bg-graphite-800 border-b border-gray-300 dark:border-graphite-600 font-bold uppercase">
                <th className="p-2 border border-gray-300 dark:border-graphite-600">Lote Carga</th>
                <th className="p-2 border border-gray-300 dark:border-graphite-600">Indicador Biológico</th>
                <th className="p-2 border border-gray-300 dark:border-graphite-600">Resultado Lectura</th>
                <th className="p-2 border border-gray-300 dark:border-graphite-600">Responsable</th>
              </tr>
            </thead>
            <tbody>
              {biologicos.map(b => (
                <tr key={b.id}>
                  <td className="p-2 border border-gray-300 dark:border-graphite-600 font-bold">{b.loteAsociado}</td>
                  <td className="p-2 border border-gray-300 dark:border-graphite-600">{b.marcaAmpolla} ({b.horasRequeridas}h)</td>
                  <td className="p-2 border border-gray-300 dark:border-graphite-600 font-bold">{b.resultado}</td>
                  <td className="p-2 border border-gray-300 dark:border-graphite-600">{b.responsableLectura}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pt-16 grid grid-cols-2 gap-8 text-center print:pt-24">
          <div className="border-t border-black pt-2">
            <p className="font-bold text-xs">{userProfile?.nombreCompleto}</p>
            <p className="text-[10px] text-gray-500 dark:text-graphite-400">Director Técnico / Cirujano Dentista</p>
          </div>

          <div className="border-t border-black pt-2">
            <p className="font-bold text-xs">Firma Encargado Esterilización</p>
            <p className="text-[10px] text-gray-500 dark:text-graphite-400">TENS / Supervisor Bioseguridad</p>
          </div>
        </div>
      </div>
    </div>
  )
})

LibroSeremiSection.displayName = 'LibroSeremiSection'