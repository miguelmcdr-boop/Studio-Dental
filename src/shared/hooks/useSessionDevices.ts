/**
 * useSessionDevices — Hook para consulta de sesiones y dispositivos reales
 * Blueprint 02 §05: Obtiene sesión activa desde Supabase Auth + userAgent.
 */
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../infrastructure/supabase/supabaseClient'

export interface DeviceSession {
  id: string
  tipo: 'desktop' | 'tablet' | 'mobile'
  nombre: string
  navegador: string
  ubicacion?: string
  ultimaActividad: string
  esActual: boolean
}

export const parseDeviceType = (ua: string): 'desktop' | 'tablet' | 'mobile' => {
  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) return 'tablet'
  if (/mobile|iphone|ipod|android/i.test(ua)) return 'mobile'
  return 'desktop'
}

export const parseBrowser = (ua: string): string => {
  if (/edg/i.test(ua)) return 'Edge'
  if (/chrome|crios/i.test(ua)) return 'Chrome'
  if (/firefox|fxios/i.test(ua)) return 'Firefox'
  if (/safari/i.test(ua) && !/chrome/i.test(ua)) return 'Safari'
  if (/opera|opr/i.test(ua)) return 'Opera'
  return 'Navegador Web'
}

export const parseOS = (ua: string): string => {
  if (/macintosh|mac os x/i.test(ua)) return 'Mac'
  if (/windows/i.test(ua)) return 'Windows'
  if (/linux/i.test(ua)) return 'Linux'
  if (/iphone|ipad|ipod/i.test(ua)) return 'iOS'
  if (/android/i.test(ua)) return 'Android'
  return 'Dispositivo'
}

export interface UseSessionDevicesReturn {
  devices: DeviceSession[]
  loading: boolean
  refresh: () => Promise<void>
}

export const useSessionDevices = (): UseSessionDevicesReturn => {
  const [devices, setDevices] = useState<DeviceSession[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  const refresh = useCallback(async (): Promise<void> => {
    try {
      const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
      const tipo = parseDeviceType(ua)
      const navegador = parseBrowser(ua)
      const os = parseOS(ua)

      let sessionId = 'current-session'

      if (supabase) {
        try {
          const { data } = await supabase.auth.getSession()
          if (data?.session) {
            sessionId = data.session.user?.id || 'current-session'
          }
        } catch {
          // Fallback fail-safe
        }
      }

      const currentDevice: DeviceSession = {
        id: sessionId,
        tipo,
        nombre: `${os} (${navegador})`,
        navegador,
        ubicacion: 'Sesión local',
        ultimaActividad: 'Ahora mismo',
        esActual: true,
      }

      setDevices([currentDevice])
    } catch {
      setDevices([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { devices, loading, refresh }
}
