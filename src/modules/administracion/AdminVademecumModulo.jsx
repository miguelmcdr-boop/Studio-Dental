/**
 * Módulo de administración de vademécum odontológico (F4-03f-4).
 *
 * Contenedor principal con 4 tabs:
 * - Vademécum regular (94 fármacos)
 * - Urgencia / carro reanimación (11 fármacos)
 * - Antirresortivos óseos / MRONJ (6 fármacos)
 * - Metadata de curación clínica
 *
 * Integra con:
 * - useVademecumAdmin (estado y acciones CRUD)
 * - useRBAC (control de acceso por rol)
 * - 3 modales de edición con validación Zod
 *
 * Acceso restringido a ADMIN y DENTISTA vía permiso ADMINISTRAR_VADEMECUM.
 */
import React, { useState } from 'react'
import { useRBAC } from '../../hooks/useRBAC'
import { PERMISOS } from '../../constants/rbacConstants'
import { useVademecumAdmin } from './hooks/useVademecumAdmin'
import { TablaVademecum } from './components/TablaVademecum'
import { TablaUrgencia } from './components/TablaUrgencia'
import { TablaAntirresortivos } from './components/TablaAntirresortivos'
import { MetadataCuracion } from './components/MetadataCuracion'
import { ModalEditarFarmaco } from './components/ModalEditarFarmaco'
import { ModalEditarUrgencia } from './components/ModalEditarUrgencia'
import { ModalEditarAntirresortivo } from './components/ModalEditarAntirresortivo'
import { AdminProtocolosContenido } from './components/AdminProtocolosContenido'

const TABS = [
  { id: 'vademecum', nombre: '🏥 Vademécum', descripcion: '94 fármacos regulares' },
  { id: 'urgencia', nombre: '🚨 Urgencia', descripcion: 'Carro de reanimación' },
  { id: 'antirresortivos', nombre: '🦴 Antirresortivos', descripcion: 'Riesgo MRONJ' },
  { id: 'alergias', nombre: '🧬 Alergias Cruzadas', descripcion: 'Matriz de reactividad' },
  { id: 'interacciones', nombre: '⚗️ Interacciones', descripcion: 'Farmacológicas' },
  { id: 'profilaxis', nombre: '💉 Profilaxis', descripcion: 'Endocarditis AHA' },
  { id: 'anticoagulantes', nombre: '🩸 Anticoagulantes', descripcion: 'Manejo perioperatorio' },
  { id: 'metadata', nombre: 'ℹ️ Metadata', descripcion: 'Info de curación' }
]

