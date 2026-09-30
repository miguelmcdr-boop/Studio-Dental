# RFC: F7-36 FASE 1 — Aislamiento Multi-Tenant en Frontend

**Estado:** ✅ COMPLETADA  
**Fecha de cierre:** 2026-09-28  
**Commits:** 14 atómicos (10 código + 4 documentación)  
**PRs:** #166 (Parte 1, mergeado) + #167 (Parte 2, en preparación)

---

## Resumen Ejecutivo

F7-36 FASE 1 resolvió el riesgo de contaminación cross-clinic de datos clínicos y financieros en el frontend de Studio Dental OS mediante la implementación de **3 capas de defensa en profundidad**:

1. **CAPA 1: Supabase Storage + RLS** — Previene acceso cross-clinic a blobs en la nube y BD
2. **CAPA 2: tenantCache + IndexedDB v2** — Aísla datos en localStorage y IndexedDB por clínica
3. **CAPA 3: invalidarCacheCambioClinica** — Limpia 5 fuentes de caché al cambiar de clínica

**Métricas finales:**
- 1601 tests pasando (1596 pre-existentes + 5 nuevos obligatorios)
- 0 violaciones de arquitectura
- 0 regresiones
- 15+ servicios/archivos migrados a tenant-aware
- ~30 repos ahora con claves `sd_<clinicaId>_<baseKey>`
- 3 bugs críticos corregidos

---

## 1. Contexto del Problema

### 1.1 Origen: F7-20 (pen-test)
El pen-test F7-20 validó que 10/10 ataques server-side fueron bloqueados por políticas RLS, pero identificó una **superficie de ataque residual en el frontend**: la caché local no estaba aislada por clínica.

### 1.2 Auditoría F7-36: 4 problemas críticos detectados

#### Problema 1: Fallback cross-clinic en storage services
4 storage services críticos (finanzas, agenda, pagos, presupuestos) tenían este patrón peligroso:

    if (data.length === 0 && cache.length > 0) {
      return cache  // Recupera datos de clínica anterior
    }

**Escenario de riesgo:**
1. Usuario en Clínica A carga 50 pagos
2. Cambia a Clínica B (que tiene 0 pagos)
3. Supabase retorna lista vacía
4. App muestra los 50 pagos de Clínica A (**filtración de datos**)

#### Problema 2: IndexedDB sin aislamiento por clínica
La BD `studio_dental_adjuntos` compartía registros de todas las clínicas. Si un usuario accedía a Clínica A y luego a Clínica B, la BD seguía conteniendo adjuntos de ambas clínicas sin forma de filtrar.

#### Problema 3: Claves legacy globales sin clinicaId
Todas las claves de localStorage usaban formato `studio_dental_*` sin incluir `clinicaId`. Al cambiar de clínica, los datos de la clínica anterior permanecían accesibles.

#### Problema 4: Caché en memoria no invalidada
Los storage services tenían caché en memoria al nivel de módulo (`let pacientesCache = null`). Al cambiar de clínica, la caché en memoria seguía apuntando a datos de la clínica anterior.

---

## 2. Estrategia: Defensa en Profundidad (3 capas)

    ┌──────────────────────────────────────────────────────┐
    │ CAPA 1: Supabase Storage + RLS (BD + nube)           │
    │  → Previene acceso cross-clinic a nivel servidor     │
    │  → Validado en F7-20, F7-22, F7-24                   │
    ├──────────────────────────────────────────────────────┤
    │ CAPA 2: tenantCache + createTenantRepository         │
    │         + IndexedDB v2 (frontend)                    │
    │  → Claves: sd_<clinicaId>_<baseKey>                  │
    │  → Consultas filtran por clínica actual              │
    │  → Protege incluso si CAPA 3 falla                   │
    ├──────────────────────────────────────────────────────┤
    │ CAPA 3: invalidarCacheCambioClinica (5 pasos)        │
    │  → Limpia agresivamente al cambiar de clínica        │
    │  → 5 pasos fail-safe (cada uno con try/catch)        │
    │  → Disparado por ClinicaSelector.jsx                 │
    └──────────────────────────────────────────────────────┘

