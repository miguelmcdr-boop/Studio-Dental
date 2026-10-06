import React, { useState } from 'react'
import { Building2, Plus, Trash2, MapPin } from 'lucide-react'
import { useBootstrapClinica } from '../hooks/useBootstrapClinica'
import { useAppDialog } from '../hooks/useAppDialog'
import { PantallaBienvenida } from './PantallaBienvenida'
import { OnboardingStepper } from './OnboardingStepper'
import { PasoTipoActividad } from './PasoTipoActividad'
import { PasoEquipo } from './PasoEquipo'
import { Button } from './ui/Button'
import { Input } from './ui/Input'

export interface BootstrapClinicaProps {
  onComplete?: () => void
}

export const BootstrapClinica: React.FC<BootstrapClinicaProps> = ({ onComplete }) => {
  const {
    paso,
    tipoActividad,
    datos,
    sedes,
    equipo,
    errores,
    procesando,
    errorGeneral,
    completado,
    setTipoActividad,
    actualizarCampo,
    agregarSede,
    eliminarSede,
    agregarMiembro,
    eliminarMiembro,
    avanzarPaso,
    retrocederPaso,
    cancelarConfiguracion,
    handleSubmit,
    finalizarBienvenida,
  } = useBootstrapClinica(onComplete)

  const { confirm } = useAppDialog()

  const [nuevaSedeNombre, setNuevaSedeNombre] = useState('')
  const [nuevaSedeDir, setNuevaSedeDir] = useState('')

  if (completado) {
    return (
      <PantallaBienvenida
        nombreClinica={datos.nombre || 'Tu Clínica'}
        tipoActividad={tipoActividad}
        totalSedes={sedes.length}
        equipoInvitado={equipo.length}
        alFinalizar={finalizarBienvenida}
      />
    )
  }

  const handleCancelar = async (): Promise<void> => {
    const ok = await confirm({
      title: '¿Cancelar configuración?',
      message: 'Se cerrará tu sesión y podrás retomarla más tarde. No se perderá tu cuenta.',
      description: 'Se cerrará tu sesión y podrás retomarla más tarde. No se perderá tu cuenta.',
      variant: 'warning',
    })
    if (ok) await cancelarConfiguracion()
  }

  const handleCrearSedeManual = () => {
    if (!nuevaSedeNombre.trim() || !nuevaSedeDir.trim()) return
    agregarSede({
      nombre: nuevaSedeNombre.trim(),
      direccion: nuevaSedeDir.trim(),
      comuna: datos.comuna || 'Comuna Central',
      region: datos.region || 'Región Metropolitana',
      activa: true,
    })
    setNuevaSedeNombre('')
    setNuevaSedeDir('')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#070B14] p-4 text-slate-800 dark:text-slate-100">
      <div className="max-w-2xl w-full bg-white dark:bg-[#0B132B] rounded-2xl shadow-xl border border-gray-200 dark:border-[#24334A] p-6 sm:p-8">
        <div className="relative text-center mb-6">
          <div className="sm:absolute sm:right-0 sm:top-0 mb-3 sm:mb-0">
            <button
              type="button"
              onClick={handleCancelar}
              className="text-sm text-graphite-500 hover:text-graphite-900 underline cursor-pointer"
              data-testid="bootstrap-cancelar"
            >
              Cancelar y cerrar sesión
            </button>
          </div>
          <Building2 className="mx-auto mb-2 text-[#D4AF37]" size={48} />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {tipoActividad === 'individual' ? 'Crear tu Consulta' : 'Crear tu Clínica'}
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400">Paso {paso} de 4 · Configuración de tu espacio odontológico</p>
        </div>

        {/* Barra de progreso */}
        <OnboardingStepper paso={paso} />

        {errorGeneral && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/40 rounded-xl text-xs text-red-700 dark:text-red-300">
            {errorGeneral}
          </div>
        )}

        {/* Paso 1: Tipo */}
        {paso === 1 && (
          <PasoTipoActividad tipoActividad={tipoActividad} setTipoActividad={setTipoActividad} />
        )}

        {/* Paso 2: Tu Espacio */}
        {paso === 2 && (
          <div className="space-y-3">
            <Input
              label="¿Cómo se llama tu clínica o consulta?"
              id="bootstrap-nombre"
              value={datos.nombre}
              onChange={(e) => actualizarCampo('nombre', e.target.value)}
              placeholder="Ej. Clínica Dental Sonrisas"
              error={errores.nombre || undefined}
            />
            <Input
              label="RUT de la empresa (opcional)"
              id="bootstrap-rut"
              value={datos.rutEmpresa || ''}
              onChange={(e) => actualizarCampo('rutEmpresa', e.target.value)}
              placeholder="76.123.456-7"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Dirección"
                id="bootstrap-direccion"
                value={datos.direccion || ''}
                onChange={(e) => actualizarCampo('direccion', e.target.value)}
                placeholder="Av. Providencia 1234"
                error={errores.direccion || undefined}
              />
              <Input
                label="Teléfono"
                id="bootstrap-telefono"
                value={datos.telefono || ''}
                onChange={(e) => actualizarCampo('telefono', e.target.value)}
                placeholder="+56 9 1234 5678"
              />
            </div>
          </div>
        )}

        {/* Paso 3: Sedes */}
        {paso === 3 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                <MapPin size={16} className="text-[#D4AF37]" /> Sedes registradas
              </h3>
              <span className="text-xs text-gray-400">Podrás agregar más en Administración</span>
            </div>
            <div className="space-y-2">
              {sedes.map((s, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-xs">
                  <div>
                    <span className="font-semibold text-gray-900 dark:text-white">{s.nombre}</span>
                    <span className="text-gray-500 ml-2">({s.direccion})</span>
                  </div>
                  {sedes.length > 1 && (
                    <button type="button" onClick={() => eliminarSede(idx)} className="text-red-400 hover:text-red-500 cursor-pointer">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="p-3 rounded-xl border border-dashed border-gray-300 dark:border-slate-700 space-y-2">
              <span className="text-xs font-medium text-gray-700 dark:text-slate-300">Agregar otra sede</span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Nombre sede (ej. Sede Oriente)"
                  value={nuevaSedeNombre}
                  onChange={(e) => setNuevaSedeNombre(e.target.value)}
                  className="p-2 text-xs rounded border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
                <input
                  type="text"
                  placeholder="Dirección sede"
                  value={nuevaSedeDir}
                  onChange={(e) => setNuevaSedeDir(e.target.value)}
                  className="p-2 text-xs rounded border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
              <Button type="button" size="sm" variant="outline" onClick={handleCrearSedeManual} className="text-xs cursor-pointer">
                <Plus size={14} className="mr-1" /> Agregar Sede
              </Button>
            </div>
          </div>
        )}

        {/* Paso 4: Equipo */}
        {paso === 4 && (
          <PasoEquipo
            equipo={equipo}
            agregarMiembro={agregarMiembro}
            eliminarMiembro={eliminarMiembro}
          />
        )}

        {/* Navegación botones */}
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200 dark:border-slate-800">
          {paso > 1 ? (
            <Button type="button" variant="outline" size="sm" onClick={retrocederPaso}>
              ← Anterior
            </Button>
          ) : <div />}

          {paso < 4 ? (
            <Button type="button" size="sm" onClick={avanzarPaso}>
              Continuar
            </Button>
          ) : (
            <Button type="button" size="sm" loading={procesando} onClick={() => handleSubmit()}>
              Crear Clínica
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
