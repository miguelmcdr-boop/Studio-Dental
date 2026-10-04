/**
 * Barrera pública del dominio Vademécum (F4-03f / DDD Fase 1B).
 *
 * Este dominio contiene herramientas del vademécum clínico odontológico:
 * - Administración de vademécum odontológico
 * - Protocolos, interacciones, alergias, urgencias y profilaxis
 *
 * Uso:
 *   import { useVademecumAdmin, TablaVademecum, ... } from '../domains/organization/vademecum'
 */

// Módulo principal de administración
export { AdminVademecumModulo } from './AdminVademecumModulo'

// Hooks de administración
export { useVademecumAdmin } from './hooks/useVademecumAdmin'

// Componentes de visualización del vademécum (F4-03f-2)
export { TablaVademecum } from './components/TablaVademecum'
export { TablaUrgencia } from './components/TablaUrgencia'
export { TablaAntirresortivos } from './components/TablaAntirresortivos'
export { MetadataCuracion } from './components/MetadataCuracion'

// Componentes reutilizables del vademécum (F4-03f-2 refactorización)
export { FiltrosVademecum } from './components/FiltrosVademecum'
export { FilaVademecum } from './components/FilaVademecum'
export { PaginacionVademecum } from './components/PaginacionVademecum'

// Modales de edición (F4-03f-3)
export { ModalEditarFarmaco } from './components/ModalEditarFarmaco'
export { ModalEditarUrgencia } from './components/ModalEditarUrgencia'
export { ModalEditarAntirresortivo } from './components/ModalEditarAntirresortivo'

// Componentes auxiliares de modales (F4-03f-3 refactorización)
export { CamposFormularioFarmaco } from './components/CamposFormularioFarmaco'

// Componentes de protocolos integrados (F4-03f-5d)
export { AdminProtocolosContenido } from './components/AdminProtocolosContenido'

// Componentes de alergias cruzadas (F4-03f-5a)
export { TablaAlergiasCruzadas } from './components/TablaAlergiasCruzadas'
export { ModalEditarAlergiaCruzada } from './components/ModalEditarAlergiaCruzada'

// Componentes de interacciones farmacológicas (F4-03f-5b)
export { TablaInteracciones } from './components/TablaInteracciones'
export { ModalEditarInteraccion } from './components/ModalEditarInteraccion'

// Componentes de protocolos clínicos (F4-03f-5c)
export { TablaProfilaxis } from './components/TablaProfilaxis'
export { TablaAnticoagulantes } from './components/TablaAnticoagulantes'
export { ModalEditarProtocolo } from './components/ModalEditarProtocolo'

// Schemas de validación (F4-03f-3)
export {
  farmacoSchema,
  urgenciaSchema,
  antirresortivoSchema,
  validarFarmaco,
  validarUrgencia,
  validarAntirresortivo,
  FAMILIAS_VADEMECUM,
  FAMILIAS_ANTIRRESORTIVOS,
  NIVELES_RIESGO_MRONG,
  VIAS_ADMINISTRACION
} from './schemas/vademecumSchema'
export type { Farmaco, FarmacoUrgencia, Antirresortivo } from './schemas/vademecumSchema'

// Schema de alergias cruzadas (F4-03f-5a)
export {
  alergiaCruzadaSchema,
  validarAlergiaCruzada,
  FAMILIAS_ALERGIAS,
  NIVELES_SEVERIDAD
} from './schemas/alergiaCruzadaSchema'
export type { AlergiaCruzada } from './schemas/alergiaCruzadaSchema'

// Schema de interacciones (F4-03f-5b)
export {
  interaccionSchema,
  validarInteraccion,
  NIVELES_SEVERIDAD_INTERACCION
} from './schemas/interaccionSchema'
export type { Interaccion } from './schemas/interaccionSchema'

// Schemas de protocolos (F4-03f-5c)
export {
  profilaxisSchema,
  validarProfilaxis
} from './schemas/profilaxisSchema'
export type { Profilaxis } from './schemas/profilaxisSchema'

export {
  anticoagulanteSchema,
  validarAnticoagulante
} from './schemas/anticoagulanteSchema'
export type { Anticoagulante } from './schemas/anticoagulanteSchema'