### 2.1 Principios de diseño

1. **Fail-safe:** Si no hay clínica activa, no se permite acceso a cache tenant
2. **Aislamiento estricto:** Datos de clínica A nunca visibles en clínica B
3. **Invalidación explícita:** Al cambiar clínica o logout, limpiar cache
4. **Backward compatible:** No rompe servicios existentes que aún no migraron
5. **Drop-in:** Migración de UNA línea por servicio (createLocalStorageRepository → createTenantRepository)

---

## 3. Implementación (14 commits atómicos)

| # | Commit | Descripción | Archivos |
|---|---|---|---|
| **Infraestructura tenant** | | |
| 1.1 | `28862b1` | tenantCache helper (API pública + invalidación) | 2 |
| 1.2 | `704c3d8` | Eliminación de fallback cross-clinic | 4 |
| 1.3 | `1846e12` | Listener de invalidación al cambiar clínica | 3 |
| 1.4 | `22c62e5` | createTenantRepository (wrapper drop-in) | 2 |
| **Fix de seguridad** | | |
| 1.5a | `b74f761` | Limpiar claves por pacienteId al cambiar clínica | 2 |
| **Migración de servicios (localStorage)** | | |
| 1.5b | `fc5cecc` | PHI críticos (agenda + pacientes) | 4 |
| 1.5c | `a2c3ff2` | Financieros (pagos + presupuestos + finanzas) | 5 |
| 1.5d | `c12afd0` | Operacionales (inventario + laboratorio + esterilización + urgencias) | 4 |
| 1.5e | `12334a0` | Configuración (comunicaciones + prestaciones + config) | 3 |
| 1.5f | `f70a55c` | Pendientes (operationQueue + reportes + App.jsx) + bug silencioso | 4 |
| **Migración de IndexedDB** | | |
| 1.6 | `fc71a0d` | IndexedDB tenant-aware para adjuntos clínicos | 3 |
| **Redundante** | | |
| 1.7 | — | operationQueue tenant-aware (cubierto en 1.5f) | — |
| **Tests** | | |
| 1.8 | `156d203` | 5 tests obligatorios de aislamiento end-to-end | 1 |
| **Documentación** | | |
| 1.9 | este commit | RFC + checklist + cierre FASE 1 | 4 |

**Total:** 13 commits reales + 1 redundante marcado

---

## 4. Métricas finales

### 4.1 Cobertura

| Aspecto | Resultado |
|---|---|
| Servicios/archivos migrados | **15+** |
| Repos tenant-aware | **~30** |
| Tests pasando | **1601/1601** ✅ |
| Violaciones de arquitectura | **0** ✅ |
| Regresiones | **0** ✅ |
| Bugs críticos corregidos | **3** |

### 4.2 Bugs críticos corregidos

#### Bug 1: Fallback cross-clinic (Commit 1.2)
Los 4 storage services principales (finanzas, agenda, pagos, presupuestos) usaban el cache de la clínica anterior como fallback cuando Supabase retornaba array vacío.

**Impacto:** Filtración de datos clínicos y financieros entre clínicas.

**Fix:** Eliminar el fallback. Cuando Supabase retorna `[]` sin error, sobrescribir cache con `[]`.

#### Bug 2: Reportes BI silenciosamente rotos (Commit 1.5f)
`reportesStorageService.obtenerDatosConsolidados()` leía localStorage directo con claves legacy que **YA HABÍAN SIDO MIGRADAS** a tenant-aware en commits 1.5b y 1.5c.

**Impacto:** Pagos, presupuestos y citas **SIEMPRE retornaban arrays vacíos** en el dashboard BI. Solo pacientes funcionaba (porque ya usaba el servicio público).

**Fix:** Reescribir usando servicios públicos (pagosStorageService.obtenerPagos(), etc.), heredando automáticamente aislamiento multi-tenant.

