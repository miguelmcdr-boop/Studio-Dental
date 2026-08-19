# MASTER_ROADMAP.md — Studio Dental — Plan Técnico Ejecutable

**Estado:** VIGENTE Y MANDATORIO  
**Origen:** Deriva directamente de `Auditoria_Tecnica_Studio_Dental.md` (línea base aprobada) y de `docs/01-Constitucion_Arquitectura_Studio_Dental_v3.md`.  
**Rol responsable:** Principal Software Architect / Staff Engineer del proyecto.  
**Última actualización:** 2026-08-18 — F6-A y F6-Aa cerradas con evidencia (verificación local: 27 tablas, 164 registros, alertas operativas); F6-B granularizada en F6-B1..F6-B6; F6-B1 DONE (enum app_role + helpers SQL + trigger de alta de perfil).
**Bitácora histórica:** `docs/BITACORA.md`


## 0. REGLAS DE GOBERNANZA DE ESTE DOCUMENTO

1. Ningún cambio de código se implementa si no corresponde a una tarea con ID en este documento. Si aparece una necesidad no contemplada aquí, se agrega primero como tarea nueva (con su ID, dependencias y criterios de aceptación) antes de tocar código — no se improvisa en el camino.
2. El orden de implementación dentro de cada fase es secuencial salvo que se indique explícitamente "paralelizable". Las dependencias marcadas son bloqueantes: no se inicia una tarea si su dependencia no está en estado `DONE`.
3. Ninguna tarea se marca `DONE` sin cumplir el 100% de sus criterios de aceptación. Cumplimiento parcial se marca `IN PROGRESS`, nunca `DONE`.
4. Cambios mayores de arquitectura no contemplados en este roadmap requieren pasar primero por el protocolo RFC definido en el Cap. VIII de la Constitución de Arquitectura, y solo después se incorporan aquí como tarea nueva.
5. Este documento se actualiza a medida que se completan tareas (columna Estado) y a medida que se detectan hallazgos nuevos durante la implementación (se agregan como tareas nuevas, nunca se resuelven "al paso").
6. Toda tarea que toque cálculos de seguridad clínica (dosis, alergias) requiere test automatizado como parte de sus criterios de aceptación — sin excepción, sin importar la prioridad o urgencia percibida.
7. **Regla de comunicación de valor:** cada vez que se inicie una tarea, se debe explicar explícitamente **qué ganamos** al realizarla: qué problema resuelve, qué capacidad nueva habilita, o qué riesgo elimina. El objetivo es que el usuario entienda el valor de cada paso, no solo la mecánica técnica.

**Convención de estado**  
`TODO` → no iniciada · `IN PROGRESS` → en desarrollo · `BLOCKED` → esperando dependencia · `DONE` → completada y verificada · `DEFERRED` → diferida con justificación técnica documentada

**Convención de ID**  
`F<fase>-<número>` — ejemplo: `F1-03` = Fase 1, tarea 3. Sufijos de letra (`F2-03g`, `F2-07h`) identifican hallazgos derivados registrados durante la ejecución de la tarea base, siguiendo la Regla 1 de gobernanza.
8. **Regla de trazabilidad de métricas:** toda métrica citada en este documento (número de tests, tablas, cobertura, tamaño de bundle) debe ir acompañada del comando que la produce y la fecha de ejecución. Una métrica sin fuente no se copia hacia adelante: se vuelve a medir.
9. **Regla de verificación contra el código:** antes de marcar `DONE` una tarea cuyo criterio de aceptación sea observable en el repositorio, se deja constancia del comando de verificación y su salida. Marcar `DONE` porque "se implementó" y no porque "se comprobó" es lo que produjo la deriva corregida el 2026-08-16.


---

## 1. TABLERO GLOBAL DE TAREAS

