/**
 * Contenido de los 4 tabs de protocolos clínicos del módulo admin.
 * Maneja: alergias cruzadas, interacciones, profilaxis endocarditis, anticoagulantes.
 * Extraído de AdminVademecumModulo para respetar límite de 250 líneas.
 * F4-03f-5d
 */
import React, { useState } from 'react'
import { TablaAlergiasCruzadas } from './TablaAlergiasCruzadas'
import { TablaInteracciones } from './TablaInteracciones'
import { TablaProfilaxis } from './TablaProfilaxis'
import { TablaAnticoagulantes } from './TablaAnticoagulantes'
import { ModalEditarAlergiaCruzada, type CeldaAlergia } from './ModalEditarAlergiaCruzada'
import { ModalEditarInteraccion } from './ModalEditarInteraccion'
import { ModalEditarProtocolo } from './ModalEditarProtocolo'
import type { UseVademecumAdminReturn } from '../hooks/useVademecumAdmin'
import type { AlergiaCruzada } from '../schemas/alergiaCruzadaSchema'
import type { Interaccion } from '../schemas/interaccionSchema'
import type { Profilaxis } from '../schemas/profilaxisSchema'
import type { Anticoagulante } from '../schemas/anticoagulanteSchema'
import { createLogger } from '../../../../services/logger'

const log = createLogger('AdminProtocolosContenido')

export interface AdminProtocolosContenidoProps {
  admin: UseVademecumAdminReturn
  tabActivo: string
  guardando: boolean
  setGuardando: React.Dispatch<React.SetStateAction<boolean>>
}

interface ModalAlergiaState {
  abierto: boolean
  celda: CeldaAlergia | null
}

interface ModalInteraccionState {
  abierto: boolean
  interaccion: Interaccion | null
}

interface ModalProfilaxisState {
  abierto: boolean
  protocolo: Profilaxis | null
}

interface ModalAnticoagulanteState {
  abierto: boolean
  protocolo: Anticoagulante | null
}

export const AdminProtocolosContenido: React.FC<AdminProtocolosContenidoProps> = ({
  admin,
  tabActivo,
  guardando,
  setGuardando
}) => {
  const [modalAlergiaCruzada, setModalAlergiaCruzada] = useState<ModalAlergiaState>({
    abierto: false,
    celda: null
  })
  const [modalInteraccion, setModalInteraccion] = useState<ModalInteraccionState>({
    abierto: false,
    interaccion: null
  })
  const [modalProfilaxis, setModalProfilaxis] = useState<ModalProfilaxisState>({
    abierto: false,
    protocolo: null
  })
  const [modalAnticoagulante, setModalAnticoagulante] = useState<ModalAnticoagulanteState>({
    abierto: false,
    protocolo: null
  })

  // Handlers alergias cruzadas
  const handleEditarCeldaAlergia = (celda: CeldaAlergia): void =>
    setModalAlergiaCruzada({ abierto: true, celda })

  const handleGuardarAlergiaCruzada = async (datos: AlergiaCruzada): Promise<void> => {
    setGuardando(true)
    try {
      await admin.guardarAlergia(datos)
      setModalAlergiaCruzada({ abierto: false, celda: null })
    } finally {
      setGuardando(false)
    }
  }

  // Handlers interacciones
  const handleCrearInteraccion = (): void =>
    setModalInteraccion({ abierto: true, interaccion: null })

  const handleEditarInteraccion = (interaccion: Interaccion): void =>
    setModalInteraccion({ abierto: true, interaccion })

  const handleGuardarInteraccion = async (datos: Interaccion): Promise<void> => {
    setGuardando(true)
    try {
      await admin.guardarInteraccion(datos)
      setModalInteraccion({ abierto: false, interaccion: null })
    } finally {
      setGuardando(false)
    }
  }

  // Handlers profilaxis endocarditis
  const handleCrearProfilaxis = (): void =>
    setModalProfilaxis({ abierto: true, protocolo: null })

  const handleEditarProfilaxis = (protocolo: Profilaxis): void =>
    setModalProfilaxis({ abierto: true, protocolo })

  const handleGuardarProfilaxis = async (datos: unknown): Promise<void> => {
    setGuardando(true)
    try {
      log.info('Guardar profilaxis:', datos)
      setModalProfilaxis({ abierto: false, protocolo: null })
    } finally {
      setGuardando(false)
    }
  }

  // Handlers anticoagulantes
  const handleCrearAnticoagulante = (): void =>
    setModalAnticoagulante({ abierto: true, protocolo: null })

  const handleEditarAnticoagulante = (protocolo: Anticoagulante): void =>
    setModalAnticoagulante({ abierto: true, protocolo })

  const handleGuardarAnticoagulante = async (datos: unknown): Promise<void> => {
    setGuardando(true)
    try {
      log.info('Guardar anticoagulante:', datos)
      setModalAnticoagulante({ abierto: false, protocolo: null })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <>
      {/* Tab: Alergias cruzadas */}
      {tabActivo === 'alergias' && (
        <TablaAlergiasCruzadas
          alergiasCruzadas={admin.alergiasCruzadas}
          onEditarCelda={handleEditarCeldaAlergia}
          onCrearNueva={() =>
            handleEditarCeldaAlergia({ familia_alergia: '', familia_farmaco: '', regla: null })
          }
        />
      )}

      {/* Tab: Interacciones farmacológicas */}
      {tabActivo === 'interacciones' && (
        <TablaInteracciones
          interacciones={admin.interacciones}
          onEditar={handleEditarInteraccion}
          onCrearNueva={handleCrearInteraccion}
        />
      )}

      {/* Tab: Profilaxis endocarditis */}
      {tabActivo === 'profilaxis' && (
        <TablaProfilaxis
          protocolos={admin.profilaxisEndocarditis}
          onEditar={handleEditarProfilaxis}
          onCrearNueva={handleCrearProfilaxis}
        />
      )}

      {/* Tab: Anticoagulantes */}
      {tabActivo === 'anticoagulantes' && (
        <TablaAnticoagulantes
          anticoagulantes={admin.manejoAnticoagulantes}
          onEditar={handleEditarAnticoagulante}
          onCrearNueva={handleCrearAnticoagulante}
        />
      )}

      {/* Modales */}
      {modalAlergiaCruzada.abierto && (
        <ModalEditarAlergiaCruzada
          celda={modalAlergiaCruzada.celda}
          onGuardar={handleGuardarAlergiaCruzada}
          onClose={() => setModalAlergiaCruzada({ abierto: false, celda: null })}
          guardando={guardando}
        />
      )}

      {modalInteraccion.abierto && (
        <ModalEditarInteraccion
          interaccion={modalInteraccion.interaccion}
          onGuardar={handleGuardarInteraccion}
          onClose={() => setModalInteraccion({ abierto: false, interaccion: null })}
          guardando={guardando}
        />
      )}

      {modalProfilaxis.abierto && (
        <ModalEditarProtocolo
          tipo="profilaxis"
          protocolo={modalProfilaxis.protocolo}
          onGuardar={handleGuardarProfilaxis}
          onClose={() => setModalProfilaxis({ abierto: false, protocolo: null })}
          guardando={guardando}
        />
      )}

      {modalAnticoagulante.abierto && (
        <ModalEditarProtocolo
          tipo="anticoagulante"
          protocolo={modalAnticoagulante.protocolo}
          onGuardar={handleGuardarAnticoagulante}
          onClose={() => setModalAnticoagulante({ abierto: false, protocolo: null })}
          guardando={guardando}
        />
      )}
    </>
  )
}
