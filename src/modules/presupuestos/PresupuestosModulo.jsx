import React, { memo, useState } from 'react'
import { ESTADOS_PRESUPUESTO } from './constants/presupuestosConstants'
import { usePresupuestos } from './hooks/usePresupuestos'
import { PresupuestosSummaryCards } from './components/PresupuestosSummaryCards'
import { TablaPresupuestosGlobales } from './components/TablaPresupuestosGlobales'
import { ModalNuevoPresupuesto } from './components/ModalNuevoPresupuesto'
import { DocumentoPresupuestoImprimible } from './components/DocumentoPresupuestoImprimible'
import { usePacientesStore } from '../../store/pacientesStore'
import { usePrestacionesStore } from '../../store/prestacionesStore'
import { useSesionStore } from '../../store/sesionStore'
import { useAppDialog } from '../../hooks/useAppDialog'
import { ClipboardList } from 'lucide-react'

export const PresupuestosModulo = memo(({ setPacienteSeleccionado, setActiveSection }) => {
  // (F2-02) — pacientes, prestacionesArancel y userProfile ya no llegan como prop
  // desde App.jsx: se leen directo de los stores. setPacienteSeleccionado y
  // setActiveSection son navegación local de App.jsx, fuera del alcance de F2-01,
  // así que se quedan como props.
  const pacientes = usePacientesStore((state) => state.pacientes)
  const prestaciones = usePrestacionesStore((state) => state.prestacionesArancel)
  const userProfile = useSesionStore((state) => state.userProfile)

  const [modalAbierto, setModalAbierto] = useState(false)
  const { alert: dialogAlert } = useAppDialog()
  const [presupuestoVerDocumento, setPresupuestoVerDocumento] = useState(null)

  const {
    presupuestos,
    resumen,
    busqueda,
    setBusqueda,
    estadoFiltro,
    setEstadoFiltro,
    agregarPresupuesto,
    cambiarEstadoPresupuesto,
    eliminarPresupuesto
  } = usePresupuestos(pacientes)

  const handleVerFichaPaciente = async (presupuesto) => {
    const pac = pacientes.find(p => String(p.id) === String(presupuesto.pacienteId))
    if (pac && setPacienteSeleccionado && setActiveSection) {
      setPacienteSeleccionado(pac)
      setActiveSection('Pacientes')
    } else {
      await dialogAlert({
        title: 'Ficha clínica no disponible',
        description: 'Abre la sección Pacientes para consultar la ficha clínica.',
        variant: 'info',
        confirmText: 'Entendido'
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-graphite-50 uppercase tracking-wider inline-flex items-center gap-2"><ClipboardList size={16} />Presupuestos Globales & Cotizaciones</h2>
          <p className="text-xs text-gray-500 dark:text-graphite-400">Panel central de seguimiento de tratamientos y planes de financiamiento.</p>
        </div>

        <button
          onClick={() => setModalAbierto(true)}
          className="bg-[#B88E3A] hover:bg-[#99732B] dark:bg-[#E5C378] dark:hover:bg-[#B88E3A] text-white dark:text-graphite-950 text-xs font-bold px-4 py-2.5 rounded-lg transition-micro shadow-xs cursor-pointer"
        >
          + Emitir Presupuesto
        </button>
      </div>

      <div className="print:hidden">
        <PresupuestosSummaryCards resumen={resumen} />
      </div>

      {presupuestoVerDocumento ? (
        <DocumentoPresupuestoImprimible
          presupuesto={presupuestoVerDocumento}
          userProfile={userProfile}
          alCerrar={() => setPresupuestoVerDocumento(null)}
        />
      ) : (
        <>
          <div className="bg-slate-50 dark:bg-[#0F172A] surgical:bg-[#F1F5F9] p-4 border border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] rounded-2xl flex justify-between items-center flex-wrap gap-3 text-xs print:hidden">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="font-semibold text-graphite-600 dark:text-graphite-400 surgical:text-black">Estado:</span>
              <select
                value={estadoFiltro}
                onChange={(e) => setEstadoFiltro(e.target.value)}
                className="p-2 border border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] rounded-lg bg-white dark:bg-[#1E293B] surgical:bg-[#E2E8F0] text-graphite-900 dark:text-graphite-100 surgical:text-black font-semibold flex-1 sm:flex-initial focus:ring-2 focus:ring-[#B88E3A]/40"
              >
                <option value="Todos">Todos los estados</option>
                {ESTADOS_PRESUPUESTO.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
            </div>

            <input
              type="text"
              placeholder="Buscar por folio, paciente o RUT..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="p-2 border border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] rounded-lg bg-white dark:bg-[#1E293B] surgical:bg-[#E2E8F0] text-graphite-900 dark:text-graphite-100 surgical:text-black w-full sm:w-64 focus:ring-2 focus:ring-[#B88E3A]/40"
            />
          </div>

          <TablaPresupuestosGlobales
            presupuestos={presupuestos}
            onCambiarEstado={cambiarEstadoPresupuesto}
            onVerFichaPaciente={handleVerFichaPaciente}
            onVerDocumento={setPresupuestoVerDocumento}
            onEliminar={eliminarPresupuesto}
          />
        </>
      )}

      {modalAbierto && (
        <ModalNuevoPresupuesto
          pacientes={pacientes}
          prestaciones={prestaciones}
          alGuardar={agregarPresupuesto}
          alCerrar={() => setModalAbierto(false)}
        />
      )}
    </div>
  )
})

PresupuestosModulo.displayName = 'PresupuestosModulo'