export const AdminVademecumModulo = () => {
  const { puede } = useRBAC()
  const admin = useVademecumAdmin()
  const [tabActivo, setTabActivo] = useState('vademecum')

  const [modalFarmaco, setModalFarmaco] = useState({ abierto: false, farmaco: null })
  const [modalUrgencia, setModalUrgencia] = useState({ abierto: false, farmaco: null })
  const [modalAntirresortivo, setModalAntirresortivo] = useState({ abierto: false, farmaco: null })
  const [guardando, setGuardando] = useState(false)

  // Validación de acceso
  if (!puede(PERMISOS.ADMINISTRAR_VADEMECUM)) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-red-900 mb-2">Acceso Denegado</h2>
          <p className="text-red-700">
            No tiene permisos para administrar el vademécum.
            Contacte al administrador del sistema si necesita acceso.
          </p>
        </div>
      </div>
    )
  }

  // Handlers vademécum regular
  const handleCrearFarmaco = () => setModalFarmaco({ abierto: true, farmaco: null })
  const handleEditarFarmaco = (farmaco) => setModalFarmaco({ abierto: true, farmaco })
  const handleGuardarFarmaco = async (datos) => {
    setGuardando(true)
    try {
      await admin.crearOFarmacoActualizar(datos)
      setModalFarmaco({ abierto: false, farmaco: null })
    } finally {
      setGuardando(false)
    }
  }
  const handleDesactivarFarmaco = async (farmaco) => { await admin.desactivar(farmaco.numero) }
  const handleReactivarFarmaco = async (farmaco) => { await admin.reactivar(farmaco.numero) }

  // Handlers urgencia
  const handleCrearUrgencia = () => setModalUrgencia({ abierto: true, farmaco: null })
  const handleEditarUrgencia = (farmaco) => setModalUrgencia({ abierto: true, farmaco })
  const handleGuardarUrgencia = async (datos) => {
    setGuardando(true)
    try {
      console.log('Guardar urgencia:', datos)
      setModalUrgencia({ abierto: false, farmaco: null })
    } finally {
      setGuardando(false)
    }
  }

  // Handlers antirresortivos
  const handleCrearAntirresortivo = () => setModalAntirresortivo({ abierto: true, farmaco: null })
  const handleEditarAntirresortivo = (farmaco) => setModalAntirresortivo({ abierto: true, farmaco })
  const handleGuardarAntirresortivo = async (datos) => {
    setGuardando(true)
    try {
      console.log('Guardar antirresortivo:', datos)
      setModalAntirresortivo({ abierto: false, farmaco: null })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header del módulo */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-gray-900">💊 Vademécum Odontológico</h1>
          <button
            onClick={admin.refrescar}
            disabled={admin.cargando}
            className="px-3 py-1.5 text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50"
          >
            🔄 Refrescar
          </button>
        </div>
        <p className="text-sm text-gray-600">
          Gestione los datos de referencia clínicos del vademécum odontológico curado (v1.1).
          Los cambios se sincronizan en tiempo real entre todos los dispositivos.
        </p>
      </div>

      {/* Tabs de navegación */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex border-b border-gray-200 bg-gray-50 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTabActivo(tab.id)}
              className={`px-6 py-3 text-sm font-semibold transition-all border-b-2 whitespace-nowrap ${
                tabActivo === tab.id
                  ? 'border-blue-600 text-blue-700 bg-white'
                  : 'border-transparent text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div>{tab.nombre}</div>
              <div className="text-xs text-gray-500 mt-0.5">{tab.descripcion}</div>
            </button>
          ))}
        </div>

        <div className="p-6">
          {admin.cargando && <div className="text-center py-8 text-gray-500">Cargando datos...</div>}
          {admin.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-4">
              Error: {admin.error}
            </div>
          )}

          {!admin.cargando && tabActivo === 'vademecum' && (
            <TablaVademecum
              vademecum={admin.vademecum}
              vademecumCompleto={admin.vademecumCompleto}
              familiasDisponibles={admin.familiasDisponibles}
              familiaSeleccionada={admin.familiaSeleccionada}
              setFamiliaSeleccionada={admin.setFamiliaSeleccionada}
              textoBusqueda={admin.textoBusqueda}
              setTextoBusqueda={admin.setTextoBusqueda}
              soloActivos={admin.soloActivos}
              setSoloActivos={admin.setSoloActivos}
              onCrearNuevo={handleCrearFarmaco}
              onEditar={handleEditarFarmaco}
              onDesactivar={handleDesactivarFarmaco}
              onReactivar={handleReactivarFarmaco}
            />
          )}

          {!admin.cargando && tabActivo === 'urgencia' && (
            <TablaUrgencia
              urgencia={admin.urgencia}
              onEditar={handleEditarUrgencia}
              onCrearNuevo={handleCrearUrgencia}
              onDesactivar={null}
            />
          )}

          {!admin.cargando && tabActivo === 'antirresortivos' && (
            <TablaAntirresortivos
              antirresortivos={admin.antirresortivos}
              onEditar={handleEditarAntirresortivo}
              onCrearNuevo={handleCrearAntirresortivo}
              onDesactivar={null}
            />
          )}

          {/* Tabs de protocolos clínicos (F4-03f-5d) */}
          {!admin.cargando && ['alergias', 'interacciones', 'profilaxis', 'anticoagulantes'].includes(tabActivo) && (
            <AdminProtocolosContenido
              admin={admin}
              tabActivo={tabActivo}
              guardando={guardando}
              setGuardando={setGuardando}
            />
          )}

          {!admin.cargando && tabActivo === 'metadata' && (
            <MetadataCuracion metadata={admin.metadata} />
          )}
        </div>
      </div>

      {/* Modales */}
      {modalFarmaco.abierto && (
        <ModalEditarFarmaco
          farmaco={modalFarmaco.farmaco}
          onGuardar={handleGuardarFarmaco}
          onClose={() => setModalFarmaco({ abierto: false, farmaco: null })}
          guardando={guardando}
        />
      )}
      {modalUrgencia.abierto && (
        <ModalEditarUrgencia
          farmaco={modalUrgencia.farmaco}
          onGuardar={handleGuardarUrgencia}
          onClose={() => setModalUrgencia({ abierto: false, farmaco: null })}
          guardando={guardando}
        />
      )}
      {modalAntirresortivo.abierto && (
        <ModalEditarAntirresortivo
          farmaco={modalAntirresortivo.farmaco}
          onGuardar={handleGuardarAntirresortivo}
          onClose={() => setModalAntirresortivo({ abierto: false, farmaco: null })}
          guardando={guardando}
        />
      )}
    </div>
  )
}
