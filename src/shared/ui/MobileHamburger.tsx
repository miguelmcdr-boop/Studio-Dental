import React from 'react'
import { Menu } from 'lucide-react'
import { useSidebarStore } from '../../app/stores/useSidebarStore'

export const MobileHamburger: React.FC = () => {
  const setMobileOpen = useSidebarStore((s) => s.setMobileOpen)

  return (
    <button
      type="button"
      data-testid="mobile-hamburger-btn"
      onClick={() => setMobileOpen(true)}
      aria-label="Abrir menú de navegación"
      className="md:hidden inline-flex items-center justify-center p-2 rounded-lg text-graphite-600 dark:text-graphite-300 hover:bg-graphite-100 dark:hover:bg-graphite-800 focus:outline-hidden focus:ring-2 focus:ring-primary-500 transition-colors"
    >
      <Menu className="w-5 h-5" aria-hidden="true" />
    </button>
  )
}
