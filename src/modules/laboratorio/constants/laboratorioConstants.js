/**
 * Constantes y Parámetros Sugeridos para el Módulo de Laboratorio
 */

export const ETAPAS_LABORATORIO = [
  { id: 'Enviado', nombre: '📤 Enviado al Lab', colorBg: 'bg-blue-50', colorText: 'text-blue-800', colorBorder: 'border-blue-300' },
  { id: 'PruebaMetal', nombre: '⚙️ Prueba de Metal / Estructura', colorBg: 'bg-purple-50', colorText: 'text-purple-800', colorBorder: 'border-purple-300' },
  { id: 'PruebaBizcocho', nombre: '🦷 Prueba de Bizcocho / Color', colorBg: 'bg-amber-50', colorText: 'text-amber-800', colorBorder: 'border-amber-300' },
  { id: 'RecibidoListo', nombre: '📦 Recibido / Listo en Clínica', colorBg: 'bg-emerald-50', colorText: 'text-emerald-800', colorBorder: 'border-emerald-300' },
  { id: 'Instalado', nombre: '✅ Instalado al Paciente', colorBg: 'bg-gray-100', colorText: 'text-gray-800', colorBorder: 'border-gray-300' },
  { id: 'Repeticion', nombre: '🔄 Repetición / Ajuste Garantía', colorBg: 'bg-red-50', colorText: 'text-red-800', colorBorder: 'border-red-300' }
]

// Sugerencias para autocompletado (el usuario puede escribir cualquier otra cosa)
export const TIPOS_TRABAJO_SUGERIDOS = [
  'Corona de Zirconio Monolítico',
  'Corona de Porcelana sobre Metal (PFM)',
  'Carilla Estética de Disilicato de Litio (E-Max)',
  'Carilla Feldspática Artesanal',
  'Incrustación Estética (Overlay / Inlay)',
  'Prótesis Total Removible (Acrílico)',
  'Prótesis Parcial Removible (Metálica / Deflex / Valplast)',
  'Plano de Relajación Miorrelajante Impreso 3D',
  'Aparato de Ortodoncia / Mantenedor de Espacio',
  'Estructura / Implante (Silla Multi-Unit)',
  'Prótesis Híbrida sobre Implantes',
  'Reparación de Prótesis / Agregado de Diente'
]

export const LABORATORIOS_BASE = [
  {
    id: 1,
    nombre: 'Laboratorio Oral Art & Cerámica',
    contacto: 'Sr. Roberto Gómez',
    telefono: '+56 9 8877 6655',
    email: 'contacto@oralart.cl',
    direccion: 'Av. Providencia 1234, Of. 502',
    tarifas: [
      { trabajo: 'Corona de Zirconio Monolítico', precio: 45000 },
      { trabajo: 'Carilla Estética de Disilicato de Litio (E-Max)', precio: 55000 },
      { trabajo: 'Incrustación Estética (Overlay / Inlay)', precio: 38000 }
    ]
  },
  {
    id: 2,
    nombre: 'Laboratorio 3D CadCam Digital',
    contacto: 'Dra. Andrea Morales',
    telefono: '+56 9 1122 3344',
    email: 'lab3d@cadcamdent.cl',
    direccion: 'Av. Las Condes 8900',
    tarifas: [
      { trabajo: 'Corona de Zirconio Monolítico', precio: 50000 },
      { trabajo: 'Corona de Porcelana sobre Metal (PFM)', precio: 35000 },
      { trabajo: 'Estructura / Implante (Silla Multi-Unit)', precio: 75000 }
    ]
  }
]

export const ORDENES_DEFAULT = [
  {
    id: 101,
    codigoOrden: 'LAB-2026-101',
    pacienteId: 1,
    pacienteNombre: 'Camila Silva Morales',
    pacienteRut: '18.452.123-K',
    laboratorioId: 1,
    laboratorioNombre: 'Laboratorio Oral Art & Cerámica',
    tipoTrabajo: 'Corona de Zirconio Monolítico',
    piezaDientaria: 'Pieza 1.1',
    colorGuia: 'A2 (Vita Classical)',
    fechaEnvio: '2026-08-01',
    fechaEntregaPrometida: '2026-08-08',
    etapa: 'Enviado',
    costoLaboratorio: 45000,
    estadoPagoLab: 'Pendiente',
    indicacionesTecnicas: 'Margen chamfer subgingival 0.5mm. Caracterización anatómica natural.'
  }
]