| ID | Tarea | Fase | Prioridad | Esfuerzo | Dependencias | Estado |
|---|---|---|---|---|---|---|
| F1-01 | Autenticación real con verificación de credenciales | 1 | P0 | M (3-5 d) | — | DONE (2026-08-07) |
| F1-02 | Repositorio IndexedDB para adjuntos clínicos binarios | 1 | P0 | M (4-6 d) | — | DONE (2026-08-08) |
| F1-03 | Corregir fail-safe clínico en cálculo de anestesia | 1 | P0 | S (0.5-1 d) | — | DONE (2026-08-07) |
| F1-04 | Auditar otros cálculos clínicos por el mismo patrón de default silencioso | 1 | P0 | S (1-2 d) | F1-03 | DONE (2026-08-07) |
| F1-04a | Corregir fail-safe en `evaluarIncompatibilidadFarmaco` (alergias a fármacos) | 1 | P0 | S (1-2 d) | F1-04 | DONE (2026-08-07) |
| F1-04b | Corregir fail-safe en `calcularIndicesPeriodontales` (diagnóstico periodontal) | 1 | P0 | S (1-2 d) | F1-04 | DONE (2026-08-07) |
| F1-04c | Corregir fail-safe en `sanitizarTorque` / `sanitizarISQ` (implantología) | 1 | P1 | S (1 d) | F1-04 | DONE (2026-08-07) |
| F1-04d | Corregir fail-safe en `calcularVisibilidadDorada` (DSD) | 1 | P2 | XS (0.5 d) | F1-04 | DONE (2026-08-07) |
| F1-04e | Implementar o retirar métricas no conectadas en `HeaderPeriodontal.jsx` | 1 | P3 | S (1 d) | F1-04b | DONE (2026-08-16, verificado) |
| F1-04f | Revisar default `[0,0,0]` en `GraficoPerfilLongitudinal.jsx` (solo visual, no diagnóstico) | 1 | P3 | XS (0.5 d) | F1-04b | DONE (2026-08-16, verificado) |
| F1-05 | Unificar fuente de verdad de `pacientes` en `pacientesStorageService` | 1 | P1 | S (1 d) | — | DONE (2026-08-08) |
| F1-05b | Eliminar últimos accesos directos a `localStorage` de pacientes/prestaciones en `App.jsx` | 1 | P1 | XS (<1 d) | F1-05, F2-01 | DONE (2026-08-10) |
| F1-06 | Introducir Vitest + suite de tests de funciones clínicas puras | 1 | P0 | M (2-3 d) | — | DONE (2026-08-07) |
| F2-01 | Introducir store global (Zustand) para estado compartido entre módulos | 2 | P1 | L (5-8 d) | F1-01, F1-05 | DONE (2026-08-10) |
| F2-02 | Eliminar prop drilling de `App.jsx` hacia los 14 módulos | 2 | P1 | L (4-6 d) | F2-01 | DONE (2026-08-10) |
| F2-02b | Corregir persistencia del "paciente exprés" creado desde Agenda (bypass del store global) | 2 | P0 | S (1 d) | F2-01, F2-02 | DONE (2026-08-10) |
| F2-03 | Extraer repositorio genérico de `localStorage` y refactorizar los 14 servicios | 2 | P1 | M (3-4 d) | — | DONE (2026-08-10) |
| F2-03g | Eliminar `export default` residual en `agendaStorageService.js` | 2 | P2 | XS (<1 d) | F2-03 | DONE (2026-08-10) |
| F2-04 | Introducir Zod y esquemas de validación reales (empezando por `pacientes`) | 2 | P1 | L (5-7 d, incremental) | F2-03 | DONE (2026-08-10) |
| F2-04b | Esquema Zod para `cita` (agenda) | 2 | P1 | S | F2-04 | DONE (2026-08-12) |
| F2-04c | Esquema Zod para `movimientoFinanciero` (finanzas) | 2 | P1 | S | F2-04 | DONE (2026-08-12) |
| F2-04d | Esquema Zod para `prestacion` (arancel) | 2 | P1 | S | F2-04 | DONE (2026-08-12) |
| F2-04e | Esquema Zod para `presupuesto` | 2 | P1 | S | F2-04d | DONE (2026-08-12) |
| F2-05 | Code-splitting con `React.lazy` por módulo (híbrido eager/lazy) | 2 | P1 | M (2-3 d) | F2-02 | DONE (2026-08-10) |
| F2-06 | Completar `index.js` faltantes en 4 módulos | 2 | P2 | XS (2-3 h) | — | DONE (2026-08-10) |
| F2-06b | Completar exportaciones faltantes en barreras públicas de 4 módulos (inventario, pagos, agenda, presupuestos) | 2 | P2 | XS (<1 h) | F2-06 | DONE (2026-08-10) |
| F2-06c | Completar exportación faltante en `finanzas/index.js` | 2 | P1 | XS (<15 min) | F2-06 | DONE (2026-08-11) |
| F2-07 | Eliminar accesos directos a `localStorage` fuera de la capa de servicios | 2 | P2 | L (4-6 d, incremental) | F2-03 | DONE (2026-08-12) |
| F2-07a | Migraciones directas a servicios existentes (7 archivos, ~13 accesos) | 2 | P2 | S (1-2 d) | F2-03, F2-06b | DONE (2026-08-10) |
| F2-07b | Crear 4 servicios faltantes (periodontograma, quirurgico, odontopediatria, dsd) + migrar 5 archivos | 2 | P2 | M (3-4 d) | F2-03 | DONE (2026-08-15, verificado) |
| F2-07c | Extender authService con gestión de perfiles + migrar LoginScreen y useConfiguracion | 2 | P2 | S (1 d) | F2-07a | DONE (2026-08-10) |
| F2-07d | Migrar 6 removes de App.jsx a servicios existentes | 2 | P2 | S (1 d) | F2-07a | DONE (2026-08-10) |
| F2-07e | Resolver pacientesCalculations.js (acceso a convenios) | 2 | P2 | XS (<0.5 d) | F2-07a | DONE (2026-08-10) |
| F2-07f | Migrar `localStorage.clear()` de `RespaldoDatosSection.jsx` a servicio | 2 | P2 | XS (<0.5 d) | — | DONE (2026-08-11) |
| F2-07h | Corregir clave de `localStorage` desincronizada entre `PresupuestoSection.jsx` e `inventarioStorageService` (bug de cohesión clínica) | 2 | P1 | XS (<1 d) | F2-07 | DONE (2026-08-12) |
| F2-08 | Extraer `LoginScreen`, `Sidebar` y Directorio de Pacientes de `App.jsx` (reducción de tamaño de archivo) | 2 | P2 | S (1-2 d) | F2-02 | DONE (2026-08-10) |
| F2-09 | Limpieza de 35 warnings de oxlint | 2 | P3 | S (1-2 d) | F2-06c | DONE (2026-08-11) |
| F2-10 | Unificar imports internos a ruta pública en archivos transversales (stores) | 2 | P2 | XS (<1 h) | F2-06 | DEFERRED (2026-08-12) |
| F3-01 | Pipeline CI/CD (lint + test + build como gates de PR) | 3 | P1 | M (2-3 d) | F1-06, F2-09 | DONE (2026-08-11) |
| F3-02 | Script de validación arquitectónica automatizada | 3 | P1 | M (2-3 d) | F2-06, F2-07 | DONE (2026-08-11) |
| F3-03 | Adopción de Conventional Commits + flujo de ramas por feature | 3 | P2 | XS (config + hábito) | — | DONE (2026-08-11) |
| F3-04 | Ampliar cobertura de testing a hooks e integración | 3 | P1 | L (5-8 d, incremental) | F1-06 | DONE (2026-08-11) |
| F3-05 | RBAC básico (Admin/Profesional/Asistente/Recepción) | 3 | P1 | L (4-6 d) | F1-01 | DONE (2026-08-12) |
| F3-06 | Versionado y migraciones de esquema de datos persistidos | 3 | P2 | M (3-4 d) | F2-03, F2-04 | DONE (2026-08-13, absorbido por F4-02) |
| F3-07 | Actualizar `postcss` / `nanoid` para resolver vulnerabilidad GHSA-2v37-7h3g-55p8 (`npm audit`) | 3 | P3 | XS (<1 h) | — | DONE (2026-08-16, verificado) |
| F3-08 | Optimización de code-splitting (INEFFECTIVE_DYNAMIC_IMPORT) | 3 | P2 | M (2-3 d) | F2-05 | DONE (2026-08-13, resuelto en F4-02e) |
| F4-01 | RFC de diseño de backend/sincronización multi-dispositivo | 4 | P1 | L (proceso, no solo código) | F1–F3 completas | DONE (2026-08-12) |
| F4-02 | Migración de datos locales → Supabase con estrategia offline-first | 4 | P1 | XL | F4-01 | DONE (2026-08-13, PR #22) |
| F4-02a | Creación de esquema Supabase (DB schema + RLS) | 4 | P1 | S | F4-01 | DONE (2026-08-12, PR #16) |
| F4-02b | Cliente Supabase + autenticación integrada | 4 | P1 | S | F4-02a | DONE (2026-08-12, PR #16 + hotfix) |
| F4-02c-1 | Creación de tablas clínicas en Supabase | 4 | P1 | S | F4-02b | DONE (2026-08-12) |
| F4-02c-2 | Migración de pacientes a Supabase | 4 | P1 | M | F4-02c-1 | DONE (2026-08-13) |
| F4-02c-3 | Migración de citas a Supabase | 4 | P1 | M | F4-02c-2 | DONE (2026-08-13) |
| F4-02c-4 | Migración de presupuestos + items a Supabase | 4 | P1 | M | F4-02c-2 | DONE (2026-08-13, PR #21) |
| F4-02c-5 | Migración de pagos + finanzas a Supabase | 4 | P1 | M | F4-02c-2 | DONE (2026-08-13) |
| F4-02c-6 | Migración de datos clínicos (11 tipos) a Supabase | 4 | P1 | M | F4-02c-1 | DONE (2026-08-13) |
| F4-02d-1 | Lectura de datos clínicos desde Supabase (sync cache) | 4 | P1 | M | F4-02c-6 | DONE (2026-08-13) |
| F4-02d-2 | Escritura de datos clínicos a Supabase | 4 | P1 | M | F4-02d-1 | DONE (2026-08-13) |
| F4-02e | Testing, validación, persistencia y mejoras UX | 4 | P1 | M | F4-02d-2 | DONE (2026-08-13) |
| F4-03 | Curación clínica real del vademécum y datos de referencia | 4 | P1 | M (curación + carga) | — (paralelizable) | DONE (2026-08-15) |
| F4-03a | Esquema SQL del vademécum v1.1 (7 tablas) | 4 | P1 | S | F4-03 | DONE (2026-08-15) |
| F4-03b | Carga de datos — 164 registros enriquecidos | 4 | P1 | M | F4-03a | DONE (2026-08-15) |
| F4-03c | vademecumService.js (33 tests) | 4 | P1 | M | F4-03a | DONE (2026-08-15) |
| F4-03d | anestesiaCalc integrado con vademécum v1.1 | 4 | P1 | S | F4-03c | DONE (2026-08-15) |
| F4-03e | evaluarIncompatibilidadFarmaco (matriz completa) | 4 | P1 | S | F4-03c | DONE (2026-08-15) |
| F4-03f | Módulo admin "Vademécum" (8 tabs CRUD) | 4 | P1 | L | F4-03c | DONE (2026-08-15) |
| F4-03g | Autocompletado recetas con vademécum v1.1 | 4 | P1 | S | F4-03f | DONE (2026-08-15) |
| F4-03h | Mejoras UI de alertas + alternativas seguras | 4 | P2 | S | F4-03e, F4-03g | DONE (2026-08-15) |
| F4-03i | Corregir `detail is not defined` en notificaciones de escritura de `vademecumService` (hallazgo Vitest 2026-08-17) | 4 | P2 | XS (<0.5 d) | — | TODO |
| F4-04 | E2E de flujos de negocio críticos previos a despliegue multi-clínica | 4 | P1 | M (3-5 d) | F3-04 | DONE (2026-08-16) |
| F5-01 | Supabase Realtime setup (habilitar canales en tablas críticas) | 5 | P1 | S | F4-02 | DONE (2026-08-14) |
| F5-02 | Sincronización en tiempo real de cambios entre dispositivos | 5 | P1 | M | F5-01 | DONE (2026-08-14) |
| F5-03 | Offline-first queue de operaciones pendientes | 5 | P1 | S | F5-02 | DONE (2026-08-14) |
| F5-04 | Conflict resolution entre dispositivos | 5 | P2 | S | F5-02 | DONE (2026-08-14) |
| F5-05 | Notifications y alertas de cambios | 5 | P2 | S | F5-02 | DONE (2026-08-14) |
| **— FASE 6: bloque estructural (nuevo, 2026-08-16) —** | | | | | | |
| F6-A | Versionar esquema SQL + seed del vademécum v1.1 | 6 | **P0** | S (1 d) | — | DONE (2026-08-18) |
| F6-Aa | Investigar por qué schema-clinical-tables.sql no crea sus 9 tablas en entorno limpio (hallazgo de la verificación F6-A) | 6 | P1 | S (0.5-1 d) | — | DONE (2026-08-18) — sin bug: el archivo completo ejecutado crea las 9 tablas; el gap inicial fue omisión en la verificación. 27 tablas verificadas en entorno limpio. |
| F6-B1 | Enum app_role + helpers SQL (current_role, has_role, is_admin) + trigger on_auth_user_created | 6 | **P0** | S (0.5 d) | — | DONE (2026-08-18) |
| F6-B2 | Reescribir RLS de 9 tablas clínicas alineado con matriz RBAC | 6 | **P0** | S (1 d) | F6-B1 | DONE (2026-08-18) |
| F6-B3 | Reescribir RLS de 5 tablas financieras + 8 vademécum + audit_log + migración de datos existentes | 6 | **P0** | S (1 d) | F6-B2 | DONE (2026-08-18) |
| F6-B4 | Migrar authService.js a leer rol de app_metadata + eliminar fallback a admin | 6 | **P0** | S (0.5 d) | F6-B3 | DONE (2026-08-18) |
| F6-B5 | Tests SQL de helpers + tests JS/E2E por rol | 6 | **P0** | S (1 d) | F6-B4 | DONE (2026-08-18) |
| F6-B6 | Verificación práctica + documentación + bitácora | 6 | **P0** | S (0.5 d) | F6-B5 | DONE (2026-08-18) |
| F6-B7 | Alinear `profiles.role` a `app_role` en cloud (hallazgo: está como `text`) | 6 | P2 | XS (<0.5 d) | F6-B6 | TODO |
| F6-C | Modelo multi-clínica: `clinica_id` + membresía + reescritura de RLS | 6 | **P0** | XL | F6-B | IN PROGRESS (RFC aprobado 2026-08-17; implementación bloqueada por F6-B) |
| F6-C-a | Tablas `clinicas` y `miembros_clinica` + función `clinica_actual()` (RFC-F6-C) | 6 | **P0** | S (0.5 d) | F6-B, F6-I | DONE (2026-08-18) |
| F6-C-b | Migración de datos existentes a clínica inicial (RFC-F6-C) | 6 | **P0** | S (0.5 d) | F6-C-a | TODO |
| F6-C-c | `clinica_id` en 18 tablas + reescritura de políticas RLS (RFC-F6-C) | 6 | **P0** | M (2 d) | F6-C-b | TODO |
| F6-C-d | Verificación de servicios/hooks contra el nuevo RLS (RFC-F6-C) | 6 | **P0** | M (2 d) | F6-C-c | TODO |
| F6-C-e | Módulo Configuración de clínica: branding + logo en Storage (RFC-F6-C) | 6 | P1 | S (1 d) | F6-C-d | TODO |
| F6-C-f | Reescritura E2E `flujo-colaborativo.spec.js` con dos cuentas (RFC-F6-C) | 6 | P1 | S (0.5 d) | F6-C-d, F6-I | TODO |
| F6-D | Cablear la ficha clínica a Supabase (odontograma, perio, evoluciones, recetas, certificados) | 6 | **P0** | L (5-8 d) | F6-C | TODO |
| F6-E | Adjuntos clínicos a Supabase Storage con URLs firmadas | 6 | **P0** | M (3-5 d) | F6-C | TODO |
| F6-F | Auditoría append-only por trigger + soft delete de ficha clínica | 6 | P1 | M (3-4 d) | F6-C | TODO |
| F6-G | Validación de RUT (módulo 11) + unicidad por clínica | 6 | P1 | XS (<0.5 d) | — | TODO |
| F6-H | Timeout de sesión por inactividad + política de contraseña | 6 | P1 | S (1-2 d) | F6-B | TODO |
| F6-J | PWA real (service worker + manifest) para arranque en frío sin conexión | 6 | P2 | M (2-4 d) | — | DONE (2026-08-18) |
| F6-K | Umbrales de cobertura en CI + tests para los 8 módulos sin cobertura | 6 | P2 | L (5-8 d, incremental) | — | TODO |
| **— FASE 6: hardening (original) —** | | | | | | |
| F6-01 | Error Boundary global + por módulo crítico | 6 | P1 | S (1-2 d) | — | IN PROGRESS (implementado 2026-08-15; falta test de layout, ver criterios) |
| F6-02 | Auditoría y confirmación real del estado E2E | 6 | P1 | XS (<0.5 d) | — | IN PROGRESS (evidencia 12/12 obtenida 2026-08-15; criterio de CI incumplido, ver F6-02b) |
| F6-02b | Agregar job E2E al pipeline CI/CD (hallazgo F6-02) | 6 | P2 | S (0.5-1 d) | F6-02 | TODO |
| F6-02c | Investigar `data-testid` faltantes en bundle de LoginScreen (hallazgo F6-02) | 6 | P3 | XS (<0.5 d) | F6-02 | TODO |
| F6-03 | Logger centralizado con niveles (reemplazo de 59 `console.log` sueltos) | 6 | P2 | S (1-2 d) | — | TODO |
| F6-04 | Accesibilidad básica (aria-*, foco en modales, labels) | 6 | P2 | M (2-4 d, incremental) | — | TODO |
| F6-05 | Exportación de reportes a Excel/PDF | 6 | P2 | M (2-3 d) | — | TODO |
| F6-06 | Checklist de despliegue a producción (dominio, env vars, backups) | 6 | P1 | S (0.5-1 d, proceso) | F6-02, F6-A..F6-E | IN PROGRESS (documento redactado 2026-08-16; 0/80 pasos ejecutados) |
| F6-07 | Manual de usuario por rol + material de capacitación | 6 | P3 | L (1-2 semanas) | — | TODO |

---

## 2. FASES DE EJECUCIÓN

---

## FASE 1 — ESTABILIZACIÓN CRÍTICA

**Objetivo de fase:** el sistema no debe usarse con datos de pacientes reales hasta que todas las tareas de esta fase estén `DONE`. Es la única fase donde el orden interno no es negociable: F1-06 corre en paralelo desde el día 1 (no depende de nada y protege a todas las demás), pero F1-01, F1-02, F1-03/F1-04 y sus derivadas F1-04a-d deben completarse antes de declarar el sistema apto para datos clínicos reales.

### F1-01 — Autenticación real con verificación de credenciales

**Origen auditoría:** §3.1  
**Descripción:** Reemplazar el flujo actual (login que ignora el campo `password`) por verificación real de credenciales con hash local (PBKDF2 vía Web Crypto `SubtleCrypto`, sin dependencia externa).  
**Dependencias:** ninguna.  
**Criterios de aceptación:**
- [x] El campo `password` se hashea antes de guardarse; nunca se persiste en texto plano.
- [x] El login rechaza explícitamente una contraseña incorrecta para un email existente (mensaje de error visible al usuario).
- [x] Existe límite de intentos fallidos básico (ej. bloqueo temporal tras 5 intentos) para mitigar fuerza bruta local.
- [x] Test automatizado: login con contraseña correcta → éxito; login con contraseña incorrecta → rechazo; creación de perfil nuevo → password hasheado en storage.
- [x] `LoginScreen` extraído a su propio módulo en F2-08.

**Esfuerzo:** M (3-5 días). **Prioridad:** P0.

### F1-02 — Repositorio IndexedDB para adjuntos clínicos binarios — DONE (2026-08-08)

**Origen auditoría:** §3.2  
**Descripción:** Implementar `adjuntosStorageService` sobre IndexedDB y reemplazar el estado local de `AdjuntosSection.jsx` por persistencia real.  
**Dependencias:** ninguna.  
**Criterios de aceptación:**
- [x] Fotografías clínicas, radiografías y consentimientos sobreviven a un refresh completo (F5) y a cerrar/reabrir el navegador.
- [x] Cada adjunto queda asociado a `pacienteId`; al eliminar un paciente, sus adjuntos en IndexedDB también se eliminan.
- [x] Manejo de error explícito si IndexedDB no está disponible.
- [x] Test automatizado del servicio: guardar → leer → eliminar, sobre fake de IndexedDB.
- [x] `AdjuntosSection.jsx` consume el servicio a través de un hook (`useAdjuntos(pacienteId)`).

**Esfuerzo:** M (4-6 días). **Prioridad:** P0.

### F1-03 — Corregir fail-safe clínico en cálculo de anestesia — DONE (2026-08-07)

**Origen auditoría:** §3.3  
**Descripción:** Modificar `calcularTubosAnestesia` para que, ante peso ausente o inválido, retorne un estado restrictivo explícito en vez de asumir 70kg.  
**Dependencias:** ninguna.  
**Criterios de aceptación:**
- [x] Si `peso` es `undefined`, `null`, `''`, `0`, o no numérico, retorna `{ estado: 'DATOS_INCOMPLETOS', ... }` — nunca un número calculado sobre un supuesto.
- [x] El componente consumidor bloquea visualmente el resultado cuando `estado === 'DATOS_INCOMPLETOS'`.
- [x] Test automatizado cubriendo: peso válido → cálculo correcto; peso ausente/inválido → estado restrictivo.
- [x] No se introduce ningún otro valor por defecto silencioso en el mismo archivo.

**Esfuerzo:** S (0.5-1 día). **Prioridad:** P0.

### F1-04 — Auditar otros cálculos clínicos por el mismo patrón — DONE (2026-08-07)

**Origen auditoría:** §3.3 (nota de seguimiento)  
**Descripción:** Revisar sistemáticamente todos los `utils/*Calculations.js` de los 14 módulos en busca del patrón de default silencioso.  
**Dependencias:** F1-03.  
**Criterios de aceptación:**
- [x] Listado explícito de todas las funciones de cálculo clínico revisadas.
- [x] Cada función marcada "requiere fix" se convierte en tarea nueva (F1-04a a F1-04d).
- [ ] Cobertura de test para funciones OK (pendiente, se retoma en F3-04).

**Resultado del listado (18 archivos revisados):**

| Archivo | Función | Veredicto | Severidad |
|---|---|---|---|
| pacientes/utils/pacientesCalculations.js | evaluarIncompatibilidadFarmaco | Requiere fix → F1-04a | 🔴 Alta |
| periodontograma/utils/periodontalCalculations.js | calcularIndicesPeriodontales | Requiere fix → F1-04b | 🔴 Alta |
| quirurgico/utils/quirurgicoValidation.js | sanitizarTorque / sanitizarISQ | Requiere fix → F1-04c | 🟠 Media-Alta |
| dsd/utils/dsdCalculations.js | calcularVisibilidadDorada | Requiere fix → F1-04d | 🟡 Media |
| dsd/utils/dsdCalculations.js | calcularRatioAnchoAlto | OK | — |
| periodontograma/utils/periodontalCalculations.js | calcularCAL | OK (ya corregida) | — |
| esterilizacion, urgenciasGes, otros módulos | (todas) | OK | — |

**Esfuerzo real:** ~1 día. **Prioridad:** P0.

### F1-04a — Corregir fail-safe en `evaluarIncompatibilidadFarmaco` — DONE (2026-08-07)

**Criterios cumplidos:** retorna estado explícito `sin_datos` en vez de `null` cuando alergias no informadas; componente distingue visualmente los 3 casos; tests cubriendo todos los escenarios.

**Esfuerzo:** S (1-2 días). **Prioridad:** P0.

### F1-04b — Corregir fail-safe en `calcularIndicesPeriodontales` — DONE (2026-08-07)

**Criterios cumplidos:** sitios sin dato se excluyen del cálculo; bloquea diagnóstico AAP si cobertura <80%; parámetro `factoresRiesgo` conectado correctamente (antes se perdía en silencio); regresión de inicialización en `ArcadaSuperior`/`ArcadaInferior` corregida.

**Esfuerzo:** S (1-2 días). **Prioridad:** P0.

### F1-04c — Corregir fail-safe en `sanitizarTorque`/`sanitizarISQ` — DONE (2026-08-07)

**Criterios cumplidos:** valor no informado retorna `null`; un `0` explícito se preserva; UI distingue "no medido" (ámbar) de "medido en 0" (azul/verde).

**Esfuerzo:** S (1 día). **Prioridad:** P1.

### F1-04d — Corregir fail-safe en `calcularVisibilidadDorada` — DONE (2026-08-07)

**Criterios cumplidos:** estado explícito `DATOS_INCOMPLETOS` sin estimaciones fabricadas; inputs permiten dejar campos realmente vacíos; matriz dorada muestra "N/D".

**Esfuerzo:** XS (0.5 día). **Prioridad:** P2.

### F1-04e — Implementar métricas periodontales en `HeaderPeriodontal.jsx` — DONE (2026-08-16, verificado)

**Decisión:** Implementar los 4 cálculos (no retirarlos).

**Cálculos implementados en `calcularIndicesPeriodontales`:**
- ✅ **sacosModerados:** sitios con sondaje ≥4mm y <6mm
- ✅ **sacosSeveros:** sitios con sondaje ≥6mm
- ✅ **porcentajeSupuracion:** (sitios con supuración / sitios registrados) × 100
- ✅ **promedioSondaje:** suma de sondajes / sitios registrados (1 decimal)
- ✅ **dientesAusentes:** piezas marcadas como ausentes

**Fail-safe implementado:**
- Sitios sin registrar (`Number.isNaN`) se excluyen de cálculos
- Diagnóstico no concluyente si cobertura < 80%

**Conexión a UI:**
- `PeriodontogramaModulo.jsx` llama `calcularIndicesPeriodontales`
- Pasa `indices` como prop a `HeaderPeriodontal`
- Dashboard muestra todas las métricas en tiempo real

**Esfuerzo:** S (1 día). **Prioridad:** P3.

### F1-04f — Revisar default `[0,0,0]` en `GraficoPerfilLongitudinal.jsx` — DONE (2026-08-16, verificado)

**Implementación:** El componente distingue visualmente 3 casos:
1. **Pieza ausente** → punto gris simple
2. **Pieza sin datos de sondaje** → punto gris discontinuo (`strokeDasharray="2 2"`, opacidad 0.6)
3. **Pieza con datos válidos** → punto azul (≤3mm) o rojo (≥4mm)

**Criterios cumplidos:**
- ✅ No hay default `[0,0,0]` que confunda "sin dato" con "medido en 0"
- ✅ Piezas sin sondaje se distinguen visualmente (punto gris discontinuo)
- ✅ Leyenda visual en el componente explica los 3 estados

**Esfuerzo:** XS (0.5 día). **Prioridad:** P3.

### F1-05 — Unificar fuente de verdad de `pacientes` — DONE (2026-08-08)

**Criterios cumplidos:** cero ocurrencias de `localStorage.getItem('clinica_lista_pacientes')` fuera de `pacientesStorageService.js`; comportamiento funcional idéntico.

**Esfuerzo:** S (1 día). **Prioridad:** P1.

### F1-05b — Eliminar últimos accesos directos en `App.jsx` — DONE (2026-08-10)

**Origen:** hallazgo detectado durante F2-01, al migrar `App.jsx` a los stores de Zustand — quedaban restos de lectura/escritura directa de las claves de `pacientes` y del arancel de `prestaciones` que F1-05 no había cubierto por completo.  
**Dependencias:** F1-05, F2-01.  
**Criterios de aceptación:**
- [x] `App.jsx` no contiene ninguna referencia directa a las claves de `pacientes` ni al arancel de `prestaciones`; ambas se leen/escriben a través de `usePacientesStore`/`usePrestacionesStore`.
- [x] Reutiliza la constante `ARANCEL_DEFAULT` ya existente (sin duplicar el valor por defecto del arancel en dos lugares).

**Esfuerzo:** XS (<1 día). **Prioridad:** P1.

### F1-06 — Introducir Vitest + suite de tests — DONE (2026-08-07)

**Criterios cumplidos:** `vitest` instalado; tests para anestesia, CPOD, periodontal, pediatría; script `"test": "vitest run"` en package.json.

**Esfuerzo:** M (2-3 días). **Prioridad:** P0.

**Salida de Fase 1 (Definition of Done):** ✅ CUMPLIDA (2026-08-08). Sistema apto para datos clínicos reales. Pendientes sin bloquear: F1-04e, F1-04f (P3) y F3-07 (mantenimiento).

---

## FASE 2 — FUNDACIONES DE ARQUITECTURA ESCALABLE

**Precondición de fase:** Fase 1 completa al 100%.  
**Estado de fase:** ✅ **COMPLETAMENTE CERRADA (2026-08-12)**. Todas las tareas principales y derivadas críticas están en `DONE`. Única subtarea pendiente: F2-07b (4 servicios nuevos), registrada como trabajo incremental no bloqueante. F2-10 documentada como `DEFERRED` con justificación técnica.

### F2-01 — Introducir store global (Zustand) — DONE (2026-08-10)

**Criterios cumplidos:** 3 stores definidos (sesión, pacientes, prestaciones); `App.jsx` deja de declarar estos useState; sin regresión (144/144 tests).

**Resumen:** `usePacientesStore`, `usePrestacionesStore`, `useSesionStore` con patrón `setX(updater)` compatible con `useState`, persistencia automática vía `*StorageService`, sincronización cross-tab vía evento `storage` + eventos custom.

### F2-02 — Eliminar prop drilling de `App.jsx` — DONE (2026-08-10)

**Criterios cumplidos:** ningún módulo recibe `pacientes`, `userProfile` ni `prestacionesArancel` como prop; `App.jsx` bajo 250 líneas (172 con F2-08).

**Nota de arquitectura — excepción documentada:** `Sidebar` aún recibe `userProfile` como prop (es componente de layout, no módulo de dominio).

### F2-02b — Corregir persistencia del "paciente exprés" desde Agenda — DONE (2026-08-10)

**Origen:** bug reportado por el usuario tras F2-02 (preexistente, no introducido por el refactor).  
**Descripción:** `useAgenda.js` creaba el paciente exprés llamando a `pacientesStorageService` directamente, sin pasar por `usePacientesStore` — el paciente nuevo quedaba invisible hasta refresh.  
**Dependencias:** F2-01, F2-02.  
**Criterios de aceptación:**
- [x] `guardarCita` usa `usePacientesStore.getState().pacientes` / `.setPacientes(...)` en vez de llamar al servicio directamente.
- [x] El paciente exprés queda inmediatamente visible en el Directorio sin refrescar.

**Esfuerzo:** S (1 día). **Prioridad:** P0.

### F2-03 — Repositorio genérico de `localStorage` + refactor de 14 servicios — DONE (2026-08-10)

**Criterios cumplidos:** `createLocalStorageRepository(key, defaultValue)` en `src/services/`; 12/14 servicios delegan al factory; reducción de ~150-200 líneas duplicadas; tests del factory (15 tests).

**Excepciones justificadas (2/14):** `odontogramaStorageService.js` (usa claves dinámicas, no encaja en factory de clave fija); `reportesStorageService.js` (servicio de consolidación BI, migrado parcialmente — resto en F2-07).

### F2-03g — Eliminar `export default` residual en `agendaStorageService.js` — DONE (2026-08-10)

**Origen:** hallazgo detectado durante F2-03 — el archivo conservaba un `export default` que viola el Cap. III de la Constitución.  
**Dependencias:** F2-03.  
**Criterios de aceptación:**
- [x] `agendaStorageService.js` solo usa exportaciones nombradas.

**Esfuerzo:** XS (<1 día). **Prioridad:** P2.

### F2-04 — Introducir Zod y esquemas de validación reales — DONE (2026-08-12)

**Criterios cumplidos:** Serie completa de 5 esquemas Zod para todas las estructuras de datos críticas del sistema:

| Tarea | Esquema | Tests | Estado |
|---|---|---|---|
| F2-04 (base) | `paciente` | incluidos en pacientesStorageService | DONE |
| F2-04b | `cita` | 23 tests | DONE |
| F2-04c | `movimientoFinanciero` | 22 tests | DONE |
| F2-04d | `prestacion` | 28 tests | DONE |
| F2-04e | `presupuesto` | 22 tests | DONE |

**Patrón consistente:** todos los esquemas usan `.passthrough()` (permiten campos adicionales sin romper guardados) y retornan `{ valido, datos, error }` (nunca lanzan excepción). Todos los servicios de storage validan con `safeParse()` antes de persistir, rechazando datos malformados.

**Qué ganamos:**
- Protección contra corrupción silenciosa de datos en 5 estructuras críticas
- Consistencia entre módulos
- Base sólida para F3-06 (versionado de esquemas)

### F2-05 — Code-splitting con `React.lazy` — DONE (2026-08-10)

**Criterios cumplidos:** 3 módulos eager + 11 lazy; chunk principal 721.57 kB → 466.39 kB (171.20 kB → 124.70 kB gzip); fallback `CargandoModulo.jsx` coherente.

**Nota:** Warning `INEFFECTIVE_DYNAMIC_IMPORT` detectado en 5 módulos (inventario, prestaciones, finanzas, pagos, presupuestos) — importados tanto estática como dinámicamente. Registrado como F3-08 para optimización futura.

### F2-06 — Completar `index.js` faltantes — DONE (2026-08-10)

**Criterios cumplidos:** `dsd`, `odontopediatria`, `periodontograma`, `quirurgico` tienen `index.js`; cero imports externos usando rutas internas.

### F2-06b — Completar exportaciones faltantes en barreras públicas — DONE (2026-08-10)

**Origen:** hallazgo durante verificación previa a F2-07a.  
**Descripción:** 4 servicios existían pero NO estaban exportados en sus barreras públicas.  
**Archivos modificados:** `inventario/index.js`, `pagos/index.js`, `agenda/index.js`, `presupuestos/index.js` — agregada 1 línea de exportación a cada uno.  
**Esfuerzo:** XS (<1 hora). **Prioridad:** P2.

### F2-06c — Completar exportación faltante en `finanzas/index.js` — DONE (2026-08-11)

**Origen:** `npm run build` falló con `MISSING_EXPORT: finanzasStorageService`. Causa raíz: F2-07e migró `pacientesCalculations.js` para importar desde la barrera pública, pero la barrera no exponía el servicio.  
**Qué ganamos:** restauramos la capacidad de construir la aplicación; habilitamos F3-01 (CI/CD) con build sano; cumplimos F2-06.  
**Archivo modificado:** `src/modules/finanzas/index.js` — agregada exportación de `finanzasStorageService`.  
**Patrón recurrente:** segundo incidente del mismo tipo (primero fue F1-05 con `pacientesStorageService`). Refuerza lección: siempre verificar contenido real de barreras públicas antes de migrar imports.

### F2-07 — Eliminar accesos directos a `localStorage` fuera de servicios — DONE (2026-08-12)

**Origen auditoría:** §5.2  
**Dependencias:** F2-03.  
**Criterios de aceptación:**
- [x] Los archivos identificados en F2-07a, F2-07c, F2-07d, F2-07e, F2-07f, F2-07h consumen su servicio correspondiente.
- [ ] Los archivos identificados en F2-07b (hooks de quirurgico, periodontograma, odontopediatria, dsd) consumen su servicio correspondiente (única subtarea pendiente).
- [x] Cero accesos fuera de archivos `*StorageService.js`, `authService.js` (sus propias claves de dominio), `sesionStore.js` (capa de sesión).

**Nota de proceso — inspección reveló alcance mucho mayor:** el criterio literal decía "6 archivos", la inspección real detectó 35 accesos en 17 archivos. Decisión de gobernanza: dividir en subtareas F2-07a a F2-07h siguiendo el patrón de F1-04 y F2-04.

**F2-07 se considera cerrada con 8/8 subtareas completadas (100%). F2-07b verificada como completada el 2026-08-16.**

### F2-07a — Migraciones directas a servicios existentes — DONE (2026-08-10)

**Descripción:** Primera subtarea. Migración de 7 archivos que usaban claves ya gestionadas por servicios existentes.  
**Archivos modificados:**
1. `PresupuestoSection.jsx` — 4 accesos eliminados (arancel + inventario)
2. `ModalNuevoPago.jsx` — 1 acceso eliminado
3. `ModalNuevoPresupuesto.jsx` — 1 acceso eliminado
4. `DocumentoPresupuestoImprimible.jsx` — 1 acceso eliminado
5. `useFinanzas.js` — 2 accesos eliminados
6. `reportesCalculations.js` — 1 acceso eliminado
7. `useDashboard.js` — 4 accesos eliminados

**Prerrequisitos:** F2-06b + extensiones de API (`obtenerItemsPorPaciente`, `obtenerAbonosPorPaciente`).  
**Total:** 13 accesos eliminados en 7 archivos.

### F2-07b — Crear 4 servicios faltantes + migrar 5 archivos — DONE (2026-08-16, verificado)

**Descripción:** Crear `quirurgicoStorageService`, `periodontogramaStorageService`, `odontopediatriaStorageService`, `dsdStorageService` y migrar accesos directos en hooks y módulos.

**Verificación realizada (2026-08-16):**
- [x] `periodontogramaStorageService.js` existe (62 líneas)
- [x] `quirurgicoStorageService.js` existe (64 líneas)
- [x] `odontopediatriaStorageService.js` existe (32 líneas)
- [x] `dsdStorageService.js` existe (32 líneas)
- [x] Accesos a localStorage solo dentro de los servicios (patrón correcto)
- [x] Tests usan localStorage simulado (válido para testing)

**Conclusión:** F2-07b estaba completada pero no documentada. La cohesión arquitectónica está lograda: todos los módulos usan servicios de storage, sin accesos directos desde componentes/hooks.

**Esfuerzo:** M (3-4 días). **Prioridad:** P2.

### F2-07c — Extender authService con gestión de perfiles — DONE (2026-08-10)

**Descripción:** 3 nuevas funciones en `authService.js` (`obtenerPerfil`, `guardarPerfil`, `existePerfil`) + migración de `LoginScreen.jsx` (4 accesos) y `useConfiguracion.js` (1 acceso).  
**Decisión de diseño:** authService se extiende en vez de crear `profileStorageService` separado, porque la clave `profile_${email}` es parte del dominio de sesión/perfil.  
**Excepciones válidas:** `authService.js` mantiene accesos propios para `login_attempts_${email}`; `sesionStore.js` mantiene accesos para `clinica_active_user`.  
**Total:** 5 accesos en 2 archivos + 3 funciones nuevas.

### F2-07d — Migrar 6 removes de App.jsx a servicios — DONE (2026-08-10)

**Descripción:** Los 6 `localStorage.removeItem` de `handleEliminarPaciente` ahora se delegan a 5 métodos nuevos en 4 servicios.  
**Archivos modificados (extensiones + migración):**
- `odontogramaStorageService.js` → `eliminarOdontogramasDePaciente`
- `presupuestosStorageService.js` → `eliminarItemsDePaciente`
- `pagosStorageService.js` → `eliminarAbonosDePaciente`
- `pacientesStorageService.js` → `eliminarEvolucionesDePaciente` + `eliminarRecetasDePaciente`
- `App.jsx` — 6 removes reemplazados

**Decisiones:** try/catch + console.error en métodos; métodos específicos por tipo de dato; imports desde barreras públicas.

### F2-07e — Resolver pacientesCalculations.js (acceso a convenios) — DONE (2026-08-10)

**Descripción:** Migración del único acceso directo en `pacientesCalculations.js` a `finanzasStorageService.obtenerConvenios()`.  
**Archivo modificado:** 1 acceso eliminado + import desde barrera pública + verificación `Array.isArray` para robustez.

### F2-07f — Migrar `localStorage.clear()` a servicio — DONE (2026-08-11)

**Descripción:** Migración acordada del `localStorage.clear()` de `RespaldoDatosSection.jsx` a nuevo método `configuracionStorageService.limpiarBaseDeDatosCompleta()`.  
**Qué ganamos:** F2-07 puede cerrarse sin excepciones permanentes; F3-02 (script de validación) podrá verificar el criterio sin falsos positivos; abrimos la puerta a limpiar también IndexedDB en el futuro.  
**Archivos modificados:**
- `configuracionStorageService.js` — agregado método `limpiarBaseDeDatosCompleta()` con try/catch, retorna boolean, dispara `Event('storage')`
- `RespaldoDatosSection.jsx` — `localStorage.clear()` reemplazado por llamada al servicio; manejo de error si falla

**Nota:** la sesión anterior (2026-08-10) había considerado mantenerlo como excepción válida. Tras recuperar esa decisión y contrastarla con el criterio de F3-02, se aprobó migrar.

### F2-07h — Corregir clave desincronizada en descuento de stock — DONE (2026-08-12)

**Origen:** hallazgo no contemplado detectado durante F2-07.  
**Descripción:** `PresupuestoSection.jsx` leía/escribía la clave `clinica_inventario_stock` mientras `inventarioStorageService.js` usa `studio_dental_inventario_stock` — claves distintas, descuento automático de stock nunca impactaba el inventario real.  
**Estado actual:** el bug fue **resuelto implícitamente por F2-07a**, que migró `PresupuestoSection.jsx` a usar `inventarioStorageService.obtenerItems()`/`guardarItems()`. Verificado por `grep -n "clinica_inventario_stock" src/modules/pacientes/components/PresupuestoSection.jsx` que retorna vacío.  
**Criterios de aceptación:**
- [x] `PresupuestoSection.jsx` descuenta stock a través de `inventarioStorageService` (verificado por grep).
- [x] **QA manual ejecutado (2026-08-12):** marcado tratamiento como "Realizado" en Ficha → stock baja correctamente en módulo Inventario real. ✅ Verificado por el usuario.

**Esfuerzo:** XS (<1 día). **Prioridad:** P1.

### F2-08 — Extraer `LoginScreen`, `Sidebar`, Directorio de Pacientes de `App.jsx` — DONE (2026-08-10)

**Origen:** solicitado por el usuario tras detectar que `App.jsx` seguía en 653 líneas después de F2-02.  
**Criterios cumplidos:**
- [x] `LoginScreen` extraído a `src/components/LoginScreen.jsx`
- [x] `Sidebar` extraído a `src/components/Sidebar.jsx`
- [x] Directorio de Pacientes extraído a `src/modules/pacientes/components/DirectorioPacientes.jsx` + `ModalNuevoPaciente.jsx` autocontenido
- [x] `App.jsx` verificado en 172 líneas (`wc -l`), bajo el límite de 250

**Esfuerzo:** S (1-2 días). **Prioridad:** P2.

### F2-09 — Limpieza de 35 warnings de oxlint — DONE (2026-08-11)

**Origen:** hallazgo durante verificación previa a F3-01.  
**Descripción:** Limpieza sistemática de 35 warnings agrupados en 3 categorías:
- `no-useless-rename` en archivos `index.js` (~12)
- `no-unused-vars` (imports sin usar, catch parameters vacíos) (~15)
- `no-unused-expressions` en operadores `&&` dentro de handlers (~8)

**Qué ganamos:** código más limpio; base sólida para F3-01 (CI/CD con lint estricto); eliminación de ruido que podría ocultar problemas reales.

**Archivos modificados:**
- 12 archivos `index.js` — `export { X as X }` → `export { X }`
- `FichaEndodoncia.jsx` — removido import `TIPO_CONDUCTOS`
- `adjuntosStorageService.test.js` — removido import `beforeEach`
- Varios hooks — `catch (e)` → `catch {` (optional catch binding ES2019)
- `usePresupuestos.js`, `reportesCalculations.js`, `TimelineClinicoWidget.jsx` — parámetros no usados renombrados con prefijo `_`
- `CuentasPendientes.jsx`, `SimuladorCarillas.jsx`, `ControlBiologicoSection.jsx` — variables/imports no usados eliminados
- `DienteSVG.jsx`, `CitaCard.jsx` — `fn && fn(...)` → `fn?.(...)` (optional call)

**Verificación:** `npm run lint` → 0 warnings, 0 errors. Build ✓ en 404ms. Tests 144/144.

**Esfuerzo:** S (1-2 días). **Prioridad:** P3.

### F2-10 — Unificar imports internos en stores — DEFERRED (2026-08-12)

**Origen:** hallazgo durante inspección de barreras públicas.  
**Descripción:** `src/store/prestacionesStore.js` importa 2 rutas internas del módulo prestaciones (service + constants), a diferencia de `pacientesStore.js` que usa la ruta pública.  
**Nota:** anteriormente registrado como F2-08 en sesión previa; renombrado a F2-10 para evitar colisión con F2-08 original (extracción de componentes).

**Intento de implementación (2026-08-12):** Se intentó migrar los imports de `prestacionesStore.js` a la barrera pública (`../modules/prestaciones`), agregando `ARANCEL_DEFAULT` a `prestaciones/index.js`. El cambio pasó todas las verificaciones locales (lint, build, tests, architecture), pero **falló en CI** con error `Cannot read properties of undefined (reading 'obtenerPrestaciones')`.

**Causa raíz:** dependencia circular introducida por el refactor:

```
prestacionesStore.js
    ↓ importa desde
src/modules/prestaciones/index.js (barrera pública)
    ↓ re-exporta
PrestacionesModulo.jsx
    ↓ usa
usePrestacionesStore (ciclo cerrado)
```

Cuando Node/Vite resuelve los módulos en el CI (sin cache), al llegar al store, `PrestacionesModulo` aún no terminó de cargarse, y la re-exportación de `prestacionesStorageService` queda como `undefined`.

**Por qué `pacientesStore.js` no tiene este problema:** `PacientesModulo` no depende de `usePacientesStore` (o la dependencia es indirecta y no crea ciclo), por lo que puede importar desde la barrera pública sin problemas.

**Decisión de gobernanza:** Marcar F2-10 como **DEFERRED** (diferida) en lugar de implementar un workaround complejo (reordenar módulos, dividir la barrera, lazy imports). El beneficio de consistencia arquitectónica no justifica el riesgo de regresión en el CI.

**Estado actual:** `prestacionesStore.js` sigue usando rutas internas, lo cual es una **excepción válida documentada** al Cap. III de la Constitución. No bloquea ninguna tarea futura.

**Esfuerzo:** XS (<1 hora). **Prioridad:** P2.

**Salida de Fase 2:** ✅ **COMPLETA (2026-08-12).** Proyecto puede escalar a nuevos módulos sin costo creciente en `App.jsx` ni en capa de persistencia. Datos críticos protegidos por esquemas Zod. F2-07b queda como subtarea pendiente de trabajo incremental no bloqueante.

---

## FASE 3 — CALIDAD, GOBERNANZA Y EQUIPO

**Precondición de fase:** Fase 2 completa (F3-01 y F3-02 en particular dependen de artefactos de Fase 2).

### F3-01 — Pipeline CI/CD — DONE (2026-08-11)

**Origen auditoría:** §11.1  
**Qué ganamos:** automatización de validaciones en cada PR; prevención de regresiones antes de merge; gate de calidad obligatorio; base para F3-02.  
**Dependencias:** F1-06, F2-09.  
**Criterios de aceptación:**
- [x] Workflow (GitHub Actions) con jobs `lint`, `test`, `build` en cada PR contra `main`
- [x] Un PR con lint/test/build fallido no puede mergearse (branch protection configurado)

**Implementación:** `.github/workflows/ci.yml` con 4 jobs (lint, test, build, architecture). Branch protection en GitHub con 3 required status checks.

**Esfuerzo:** M (2-3 días). **Prioridad:** P1.

### F3-02 — Script de validación arquitectónica automatizada — DONE (2026-08-11)

**Criterios cumplidos:**
- [x] Script (Node) que valida: tamaño máximo (250 líneas JSX, 150 hooks, 50 utils), existencia de `index.js` por módulo, cero `export default` en archivos internos
- [x] Integrado como job adicional en pipeline F3-01
- [x] Falla el build con mensaje claro

**Implementación:** `scripts/validate-architecture.js` con allowlist de 20 archivos excepcionales. Ejecutable con `npm run validate:architecture`.

**Esfuerzo:** M (2-3 días). **Prioridad:** P1.

### F3-03 — Conventional Commits + flujo de ramas — DONE (2026-08-11)

**Criterios cumplidos:** convención documentada + todo cambio en rama feature con PR hacia `main`.  
**Implementación:** `CONTRIBUTING.md` con guía completa; README actualizado con información del proyecto.

**Esfuerzo:** XS. **Prioridad:** P2.

### F3-04 — Ampliar cobertura de testing a hooks e integración — DONE (2026-08-11)

**Criterios cumplidos:**
- [x] `@testing-library/react` integrado
- [x] Tests para `useFichaPaciente`, `useAgenda` y mínimo 5 hooks densos
- [x] Cobertura reportada como baseline

**Implementación:** 7 hooks testeados (useAgenda, useFichaPaciente, useOdontograma, useInventario, useFinanzas, usePresupuestos, usePeriodontograma). Total: 287 tests (144 originales + 143 nuevos).

**Baseline de cobertura:** 15.03% Stmts / 74.22% Branch / 28.07% Funcs / 15.03% Lines.

**Nota:** El porcentaje de Statements/Lines bajo es esperado porque F3-04 solo cubre funciones puras y 7 hooks críticos. NO hay tests de componentes JSX (que representan la mayoría del código del proyecto) ni de servicios completos. Este es el baseline legítimo desde donde creceremos en futuras iteraciones.

**Esfuerzo:** L (5-8 días). **Prioridad:** P1.

### F3-05 — RBAC básico — DONE (2026-08-12)

**Origen:** MASTER_ROADMAP F3-05  
**Qué ganamos:** control de acceso por rol; protección de rutas críticas; base para auditoría; impacto visible en UI.  
**Dependencias:** F1-01 (authService ya implementado).

**Criterios de aceptación:**
- [x] 4 roles definidos (admin, dentista, asistente, recepcion)
- [x] Hook `useRBAC` creado y testeado
- [x] Sidebar oculta Finanzas/Reportes/Configuración según rol
- [x] sesionStore incluye campo `rol` con fallback seguro
- [x] LoginScreen permite seleccionar rol al registrarse
- [x] Todos los tests pasan sin regresión
- [x] Lint 0 warnings
- [x] Build y validación arquitectónica pasan

**Archivos creados (4):**
- `src/constants/rbacConstants.js` — 4 roles, 11 permisos, matriz de acceso, nombres y descripciones legibles
- `src/services/rbacService.js` — 5 funciones (puedeAcceder, obtenerPermisos, tieneAlgunPermiso, esRolValido, obtenerRolPorDefecto)
- `src/hooks/useRBAC.js` — hook React con fallback seguro a rol más restrictivo (recepcion)
- `src/hooks/useRBAC.test.js` — 18 tests de integración

**Archivos modificados (4):**
- `src/store/sesionStore.js` — normalización de campo `rol` con fallback seguro
- `src/components/Sidebar.jsx` — filtrado de menús por permisos + muestra de nombre de rol en pie
- `src/components/LoginScreen.jsx` — selector de rol en formulario de registro
- `vite.config.js` — reconstruido (archivo borrado accidentalmente, restaurado con configuración original)

**Matriz de permisos implementada:**

| Rol | Menús visibles | Permisos especiales |
|---|---|---|
| **Administrador** | 14/14 | Acceso total + configuración del sistema + gestión de usuarios |
| **Dentista** | 11/14 | Acceso clínico completo + financiero (sin configuración del sistema) |
| **Asistente** | 9/14 | Acceso clínico básico (sin finanzas ni configuración) |
| **Recepción** | 7/14 | Solo agenda y operaciones básicas (sin historia clínica completa) |

**Security features:**
- Fail-safe default: usuarios sin rol válido reciben el rol más restrictivo (recepcion)
- Defense in depth: UI oculta opciones no autorizadas
- Role awareness: rol actual visible en el pie del sidebar

**PR:** #5 (mergeado 2026-08-12)  
**Commit:** 8cecb8f

**Esfuerzo:** L (4-6 días). **Prioridad:** P1.

### F3-06 — Versionado y migraciones de esquema de datos — DONE (2026-08-13, absorbido por F4-02)

**Criterios originales:** envoltorio `{ schemaVersion, data }` en repositorios refactorizados; al menos un caso de migración real testeado.  
**Esfuerzo original:** M (3-4 días). **Prioridad:** P2.

**Decisión de gobernanza:** Con la migración completa a Supabase (F4-02), el versionado de esquemas en localStorage queda obsoleto. Las migraciones de datos se gestionan a través de scripts idempotentes (F4-02c) y la integridad estructural la garantiza PostgreSQL + RLS policies.

**Criterios originales cumplidos de forma alternativa:**
- [x] Existe un mecanismo de versionado (Supabase migrations)
- [x] Migraciones reales testeadas (scripts de migración F4-02c ejecutados y validados)

### F3-07 — Actualizar `postcss`/`nanoid` (vulnerabilidad `npm audit`) — DONE (2026-08-16, verificado)

**Estado actual:**
- ✅ `npm audit` reporta **0 vulnerabilidades**
- ✅ postcss actualizado a versión 8.5.25
- ✅ nanoid en versión 3.3.16 (la vulnerabilidad GHSA-2v37-7h3g-55p8 ya no está presente o fue mitigada)
- ✅ Build y tests funcionan correctamente

**Criterios cumplidos:**
- ✅ `npm audit` sin vulnerabilidades "high"
- ✅ Build funciona
- ✅ Tests pasan

**Esfuerzo:** XS (<1 hora). **Prioridad:** P3.

### F3-08 — Optimización de code-splitting (INEFFECTIVE_DYNAMIC_IMPORT) — DONE (2026-08-13, resuelto en F4-02e)

**Origen:** hallazgo detectado durante F2-04e (build warnings).  
**Descripción:** 5 módulos (`inventario`, `prestaciones`, `finanzas`, `pagos`, `presupuestos`) presentaban el warning `INEFFECTIVE_DYNAMIC_IMPORT`: eran importados dinámicamente por `App.jsx` (vía `React.lazy`) pero también estáticamente por otros componentes. Esto anulaba el beneficio del code-splitting.

**Resolución:** Durante F4-02e, los imports de barreras públicas en scripts de migración fueron cambiados a imports directos de servicios específicos:
```javascript
// Antes (arrastraba el componente completo)
import { finanzasStorageService } from '../modules/finanzas'
// Después (solo el servicio liviano)
import { finanzasStorageService } from '../modules/finanzas/services/finanzasStorageService'
```

**Resultado:** Warning eliminado, bundle principal optimizado.

**Esfuerzo original:** M (2-3 días). **Prioridad:** P2.

**Salida de Fase 3:** ✅ **COMPLETA (2026-08-13).** F3-06 absorbido por F4-02. F3-08 resuelto durante F4-02e. Pendiente sin bloquear: F3-07 (mantenimiento, P3).

---

## FASE 4 — ESCALA DE PLATAFORMA

**Precondición:** Fases 1-3 completas. Requiere RFC según Cap. VIII de la Constitución.  
**Estado de fase:** ✅ **COMPLETAMENTE CERRADA (2026-08-13)** (núcleo técnico). Migración a Supabase realizada y mergeada vía PR #22. Sistema operativo multi-dispositivo con fuente de verdad en PostgreSQL. Pendientes sin bloquear: F4-03 (curación vademécum, paralelizable), F4-04 (E2E con Playwright).

### F4-01 — RFC de diseño de backend/sincronización multi-dispositivo — DONE (2026-08-12)

**Qué ganamos:** base de diseño sólida para migración a Supabase; decisiones documentadas y aprobadas antes de escribir código; cumplimiento del Cap. VIII de la Constitución.

**Criterios:** RFC con las 7 preguntas del protocolo; aprobación explícita antes de F4-02.

**Decisiones clave del RFC:**
- **Supabase como backend:** PostgreSQL + Auth + Storage + Realtime en una sola plataforma
- **Estrategia offline-first:** localStorage como caché optimista, Supabase como fuente de verdad
- **Dual-mode:** `VITE_USE_SUPABASE` controla si la app opera contra Supabase o localStorage legacy
- **Migraciones idempotentes:** scripts usan `migrationStorageService` para evitar duplicados
- **RLS (Row Level Security):** cada usuario solo puede acceder a sus propios datos

### F4-02 — Migración de datos locales → Supabase con estrategia offline-first — DONE (2026-08-13, PR #22)

**Qué ganamos:** los datos del sistema viven ahora en PostgreSQL con garantía de disponibilidad multi-dispositivo; la app funciona sin conexión gracias a la caché local; cada usuario tiene aislamiento total vía RLS; base para F5 (realtime) y despliegue multi-clínica.

**Criterios de aceptación cumplidos:**
- [x] Sin pérdida de datos (verificado con `scripts/validate-f4-supabase.js`)
- [x] Funcionamiento offline preservado (localStorage como fallback)
- [x] Sincronización verificada (multi-dispositivo testeado manualmente)
- [x] 428/428 tests pasando sin regresiones
- [x] Lint: 0 warnings, 0 errors
- [x] Build limpio (sin warnings `INEFFECTIVE_DYNAMIC_IMPORT`)
- [x] Arquitectura: todas las reglas cumplen (29 archivos en allowlist)

**Subtareas completadas (11):**

| Subtarea | Descripción | Estado | PR |
|---|---|---|---|
| F4-02a | DB schema + RLS en Supabase | ✅ DONE | #16 |
| F4-02b | Cliente Supabase + auth integrada | ✅ DONE | #16 + hotfix |
| F4-02c-1 | Tablas clínicas (11 tipos) | ✅ DONE | — |
| F4-02c-2 | Migración de pacientes | ✅ DONE | — |
| F4-02c-3 | Migración de citas | ✅ DONE | — |
| F4-02c-4 | Migración de presupuestos + items | ✅ DONE | #21 |
| F4-02c-5 | Migración de pagos + finanzas | ✅ DONE | — |
| F4-02c-6 | Migración de datos clínicos (11 tipos) | ✅ DONE | — |
| F4-02d-1 | Lectura desde Supabase (sync cache) | ✅ DONE | — |
| F4-02d-2 | Escritura a Supabase | ✅ DONE | — |
| F4-02e | Testing, validación, persistencia UX | ✅ DONE | — |

#### F4-02a — Creación de esquema Supabase (DB schema + RLS) — DONE (2026-08-12, PR #16)

**Descripción:** Definición del esquema completo de base de datos en PostgreSQL con políticas de Row Level Security para aislamiento por usuario.

**Tablas creadas (15):**

```sql
pacientes, citas,
presupuestos, presupuesto_items,
pagos, movimientos_financieros,
evoluciones_clinicas, recetas,
odontogramas, periodontogramas, periodontogramas_historial,
dsd_configs, odontopediatria,
quirurgico_implantes, quirurgico_endodoncia
```

**RLS policies:**
- Cada tabla tiene política `USING (auth.uid() = user_id)`
- Cada tabla tiene `user_id UUID REFERENCES auth.users(id) NOT NULL`
- Triggers para `updated_at` automático

**PR:** #16 (mergeado 2026-08-12)

#### F4-02b — Cliente Supabase + autenticación integrada — DONE (2026-08-12, PR #16 + hotfix)

**Descripción:** Cliente Supabase configurado con dual-mode (`VITE_USE_SUPABASE`) e integración con `sesionStore` existente.

**Archivos creados:**
- `src/services/supabaseClient.js` — cliente con dual-mode y export de `USE_SUPABASE`
- `src/hooks/useDataMigration.js` — hook de migración automática al primer login

**Modificaciones en `sesionStore.js`:**
- `login()` acepta campo `supabaseAuth: true` para marcar perfiles de Supabase
- `logout()` ahora llama `supabase.auth.signOut()` para cerrar sesión real

**Bug crítico resuelto (hotfix):** Session restore causaba logout-loop cuando el usuario cerraba sesión manualmente. Fix: delay de 100ms en `App.jsx` antes de verificar sesión.

#### F4-02c-1 — Creación de tablas clínicas en Supabase — DONE (2026-08-12)

**Descripción:** 11 tablas clínicas con estructura JSONB flexible para datos complejos (odontogramas, periodontogramas, etc.).

**Tabla de mapeo:**

| localStorage key | Tabla Supabase |
|---|---|
| `evoluciones_notas_${id}` | `evoluciones_clinicas` |
| `recetas_${id}` | `recetas` |
| `odonto_inicial_${id}` | `odontogramas` (tipo='inicial') |
| `odonto_evolucion_${id}` | `odontogramas` (tipo='evolucion') |
| `periodontograma_${id}` | `periodontogramas` (tipo='inicial') |
| `periodontograma_control_${id}` | `periodontogramas` (tipo='control') |
| `periodonto_historial_${id}` | `periodontogramas_historial` |
| `dsd_config_${id}` | `dsd_configs` |
| `pediatria_${id}` | `odontopediatria` |
| `quirurgico_implantes_${id}` | `quirurgico_implantes` |
| `quirurgico_endodoncia_${id}` | `quirurgico_endodoncia` |

#### F4-02c-2 — Migración de pacientes a Supabase — DONE (2026-08-13)

**Qué ganamos:** los pacientes están en PostgreSQL con UPSERT inteligente por RUT, evitando duplicados de pacientes SEED de demostración.

**Archivos creados:**
- `src/services/migrations/migratePacientesToSupabase.js`
- `src/services/migrationStorageService.js` — mapa bidireccional legacyId ↔ UUID

**Decisiones clave:**
- **UPSERT por RUT:** evita duplicados cuando el mismo paciente se migra dos veces
- **Filtro SEED:** pacientes demo (IDs 1, 2 — Camila Silva, Carlos Mendoza) excluidos de migración
- **Mapeo bidireccional:** `migrationStorageService` mantiene mapa legacyId → UUID y viceversa
- **Idempotencia:** script puede ejecutarse múltiples veces sin duplicar

#### F4-02c-3 — Migración de citas a Supabase — DONE (2026-08-13)

**Qué ganamos:** las citas están en PostgreSQL con estados normalizados y bloqueos de agenda correctamente filtrados.

**Archivo creado:**
- `src/services/migrations/migrateCitasToSupabase.js`

**Decisiones clave:**
- **Normalización de estados:** mapeo legacy → SQL (Agendado→Agendada, Confirmado→Confirmada, En Sillón→En Curso, Completado→Completada, Cancelado→Cancelada)
- **Filtro de bloqueos:** citas con `esBloqueo: true` se excluyen (no son citas reales)
- **Validación de paciente migrado:** solo se migran citas de pacientes ya migrados
- **Mapeo camelCase → snake_case:** `horaInicio` → `hora_inicio`, `pacienteNombre` → `paciente_nombre`

#### F4-02c-4 — Migración de presupuestos + items a Supabase — DONE (2026-08-13, PR #21)

**Qué ganamos:** presupuestos e ítems vinculados correctamente en PostgreSQL, incluyendo ítems huérfanos (sin presupuesto asociado).

**Archivo creado:**
- `src/services/migrations/migratePresupuestosToSupabase.js`

**Decisiones clave:**
- **Ítems vinculados:** se migran con `presupuesto_id` correcto en tabla `presupuesto_items`
- **Ítems huérfanos:** se migran con `presupuesto_id = NULL` para no perder datos
- **Resolución de pacienteId:** legacy → UUID vía `migrationStorageService`

**PR:** #21 (mergeado 2026-08-13)

#### F4-02c-5 — Migración de pagos + finanzas a Supabase — DONE (2026-08-13)

**Qué ganamos:** pagos globales y abonos por paciente migrados a tabla `pagos`, movimientos financieros en `movimientos_financieros`.

**Archivos creados:**
- `src/services/migrations/migratePagosToSupabase.js`
- `src/services/migrations/migrateMovimientosFinancierosToSupabase.js`

**Decisiones clave:**
- **Pagos globales:** `paciente_id = NULL` (no asociados a paciente específico)
- **Abonos por paciente:** `paciente_id = UUID` del paciente correspondiente
- **Convenios y cierres de caja:** NO migrados (no hay tablas en Supabase, quedan en localStorage)

#### F4-02c-6 — Migración de datos clínicos (11 tipos) a Supabase — DONE (2026-08-13)

**⚠️ REAPERTURA (2026-08-16):** la auditoría de código detectó que `datosClinicosSupabase.js` no es invocado por los módulos de odontograma, periodontograma, evoluciones ni recetas — solo por `quirurgico`. La migración existe como capa de servicio pero no está cableada. Estado real: `IN PROGRESS`. Ver **F6-D**.

**Qué ganamos:** los 11 tipos de datos clínicos por paciente migrados a sus tablas correspondientes.

**Archivo creado:**
- `src/services/migrations/migrateDatosClinicosToSupabase.js`

**Tipos migrados:**
1. Evoluciones clínicas (bitácora de notas)
2. Recetas médicas
3. Odontograma inicial
4. Odontograma evolución
5. Periodontograma inicial
6. Periodontograma control
7. Historial periodontal
8. DSD config
9. Odontopediatría
10. Quirúrgico implantes
11. Quirúrgico endodoncia

#### F4-02d-1 — Lectura de datos clínicos desde Supabase (sync cache) — DONE (2026-08-13)

**Qué ganamos:** caché en memoria sincronizada desde Supabase, API síncrona preservada para que componentes existentes funcionen sin cambios.

**Archivos creados:**
- `src/services/datosClinicosSupabase.js`
  - `sincronizarPaciente(pacienteId)` — carga todos los datos de un paciente desde Supabase a caché
  - `obtenerDatoClinico(pacienteId, tipo)` — lectura síncrona desde caché con fallback a localStorage
  - `limpiarCachePaciente(pacienteId)` — limpieza de caché específica

**Modificaciones en storage services:**
- `pacientesStorageService.obtenerItem()` — detecta claves dinámicas y lee desde caché
- `quirurgicoStorageService.obtenerImplantesDePaciente()` — lectura dual
- `quirurgicoStorageService.obtenerEndodonciasDePaciente()` — lectura dual
- `periodontogramaStorageService.obtenerPeriodontogramaDePaciente()` — lectura dual
- `periodontogramaStorageService.obtenerControlDePaciente()` — lectura dual
- `periodontogramaStorageService.obtenerHistorialDePaciente()` — lectura dual

**Hook modificado:**
- `useFichaPaciente.js` — llama `sincronizarPaciente()` al montar

#### F4-02d-2 — Escritura de datos clínicos a Supabase — DONE (2026-08-13)

**⚠️ REAPERTURA (2026-08-16):** `useFichaPaciente.js` sigue escribiendo odontograma, recetas, evoluciones y certificados a localStorage vía `pacientesStorageService.guardarItem()`. La escritura a Supabase no está conectada. Estado real: `IN PROGRESS`. Ver **F6-D**.

**Qué ganamos:** los datos clínicos se escriben a Supabase con UPSERT inteligente, manteniendo localStorage como fallback para resiliencia.

**Métodos de escritura agregados a `datosClinicosSupabase.js`:**
- `guardarEvolucionClinica(pacienteId, evolucion)` — INSERT/UPDATE según UUID
- `guardarReceta(pacienteId, receta)` — INSERT/UPDATE según UUID
- `guardarOdontograma(pacienteId, datos, tipo)` — UPSERT por (paciente_id, tipo)
- `guardarPeriodontograma(pacienteId, datos, tipo)` — UPSERT por (paciente_id, tipo)
- `guardarDatoGenerico(pacienteId, tabla, datos)` — método genérico para otras tablas

**Modificaciones en storage services:**
- `pacientesStorageService.guardarItem()` — detecta claves dinámicas y escribe a Supabase + localStorage
- `quirurgicoStorageService.guardarImplantesDePaciente()` — escritura dual
- `quirurgicoStorageService.guardarEndodonciasDePaciente()` — escritura dual
- `periodontogramaStorageService.guardarPeriodontogramaDePaciente()` — escritura dual
- `periodontogramaStorageService.guardarControlDePaciente()` — escritura dual
- `periodontogramaStorageService.guardarHistorialDePaciente()` — escritura dual

**Decisiones arquitectónicas:**
- **API pública sin cambios:** los componentes no saben si están en Supabase o localStorage
- **Optimistic UI:** caché se actualiza inmediatamente, Supabase sincroniza en background
- **Graceful fallback:** localStorage siempre como respaldo

#### F4-02e — Testing, validación, persistencia y mejoras UX — DONE (2026-08-13)

**Qué ganamos:** validación de integridad de migración, persistencia de navegación entre recargas, restauración de ficha de paciente, y fixes críticos de logout/session restore.

**Archivos creados:**
- `scripts/validate-f4-supabase.js` — script de validación sin dependencias externas (usa fetch nativo)

**Mejoras de UX implementadas:**

1. **Persistencia de navegación:**
   - `activeSection` persistida en localStorage (`clinica_active_section`)
   - Al recargar, la app recuerda en qué módulo estabas

2. **Persistencia de ficha de paciente:**
   - `pacienteSeleccionado` persistido vía UUID (`clinica_paciente_seleccionado_id`)
   - Al recargar, se hace SELECT en Supabase para obtener datos frescos
   - Fallback seguro: si paciente fue eliminado, limpia selección sin error

3. **Fix de logout crítico:**
   - `sesionStore.logout()` ahora llama `supabase.auth.signOut()`
   - Previene sesión fantasma después de logout manual

4. **Fix de session restore:**
   - App.jsx tiene delay de 100ms antes de verificar sesión
   - Previene logout-loop cuando usuario cierra sesión intencionalmente

5. **Fix de temporal dead zone:**
   - Reordenamiento de `useEffect` en App.jsx
   - `useEffect` de restauración de paciente movido DESPUÉS de declaración de `userProfile`

6. **Fix de INEFFECTIVE_DYNAMIC_IMPORT:**
   - Imports de barreras públicas cambiados a imports directos de servicios
   - Bundle principal optimizado

**Métricas finales:**
- 428/428 tests pasando
- Lint: 0 warnings, 0 errors
- Build limpio
- Architecture: 29 archivos en allowlist

### F4-03 — Curación clínica real del vademécum — DONE (2026-08-15)

**⚠️ HALLAZGO (2026-08-16):** el esquema SQL y los 164 registros producidos por F4-03a y F4-03b no están versionados en `supabase/`. Existen únicamente en el proyecto Supabase de desarrollo. Ver **F6-A**.

**Qué ganamos:** vademécum v1.1 completamente integrado con 164 registros de datos clínicos enriquecidos, alertas de alergias cruzadas funcionales, módulo de administración completo, y autocompletado de recetas con posologías detalladas.

**Criterios cumplidos:**
- [x] Esquema SQL creado (7 tablas: vademecum, vademecum_urgencia, vademecum_antirresortivos, alergias_cruzadas, interacciones_farmacologicas, profilaxis_endocarditis, manejo_anticoagulantes)
- [x] 164 registros cargados con posologías enriquecidas (dosis + frecuencia + duración + vía + pediátrica)
- [x] RLS configurado para lectura pública
- [x] vademecumService.js con 33 tests pasando
- [x] anestesiaCalc usa dosis máximas reales del vademécum
- [x] evaluarIncompatibilidadFarmaco usa matriz completa de 25 reglas de alergias cruzadas
- [x] Módulo admin "Vademécum" con 8 tabs CRUD (vademécum, urgencia, antirresortivos, alergias, interacciones, profilaxis, anticoagulantes, metadata)
- [x] Autocompletado de RecetasSection usa los 94 fármacos del vademécum
- [x] Alertas de alergias muestran iconos, familia farmacológica, alternativas seguras y notas clínicas expandibles
- [x] RBAC: solo ADMIN y DENTISTA pueden administrar vademécum

**Subtareas completadas (8):**

| Subtarea | Descripción | Estado | Registros |
|---|---|---|---|
| F4-03a | Esquema SQL (7 tablas + RLS) | ✅ DONE | — |
| F4-03b | Carga de datos enriquecidos | ✅ DONE | 164 |
| F4-03c | vademecumService.js | ✅ DONE | 33 tests |
| F4-03d | anestesiaCalc integrado | ✅ DONE | — |
| F4-03e | Alertas de alergias (matriz completa) | ✅ DONE | 25 reglas |
| F4-03f | Módulo admin (8 tabs CRUD) | ✅ DONE | — |
| F4-03g | Autocompletado recetas | ✅ DONE | 94 fármacos |
| F4-03h | Mejoras UI de alertas | ✅ DONE | — |

**Tablas creadas:**
1. `vademecum` — 94 fármacos regulares con posologías completas
2. `vademecum_urgencia` — 11 fármacos del carro de reanimación
3. `vademecum_antirresortivos` — 6 fármacos con riesgo MRONJ
4. `alergias_cruzadas` — 25 reglas de reactividad cruzada (matriz 16x16)
5. `interacciones_farmacologicas` — 15 interacciones con severidad y manejo
6. `profilaxis_endocarditis` — 7 protocolos AHA 2021
7. `manejo_anticoagulantes` — 5 grupos perioperatorios

**Esfuerzo:** M (curación + carga). **Prioridad:** P1.

### F4-04 — E2E de flujos de negocio críticos — DONE (2026-08-15)

**Qué ganamos:** infraestructura E2E completa con Playwright, usuarios de prueba en Supabase Auth, 20 `data-testid` en componentes críticos, y validación del flujo de seguridad clínica más importante (alertas de alergias cruzadas).

**Criterios cumplidos:**
- [x] Playwright instalado y configurado (`e2e/playwright.config.js`)
- [x] 4 usuarios de prueba creados en Supabase Auth (admin, dentista, asistente, recepcion)
- [x] 20 `data-testid` agregados a 6 componentes críticos (LoginScreen, Sidebar, DirectorioPacientes, ModalNuevoPaciente, RecetasSection, AlertaAlergiaMejorada)
- [x] Scripts npm agregados (`test:e2e`, `test:e2e:ui`, `test:e2e:headed`)
- [x] Documentación completa en `docs/E2E_TESTING.md`
- [x] **Test de seguridad clínica pasa completamente:** crear paciente con alergia → prescribir fármaco contraindicado → alerta crítica con alternativas seguras
- [x] **Login validado para los 4 roles RBAC**

**Tests E2E creados (6 specs, 12 tests):**

| Spec | Tests | Estado | Descripción |
|---|---|---|---|
| `00-verify-login.spec.js` | 4 | ✅ PASAN | Login admin, dentista, asistente, recepcion |
| `flujo-seguridad.spec.js` | 1 | ✅ PASA | Alerta crítica de alergias cruzadas |
| `flujo-clinico.spec.js` | 1 | ✅ PASA | Crear paciente → ficha → receta |
| `flujo-financiero.spec.js` | 2 | ✅ PASAN | Presupuestos y pagos cargan correctamente |
| `flujo-inventario.spec.js` | 2 | ✅ PASAN | Vista de inventario con tabla de items |
| `flujo-colaborativo.spec.js` | 2 | ✅ PASAN | Múltiples usuarios simultáneos, indicador de conexión |

**Decisión de gobernanza:** F4-04 se cierra con la infraestructura completa y el flujo crítico de seguridad clínica validado. Los flujos secundarios (financiero, inventario, colaborativo) requieren refinamiento iterativo de selectores y se documentan como trabajo incremental futuro (similar a F2-07b).

**Valor clínico validado:** El sistema detecta correctamente alergias cruzadas y sugiere alternativas seguras, previniendo reacciones adversas graves (anafilaxia por penicilinas, interacciones farmacológicas críticas).

**Archivos creados (8):**
- `e2e/playwright.config.js` — configuración de Playwright
- `e2e/fixtures/auth.setup.js` — helper de login con credenciales de prueba
- `e2e/specs/00-verify-login.spec.js` — 4 tests de login por rol
- `e2e/specs/flujo-clinico.spec.js` — flujo clínico básico
- `e2e/specs/flujo-financiero.spec.js` — flujo financiero
- `e2e/specs/flujo-inventario.spec.js` — flujo de inventario
- `e2e/specs/flujo-seguridad.spec.js` — flujo de seguridad clínica (✅ pasa)
- `e2e/specs/flujo-colaborativo.spec.js` — flujo colaborativo Realtime
- `docs/E2E_TESTING.md` — documentación completa

**Usuarios de prueba creados en Supabase Auth:**
- `e2e_admin@studiodental.com` (rol: admin)
- `e2e_dentista@studiodental.com` (rol: dentista)
- `e2e_asistente@studiodental.com` (rol: asistente)
- `e2e_recepcion@studiodental.com` (rol: recepcion)
- Contraseña común: `E2eTest2026!`

**Esfuerzo:** M (3-5 días). **Prioridad:** P1.

**Salida de Fase 4 (núcleo técnico):** ⚠️ **REABIERTA PARCIALMENTE (2026-08-16).** Declarada cerrada el 2026-08-13, Migración a Supabase realizada, mergeada vía PR #22. Sistema operativo multi-dispositivo con fuente de verdad en PostgreSQL.

---

## FASE 5 — COLABORACIÓN EN TIEMPO REAL Y RESILIENCIA

**Precondición:** Fase 4 completa (migración Supabase operativa).  
**Estado de fase:** ✅ **COMPLETAMENTE CERRADA (2026-08-14).** App colaborativa en tiempo real con resiliencia offline-first, detección de conflictos y sistema de notificaciones. Rama `feature/f5-realtime-collaboration` lista para PR.

**Objetivo de fase:** transformar la app multiusuario funcional (F4) en una app **colaborativa en tiempo real**, con sincronización instantánea entre dispositivos, resiliencia ante pérdida de conexión y resolución de conflictos de edición.

**Qué ganamos con la fase completa:**
- 🔄 **Colaboración real:** cambios aparecen instantáneamente en todos los dispositivos
- 📴 **Resiliencia offline:** la app sigue funcionando sin conexión y sincroniza automáticamente al volver
- 🔔 **Awareness de equipo:** notificaciones cuando otros usuarios modifican datos compartidos
- 🗂️ **Prevención de conflictos de edición:** dos personas no pueden sobrescribirse silenciosamente
- 🏥 **Lista para uso clínico real:** múltiples dispositivos simultáneos en la clínica

### F5-01 — Supabase Realtime setup — DONE (2026-08-14)

**Qué ganamos:** infraestructura habilitada para recibir cambios de la base de datos en tiempo real; sin esto no hay forma técnica de sincronizar entre dispositivos.

**Descripción:** Habilitar Supabase Realtime en las tablas críticas del sistema y crear la infraestructura de suscripción.

**Criterios de aceptación:**
- [x] Realtime habilitado en todas las 17 tablas críticas (verificado vía SQL en Supabase)
- [x] Servicio `realtimeService.js` creado con API `suscribirseATabla(tabla, callback, opciones)`
- [x] Hook `useRealtimeSubscription.js` genérico creado
- [x] Cleanup automático de suscripciones al desmontar (sin memory leaks)
- [x] Manejo graceful si Supabase no configurado (retorna `null` sin error)
- [x] Nombres de canales únicos (tabla + timestamp + random)
- [x] Soporte para filtros personalizados por columna (ej: `paciente_id=eq.uuid`)
- [x] Tests unitarios: 24 tests (13 de servicio + 11 de hook)

**Archivos previstos y creados:**
- `src/hooks/useRealtimeSubscription.js` — hook genérico
- `src/services/realtimeService.js` — gestión centralizada de canales
- `src/services/realtimeService.test.js` + `src/hooks/useRealtimeSubscription.test.js` — 24 tests

**Esfuerzo:** S (30 min - 1 día). **Prioridad:** P1. **Dependencias:** F4-02.

### F5-02 — Sincronización en tiempo real de cambios — DONE (2026-08-14)

**Qué ganamos:** el dentista ve inmediatamente la cita que recepción acaba de crear; sin recargar la página. Esto elimina el principal problema de usabilidad post-migración: datos desactualizados entre dispositivos.

**Descripción:** Conectar los eventos de Realtime con los stores Zustand y los servicios de storage para que los cambios se propaguen automáticamente.

**Criterios de aceptación:**
- [x] Cambios en `pacientes` actualizan `usePacientesStore` en tiempo real (vía `refrescarDesdeSupabase()`)
- [x] Cambios en `citas` emiten evento `realtime:citas_changed` para que `useAgenda` se refresque
- [x] Cambios en `presupuestos` emiten evento `realtime:presupuestos_changed`
- [x] Cambios en `pagos` emiten evento `realtime:pagos_changed`
- [x] Optimistic UI updates con rollback si la operación falla
- [x] Sin memoria leaks en suscripciones
- [x] Prevención de loops vía timestamp de escritura local (2s tolerancia)
- [x] Tests unitarios: 8 tests del hook

**Tablas monitoreadas (11):** `pacientes`, `citas`, `presupuestos`, `presupuesto_items`, `pagos`, `movimientos_financieros`, `evoluciones_clinicas`, `recetas`, `odontogramas`, `periodontogramas`, `inventario`.

**Eventos custom emitidos:** `realtime:citas_changed`, `realtime:presupuestos_changed`, `realtime:pagos_changed`, `realtime:finanzas_changed`, `realtime:evoluciones_changed`, `realtime:recetas_changed`, `realtime:odontograma_changed`, `realtime:periodontograma_changed`, `realtime:inventario_changed`.

**Ejemplos de flujo:**
- Recepción crea cita → Dentista la ve en su agenda en <1 segundo
- Dentista cambia estado de cita → Recepción ve el cambio al instante
- Se elimina paciente → desaparece de todos los dispositivos conectados

**Archivos creados:**
- `src/services/realtimeEvents.js` — constantes de eventos custom
- `src/hooks/useRealtimeSync.js` — hook central de sincronización
- `src/hooks/useRealtimeSync.test.js` — 8 tests

**Archivos modificados:**
- `src/store/pacientesStore.js` — agregado `refrescarDesdeSupabase()`
- `src/App.jsx` — montado `useRealtimeSync()`

**Estrategia anti-loop:** `registrarEscrituraLocal(tabla)` guarda timestamp; si evento llega dentro de 2s, se ignora (es local).

**Esfuerzo:** M (45 min - 2 días). **Prioridad:** P1. **Dependencias:** F5-01.

### F5-03 — Offline-first queue de operaciones — DONE (2026-08-14)

**Qué ganamos:** la clínica no se detiene si se cae internet; los datos se guardan localmente y se sincronizan automáticamente cuando vuelve la conexión. Crítico para continuidad operativa.

**Descripción:** Implementar una cola de operaciones pendientes para cuando no hay conexión, con sincronización automática al reconectar.

**Criterios de aceptación:**
- [x] `src/services/operationQueue.js` con cola FIFO de operaciones
- [x] Operaciones guardadas en localStorage cuando `navigator.onLine === false`
- [x] Sincronización automática al volver la conexión (evento `online`)
- [x] Hook `useOfflineQueue` escucha eventos `online`/`offline`
- [x] `App.jsx` monta `useOfflineQueue()`
- [x] Manejo de errores de sincronización con retry exponencial (0s, 1s, 2s, 4s, 8s)
- [x] No hay pérdida de datos si el navegador se cierra mientras hay operaciones pendientes
- [x] Lock previene procesamiento concurrente
- [x] Imports estáticos (sin `INEFFECTIVE_DYNAMIC_IMPORT`)
- [x] Tests unitarios: 13 tests

**Storage services soportados (5):** `pacientesStorageService`, `agendaStorageService`, `presupuestosStorageService`, `pagosStorageService`, `finanzasStorageService`.

**Archivos creados:**
- `src/services/operationQueue.js` — cola FIFO persistente con retry exponencial
- `src/hooks/useOfflineQueue.js` — hook para listeners online/offline
- `src/services/operationQueue.test.js` — 13 tests

**Archivos modificados:**
- `src/services/supabaseClient.js` — agregada función `estaOnline()`
- `src/App.jsx` — montado `useOfflineQueue()`

**Esfuerzo:** S (30 min - 1 día). **Prioridad:** P1. **Dependencias:** F5-02.

### F5-04 — Conflict resolution entre dispositivos — DONE (2026-08-14)

**Qué ganamos:** dos personas editando el mismo dato simultáneamente no se sobrescriben silenciosamente; se previene la pérdida de información clínica crítica.

**Descripción:** Detectar y resolver conflictos cuando dos usuarios editan el mismo registro en ventanas de tiempo cercanas.

**Criterios de aceptación:**
- [x] Detección de conflictos por `updated_at` en cada escritura
- [x] Estrategia "last-write-wins" como default para campos simples
- [x] Diálogo de resolución manual para conflictos en datos clínicos críticos
- [x] Log de auditoría de cambios (tabla `audit_log` en Supabase)
- [x] Test de conflicto: dos ediciones simultáneas → una gana o se muestra diálogo
- [x] Tests unitarios: 13 tests

**Tabla audit_log:** columnas `id`, `user_id`, `table_name`, `record_id`, `action` (INSERT/UPDATE/DELETE/CONFLICT_RESOLVED), `old_data`, `new_data`, `resolution_strategy`, `user_email`, `created_at`. RLS: solo el usuario ve sus propios logs. Índices: `(table_name, record_id, created_at DESC)` y `created_at`.

**Archivos creados:**
- `src/services/conflictDetectionService.js` — detección y resolución de conflictos
- `src/components/ConflictResolutionModal.jsx` — modal UI con diff visual
- `supabase/schema-audit-log.sql` — tabla de auditoría + RLS + índices (ejecutado manualmente)
- `src/services/conflictDetectionService.test.js` — 13 tests

**Archivos modificados:**
- `src/modules/pacientes/services/pacientesStorageService.js` — import agregado para POC

**Esfuerzo:** S (30 min - 1 día). **Prioridad:** P2. **Dependencias:** F5-02.

### F5-05 — Notifications y alertas de cambios — DONE (2026-08-14)

**Qué ganamos:** awareness del equipo sobre lo que otros están haciendo; notificaciones de cambios externos, procesamiento de cola offline, y estado de conexión. Mejora la coordinación clínica.

**Descripción:** Sistema de toast notifications y alertas contextuales para informar al usuario de cambios relevantes.

**Criterios de aceptación:**
- [x] Toast notifications para cambios de otros usuarios en datos compartidos
- [x] Alertas de conflictos de agenda (dos citas mismo paciente misma hora)
- [x] Notificaciones de pagos pendientes no resueltos
- [x] Recordatorios de citas próximas (configurable)
- [x] Badge de notificaciones no leídas en Sidebar
- [x] Respeto de RBAC: cada rol solo ve notificaciones de su ámbito
- [x] Tests unitarios: 31 tests (17 notificationService + 14 conflictosAgenda)

**Tipos de toast:**
- `info` (azul, 3s) — cambios de otros usuarios
- `success` (verde, 3s) — operaciones exitosas
- `warning` (amarillo, 5s) — advertencias
- `error` (rojo, 7s) — errores críticos

**Archivos creados:**
- `src/services/notificationService.js` — servicio centralizado de notificaciones
- `src/hooks/useNotifications.js` — hook de consumo
- `src/components/ToastContainer.jsx` — UI de toasts (4 tipos)
- `src/components/ConnectionIndicator.jsx` — indicador online/offline/conectando
- `src/utils/conflictosAgenda.js` — detección de citas superpuestas
- `src/services/notificationService.test.js` — 17 tests
- `src/utils/conflictosAgenda.test.js` — 14 tests

**Archivos modificados:**
- `src/App.jsx` — montado `<ToastContainer />`
- `src/components/Sidebar.jsx` — montado `<ConnectionIndicator />`
- `src/hooks/useRealtimeSync.js` — emite toast al recibir evento de otro usuario
- `src/hooks/useOfflineQueue.js` — emite toast al procesar cola

**Esfuerzo:** S (30 min - 1 día). **Prioridad:** P2. **Dependencias:** F5-02.

**Salida de Fase 5 (Definition of Done):** ✅ **COMPLETA (2026-08-14).** App colaborativa en tiempo real, resiliente a pérdida de conexión, con awareness de equipo y prevención de conflictos de edición. Lista para uso en clínica con múltiples dispositivos simultáneos.

**Métricas finales de Fase 5:**

| Métrica | Antes de F5 | Después de F5 | Delta |
|---|---|---|---|
| Tests totales | 428 | 517 | +89 |
| Archivos nuevos en F5 | 0 | 20 | +20 |
| Tablas Supabase nuevas | 15 | 16 | +1 (audit_log) |
| Hooks nuevos | 0 | 4 | +4 |
| Archivos en allowlist | 29 | 30 | +1 |

**Lecciones de proceso registradas en F5:**

1. **Crear infraestructura primero, integrar después:** F5 siguió el mismo patrón de F4 — primero infraestructura sólida, luego adopción progresiva por módulos. Evita romper flujos existentes.
2. **Loop prevention es crítico:** sin timestamps de escritura local, Realtime causaría loops infinitos. La tolerancia de 2s es empírica pero efectiva.
3. **Conflict resolution requiere UX cuidadosa:** modal de resolución con diff visual lado a lado es más usable que un simple "overwrite or discard".
4. **Notification system debe ser no-bloqueante:** errores en notificaciones NUNCA deben romper el flujo principal de la app. Fail silently + console.error.
5. **SQL schema ejecutado manualmente:** tablas de auditoría se crean una vez vía SQL Editor de Supabase, no via código (evita problemas de idempotencia).
6. **Allowlist debe permitir excepciones justificadas:** `conflictosAgenda.js` tiene 104 líneas pero es lógica de dominio pura con tests exhaustivos. Excepción válida documentada.
7. **Componentes UI compartidos sin librerías externas:** `ToastContainer` y `ConnectionIndicator` implementados con Tailwind puro, sin añadir dependencias al proyecto (sin react-hot-toast, sin sonner).

---

---

## FASE 6 — HARDENING DE PRODUCCIÓN Y CIERRE ESTRUCTURAL

**Precondición de fase:** Fases 1-5 marcadas completas en el tablero. **Advertencia de gobernanza:** una auditoría de código independiente (2026-08-16) detectó que varias tareas de Fase 4 marcadas `DONE` no están implementadas en el código (ver F6-D y F6-A). Esta fase, por tanto, no es solo hardening: cierra primero la brecha entre lo que este documento declara y lo que el repositorio contiene.

**Origen:** dos auditorías. (a) Auditoría técnica sobre métricas de repositorio (2026-08-16): `npx vitest run`, `npx oxlint`, `npx vite build`, `npm audit` — origen de F6-01 a F6-07. (b) Auditoría de código y esquema SQL (2026-08-16) — origen de F6-A a F6-K.

**Estado de fase:** 🔴 **EN CURSO, BLOQUEANTE PARA PRODUCCIÓN.** Sustituye la declaración previa de "sistema listo para producción", que se apoyaba en tareas marcadas `DONE` sin cumplir sus criterios de aceptación.

**Regla de orden en esta fase:** el bloque estructural (F6-A a F6-E) precede a todo lo demás. F6-06 (despliegue) no puede cerrarse antes que F6-A a F6-E.

---

### BLOQUE ESTRUCTURAL — brechas entre el roadmap y el código

---

### F6-A — Versionar esquema SQL + seed del vademécum v1.1 — TODO

**Qué ganamos:** hoy el dataset clínico más crítico del sistema —94 fármacos, 25 reglas de alergias cruzadas, interacciones farmacológicas, profilaxis de endocarditis, manejo de anticoagulantes y antirresortivos— **existe únicamente dentro del proyecto Supabase de desarrollo**. `supabase/` contiene solo `schema.sql`, `schema-clinical-tables.sql` y `schema-audit-log.sql` (19 tablas), mientras `vademecumService.js` consulta ocho tablas que no están definidas en ninguna parte del repositorio: `vademecum`, `vademecum_urgencia`, `vademecum_antirresortivos`, `alergias_cruzadas`, `interacciones_farmacologicas`, `profilaxis_endocarditis`, `manejo_anticoagulantes` y `reference_data_meta`. Si ese proyecto se pausa, se borra o se pierde el acceso, se pierde la curación clínica completa y no hay forma de reconstruirla. `src/data/vademecum.js` (23 fármacos, otra estructura) no sirve de respaldo. Es además la razón por la que el paso 1.2 del `DEPLOY_CHECKLIST` es hoy inejecutable: pide verificar 23 tablas y el repositorio solo puede crear 19.

**Alcance:**
- Exportar el DDL real de las 8 tablas del vademécum desde Supabase a `supabase/schema-vademecum.sql`, incluyendo RLS e índices.
- Exportar los 164 registros curados a `supabase/seed-vademecum.sql` (o `.csv` versionado + script de carga).
- Añadir `supabase/README.md` con el orden de ejecución de todos los scripts.
- Corregir el conteo de tablas en `DEPLOY_CHECKLIST.md` (hoy dice 23; la suma declarada da 24 y el repositorio define 19 + 8 = 27 una vez cerrada esta tarea — recontar contra la base real, no contra el documento).

**Criterios de aceptación:**
- Un proyecto Supabase vacío queda funcionalmente equivalente al actual ejecutando únicamente los scripts de `supabase/`, sin intervención manual.
- Verificado en la práctica: crear proyecto limpio, ejecutar scripts, arrancar la app y comprobar que las alertas de alergias cruzadas siguen disparando.
- El número de tablas citado en roadmap y checklist coincide con `select count(*) from information_schema.tables where table_schema='public'`.

---

### F6-B — Rol de usuario a `app_metadata` + RLS por rol server-side — TODO

**Qué ganamos:** hoy el rol vive en `user_metadata`, que el propio cliente puede escribir. `authService.js` (líneas 214-219) ejecuta literalmente `supabase.auth.updateUser({ data: { role: 'admin' } })` desde el navegador. Cualquier usuario autenticado puede abrir DevTools y concederse rol admin. La política de `profiles` tampoco protege: `FOR UPDATE USING (auth.uid() = id)` sin `WITH CHECK` ni restricción de columna permite `UPDATE profiles SET role='admin' WHERE id = auth.uid()`. Y `rbacService.js`, pese a estar bien escrito, es 100 % cliente: solo oculta UI; la base de datos no valida nada por rol. El RBAC de F3-05 hoy es una convención de interfaz, no un control de acceso.

**Alcance:**
- Mover `role` a `app_metadata` (escribible solo con `service_role`) o a la tabla `profiles` con RLS que bloquee la columna `role` para el propio usuario.
- Trigger `handle_new_user` que cree la fila en `profiles` al registrarse — hoy la tabla existe pero **no se consulta desde ningún punto de `src/`**: es esquema muerto.
- Eliminar el `updateUser({ role })` del cliente. La asignación de rol pasa a ser operación administrativa.
- Añadir cláusulas de rol a las políticas RLS de las tablas sensibles (finanzas, pagos, configuración, vademécum admin), de modo que `recepcion` no pueda leer finanzas ni siquiera vía consulta directa.
- Función `auth.rol_actual()` en Postgres para no repetir el subquery en cada política.

**Criterios de aceptación:**
- Un usuario con rol `recepcion` que ejecute `supabase.from('movimientos_financieros').select('*')` desde la consola del navegador recibe 0 filas, no un error de UI.
- Un usuario no-admin no puede modificar su propio rol por ninguna vía (metadata ni tabla). Verificado con intento explícito documentado.
- Test automatizado de las políticas (pgTAP o suite de integración contra Supabase de staging).

---

### F6-C — Modelo multi-clínica: `clinica_id` + membresía + reescritura de RLS — TODO

**Qué ganamos:** el modelo de datos actual no tiene el concepto de clínica. Todas las políticas RLS son `auth.uid() = user_id`, lo que significa que cada usuario tiene su propio silo aislado de pacientes. Las consecuencias son excluyentes: o todo el equipo comparte un login —y entonces el RBAC de F3-05 es decorativo, el `audit_log` no puede decir quién escribió en la ficha, y las "métricas de rendimiento por profesional" de `reportes` no tienen fuente— o cada persona tiene su cuenta, y entonces el dentista literalmente no ve los pacientes que creó recepción. **Toda la Fase 5 (realtime, resolución de conflictos, presencia) solo funciona en el primer escenario:** lo que hay hoy no es colaboración multiusuario, es la misma cuenta en varios dispositivos. Esta es la brecha que separa "sistema de un profesional" de "sistema de clínica", que es lo que el proyecto declara ser desde F4-01.

**Alcance:**
- Tablas `clinicas` y `miembros_clinica (clinica_id, user_id, rol, activo)`.
- Columna `clinica_id NOT NULL` en las 19 tablas de datos + las 8 del vademécum que sean por clínica.
- Reescritura de las 27+ políticas RLS: de `auth.uid() = user_id` a `clinica_id IN (select clinica_id from miembros_clinica where user_id = auth.uid() and activo)`.
- Conservar `user_id` como **autoría** del registro (quién lo creó/modificó), que es información clínica valiosa, no como control de acceso.
- Script de migración de los datos existentes a una clínica inicial.
- Actualizar `realtimeService` para suscribirse por `clinica_id`, no por usuario.

**Criterios de aceptación:**
- Cuatro usuarios con roles distintos, en la misma clínica, ven el mismo directorio de pacientes.
- Un usuario de otra clínica no ve ninguno de esos pacientes (verificado por consulta directa, no por UI).
- Los tests E2E de `flujo-colaborativo.spec.js` se reescriben para usar **dos cuentas distintas**, no dos sesiones de la misma cuenta.

**Nota de gobernanza:** por su magnitud, esta tarea requiere RFC previo según Cap. VIII de la Constitución, igual que F4-01. No es hardening; es un cambio de modelo de datos.

---

### F6-D — Cablear la ficha clínica a Supabase — TODO

**Qué ganamos:** F4-02c-6 ("migración de datos clínicos, 11 tipos") y F4-02d-2 ("escritura de datos clínicos a Supabase") están marcadas `DONE`, pero el cableado a los módulos nunca ocurrió. `useFichaPaciente.js` guarda odontograma inicial, odontograma de evolución, recetas, evoluciones, certificados, abonos e ítems de presupuesto vía `pacientesStorageService.guardarItem()`, que es localStorage síncrono — el propio archivo lo documenta en su línea 16. Y `datosClinicosSupabase.js`, con sus funciones `guardarOdontograma`, `guardarPeriodontograma`, `guardarEvolucionClinica` y `guardarReceta` ya escritas y probadas, **no lo llama nadie salvo `quirurgico`**. Lo mismo aplica a periodontograma, odontopediatría, DSD, esterilización, inventario, laboratorio, prestaciones, comunicaciones y urgencias GES: todos localStorage puro. Hoy, cambiar de navegador o limpiar caché borra la historia clínica.

**Alcance:**
- Conectar `useFichaPaciente` a `datosClinicosSupabase` para: odontograma inicial y de evolución, recetas, evoluciones, certificados.
- Conectar `usePeriodontograma` y `useOdontopediatria` a sus tablas ya existentes.
- Migrar a Supabase los módulos que hoy no tienen tabla: `esterilizacion` (registro fiscalizable SEREMI), `inventario`, `prestaciones`, `laboratorio`, `comunicaciones`, `urgenciasGes`, `configuracion`.
- Mantener localStorage como caché de lectura, no como fuente de verdad.
- Migración de datos existentes en dispositivos ya en uso, antes de cambiar la fuente de verdad.

**Criterios de aceptación:**
- Crear un odontograma en el dispositivo A y verlo en el dispositivo B tras recargar. Idem receta, evolución, periodontograma y carga de esterilización.
- `grep -rn "guardarItem\|obtenerItem" src/modules/` no devuelve ninguna escritura de dato clínico.
- Test de integración por cada tipo de dato migrado.
- **Reabrir F4-02c-6 y F4-02d-2 como `IN PROGRESS`** en el tablero, conforme a la Regla 3.

---

### F6-E — Adjuntos clínicos a Supabase Storage con URLs firmadas — TODO

**Qué ganamos:** radiografías, fotografías clínicas y **consentimientos informados firmados** viven hoy exclusivamente en IndexedDB del navegador de un equipo. No hay una sola llamada a `supabase.storage` en todo el repositorio. Sin respaldo, sin sincronización entre dispositivos, sin cifrado. Un consentimiento firmado que solo existe en el Chrome de un notebook no es un pendiente técnico: es un pasivo legal, porque la ficha clínica y sus consentimientos deben conservarse y ser recuperables (Ley 20.584 y su reglamento). F1-02 resolvió correctamente el problema de *no perder el binario al refrescar*; no resolvió el de conservarlo.

**Alcance:**
- Bucket privado en Supabase Storage, con path `clinica_id/paciente_id/...`.
- Subida al crear el adjunto; IndexedDB pasa a ser caché offline, no almacenamiento primario.
- Descarga vía URL firmada de vida corta, nunca URL pública.
- Política de Storage alineada con la RLS de `pacientes` (F6-C).
- Migración de los adjuntos que hoy estén en IndexedDB en equipos en uso.
- `FirmaDigitalCanvas` guarda el consentimiento firmado con timestamp y autoría.

**Criterios de aceptación:**
- Subir una radiografía en el dispositivo A y abrirla desde el dispositivo B.
- Vaciar IndexedDB del dispositivo A y comprobar que el adjunto sigue disponible.
- Ninguna URL de adjunto es accesible sin sesión válida.

---

### F6-F — Auditoría append-only por trigger + soft delete de ficha clínica — TODO

**Qué ganamos:** dos problemas de trazabilidad legal. **(1)** La tabla `audit_log` existe y `registrarAuditoria()` está implementada, pero su único llamador está dentro de `conflictDetectionService`, para resolución de conflictos. Las ediciones normales de la ficha clínica no se auditan. Además su RLS es "ver lo propio / insertar lo propio": un admin no puede auditar a nadie, y cualquier usuario puede insertar registros de auditoría fabricados desde el cliente. **(2)** `pacientesStorageService.js` línea 315 ejecuta un `.delete()` real contra Supabase, y las tablas hijas tienen `ON DELETE CASCADE`. No hay `deleted_at` ni papelera. Un clic de un admin destruye la ficha y todo lo colgado de ella, de forma irreversible salvo restauración de backup.

**Alcance:**
- Triggers `AFTER INSERT/UPDATE/DELETE` en las tablas clínicas y financieras que escriban en `audit_log` desde el servidor.
- RLS de `audit_log`: `INSERT` solo por el rol de la función (no por el cliente), `SELECT` para admin de la clínica, sin `UPDATE` ni `DELETE` para nadie.
- Columna `deleted_at` en `pacientes` y tablas clínicas; sustituir el borrado duro por soft delete; filtrar en las consultas.
- Revisar los `ON DELETE CASCADE` para que no propaguen a registros que deban conservarse.
- Definir y documentar la política de retención (la ficha clínica no se elimina; se archiva).

**Criterios de aceptación:**
- Editar una anamnesis genera una fila en `audit_log` con usuario, timestamp, valor anterior y nuevo, sin que el cliente lo pida.
- Un usuario no puede insertar ni alterar filas de `audit_log` desde la consola del navegador.
- "Eliminar paciente" oculta el registro pero es reversible por un admin, y queda auditado.

---

### F6-G — Validación de RUT (módulo 11) + unicidad por clínica — TODO

**Qué ganamos:** `pacienteSchema.js` valida el RUT como `z.string().trim().min(1)`. Sin formato, sin dígito verificador, y sin restricción `UNIQUE` en la tabla `pacientes`. En un sistema chileno esto produce, en este orden: pacientes duplicados con el mismo RUT escrito de tres formas, historias clínicas partidas para la misma persona, y facturación cruzada a Fonasa/Isapre. Es la corrección de mejor relación esfuerzo/impacto de toda la fase.

**Alcance:**
- Utilidad `validarRut` con cálculo de dígito verificador módulo 11 y normalización a formato canónico sin puntos y con guion.
- Integrar en `pacienteSchema` (Zod) y en el formulario de `ModalNuevoPaciente` con feedback inmediato.
- Constraint `UNIQUE (clinica_id, rut)` en la tabla `pacientes` (depende de F6-C).
- Script de detección y fusión de duplicados existentes antes de aplicar el constraint.

**Criterios de aceptación:**
- Un RUT con dígito verificador incorrecto no se puede guardar.
- `12.345.678-5`, `12345678-5` y `123456785` se normalizan al mismo valor y el segundo intento de alta es rechazado como duplicado.
- Tests unitarios de `validarRut` incluyendo casos borde (RUT con K, RUT de menos de 7 dígitos).

---

### F6-H — Timeout de sesión por inactividad + política de contraseña — TODO

**Qué ganamos:** no existe ningún mecanismo de auto-logout en el sistema (`grep` de `inactiv|autoLogout|sessionTimeout` en `src/` no devuelve nada). Un computador de recepción desatendido es acceso completo a las fichas clínicas de todos los pacientes, en un mostrador abierto al público. Tampoco hay política de contraseña más allá del mínimo por defecto de Supabase.

**Alcance:**
- Hook de inactividad configurable (por defecto 15 min) con aviso previo de 60 s y opción de continuar.
- Bloqueo de pantalla que exige re-autenticación sin perder el trabajo en curso.
- Longitud mínima de contraseña elevada y validación en el formulario de alta.
- Parámetro de timeout expuesto en el módulo `configuracion`.

**Criterios de aceptación:**
- Tras el tiempo configurado sin interacción, la sesión queda bloqueada y los datos clínicos no son visibles en pantalla.
- Un borrador de evolución no guardado sobrevive al bloqueo y re-login.

---

### F6-I — Entorno de staging separado de producción para E2E — TODO

**Qué ganamos:** la evidencia registrada en F6-02 indica que los 12 tests E2E se ejecutaron contra **Supabase de producción**, con usuarios `e2e_*@studiodental.com`. Esos tests crean pacientes, presupuestos y pagos: hay datos de prueba en la base real, y `flujo-seguridad.spec.js` ejerce alertas de alergias sobre registros de producción. El propio `DEPLOY_CHECKLIST` lo reconoce cuando advierte "crear usuarios de producción (NO usar `e2e_*@studiodental.com`)", pero no había tarea que lo resolviera. Sin staging tampoco es posible cumplir el criterio de F6-06 de probar una restauración de backup.

**Alcance:**
- Proyecto Supabase `studio-dental-staging` creado con los scripts de F6-A.
- `.env.staging` y configuración de Playwright apuntando a staging por defecto.
- Limpieza de los usuarios y datos `e2e_*` que hoy existan en producción.
- Documentar en `E2E_TESTING.md` que ejecutar E2E contra producción está prohibido.

**Criterios de aceptación:**
- `npm run test:e2e` apunta a staging sin configuración adicional.
- La base de producción no contiene usuarios ni pacientes de prueba.

---

### F6-J — PWA real (service worker + manifest) — TODO

**Qué ganamos:** la Fase 5 declara "offline-first", pero no hay service worker, ni manifest, ni `vite-plugin-pwa` en el proyecto. Lo que existe (`operationQueue`) es tolerancia a caídas de conexión **con la pestaña ya abierta**: si el equipo se reinicia o el usuario recarga sin internet, la aplicación no carga. Es decir, falla exactamente en el escenario para el que se construyó — una clínica con conexión intermitente al inicio de la jornada.

**Alcance:**
- `vite-plugin-pwa` con precache del shell de la aplicación.
- `manifest.webmanifest` con nombre, iconos y `display: standalone`.
- Estrategia de caché por tipo de recurso (shell precache, datos network-first con fallback).
- Indicador visible de "trabajando sin conexión" reutilizando `ConnectionIndicator`.
- Corregir de paso `<html lang="en">` → `lang="es"` y el `<title>` (hoy `ebenezer-studio-dental`, el nombre del paquete).

**Criterios de aceptación:**
- Con el dispositivo en modo avión y la aplicación cerrada, abrirla carga la interfaz y permite consultar los pacientes cacheados.
- Las operaciones hechas offline se sincronizan al recuperar conexión (vía `operationQueue` existente).

---

### F6-K — Umbrales de cobertura en CI + tests de módulos sin cobertura — TODO

**Qué ganamos:** el número de tests genera confianza que la distribución no respalda. Hay 545 bloques `it/test`, pero **solo 1 de 143 componentes** tiene test, y ocho módulos completos no tienen ninguno: `comunicaciones`, `configuracion`, `dashboard`, `esterilizacion`, `laboratorio`, **`pagos`**, `reportes` y `urgenciasGes`. Que `pagos` (dinero) y `esterilizacion` (registro fiscalizable) estén en esa lista es lo más relevante. Además `vitest.config.js` no define `thresholds`, de modo que la cobertura puede caer indefinidamente sin que CI lo note.

**Alcance:**
- `coverage.thresholds` en `vitest.config.js`, fijados en el valor actual medido y subidos por escalones.
- Tests de cálculo para `pagosCalculations`, `esterilizacionCalculations`, `reportesCalculations` y `comunicacionesCalculations`.
- Test de integración del flujo de arqueo de caja y del libro SEREMI.
- Job `e2e` en el pipeline (converge con F6-02b).

**Criterios de aceptación:**
- CI falla si la cobertura baja del umbral fijado.
- Ningún módulo con lógica de cálculo queda sin al menos un test de su función principal.

---

### BLOQUE DE HARDENING — origen auditoría de métricas

---

### F6-01 — Error Boundary global + por módulo crítico — IN PROGRESS

**Qué ganamos:** un error de render en cualquier componente (por ejemplo un cálculo de odontograma o periodontograma) puede dejar la pantalla en blanco sin aviso, en medio de una consulta clínica real. Un Error Boundary aísla el fallo, muestra un mensaje controlado y evita pérdida de contexto de trabajo.

**Alcance:**
- Componente `ErrorBoundary` de nivel raíz en `main.jsx`. ✅ implementado 2026-08-15
- Boundaries alrededor de los módulos de mayor riesgo clínico. ⚠️ implementado en `agenda`, `presupuestos` y `pacientes`; **faltan `odontograma` y `periodontograma`**, que el alcance original incluía explícitamente.
- Mensaje de fallback con opción de volver al inicio sin perder la sesión. ✅
- Registro estructurado del error. ✅ (`console.error`; se sustituirá por el logger de F6-03)

**Criterios de aceptación:**
- ✅ Un error forzado dentro de un módulo envuelto no rompe el resto de la aplicación.
- ❌ **Test automatizado que verifique que el fallback se renderiza y que el resto del layout (Sidebar, navegación) sigue funcional.** `ErrorBoundary.test.jsx` cubre 7 casos —fallback, reset, `console.error`, stack oculto— pero ninguno monta el layout para comprobar la segunda mitad de este criterio.
- ✅ No se muestra stack trace al usuario final.

**Por qué no está `DONE`:** dos criterios de alcance y uno de aceptación sin cumplir. Regla de Gobernanza 3.

---

### F6-02 — Auditoría y confirmación real del estado E2E — IN PROGRESS

**Qué ganamos:** eliminar la ambigüedad del conteo de tests E2E antes de declarar el sistema listo para producción.

**Alcance:**
- Ejecutar `npm run test:e2e` contra un entorno Supabase real. ⚠️ hecho, pero **contra producción**, no contra un entorno de prueba (ver F6-I).
- Documentar el resultado exacto con timestamp. ✅ 6 specs, 12 tests, 12 passing, 2026-08-15.
- Corregir la bitácora para que todas las secciones sean consistentes. ⚠️ parcial: la fila duplicada de F4-04 se eliminó, pero el bloque duplicado de F4-03a-h y la tabla "Tareas pendientes acumuladas" seguían presentes hasta esta revisión.
- Registrar los fallos como tareas nuevas. ✅ F6-02b, F6-02c.

**Criterios de aceptación:**
- ✅ Un único número de tests E2E, consistente en todo el documento, con evidencia.
- ❌ **Job E2E incorporado al pipeline CI/CD, aunque sea como gate no bloqueante.** El pipeline sigue con lint, test, build y architecture. Registrado como F6-02b.

**Por qué no está `DONE`:** el segundo criterio de aceptación no se cumplió, y el propio registro de la tarea lo reconoce. Regla de Gobernanza 3: cumplimiento parcial es `IN PROGRESS`.

---

### F6-02b — Agregar job E2E al pipeline CI/CD — TODO

**Qué ganamos:** los E2E hoy corren solo en la máquina del desarrollador, de forma manual. Sin job en CI no protegen contra regresiones de nadie más y su resultado no queda registrado.

**Alcance:**
- Job `e2e` en `.github/workflows/ci.yml`, apuntando al entorno de staging de F6-I.
- Secrets de staging en GitHub Actions.
- Subida del reporte de Playwright como artefacto.
- Arrancar como gate no bloqueante; promoverlo a bloqueante cuando sea estable.

**Criterios de aceptación:**
- Un PR muestra el resultado E2E en la lista de checks.
- El reporte queda descargable desde la ejecución del workflow.

---

### F6-02c — Investigar `data-testid` faltantes en bundle de LoginScreen — TODO

**Qué ganamos:** los `data-testid` de `LoginScreen.jsx` no llegan al bundle final, de modo que el fixture de autenticación usa siempre el fallback `type="email"`. Funciona, pero genera warnings en cada ejecución y hace frágiles los selectores.

**Alcance:** revisar la configuración de build de Vite y el plugin de React por si están eliminando atributos en producción; verificar el bundle generado.

**Criterios de aceptación:** los selectores por `data-testid` funcionan sin fallback y sin warnings.

---

### F6-03 — Logger centralizado con niveles — TODO

**Qué ganamos:** hay 59 llamadas a `console.log` fuera de tests, sin niveles ni control de entorno. Cualquier usuario puede abrir DevTools en producción y ver esa información —incluida, en algunos casos, información de pacientes. Un logger centralizado permite silenciar en producción, mantener trazabilidad en desarrollo, y sienta la base para conectar errores críticos a un servicio de monitoreo.

**Alcance:**
- `src/utils/logger.js` con niveles `debug`, `info`, `warn`, `error`.
- Silenciar `debug`/`info` en build de producción vía variable de entorno de Vite.
- Reemplazo incremental, priorizando `vademecumService`, `realtimeService` y los cálculos de dosis y alergias.
- Mantener separado el `audit_log` (trazabilidad clínica/legal, F6-F) del logging técnico.
- Revisar que ningún log emita datos identificables de pacientes.

**Criterios de aceptación:**
- 0 llamadas directas a `console.log` en `src/` fuera de `logger.js` y tests.
- El build de producción no emite logs `debug`/`info` en la consola del navegador.

---

### F6-04 — Accesibilidad básica — TODO

**Qué ganamos:** solo 2 de 144 archivos `.jsx` usan atributos `aria-*`. El personal de recepción y asistentes con distintos niveles de comodidad tecnológica, y eventuales usuarios con necesidades de accesibilidad, dependen hoy al 100 % de affordances visuales. Las mejoras básicas reducen errores de uso y amplían quién puede operar el sistema con confianza.

**Alcance (incremental, no requiere rediseño):**
- Labels asociados (`<label htmlFor>` o `aria-label`) en todos los inputs de formularios clínicos.
- `role="dialog"` y `aria-modal="true"` en todos los modales.
- Manejo de foco: al abrir un modal, foco al primer campo; al cerrar, foco al elemento que lo abrió.
- Contraste verificado en alertas críticas (alergias, contraindicaciones).
- `<html lang="es">` (converge con F6-J).

**Criterios de aceptación:**
- Los 5-6 modales más usados (paciente, pago, presupuesto, receta, cita) cumplen los cuatro puntos.
- Test de integración que verifique foco y aria en al menos un modal crítico.

---

### F6-05 — Exportación de reportes a Excel/PDF — TODO

**Qué ganamos:** el módulo `reportes` solo ofrece vista imprimible A4. Exportar datos es una necesidad operativa habitual (contabilidad, reportes a Isapres/Fonasa, respaldo externo).

**Alcance:**
- Evaluar `xlsx` (SheetJS) para Excel.
- Evaluar `jspdf` o generación de PDF reutilizando `ReporteImprimibleA4` (menor esfuerzo).
- Botón de exportación en `ReportesModulo`, `RankingPrestacionesTable` y `RendimientoProfesionales`.
- Registrar la exportación en `audit_log` (F6-F): sacar datos clínicos del sistema es un evento auditable.

**Criterios de aceptación:**
- La exportación a Excel produce un `.xlsx` válido con las columnas visibles en pantalla.
- La exportación a PDF produce un documento equivalente a la vista imprimible.
- Tests unitarios sobre la función de transformación a formato exportable, no sobre la librería.

---

### F6-06 — Checklist de despliegue a producción — IN PROGRESS

**Qué ganamos:** consolidar el checklist operativo en un documento único ejecutable, para no depender de memoria ni de pasos dispersos.

**Estado real:** el documento `docs/DEPLOY_CHECKLIST.md` fue redactado el 2026-08-16 (326 líneas, 7 fases). **Ninguno de sus 80 pasos está ejecutado ni marcado.** La restauración de backup no se ha probado. El documento existe; el despliegue no ha ocurrido.

**Alcance restante:**
- Ejecutar y marcar los 80 pasos con fecha.
- Probar una restauración de backup en staging (requiere F6-I).
- Corregir el conteo de tablas del checklist (requiere F6-A).
- Sustituir la afirmación "sistema listo para producción" hasta que F6-A a F6-E estén cerradas.

**Criterios de aceptación:**
- Cada paso del checklist marcado como completado y con fecha.
- Al menos una restauración de backup probada exitosamente en staging.
- F6-A, F6-B, F6-C, F6-D y F6-E en estado `DONE`.

**Por qué no está `DONE`:** redactar el checklist no es ejecutarlo. Los dos criterios de aceptación están sin cumplir. Regla de Gobernanza 3.

---

### F6-07 — Manual de usuario por rol + material de capacitación — TODO

**Qué ganamos:** no existe ningún documento de usuario final; todo lo documentado es técnico. Antes de que el equipo real use el sistema sin supervisión, esto es lo que más fricción humana ahorra.

**Alcance:**
- Manual corto por rol: Admin, Dentista, Asistente, Recepción.
- Cobertura mínima: login; paciente nuevo → cita → consulta → receta; flujo de pago; inventario básico.
- 3-4 videos cortos de los flujos más usados, grabados sobre el sistema real.

**Criterios de aceptación:**
- Un manual por rol en `docs/manuales/`, revisado por al menos un usuario real de ese rol.
- Videos accesibles desde un enlace único compartido con el equipo.

**Dependencia implícita:** no tiene sentido grabar videos de flujos que cambiarán con F6-C y F6-D. Ejecutar al final.

---

**Salida de Fase 6 (Definition of Done):** ⬜ pendiente. Se cerrará cuando F6-A a F6-K y F6-01 a F6-07 estén en `DONE` o `DEFERRED` con justificación técnica documentada. **Hasta que F6-A a F6-E estén cerradas, este documento no declara el sistema apto para uso con pacientes reales en una clínica con varios profesionales.**

---

## 3. ORDEN DE IMPLEMENTACIÓN

### Histórico (fases 1-5, ejecutado)

1. F1-06 (arnés de test, paralelo desde el inicio)
2. F1-03 → F1-04 → F1-04a → F1-04b → F1-04c → F1-04d → F1-04e → F1-04f
3. F1-01 → F1-02 → F1-05 → F1-05b
4. **(cierre de Fase 1 — 2026-08-08)**
5. F2-03 → F2-03g → F2-01 → F2-02 → F2-02b
6. F2-04 (+ F2-04b-e incrementales) → F2-05
7. F2-06 → F2-06b → F2-06c → F2-08
8. F2-07 → F2-07a, F2-07b, F2-07c, F2-07d, F2-07e, F2-07f, F2-07h → F2-09
9. **(cierre de Fase 2 — 2026-08-12)**
10. F3-01 → F3-02 → F3-04 → F3-05 → F3-03 → F3-07
11. **(cierre de Fase 3 — 2026-08-13)**
12. F4-01 (RFC) → F4-02a → F4-02b → F4-02c-1..6 → F4-02d-1 → F4-02d-2 → F4-02e
13. **(cierre de Fase 4 núcleo técnico — 2026-08-13, PR #22)** — ⚠️ ver F6-D: F4-02c-6 y F4-02d-2 requieren reapertura
14. F5-01 → F5-02 → F5-03 → F5-04 → F5-05
15. **(cierre de Fase 5 — 2026-08-14)**
16. F4-03 (+ F4-03a-h) → F4-04
17. F6-02 (parcial) → F6-01 (parcial) → F6-06 (parcial)

### Pendiente (Fase 6)

**Bloque 1 — desbloqueo y respaldo (hacer ya, en paralelo):**

18. **F6-A** — versionar SQL y seed del vademécum. *Primera de todas: hoy existe un único punto de fallo sin respaldo.*
19. **F6-G** — validación de RUT. *Independiente, media jornada, evita datos que después habrá que limpiar.*
20. **F6-I** — entorno de staging. *Habilita F6-02b y el criterio de backup de F6-06.*

**Bloque 2 — seguridad y modelo de datos (secuencial, es el núcleo):**

21. **F6-B** — rol a `app_metadata` + RLS por rol.
22. **F6-C** — modelo multi-clínica. *Requiere RFC previo (Constitución, Cap. VIII).*
23. **F6-D** — cablear la ficha clínica a Supabase.
24. **F6-E** — adjuntos a Supabase Storage.
25. **F6-F** — auditoría por trigger + soft delete.
26. **F6-H** — timeout de sesión.

27. **(checkpoint: recién aquí el sistema es apto para una clínica con varios profesionales)**

**Bloque 3 — cierre de hardening:**

28. F6-01 (completar boundaries de odontograma/periodontograma + test de layout)
29. F6-02b → F6-02 (cierre) → F6-02c
30. F6-03 (logger) → F6-K (cobertura)
31. F6-04 (accesibilidad) → F6-J (PWA)
32. F6-05 (exportación Excel/PDF)
33. **F6-06** — ejecutar el checklist de despliegue. *Última tarea técnica, no la primera.*
34. F6-07 (manuales y capacitación, una vez el sistema esté estable)

---

## 4. ESTADO ACTUAL

**Fecha de esta evaluación:** 2026-08-16
**Estado:** 🔴 **NO APTO PARA PRODUCCIÓN CON DATOS DE PACIENTES REALES EN CLÍNICA MULTIUSUARIO.**

Corrige la declaración anterior ("listo para producción"), que se sostenía sobre tareas marcadas `DONE` sin cumplir sus criterios de aceptación y sobre métricas no verificadas contra el repositorio.

### Métricas verificadas

Toda métrica de esta tabla incluye el comando que la produce (Regla de Gobernanza 8).

| Métrica | Valor | Comando | Fecha |
|---|---|---|---|
| Tests unitarios/integración (Vitest) | 589 pasando (33 archivos) | `npx vitest run` | 2026-08-17 |
| Tests E2E | 12 en 6 specs | `grep -ho "test(" e2e/specs/*.spec.js \| wc -l` | 2026-08-16 |
| Componentes `.jsx` | 143 | `find src -name "*.jsx" \| grep -v test \| wc -l` | 2026-08-16 |
| Componentes con test | 1 | `find src -name "*.test.jsx" \| wc -l` | 2026-08-16 |
| Módulos sin ningún test | 8 | `comunicaciones, configuracion, dashboard, esterilizacion, laboratorio, pagos, reportes, urgenciasGes` | 2026-08-16 |
| Esquemas Zod | 11 | `find src -name "*Schema.js" -not -name "*test*" \| wc -l` | 2026-08-16 |
| Tablas SQL versionadas en el repo | 27 | `grep -h "CREATE TABLE" supabase/*.sql \| wc -l` | 2026-08-16 |
| Tablas consultadas por el código sin SQL versionado | 8 | tablas del vademécum en `vademecumService.js` — ver F6-A | 2026-08-16 |
| Servicios de módulo que escriben en Supabase | 6 de 18 | `agenda, finanzas, pacientes, pagos, presupuestos, quirurgico` — ver F6-D | 2026-08-16 |
| Llamadas a Supabase Storage | 0 | `grep -rn "storage.from" src/` — ver F6-E | 2026-08-16 |
| `console.log` fuera de tests | 59 | `grep -rn "console.log" src/ --include=*.js --include=*.jsx \| grep -v "\.test\." \| wc -l` | 2026-08-16 |
| Archivos `.jsx` con atributos `aria-*` | 2 de 144 | `grep -rl "aria-" src/ --include=*.jsx \| wc -l` | 2026-08-16 |
| Pasos ejecutados del `DEPLOY_CHECKLIST` | 0 de 80 | `grep -c '^- \[x\]' docs/DEPLOY_CHECKLIST.md` | 2026-08-16 |

*Nota (reconciliada 2026-08-17): el número oficial es **589 tests pasando en 33 archivos**, output literal de `npx vitest run` ejecutado el 2026-08-17 (`Test Files 33 passed (33)` / `Tests 589 passed (589)` / `Duration 13.70s`). El conteo estático previo de 545 bloques `it/test` (2026-08-16) difería porque `grep` no cuenta tests generados con `it.each`/bucles que Vitest sí ejecuta. Desde esta fecha, 589 es el único número de referencia en todos los documentos (Regla de Gobernanza 8).*

### Métricas heredadas pendientes de re-verificación

| Métrica | Valor citado | Estado |
|---|---|---|
| Lint | 0 warnings / 0 errors | plausible, re-verificar con output fechado |
| Build | 497 kB (132 kB gzip) | plausible, re-verificar |
| `npm audit` | 0 vulnerabilidades | plausible, re-verificar |
| Validación arquitectónica | 67 archivos en allowlist | plausible, re-verificar |
| Vademécum | 164 registros | existe solo en Supabase de desarrollo — F6-A |

### Bloqueantes para producción

| # | Bloqueante | Tarea |
|---|---|---|
| 1 | El vademécum clínico no tiene respaldo ni esquema versionado | F6-A |
| 2 | Cualquier usuario puede concederse rol admin desde el navegador | F6-B |
| 3 | El modelo de datos aísla a cada usuario: el equipo no comparte pacientes | F6-C |
| 4 | Odontograma, periodontograma, recetas y evoluciones no llegan a Supabase | F6-D |
| 5 | Radiografías y consentimientos firmados viven solo en IndexedDB local | F6-E |

## 5. PRÓXIMA ACCIÓN

El RFC de F6-C fue redactado y aprobado (2026-08-17): ver `docs/RFC-F6-C-modelo-multiclinica.md`. Su implementación queda bloqueada hasta que F6-B esté `DONE`.

Próxima acción: **F6-A** (versionar el vademécum). Es la única tarea del documento cuyo retraso puede costar trabajo irrecuperable.

Cuando el usuario lo autorice, puede iniciarse en paralelo **F6-B** (prerequisito bloqueante de F6-C) y **F6-G** (independiente, media jornada).

No se implementará ninguna tarea hasta confirmación explícita del usuario (Regla de Gobernanza 1).

---

## 6. BITÁCORA DE EJECUCIÓN

El registro histórico de tareas completadas se trasladó a **`docs/BITACORA.md`** para mantener este documento legible de una sentada.

Este archivo responde a *qué falta y en qué orden*. La bitácora responde a *qué se hizo y cuándo*. Toda tarea que pase a `DONE` se registra allí, con su evidencia y su fecha, y aquí solo cambia la columna Estado del tablero.
