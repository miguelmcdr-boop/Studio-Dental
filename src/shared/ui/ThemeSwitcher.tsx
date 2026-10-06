/**
 * ThemeSwitcher — Slider físico táctil y visual para los 3 modos de DentikOS
 * Blueprint 02: ☀️ Claro | 🔬 Quirúrgico | 🌙 Oscuro
 */
import React, { useCallback } from 'react'
import { motion } from 'framer-motion'
import { Sun, Sparkles, Moon } from 'lucide-react'
import { useDarkMode, type Theme } from '../hooks/useDarkMode'

const playThemeSound = () => {
  if (typeof window === 'undefined') return
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext
    if (!AudioContextClass) return
    const ctx = new AudioContextClass()
    const now = ctx.currentTime

    // Pulso 1: 680Hz
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.frequency.setValueAtTime(680, now)
    gain1.gain.setValueAtTime(0.03, now)
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.04)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(now)
    osc1.stop(now + 0.04)

    // Pulso 2: 850Hz
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.frequency.setValueAtTime(850, now + 0.045)
    gain2.gain.setValueAtTime(0.03, now + 0.045)
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.09)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(now + 0.045)
    osc2.stop(now + 0.09)
  } catch {
    // Web Audio no permitido o silenciado
  }
}

export interface ThemeSwitcherProps {
  compact?: boolean
  className?: string
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ compact = false, className = '' }) => {
  const { theme: currentTheme, setTheme } = useDarkMode()

  const handleSelectTheme = useCallback((targetTheme: Theme) => {
    playThemeSound()
    setTheme(targetTheme)
  }, [setTheme])

  // Posición del círculo deslizante según tema
  const getThumbOffset = (t: Theme): string => {
    switch (t) {
      case 'light':
        return '0%'
      case 'surgical':
        return '50%'
      case 'dark':
        return '100%'
      default:
        return '0%'
    }
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => {
          const next: Theme = currentTheme === 'light' ? 'surgical' : currentTheme === 'surgical' ? 'dark' : 'light'
          handleSelectTheme(next)
        }}
        title={`Tema actual: ${currentTheme}`}
        aria-label={`Cambiar tema (actual: ${currentTheme})`}
        className={`w-9 h-9 rounded-xl flex items-center justify-center bg-graphite-100 dark:bg-graphite-800 text-graphite-700 dark:text-graphite-200 transition-colors ${className}`}
      >
        {currentTheme === 'light' && <Sun size={16} className="text-amber-500" />}
        {currentTheme === 'surgical' && <Sparkles size={16} className="text-primary" />}
        {currentTheme === 'dark' && <Moon size={16} className="text-blue-400" />}
      </button>
    )
  }

  return (
    <div
      className={`flex flex-col items-center select-none ${className}`}
      data-testid="theme-switcher-slider"
    >
      {/* Contenedor del slider físico de 160px */}
      <div className="w-[160px] bg-graphite-100 dark:bg-graphite-900/90 surgical:bg-graphite-200 p-1 rounded-full border border-surface relative flex items-center justify-between">
        {/* Fondo activo deslizante */}
        <div className="absolute inset-y-1 left-1 right-1 pointer-events-none">
          <div className="relative w-full h-full">
            <motion.div
              className="absolute top-0 w-[26px] h-[26px] rounded-full shadow-md"
              style={{
                background: 'linear-gradient(135deg, #E5C378 0%, #B88E3A 100%)',
                left: getThumbOffset(currentTheme),
                x: currentTheme === 'light' ? 0 : currentTheme === 'surgical' ? '-50%' : '-100%',
              }}
              transition={{
                duration: 0.25,
                ease: [0.16, 1, 0.3, 1],
              }}
            />
          </div>
        </div>

        {/* Botón 1: Modo Claro */}
        <button
          type="button"
          onClick={() => handleSelectTheme('light')}
          aria-label="Activar modo claro"
          className="relative z-10 w-[26px] h-[26px] flex items-center justify-center rounded-full text-xs transition-colors"
          title="Modo Claro"
        >
          <Sun
            size={14}
            className={currentTheme === 'light' ? 'text-black font-bold' : 'text-graphite-500 hover:text-graphite-900 dark:text-graphite-400'}
          />
        </button>

        {/* Botón 2: Modo Quirúrgico */}
        <button
          type="button"
          onClick={() => handleSelectTheme('surgical')}
          aria-label="Activar modo quirúrgico"
          className="relative z-10 w-[26px] h-[26px] flex items-center justify-center rounded-full text-xs transition-colors"
          title="Modo Quirúrgico"
        >
          <Sparkles
            size={14}
            className={currentTheme === 'surgical' ? 'text-black font-bold' : 'text-graphite-500 hover:text-graphite-900 dark:text-graphite-400'}
          />
        </button>

        {/* Botón 3: Modo Oscuro */}
        <button
          type="button"
          onClick={() => handleSelectTheme('dark')}
          aria-label="Activar modo oscuro"
          className="relative z-10 w-[26px] h-[26px] flex items-center justify-center rounded-full text-xs transition-colors"
          title="Modo Oscuro"
        >
          <Moon
            size={14}
            className={currentTheme === 'dark' ? 'text-black font-bold' : 'text-graphite-500 hover:text-graphite-900 dark:text-graphite-400'}
          />
        </button>
      </div>
    </div>
  )
}
