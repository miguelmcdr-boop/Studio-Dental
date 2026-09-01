import React from 'react'
import { useBootstrapClinica } from '../hooks/useBootstrapClinica'
import { supabaseSignOut } from '../services/authService'

/**
 * F7-11b: Wizard de creación de clínica nueva.
 * Componente puramente presentacional — toda la lógica está en useBootstrapClinica.
 *
 * Flujo:
 * - Paso 1: Nombre de la clínica
 * - Paso 2: Datos adicionales (RUT, dirección, teléfono)
 * - Paso 3: Confirmación y crear
 */
export const BootstrapClinica = ({ onComplete }) => {
  const {
    paso,
    datos,
    errores,
    procesando,
    errorGeneral,
    actualizarCampo,
    avanzarPaso,
    retrocederPaso,
    handleSubmit
  } = useBootstrapClinica(onComplete)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🏥</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Crear tu Clínica</h1>
          <p className="text-gray-600">
            Configura tu nueva clínica dental. Este proceso toma menos de 1 minuto.
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {[1, 2, 3].map((p) => (
              <div key={p} className={`flex items-center ${p <= paso ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  p <= paso ? 'bg-blue-600 text-white' : 'bg-gray-200'
                }`}>
                  {p < paso ? '✓' : p}
                </div>
                <span className="ml-2 text-sm font-medium">
                  {p === 1 ? 'Nombre' : p === 2 ? 'Datos' : 'Confirmar'}
                </span>
              </div>
            ))}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(paso / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Mensaje de error general */}
        {errorGeneral && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{errorGeneral}</p>
          </div>
        )}

        {/* Botón de cancelar/logout */}
        <div className="mb-6 text-center">
          <button
            type="button"
            onClick={async () => {
              if (confirm('¿Seguro que quieres salir? Puedes iniciar sesión más tarde.')) {
                await supabaseSignOut()
                window.location.href = '/'
              }
            }}
            className="text-sm text-gray-600 hover:text-gray-900 underline"
          >
            ← No quiero crear una clínica ahora
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Paso 1: Nombre */}
          {paso === 1 && (
            <div>
              <label htmlFor="nombre" className="block text-lg font-medium text-gray-700 mb-2">
                ¿Cómo se llama tu clínica?
              </label>
              <input
                type="text"
                id="nombre"
                value={datos.nombre}
                onChange={(e) => actualizarCampo('nombre', e.target.value)}
                placeholder="Ej: Clínica Dental Sonríe"
                required
                maxLength={100}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                disabled={procesando}
              />
              {errores.nombre && (
                <p className="mt-2 text-sm text-red-600">{errores.nombre}</p>
              )}
              <p className="mt-2 text-sm text-gray-500">
                Este nombre será visible para todos los miembros de tu clínica.
              </p>
            </div>
          )}

          {/* Paso 2: Datos adicionales */}
          {paso === 2 && (
            <div className="space-y-4">
              <div>
                <label htmlFor="rutEmpresa" className="block text-sm font-medium text-gray-700 mb-1">
                  RUT de la empresa (opcional)
                </label>
                <input
                  type="text"
                  id="rutEmpresa"
                  value={datos.rutEmpresa}
                  onChange={(e) => actualizarCampo('rutEmpresa', e.target.value)}
                  placeholder="76.123.456-7"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={procesando}
                />
                {errores.rutEmpresa && (
                  <p className="mt-2 text-sm text-red-600">{errores.rutEmpresa}</p>
                )}
              </div>

              <div>
                <label htmlFor="direccion" className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección (opcional)
                </label>
                <input
                  type="text"
                  id="direccion"
                  value={datos.direccion}
                  onChange={(e) => actualizarCampo('direccion', e.target.value)}
                  placeholder="Av. Siempre Viva 123, Santiago"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={procesando}
                />
              </div>

              <div>
                <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono (opcional)
                </label>
                <input
                  type="tel"
                  id="telefono"
                  value={datos.telefono}
                  onChange={(e) => actualizarCampo('telefono', e.target.value)}
                  placeholder="+56912345678"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={procesando}
                />
              </div>
            </div>
          )}

          {/* Paso 3: Confirmación */}
          {paso === 3 && (
            <div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen de tu clínica</h3>
                <dl className="space-y-2">
                  <div className="flex">
                    <dt className="font-medium text-gray-700 w-40">Nombre:</dt>
                    <dd className="text-gray-900">{datos.nombre}</dd>
                  </div>
                  {datos.rutEmpresa && (
                    <div className="flex">
                      <dt className="font-medium text-gray-700 w-40">RUT:</dt>
                      <dd className="text-gray-900">{datos.rutEmpresa}</dd>
                    </div>
                  )}
                  {datos.direccion && (
                    <div className="flex">
                      <dt className="font-medium text-gray-700 w-40">Dirección:</dt>
                      <dd className="text-gray-900">{datos.direccion}</dd>
                    </div>
                  )}
                  {datos.telefono && (
                    <div className="flex">
                      <dt className="font-medium text-gray-700 w-40">Teléfono:</dt>
                      <dd className="text-gray-900">{datos.telefono}</dd>
                    </div>
                  )}
                </dl>
              </div>
              <p className="text-sm text-gray-600">
                Serás el administrador de esta clínica y podrás invitar a tu personal después.
              </p>
            </div>
          )}

          {/* Botones de navegación */}
          <div className="flex justify-between pt-4">
            {paso > 1 && (
              <button
                type="button"
                onClick={retrocederPaso}
                disabled={procesando}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
              >
                ← Atrás
              </button>
            )}

            {paso < 3 ? (
              <button
                type="button"
                onClick={avanzarPaso}
                disabled={procesando || (paso === 1 && !datos.nombre)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors ml-auto"
              >
                Continuar →
              </button>
            ) : (
              <button
                type="submit"
                disabled={procesando}
                className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors ml-auto font-semibold"
              >
                {procesando ? 'Creando clínica...' : '✓ Crear Clínica'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