#### Bug 3: GAP claves por pacienteId (Commit 1.5a)
`invalidarCacheCambioClinica` solo limpiaba claves con prefijo `studio_dental_`, pero NO limpiaba las 8 claves por `pacienteId`:
- `recetas_<pacienteId>`
- `evoluciones_<pacienteId>`
- `certificados_<pacienteId>`
- `odontograma_<pacienteId>`
- `periodontograma_<pacienteId>`
- `odontopediatria_<pacienteId>`
- `quirurgico_<pacienteId>`
- `dsd_<pacienteId>`

**Impacto:** Si había coincidencia de UUIDs entre pacientes de clínicas diferentes, podrían contaminarse.

**Fix:** Agregar limpieza específica de estas 8 claves en `invalidarCacheCambioClinica`.

---

## 5. Arquitectura implementada

### 5.1 tenantCache (Commit 1.1)

Archivo: `src/services/tenantCache.js` (192 líneas)

**API pública:**

    tenantCache.claveTenant(baseKey)         // sd_<clinicaId>_<baseKey>
    tenantCache.leerTenant(baseKey, fallback) // Lee de localStorage
    tenantCache.escribirTenant(baseKey, val)  // Escribe en localStorage
    tenantCache.existeTenant(baseKey)         // Verifica existencia
    tenantCache.eliminarTenant(baseKey)       // Elimina clave específica
    tenantCache.invalidarClinica(clinicaId)   // Elimina todas las claves de una clínica
    tenantCache.invalidarTodas()              // Elimina todas las claves tenant (logout)
    tenantCache.listarClavesTenant()          // Lista todas las claves tenant

**Fail-safe:** Si no hay clínica activa, `claveTenant()` lanza error explícito.

### 5.2 createTenantRepository (Commit 1.4)

Archivo: `src/services/localStorageRepository.js` (agregado)

**Wrapper drop-in** compatible con `createLocalStorageRepository`:

    // Migración de UNA línea por servicio:
    - const repo = createLocalStorageRepository(KEY, default)
    + const repo = createTenantRepository(KEY, default)

**Beneficio:** Los servicios no necesitan reescribirse, solo cambiar una línea.

### 5.3 invalidarCacheCambioClinica (Commit 1.3)

Archivo: `src/services/invalidarCacheCambioClinica.js` (267 líneas)

**5 pasos fail-safe:**
1. `tenantCache.invalidarClinica(clinicaAnterior)` — claves tenant-aware
2. `resetCache()` en 4 storage services — cache en memoria
3. `setState()` en patientsStore y prestacionesStore — stores Zustand
4. Limpieza de claves legacy `studio_dental_*` + claves por pacienteId + específicas
5. `indexedDB.deleteDatabase('studio_dental_adjuntos')` — cache offline

**Estructura de retorno:**

    {
      tenantKeys: number,        // Cantidad de claves eliminadas
      storageServices: number,   // Cantidad de servicios reseteados
      stores: string[],          // Stores Zustand reseteados
      legacyKeys: number,        // Claves legacy eliminadas
      patientKeys: number,       // Claves por paciente eliminadas
      explicitKeys: number,      // Claves específicas eliminadas
      indexedDB: { eliminada: boolean, razon?: string },
      errores: number            // Errores encontrados
    }

### 5.4 IndexedDB v2 (Commit 1.6)

Archivo: `src/services/adjuntosStorageService.js` (344 líneas)

**Migración v1 → v2:**
- `DB_VERSION`: 1 → 2
- Nuevo índice `clinicaId` en object store
- `onupgradeneeded` pobla `clinicaId` en registros existentes
- `guardarAdjunto` requiere `clinicaId` obligatorio (lanza error si no hay)
- `obtenerAdjuntosPorPaciente` filtra por clínica actual (defensa en profundidad)
- Nueva función `eliminarAdjuntosPorClinica(clinicaId)` para limpieza granular

---

## 6. Tests obligatorios (Commit 1.8)

Archivo: `src/test/security/f7-36-fase1-mandatory.test.js` (433 líneas)

**5 tests end-to-end validando las 3 capas:**

