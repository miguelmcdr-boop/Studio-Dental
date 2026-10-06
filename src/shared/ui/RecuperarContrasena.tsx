import React, { useState } from 'react'
import { solicitarRecuperacionContrasena, actualizarContrasena } from '../../infrastructure/auth/authService'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { KeyRound, CheckCircle2, AlertCircle, ArrowLeft, X } from 'lucide-react'

export interface RecuperarContrasenaProps {
  emailInicial?: string
  alCerrar: () => void
  modoNuevaContrasena?: boolean
}

export const RecuperarContrasena: React.FC<RecuperarContrasenaProps> = ({
  emailInicial = '',
  alCerrar,
  modoNuevaContrasena = false,
}) => {
  const [email, setEmail] = useState<string>(emailInicial)
  const [nuevaContrasena, setNuevaContrasena] = useState<string>('')
  const [confirmarContrasena, setConfirmarContrasena] = useState<string>('')
  const [cargando, setCargando] = useState<boolean>(false)
  const [enviado, setEnviado] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [exito, setExito] = useState<string>('')

  const handleSolicitarReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email.trim()) {
      setError('Ingresa tu correo electrónico.')
      return
    }

    setCargando(true)
    try {
      const res = await solicitarRecuperacionContrasena(email.trim())
      if (!res.success) {
        setError(res.error || 'No se pudo enviar el correo de recuperación.')
        return
      }
      setEnviado(true)
    } catch {
      setError('Ocurrió un error inesperado. Intenta nuevamente.')
    } finally {
      setCargando(false)
    }
  }

  const handleActualizarClave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (nuevaContrasena.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (nuevaContrasena !== confirmarContrasena) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setCargando(true)
    try {
      const res = await actualizarContrasena(nuevaContrasena)
      if (!res.success) {
        setError(res.error || 'No se pudo actualizar la contraseña.')
        return
      }
      setExito('¡Contraseña actualizada con éxito!')
      setTimeout(() => alCerrar(), 2000)
    } catch {
      setError('Ocurrió un error inesperado al actualizar.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="recuperar-titulo">
      <div className="relative w-full max-w-md bg-[#0B132B] border border-[#24334A] rounded-2xl shadow-2xl p-6 sm:p-8 text-white">
        <button
          type="button"
          onClick={alCerrar}
          aria-label="Cerrar modal"
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-1"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37]">
            <KeyRound size={22} />
          </div>
          <div>
            <h2 id="recuperar-titulo" className="text-xl font-bold text-white">
              {modoNuevaContrasena ? 'Establecer nueva contraseña' : 'Recuperar contraseña'}
            </h2>
            <p className="text-xs text-slate-400">
              {modoNuevaContrasena
                ? 'Ingresa tu nueva clave de al menos 8 caracteres'
                : 'Te enviaremos un enlace válido por 15 minutos'}
            </p>
          </div>
        </div>

        {error && (
          <div role="alert" className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-red-950/50 border border-red-500/40 text-red-200 text-xs">
            <AlertCircle size={16} className="shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {exito && (
          <div role="status" className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-200 text-xs">
            <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
            <span>{exito}</span>
          </div>
        )}

        {modoNuevaContrasena ? (
          <form onSubmit={handleActualizarClave} className="space-y-4">
            <Input
              label="Nueva Contraseña"
              id="nueva-password"
              type="password"
              required
              value={nuevaContrasena}
              onChange={(e) => setNuevaContrasena(e.target.value)}
              placeholder="Mínimo 8 caracteres"
            />
            <Input
              label="Confirmar Contraseña"
              id="confirmar-password"
              type="password"
              required
              value={confirmarContrasena}
              onChange={(e) => setConfirmarContrasena(e.target.value)}
              placeholder="Repite la contraseña"
            />
            <Button type="submit" loading={cargando} fullWidth className="mt-2">
              Guardar nueva contraseña
            </Button>
          </form>
        ) : enviado ? (
          <div className="space-y-4 text-center py-2">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 size={28} />
            </div>
            <p className="text-sm text-slate-300">
              Hemos enviado un enlace de recuperación a <span className="font-semibold text-white">{email}</span>.
            </p>
            <p className="text-xs text-slate-400">
              Revisa tu bandeja de entrada o spam. El enlace expira en 15 minutos.
            </p>
            <Button variant="ghost" fullWidth onClick={alCerrar} className="mt-2 text-xs">
              <ArrowLeft size={14} className="mr-1 inline" /> Volver al inicio de sesión
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSolicitarReset} className="space-y-4">
            <Input
              label="Correo electrónico registrado"
              id="recuperar-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu.correo@clinica.cl"
            />
            <Button type="submit" loading={cargando} fullWidth className="mt-2">
              Enviar enlace de recuperación
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              fullWidth
              onClick={alCerrar}
              className="text-xs text-slate-400 hover:text-white"
            >
              <ArrowLeft size={14} className="mr-1 inline" /> Volver
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
