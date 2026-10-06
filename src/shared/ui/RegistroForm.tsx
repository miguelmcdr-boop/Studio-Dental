/**
 * RegistroForm — Campos adicionales del formulario de primer registro
 * Extraído de LoginScreen para cumplir límite constitucional de 250 líneas (JSX).
 */
import React from 'react'
import { ChevronLeft } from 'lucide-react'
import { NOMBRES_ROLES } from '../../constants/rbacConstants'

export interface RegistroFormProps {
  nombreCompleto: string
  rut: string
  especialidad: string
  rol: string
  onNombreCompleto: (v: string) => void
  onRut: (v: string) => void
  onEspecialidad: (v: string) => void
  onRol: (v: string) => void
  onVolver: () => void
}

export const RegistroForm: React.FC<RegistroFormProps> = ({
  nombreCompleto,
  rut,
  especialidad,
  rol,
  onNombreCompleto,
  onRut,
  onEspecialidad,
  onRol,
  onVolver,
}) => (
  <>
    <div className="mb-4">
      <button
        type="button"
        onClick={onVolver}
        aria-label="Volver al login"
        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
      >
        <ChevronLeft size={14} />
        <span>Volver al inicio de sesión</span>
      </button>
    </div>

    <div className="space-y-3 pt-2 border-t border-slate-800 animate-fade-in">
      <input
        type="text"
        required
        value={nombreCompleto}
        id="login-nombre"
        placeholder="Nombre Completo"
        onChange={(e) => onNombreCompleto(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-xs text-white"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          value={rut}
          id="login-rut"
          placeholder="RUT / Licencia"
          onChange={(e) => onRut(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-xs text-white"
        />
        <input
          type="text"
          value={especialidad}
          id="login-especialidad"
          placeholder="Especialidad"
          onChange={(e) => onEspecialidad(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-xs text-white"
        />
      </div>
      <select
        id="login-rol"
        data-testid="login-rol"
        value={rol}
        onChange={(e) => onRol(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-xs text-white"
      >
        {Object.entries(NOMBRES_ROLES).map(([val, label]) => (
          <option key={val} value={val}>{label}</option>
        ))}
      </select>
    </div>
  </>
)
