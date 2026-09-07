/**
 * useDarkMode — Hook para manejar dark mode con persistencia (F7-25)
 *
 * Maneja:
 * - Estado darkMode con persistencia en localStorage
 * - Toggle de dark mode
 * - Aplicar clase 'dark' al elemento html
 *
 * Uso:
 *   const { darkMode, toggleDarkMode } = useDarkMode()
 */
import { useState, useEffect } from 'react'

export const useDarkMode = () => {
  const [darkMode, setDarkMode] = useState(() => {
    try {
      return localStorage.getItem('darkMode') === 'true'
    } catch {
      return false
    }
  })

  const toggleDarkMode = () => {
    const newMode = !darkMode
    setDarkMode(newMode)
    try {
      localStorage.setItem('darkMode', String(newMode))
      if (newMode) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    } catch (error) {
      console.error('Error persistiendo darkMode:', error)
    }
  }

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  return { darkMode, toggleDarkMode }
}
