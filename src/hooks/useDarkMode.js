/**
 * useDarkMode — Hook para manejar temas en DentikOS (Modo Claro, Oscuro y Quirúrgico)
 *
 * Soporta:
 * - 'light': Modo diurno de alto rendimiento visual.
 * - 'dark': Modo obsidiana para descanso visual y presentaciones.
 * - 'surgical': Modo quirúrgico antirreflejo para quirófanos y pabellón (.theme-surgical).
 *
 * Mantiene total compatibilidad con la API existente (darkMode, toggleDarkMode).
 *
 * Uso:
 *   const { theme, setTheme, darkMode, isSurgical, toggleDarkMode, cycleTheme } = useDarkMode()
 */
import { useState, useEffect, useCallback } from 'react'

const THEME_KEY = 'dentikos_theme'
const LEGACY_DARK_KEY = 'darkMode'

const THEMES = ['light', 'dark', 'surgical']

/**
 * Lee el tema inicial guardado en localStorage o detecta preferencia previa.
 */
const obtenerTemaInicial = () => {
  if (typeof localStorage === 'undefined') return 'light'
  try {
    const savedTheme = localStorage.getItem(THEME_KEY)
    if (savedTheme && THEMES.includes(savedTheme)) {
      return savedTheme
    }
    const legacyDark = localStorage.getItem(LEGACY_DARK_KEY)
    if (legacyDark === 'true') {
      return 'dark'
    }
  } catch {
    // Si localStorage no está disponible, fallback a light
  }
  return 'light'
}

/**
 * Aplica las clases de tema al elemento <html> raíz y a <body>.
 * Limpia rigurosamente clases anteriores antes de añadir la correspondiente.
 */
const aplicarClasesDocumento = (tema) => {
  if (typeof document === 'undefined') return
  const targets = [document.documentElement, document.body].filter(Boolean)
  targets.forEach((el) => {
    // 1. Eliminar rigurosamente cualquier clase previa
    el.classList.remove('dark', 'theme-surgical')

    // 2. Inyectar exclusivamente la clase correspondiente
    if (tema === 'dark') {
      el.classList.add('dark')
    } else if (tema === 'surgical') {
      el.classList.add('theme-surgical')
    }
  })
}

// Sincronización inmediata al cargar el módulo (evita FOUC)
if (typeof document !== 'undefined') {
  aplicarClasesDocumento(obtenerTemaInicial())
}

export const useDarkMode = () => {
  const [theme, setThemeState] = useState(obtenerTemaInicial)

  const setTheme = useCallback((nuevoTema) => {
    if (!THEMES.includes(nuevoTema)) return
    setThemeState(nuevoTema)
    try {
      localStorage.setItem(THEME_KEY, nuevoTema)
      localStorage.setItem(LEGACY_DARK_KEY, String(nuevoTema === 'dark'))
      aplicarClasesDocumento(nuevoTema)
    } catch (e) {
      console.error('[useDarkMode] Error al persistir tema:', e)
    }
  }, [])

  // Alterna entre light y dark (retrocompatibilidad)
  const toggleDarkMode = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }, [theme, setTheme])

  // Cicla entre light -> dark -> surgical -> light
  const cycleTheme = useCallback(() => {
    const siguienteIndice = (THEMES.indexOf(theme) + 1) % THEMES.length
    setTheme(THEMES[siguienteIndice])
  }, [theme, setTheme])

  // Efecto de sincronización con DOM inicial y cambios
  useEffect(() => {
    aplicarClasesDocumento(theme)
  }, [theme])

  const darkMode = theme === 'dark'
  const isSurgical = theme === 'surgical'

  return {
    theme,
    setTheme,
    darkMode,
    isSurgical,
    toggleDarkMode,
    cycleTheme,
  }
}