| # | Test | Capa validada |
|---|---|---|
| 1 | Cambio de clínica aísla datos en localStorage | CAPA 2 |
| 2 | Cambio de clínica aísla adjuntos en IndexedDB | CAPA 2 |
| 3 | invalidarCacheCambioClinica ejecuta 5 pasos | CAPA 3 |
| 4 | Aislamiento funciona tras reload (defensa profundidad) | CAPA 2 |
| 5 | Claves legacy no interfieren con tenant-aware | CAPA 2 + 3 |

**Concepto clave:** Helper `simularReload()` con `vi.resetModules()` simula el reload de página que ocurre en producción al cambiar clínica (porque storage services tienen caché en memoria al nivel de módulo).

---

## 7. Riesgos mitigados

| Riesgo | Mitigación |
|---|---|
| Contaminación cross-clinic de PHI | CAPA 2 (tenant-aware) + CAPA 3 (invalidación) |
| Pérdida de datos legacy | Migración onupgradeneeded + coexistencia |
| Race conditions en cambio de clínica | Reload post-invalidación |
| Caché en memoria obsoleta | Reload + resetCache() |
| IndexedDB contaminada | Filtro por clinicaId + borrado completo |
| Adjuntos offline expuestos | Borrado completo al cambiar clínica |
| Operaciones en cola procesadas en clínica incorrecta | operationQueue tenant-aware |
| Reportes BI con datos cruzados | Reescritura con servicios públicos |

---

## 8. Trabajo futuro (FASE 2-11)

Ver `docs/MASTER_ROADMAP.md` para fases pendientes:

1. **FASE 2:** RPC de auditoría - cerrar superficie de ataque
2. **FASE 3:** SECURITY DEFINER hardening
3. **FASE 4:** Audit log de archivos
4. **FASE 5:** Identidad real del actor
5. **FASE 6:** Purga definitiva paciente + R2
6. **FASE 7:** Rebuild completo de base de datos
7. **FASE 8:** R2 - revisión final
8. **FASE 9:** MIME contract
9. **FASE 10:** CI / E2E
10. **FASE 11:** Test global de regresión multi-tenant

**Nota:** Las FASE 2-11 son principalmente server-side (SQL, RPC, RLS). FASE 1 cerró completamente el lado frontend.

---

## 9. Referencias

### PRs
- **PR #166:** F7-36 FASE 1 Parte 1 — Migración localStorage (Commits 1.1 a 1.5f) ✅ mergeado
- **PR #167:** F7-36 FASE 1 Parte 2 — IndexedDB + tests + docs (Commits 1.6, 1.8, 1.9) ⏳ en preparación

### Documentación relacionada
- `F7-36-FASE1-VERIFICACION.md` — Checklist de verificación manual
- `F7-20 pen-test` — Validación de RLS (10/10 ataques bloqueados)
- `F7-22 R2 storage` — Control de acceso a archivos en nube
- `F7-24 Regresión multi-tenant` — Tests de documentación como código
- `F7-31 Papelera de reciclaje` — Soft delete de pacientes
- `BITACORA.md` — Entradas de cada commit de F7-36 FASE 1

### Archivos clave
- `src/services/tenantCache.js` — API pública de aislamiento
- `src/services/localStorageRepository.js` — createTenantRepository
- `src/services/invalidarCacheCambioClinica.js` — Orquestador de limpieza
- `src/services/adjuntosStorageService.js` — IndexedDB v2
- `src/components/ClinicaSelector.jsx` — Disparador de invalidación
- `src/test/security/f7-36-fase1-mandatory.test.js` — 5 tests obligatorios

---

## 10. Conclusión

F7-36 FASE 1 cierra completamente el aislamiento multi-tenant en el frontend de Studio Dental OS. Las 3 capas de defensa en profundidad garantizan que:

1. **Ningún dato de clínica A sea accesible desde clínica B** (CAPA 2)
2. **La caché se limpie agresivamente al cambiar clínica** (CAPA 3)
3. **Si la limpieza falla, el aislamiento siga funcionando** (defensa en profundidad)

Con 1601 tests pasando, 0 regresiones y 3 bugs críticos corregidos, FASE 1 establece una base sólida para las fases server-side pendientes (FASE 2-11).

**Criterios de aceptación F7-36 FASE 1: ✅ CUMPLIDOS**
