import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../../services/supabaseClient'
import { certificadosStorageService } from '../services/certificadosStorageService'
import * as papeleraCertificadosService from '../services/papeleraCertificadosService'
import { createLogger } from '../../../services/logger'

const log = createLogger('usePapeleraCertificados')

/**
 * Hook papelera de certificados (M3).
 *
 * F7-37 v4 H-12: La eliminación definitiva delega al service que usa
 * archivos-purge Edge Function (arquitectura segura + RPC atómica).
 *
 * Estado local como fuente única de verdad.
 * Storage se actualiza de forma async (fire-and-forget).
 */
export const usePapeleraCertificados = (pacienteId, certificados, setCertificados) => {
  const [papeleraAbierta, setPapeleraAbierta] = useState(false)
  const [userId, setUserId] = useState(null)

  useEffect(() => {
    let activo = true
    supabase.auth.getUser().then(({ data }) => {
      if (activo && data?.user?.id) setUserId(data.user.id)
    }).catch(e => log.warn('No se pudo obtener user.id:', e.message))
    return () => { activo = false }
  }, [])

  const certificadosActivos = useMemo(() => {
    if (!Array.isArray(certificados)) return []
    return certificados.filter(c => !c.eliminadoAt)
  }, [certificados])

  const hayEliminados = useMemo(() => {
    if (!Array.isArray(certificados)) return false
    return certificados.some(c => c.eliminadoAt)
  }, [certificados])

  const persistir = (lista) => {
    certificadosStorageService.guardarCertificados(pacienteId, lista)
      .catch(err => log.warn('Error persistiendo:', err))
  }

  const moverAPapelera = async (certId, motivo = 'Movido a papelera') => {
    if (!Array.isArray(certificados) || !pacienteId) return false

    const actualizados = certificados.map(c =>
      String(c.id) === String(certId)
        ? { ...c, eliminadoAt: new Date().toISOString(), eliminadoPor: userId, eliminadoMotivo: motivo }
        : c
    )
    setCertificados(actualizados)
    persistir(actualizados)
    return true
  }

  const restaurar = async (certId) => {
    const actualizados = certificados.map(c =>
      String(c.id) === String(certId)
        ? { ...c, eliminadoAt: null, eliminadoPor: null, eliminadoMotivo: null }
        : c
    )
    setCertificados(actualizados)
    persistir(actualizados)
    log.info(`[AUDITORÍA] Restauración: id=${certId}, paciente=${pacienteId}`)
    return true
  }

  /**
   * Elimina definitivamente un certificado usando la arquitectura segura
   * vía archivos-purge Edge Function (F7-37 v4 H-12).
   *
   * Solo actualiza el estado local si el service reporta éxito.
   * Si el service falla, NO se actualiza el estado local (consistencia).
   */
  const eliminarDef = async (certId) => {
    if (!Array.isArray(certificados)) return false

    // Delegar al service (que usa archivos-purge con validaciones completas)
    const ok = await papeleraCertificadosService.eliminarDefinitivo(pacienteId, certId)

    if (!ok) {
      log.error(`eliminarDef: service falló para cert ${certId}, NO actualizar estado local`)
      return false
    }

    // Solo actualizar estado local si éxito
    const actualizados = certificados.filter(c => String(c.id) !== String(certId))
    setCertificados(actualizados)
    persistir(actualizados)
    log.info(`[AUDITORÍA] Eliminación definitiva vía archivos-purge: id=${certId}, paciente=${pacienteId}`)
    return true
  }

  /**
   * Vacía la papelera eliminando definitivamente todos los certificados.
   * Usa el service para cada uno (arquitectura segura vía archivos-purge).
   */
  const vaciarPapeleraLocal = async () => {
    const eliminados = certificados.filter(c => c.eliminadoAt)
    if (eliminados.length === 0) return 0

    // Procesar cada certificado a través del service
    const resultados = await Promise.all(
      eliminados.map(c => papeleraCertificadosService.eliminarDefinitivo(pacienteId, c.id))
    )

    // Solo remover del estado local los que fueron eliminados exitosamente
    const eliminadosExitosos = eliminados.filter((_, i) => resultados[i])
    const actualizados = certificados.filter(c => !eliminadosExitosos.some(e => String(e.id) === String(c.id)))

    if (eliminadosExitosos.length > 0) {
      setCertificados(actualizados)
      persistir(actualizados)
    }

    log.info(`[AUDITORÍA] Vaciado papelera: paciente=${pacienteId}, exitosos=${eliminadosExitosos.length}/${eliminados.length}`)
    return eliminadosExitosos.length
  }

  return {
    papeleraAbierta,
    abrirPapelera: () => setPapeleraAbierta(true),
    cerrarPapelera: () => setPapeleraAbierta(false),
    certificadosActivos,
    hayEliminados,
    moverAPapelera,
    restaurar,
    eliminarDefinitivo: eliminarDef,
    vaciarPapelera: vaciarPapeleraLocal
  }
}
