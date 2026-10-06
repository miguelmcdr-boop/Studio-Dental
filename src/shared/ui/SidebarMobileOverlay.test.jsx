import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SidebarMobileOverlay } from './SidebarMobileOverlay'
import { MobileHamburger } from './MobileHamburger'
import { useSidebarStore } from '../../app/stores/useSidebarStore'

vi.mock('../hooks/useRBAC', () => ({
  useRBAC: () => ({
    rol: 'ADMIN',
    esAdmin: true,
    puede: () => true,
    tieneAlguno: () => true,
    es: () => true,
    permisos: [],
  }),
}))

describe('Sidebar Responsive Mobile (Blueprint 02 §03)', () => {
  beforeEach(() => {
    useSidebarStore.setState({ mobileOpen: false, mode: 'expanded' })
  })

  it('MobileHamburger: al hacer click activa mobileOpen en el store', () => {
    render(<MobileHamburger />)
    const btn = screen.getByTestId('mobile-hamburger-btn')
    expect(btn).toBeInTheDocument()

    fireEvent.click(btn)
    expect(useSidebarStore.getState().mobileOpen).toBe(true)
  })

  it('SidebarMobileOverlay: se muestra cuando mobileOpen es true y se cierra al clickear backdrop', () => {
    useSidebarStore.setState({ mobileOpen: true })

    const setActiveSection = vi.fn()
    render(
      <SidebarMobileOverlay
        activeSection="Dashboard"
        setActiveSection={setActiveSection}
      />
    )

    expect(screen.getByTestId('sidebar-mobile-overlay')).toBeInTheDocument()
    expect(screen.getByTestId('sidebar-menu-dashboard')).toBeInTheDocument()

    // Click backdrop (aria-hidden div)
    const backdrop = document.querySelector('.bg-black\\/50')
    expect(backdrop).toBeInTheDocument()
    if (backdrop) fireEvent.click(backdrop)
    expect(useSidebarStore.getState().mobileOpen).toBe(false)
  })

  it('SidebarMobileOverlay: cierra el drawer al presionar tecla Escape', () => {
    useSidebarStore.setState({ mobileOpen: true })

    render(
      <SidebarMobileOverlay
        activeSection="Dashboard"
        setActiveSection={vi.fn()}
      />
    )

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(useSidebarStore.getState().mobileOpen).toBe(false)
  })

  it('SidebarMobileOverlay: al seleccionar un item cambia de seccion y cierra el drawer', () => {
    useSidebarStore.setState({ mobileOpen: true })
    const setActiveSection = vi.fn()

    render(
      <SidebarMobileOverlay
        activeSection="Dashboard"
        setActiveSection={setActiveSection}
      />
    )

    const agendaItem = screen.getByTestId('sidebar-menu-agenda')
    fireEvent.click(agendaItem)

    expect(setActiveSection).toHaveBeenCalledWith('Agenda')
    expect(useSidebarStore.getState().mobileOpen).toBe(false)
  })
})
