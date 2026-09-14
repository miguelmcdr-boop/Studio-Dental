import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../../services/supabaseClient'
import { certificadosStorageService } from '../services/certificadosStorageService'
import { eliminaArchivo } from '../../../services/r2ArchivosService'
import { createLogger } from '../../../services/logger'

const log = createLogger('usePapeleraCertificados')

/**
 * Hook papelera de certificados (M3).
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

  const eliminarDef = async (certId) => {
    const cert = certificados.find(c => String(c.id) === String(certId))
    const actualizados = certificados.filter(c => String(c.id) !== String(certId))
    setCertificados(actualizados)
    persistir(actualizados)
    if (cert?.r2ArchivoId) {
      eliminaArchivo(cert.r2ArchivoId).catch(err => log.warn('Error borrando R2:', err))
    }
    log.info(`[AUDITORÍA] Eliminación definitiva: id=${certId}, paciente=${pacienteId}`)
    return true
  }

  const vaciarPapeleraLocal = async () => {
    const eliminados = certificados.filter(c => c.eliminadoAt)
    if (eliminados.length === 0) return 0
    const actualizados = certificados.filter(c => !c.eliminadoAt)
    setCertificados(actualizados)
    persistir(actualizados)
    const conR2 = eliminados.filter(c => c.r2ArchivoId)
    if (conR2.length > 0) {
      Promise.all(conR2.map(c => eliminaArchivo(c.r2ArchivoId)))
        .then(res => log.info(`[AUDITORÍA] Vaciado papelera: R2 eliminados=${res.filter(Boolean).length}`))
        .catch(err => log.warn('Error vaciando R2:', err))
    }
    log.info(`[AUDITORÍA] Vaciado papelera: paciente=${pacienteId}, eliminados=${eliminados.length}`)
    return eliminados.length
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
