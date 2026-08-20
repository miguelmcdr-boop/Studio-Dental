## 2026-08-20 — F6-D-1: Hook useFichaClinicaSync para sincronización de datos clínicos — DONE

**Qué se ganó:** Hook centralizado que sincroniza todos los datos clínicos del paciente desde Supabase al abrir la ficha, y limpia la caché al cerrarla. Este es el primer paso del cableado completo de la ficha clínica a Supabase (F6-D).

**Archivos creados/modificados:**
- `src/modules/pacientes/hooks/useFichaClinicaSync.js` (NUEVO, ~65 líneas): Hook que gestiona el ciclo de sincronización con manejo de errores y cleanup
- `src/modules/pacientes/FichaPacienteModulo.jsx` (MODIFICADO, +3 líneas): Import y llamada al hook
- `src/modules/pacientes/hooks/useFichaClinicaSync.test.js` (NUEVO, ~120 líneas): 7 tests unitarios

**Decisiones técnicas:**
- Hook separado en lugar de integrarlo en useFichaPaciente (separación de responsabilidades, más fácil de testear)
- Fallback a localStorage si Supabase falla (coherente con RFC F4-01 offline-first)
- Cleanup al desmontar (evita leaks de memoria entre pacientes)

**Tests:**
- ✅ 7/7 tests nuevos pasan
- ✅ 600/600 tests existentes sin regresión

**Hallazgo adicional:** Durante validación manual se detectó error HTTP 406 en consultas a tablas clínicas vacías. Resuelto en commit separado `fix(supabase): usar maybeSingle en todas las consultas clínicas`.

**Siguiente:** F6-D-2 (cablear odontograma storageService).

## 2026-08-20 — F6-C-f: Reescritura E2E flujo-colaborativo con aislamiento multi-clínica — DONE

**Qué se ganó:** Test E2E reescrito que valida el criterio #4 del roadmap: usuarios de la misma clínica ven el mismo directorio, y usuarios de clínicas distintas están completamente aislados.

**Archivos modificados:**
- `supabase/seed-multiclinica-e2e.sql`: Script SQL para crear segunda clínica + 2 usuarios e2e_clinica2 (admin y dentista) + 1 paciente exclusivo de clínica 2
- `e2e/fixtures/auth.setup.js`: Credenciales actualizadas con contraseñas correctas (clínica 1: `test123456`, clínica 2: `E2eTest2026!`). Logging de debug agregado para diagnóstico
- `e2e/specs/flujo-colaborativo.spec.js`: Test reescrito con 2 tests de aislamiento multi-clínica (reemplaza el test original de F4-04 que solo validaba login simultáneo)
- `src/modules/pacientes/services/pacientesStorageService.js`: Eliminado fallback peligroso a caché cuando Supabase retorna vacío (rompía aislamiento multi-clínica)

**Decisiones tomadas (D46-D49):**
- D46: Crear segunda clínica para validar aislamiento (no solo Realtime dentro de una clínica)
- D47: Crear usuarios desde Dashboard de Supabase (no manualmente en SQL) para garantizar compatibilidad con auth.users
- D48: Validar aislamiento de pacientes (dato crítico). Aislamiento de citas/pagos se hereda del mismo RLS
- D49: Reemplazar contenido del test F4-04 (título dice "reescritura")

**Problemas encontrados y resueltos:**
1. **Contraseñas incorrectas**: Usuarios de clínica 1 usaban `test123456` (no `E2eTest2026!`). Corregido en fixture
2. **Código duplicado**: Variable `rolSelector` declarada 2 veces en `auth.setup.js`. Eliminado duplicado
3. **Fallback peligroso**: `pacientesStorageService.js` usaba caché cuando Supabase retornaba vacío, rompiendo aislamiento. Eliminado fallback
4. **Paciente faltante**: "Paciente Exclusivo Clínica 2" no existía en BD. Creado con SQL

**Validación en test E2E:**
- ✅ Test 1: admin y dentista de clínica 1 ven "Carlos Mendoza Vera" (mismo directorio)
- ✅ Test 2: admin de clínica 1 ve pacientes de clínica 1, admin de clínica 2 ve solo "Paciente Exclusivo Clínica 2" (aislamiento validado)

**Siguiente:** F6-D (cablear ficha clínica a Supabase).

## 2026-08-18 — F6-C-e: Configuración de clínica con branding/logo en Supabase — DONE

**Qué se ganó:** La configuración de clínica (nombre, logo, colores, datos de membrete) ahora persiste en la tabla `clinicas` de Supabase en lugar de localStorage. Todos los miembros de una clínica ven la misma configuración. Solo el admin puede editar; los demás miembros ven en modo solo-lectura.

**Archivos modificados:**
- `src/modules/configuracion/services/configuracionStorageService.js`: agregadas funciones Supabase (`guardarClinicaCompleta`, `sincronizarClinicaDesdeSupabase`, `migrarClinicaSiNecesario`). Transformación camelCase ↔ snake_case. Migración automática de localStorage a Supabase al primer load.
- `src/modules/configuracion/hooks/useConfiguracion.js`: `useEffect` de sincronización inicial desde Supabase. `guardarDatosClinica` ahora persiste en Supabase + localStorage.
- `src/modules/configuracion/components/DatosClinicaForm.jsx`: modo solo-lectura para no-admins (campos deshabilitados, badge visual, botón deshabilitado).
- `src/modules/configuracion/ConfiguracionModulo.jsx`: pasa `userProfile` al form para determinar permisos.

**Decisiones tomadas (D42-D45):**
- D42: Data URL en tabla `clinicas` (no Storage bucket). Cambio mínimo, no requiere crear bucket ni RLS de Storage.
- D43: Políticas RLS ya existentes (`admin_actualiza_su_clinica`, `miembros_leen_su_clinica`) son correctas.
- D44: Migración automática al primer load si el usuario es admin y hay datos en localStorage.
- D45: `clinicaId` desde `userProfile.clinicaId` (ya disponible por F6-C-d.2).

**Validación en navegador local:**
- Admin puede editar y guardar branding ✅
- Miembro no-admin ve datos en solo-lectura (no puede editar) ✅
- Datos compartidos entre usuarios de la misma clínica ✅
- Migración automática desde localStorage funciona ✅

**Siguiente:** F6-C-f (reescritura E2E flujo-colaborativo con aislamiento multi-clínica).

## 2026-08-18 — F6-C-d: servicios del frontend con nuevo RLS por clínica — DONE

**Qué se ganó:** El frontend ahora funciona correctamente con el modelo multi-clínica. Los usuarios de la misma clínica ven el mismo directorio de pacientes, los cambios persisten entre recargas y se sincronizan en tiempo real entre distintos usuarios.

**Archivos modificados:**
- `supabase/schema-multiclinica-trigger-clinica-id.sql` (nuevo): trigger BEFORE INSERT en 18 tablas que setea clinica_id = clinica_actual() si viene NULL.
- `src/services/authService.js` (D-d.2): consulta miembros_clinica post-login para obtener clinica_id y rol autoritativo. Fail-safe a app_metadata si falla (D37).
- `src/components/LoginScreen.jsx` (D-d.2): propaga clinicaId al userProfile. Refactorizado para extraer constructor de perfil a userProfileBuilder.js.
- `src/services/userProfileBuilder.js` (nuevo): helper para construir perfiles de usuario.
- `src/modules/pacientes/schemas/pacienteSchema.js` (fix Zod): .optional() → .nullable().optional() en campos opcionales.
- `src/store/pacientesStore.js` (fix refrescarDesdeSupabase): antes leía la caché; ahora llama a pacientesStorageService.sincronizarDesdeSupabase().
- `src/hooks/useRealtimeSync.js` (fix sync inicial + sin duplicación): extraída lógica de sincronización inicial a useSincronizacionInicial.js. Suscripciones explícitas (reglas de hooks).
- `src/hooks/useSincronizacionInicial.js` (nuevo): hook de sincronización post-login para 4 tablas sin store Zustand.
- `src/modules/pacientes/services/pacientesStorageService.js` (2 fixes críticos): logs detallados + bug de DELETE que eliminaba pacientes recién creados (no agregaba UUIDs a idsEnMemoria).

**Decisiones tomadas (D34-D41):**
- D34: Trigger en BD (Opción A) en lugar de modificar 18 servicios.
- D35: authService consulta miembros_clinica post-login.
- D36: Realtime probado manualmente (funciona con RLS).
- D37: Fail-safe a app_metadata si query de membresía falla.
- D38: signUp NO consulta miembros_clinica (usuario nuevo no tiene membresía).
- D39: Realtime en 5 tablas principales.
- D40: Hook montado en App.jsx.
- D41: useDataMigration se mantiene.

**Validación en navegador local (criterio #4 del roadmap):**
- 4 usuarios e2e_* en la misma clínica ven el mismo directorio ✅
- Creación de paciente persiste tras recargar ✅
- Realtime sincroniza cambios entre 2 ventanas de distintos usuarios ✅
- Sin errores en consola ✅

**Siguiente:** F6-C-e (módulo selector de clínica cuando el usuario pertenece a varias).

## 2026-08-18 — F6-C-d: servicios del frontend con nuevo RLS por clínica — DONE

**Qué se ganó:** El frontend ahora funciona correctamente con el modelo multi-clínica. Los usuarios de la misma clínica ven el mismo directorio de pacientes, los cambios persisten entre recargas y se sincronizan en tiempo real entre distintos usuarios.

**Archivos modificados:**
- `supabase/schema-multiclinica-trigger-clinica-id.sql` (nuevo): trigger BEFORE INSERT en 18 tablas que setea clinica_id = clinica_actual() si viene NULL.
- `src/services/authService.js` (D-d.2): consulta miembros_clinica post-login para obtener clinica_id y rol autoritativo. Fail-safe a app_metadata si falla (D37).
- `src/components/LoginScreen.jsx` (D-d.2): propaga clinicaId al userProfile. Refactorizado para extraer constructor de perfil a `userProfileBuilder.js`.
- `src/services/userProfileBuilder.js` (nuevo): helper para construir perfiles de usuario.
- `src/modules/pacientes/schemas/pacienteSchema.js` (fix Zod): .optional() → .nullable().optional() en campos opcionales.
- `src/store/pacientesStore.js` (fix refrescarDesdeSupabase): antes leía la caché; ahora llama a pacientesStorageService.sincronizarDesdeSupabase().
- `src/hooks/useRealtimeSync.js` (fix sync inicial + sin duplicación): extraída lógica de sincronización inicial a `useSincronizacionInicial.js`. Suscripciones compactadas en loop.
- `src/hooks/useSincronizacionInicial.js` (nuevo): hook de sincronización post-login para 4 tablas sin store Zustand.
- `src/modules/pacientes/services/pacientesStorageService.js` (2 fixes críticos): logs detallados + bug de DELETE que eliminaba pacientes recién creados (no agregaba UUIDs a idsEnMemoria).

**Decisiones tomadas (D34-D41):**
- D34: Trigger en BD (Opción A) en lugar de modificar 18 servicios.
- D35: authService consulta miembros_clinica post-login.
- D36: Realtime probado manualmente (funciona con RLS).
- D37: Fail-safe a app_metadata si query de membresía falla.
- D38: signUp NO consulta miembros_clinica (usuario nuevo no tiene membresía).
- D39: Realtime en 5 tablas principales.
- D40: Hook montado en App.jsx.
- D41: useDataMigration se mantiene.

**Validación en navegador local (criterio #4 del roadmap):**
- 4 usuarios e2e_* en la misma clínica ven el mismo directorio ✅
- Creación de paciente persiste tras recargar ✅
- Realtime sincroniza cambios entre 2 ventanas de distintos usuarios ✅
- Sin errores en consola ✅

**Siguiente:** F6-C-e (módulo selector de clínica cuando el usuario pertenece a varias).

## 2026-08-18 — F6-C-d: servicios del frontend con nuevo RLS por clínica — DONE

**Qué se ganó:** El frontend ahora funciona correctamente con el modelo multi-clínica. Los usuarios de la misma clínica ven el mismo directorio de pacientes, los cambios persisten entre recargas y se sincronizan en tiempo real entre distintos usuarios.

**Archivos modificados:**
- `supabase/schema-multiclinica-trigger-clinica-id.sql` (nuevo): trigger BEFORE INSERT en 18 tablas que setea clinica_id = clinica_actual() si viene NULL.
- `src/services/authService.js` (D-d.2): consulta miembros_clinica post-login para obtener clinica_id y rol autoritativo. Fail-safe a app_metadata si falla (D37).
- `src/components/LoginScreen.jsx` (D-d.2): propaga clinicaId al userProfile.
- `src/modules/pacientes/schemas/pacienteSchema.js` (fix Zod): .optional() → .nullable().optional() en campos opcionales (Zod no aceptaba NULL reales de Supabase).
- `src/store/pacientesStore.js` (fix refrescarDesdeSupabase): antes leía la caché; ahora llama a pacientesStorageService.sincronizarDesdeSupabase() realmente.
- `src/hooks/useRealtimeSync.js` (fix sync inicial + sin duplicación): agregado useEffect de sincronización inicial post-login para 4 tablas (citas, presupuestos, pagos, movimientos_financieros). Quitada sincronización duplicada de pacientes (useDataMigration ya lo hace, había race condition por React.StrictMode).
- `src/modules/pacientes/services/pacientesStorageService.js` (2 fixes críticos):
  - Logs detallados agregados para diagnóstico.
  - **Bug crítico corregido**: los UUIDs insertados/actualizados no se agregaban a idsEnMemoria, causando que el bloque DELETE (más abajo en guardarPacientes) los eliminara inmediatamente. El paciente se creaba en Supabase (3 registros) y luego se auto-borraba (volvía a 2).

**Decisiones tomadas (D34-D41):**
- D34: Trigger en BD (Opción A) en lugar de modificar 18 servicios.
- D35: authService consulta miembros_clinica post-login.
- D36: Realtime probado manualmente (funciona con RLS).
- D37: Fail-safe a app_metadata si query de membresía falla.
- D38: signUp NO consulta miembros_clinica (usuario nuevo no tiene membresía).
- D39: Realtime en 5 tablas principales.
- D40: Hook montado en App.jsx.
- D41: useDataMigration se mantiene.

**Validación en navegador local (criterio #4 del roadmap):**
- 4 usuarios e2e_* en la misma clínica ven el mismo directorio ✅
- Creación de paciente persiste tras recargar ✅
- Realtime sincroniza cambios entre 2 ventanas de distintos usuarios ✅
- Sin errores en consola ✅

**Siguiente:** F6-C-e (módulo selector de clínica cuando el usuario pertenece a varias).

## 2026-08-18 — F6-C-c: clinica_id en 18 tablas + reescritura RLS — DONE

**Qué se ganó:** El modelo de datos pasó de aislamiento por usuario (auth.uid()=user_id) a aislamiento por clínica (clinica_id=clinica_actual()), preservando la granularidad de roles de F6-B pero leyendo el rol de miembros_clinica (autoritativo por clínica, RFC §4.6).

**Archivos:** `supabase/schema-multiclinica-helpers-rol.sql` (C-c.1), `supabase/schema-multiclinica-add-clinica-id.sql` (C-c.2), `supabase/schema-multiclinica-rls.sql` (C-c.3), `supabase/verify-multiclinica-rls.sql` (verificación).

**Implementación en 3 pasos:**
- C-c.1: Funciones rol_en_clinica_actual() + tiene_rol_en_clinica() (STABLE + SECURITY DEFINER, leen de miembros_clinica).
- C-c.2: clinica_id NOT NULL + índice en las 18 tablas, backfill con clínica inicial.
- C-c.3: Reescritura de políticas: auth.uid()=user_id → clinica_id=clinica_actual(); role_in() → tiene_rol_en_clinica(). user_id conservado como autoría en WITH CHECK de INSERT.

**Decisiones aplicadas (D31/D32/D33):**
- D31 prestaciones: SELECT 4 roles, escritura admin/dentista (catálogo por clínica).
- D32 presupuesto_items: clinica_id directo + política simplificada (sin EXISTS con el padre).
- D33 audit_log: insert propia+clínica; select propia; select admin por clínica.

**Tablas NO tocadas:** 8 del vademécum (globales, mantienen role_in de F6-B) + profiles (identidad, sin clinica_id).

**Verificación:**
- Estructural: verify-multiclinica-rls.sql → 18 tablas con políticas _clinica + audit_log 3 políticas + 0 residuales _rol.
- Funcional: simulación de sesión authenticated → clinica_actual()=clínica inicial, rol_en_clinica_actual()=admin, clinicas_visibles=1, membresias_visibles=5, pacientes_visibles=2.

**Siguiente:** F6-C-d (verificación de servicios/hooks contra el nuevo RLS + fixes).

## 2026-08-18 — F6-C-b: migración de datos a clínica inicial — DONE

**Qué se ganó:** Clínica inicial creada y todos los usuarios existentes migrados con membresía activa. Roles asignados correctamente desde profiles.role (validado en F6-B), con fallback a app_metadata y fail-safe 'recepcion'.

**Archivos:** `supabase/migrate-multiclinica-inicial.sql` (nuevo), `supabase/verify-multiclinica-migracion.sql` (nuevo), `docs/MASTER_ROADMAP.md` (F6-C-b DONE).

**Resultado de la migración:**
- Clínica inicial creada con id fijo `00000000-0000-0000-0000-000000000001` ("Clínica Studio Dental").
- 5 usuarios migrados con membresía activa (2 admin, 1 dentista, 1 asistente, 1 recepcion).
- Roles consistentes en las 3 fuentes: profiles.role, app_metadata, membresía.
- Transacción con validación automática (ROLLBACK si la cantidad de membresías no coincide con la de usuarios).
- Idempotente: seguro re-ejecutar (ON CONFLICT DO NOTHING).

**Correcciones aplicadas respecto al RFC original (decisiones D28/D29):**
- D28: el rol se lee de `profiles.role` con fallback a `app_metadata` (no de `user_metadata` como decía el RFC, ya que F6-B migró los roles a app_metadata).
- D29: el backfill de `clinica_id` en las 18 tablas se difiere a F6-C-c (F6-C-b solo toca clinicas + miembros_clinica, evitando dependencia circular).

**Verificación:** `verify-multiclinica-migracion.sql` → **4/4 PASS** en proyecto local.

**Siguiente:** F6-C-c (clinica_id en las 18 tablas + reescritura de RLS + índices).

## 2026-08-18 — F6-C-a: tablas multi-clínica base + helpers — DONE

**Qué se ganó:** Esquema base del modelo multi-clínica implementado en local. Tablas `clinicas` y `miembros_clinica` creadas con RLS, funciones `clinica_actual()` y `es_admin_de_clinica_actual()` (ambas SECURITY DEFINER para evitar recursión), políticas de lectura/gestión.

**Archivos:** `supabase/schema-multiclinica-base.sql` (nuevo), `supabase/verify-multiclinica-base.sql` (nuevo), `docs/MASTER_ROADMAP.md` (F6-C-a DONE).

**Componentes:**
1. Tabla `clinicas`: datos de la clínica (nombre, RUT, dirección, contacto, logo, colores). Índice único en `rut_empresa`.
2. Tabla `miembros_clinica`: membresías usuario-clínica con rol (admin/dentista/asistente/recepcion). Índices compuestos para queries por usuario y por clínica.
3. Función `clinica_actual()` (STABLE + SECURITY DEFINER): retorna el `clinica_id` de la membresía activa. NULL si no hay membresía (fail-safe).
4. Función `es_admin_de_clinica_actual()` (STABLE + SECURITY DEFINER): verifica si el usuario es admin activo. **Agregada para mitigar riesgo de recursión de RLS** detectado en la auditoría (las políticas del RFC original usaban subqueries EXISTS sobre `miembros_clinica` desde dentro de políticas de la misma tabla).
5. RLS: miembros leen su clínica, solo admin gestiona membresías y datos de clínica.

**Verificación:** `verify-multiclinica-base.sql` → **13/13 PASS** en proyecto local.

**Entorno:** probado en local (Docker Supabase). Deploy a cloud diferido hasta cerrar F6-C completo.

**Siguiente:** F6-C-b (migración de datos existentes a clínica inicial).

## 2026-08-18 — F6-J: PWA real con service worker + manifest — DONE

**Qué se ganó:** Studio Dental ahora es una Progressive Web App instalable. Funciona offline con encolado de operaciones y sincronización automática al reconectar. Cold-start offline robusto (shell carga sin crashear).

**Archivos:** `package.json` (agrega vite-plugin-pwa), `vite.config.js` (plugin VitePWA con workbox), `public/` (4 iconos PWA generados con Pillow).

**Implementación:**
- Plugin `vite-plugin-pwa` v1.3.0 con modo `generateSW` (workbox)
- Estrategia de caché: cache-first para assets estáticos, network-first para API calls a Supabase (con timeout 5s)
- Precache de 32 entries (1212 KB)
- `navigateFallback: '/index.html'` para cold-start offline robusto
- `navigateFallbackDenylist` para excluir endpoints de Supabase
- Manifest con nombre, iconos (192, 512, maskable), tema teal
- Iconos generados con Pillow (placeholders con texto "SD", reemplazables después)

**Verificación:**
- Build: ✅ genera dist/sw.js + dist/manifest.webmanifest + dist/workbox-*.js
- DevTools → Manifest: ✅ muestra "Studio Dental" + iconos
- DevTools → Service Workers: ✅ sw.js activado y corriendo
- Cold-start offline: ✅ shell carga sin crashear al recargar con "Offline" activado
- Install button: ✅ disponible en Chrome/Edge (PWA instalable como app nativa)
- Navegación offline: ✅ operaciones encoladas y sincronizadas al reconectar

**Criterios de aceptación:** 5/5 cumplidos.

**Siguiente:** F6-C (modelo multi-clínica).

## 2026-08-19 — Deploy RBAC a producción (cloud Supabase) — EXITOSO

**Qué se hizo:** Despliegue completo del esquema RBAC (F6-B1..B6) al proyecto cloud de Supabase, revirtiendo la decisión D18 de diferir el deploy.

**Orden seguro ejecutado (7 pasos):**
1. `schema-rbac.sql` aplicado (enum app_role + 4 helpers + 2 triggers)
2. 5 perfiles creados con roles asignados (miguel.mcdr=admin, 4 e2e_ según su nombre)
3. `migrate-roles-to-app-metadata.sql` ejecutado (5/5 roles sincronizados en JWT)
4. Verificación de app_metadata: 5/5 OK
5. `schema-rbac-policies.sql` aplicado (RLS clínico: 11 tablas × 4 políticas = 44 políticas)
6. `schema-rbac-policies-fin.sql` aplicado (RLS financiero/vademécum/audit: 14 tablas)
7. `verify-rbac.sql` ejecutado: **12/12 PASS**

**Verificación en vivo:** login real con los 4 usuarios e2e_* (admin/dentista/asistente/recepcion) confirmando la matriz RBAC en producción.

**Hallazgos documentados:**
- `profiles.role` en cloud es tipo `text` (no `app_role` como en local). Registrado como F6-B7 (tarea futura P2, XS).
- Verificaciones intermedias con patrones `LIKE '%_rol'` dieron falsos negativos en audit_log (políticas sin sufijo _rol). El check definitivo `verify-rbac.sql` confirma 12/12 PASS.

**Estado final:** RBAC 100% operativo en producción. 25 tablas con políticas RLS restrictivas. Nadie bloqueado (orden seguro cumplido).

## 2026-08-18 — F6-B6: documentación RBAC + decisión de diferir cloud — DONE

**Qué se ganó:** Documentación completa de RBAC en docs/RBAC.md. Verificación local 100% completa.

**Archivos:** docs/RBAC.md (nuevo), docs/MASTER_ROADMAP.md (F6-B6 DONE).

**Decisión D18:** diferir despliegue a cloud por riesgo de bloqueo de usuarios.

**Cierre de F6-B:** fase RBAC 100% cerrada en local con documentación completa.
## 2026-08-18 — F6-B5: tests SQL de esquema + tests JS de app_metadata + e2e versionados — DONE

**Qué se ganó:** Infraestructura completa de verificación RBAC. Ahora cualquier cambio en las políticas RLS o en `authService.js` tiene cobertura automática de tests (SQL + JS + E2E).

**Archivos:** `supabase/verify-rbac.sql` (nuevo), `src/services/authService.appMetadata.test.js` (nuevo), `tests/e2e/` (nueva carpeta con 3 archivos), `docs/MASTER_ROADMAP.md` (F6-B5 DONE).

**Componentes:**
1. **verify-rbac.sql**: script de assertions SELECT (12 checks) que verifica enum, helpers, triggers, y que las políticas usan `role_in()`. Detecta si quedaron políticas legacy de solo ownership.
2. **authService.appMetadata.test.js**: 4 tests que validan el cierre de F6-B4 (lectura de `app_metadata`, default `'recepcion'`, cero `updateUser`).
3. **tests/e2e/**: carpeta con helpers compartidos + 2 scripts e2e (clínico 17 checks, financiero 31 checks) que validan la matriz RBAC completa contra el proyecto local.

**Verificación:**
- SQL: 12/12 PASS
- Tests JS: 4/4 passed
- E2E clínico: 17/17 PASS
- E2E financiero: 31/31 PASS

**Siguiente:** F6-B6 (verificación práctica + documentación final de RBAC).

## 2026-08-18 — F6-B3: RLS por rol en financiero + vademécum + audit_log — DONE

**Qué se ganó:** Las políticas RLS de las 14 tablas restantes ahora aplican la matriz RBAC server-side. Se cierran los caminos de escritura financiera por recepcion/asistente y de escritura de vademécum por cualquier authenticated (hallazgo F6-A). `audit_log` es append-only con lectura global de admin.

**Archivos:** `supabase/schema-rbac-policies-fin.sql` (nuevo), `supabase/migrate-roles-to-app-metadata.sql` (migración one-shot para producción), `supabase/README.md` (pasos 8-9), `docs/MASTER_ROADMAP.md` (F6-B3 DONE).

**Hallazgos versionados:**
1. **WITH CHECK faltante en `presupuesto_items`:** la política original solo tenía USING, permitía INSERT de items a presupuestos ajenos. Corregido con WITH CHECK vía padre.
2. **Semántica RLS en UPDATE/DELETE:** Postgres filtra filas (0 afectadas) en vez de lanzar 42501. El test e2e verifica denegación por efecto (valor intacto / fila sigue existiendo).
3. **Migración de roles existentes:** `migrate-roles-to-app-metadata.sql` sincroniza `profiles.role` → `app_metadata` de usuarios existentes para que los JWT lleven el rol.

**Evidencia:** Verificación e2e por HTTP (4 roles × 31 operaciones): 31/31 PASS incluyendo finanzas bloqueadas a recepcion/asistente, vademécum escribible solo por admin/dentista, audit_log append-only.

**Siguiente:** F6-B4 (migrar authService.js a leer rol de app_metadata + eliminar fallback a admin).

## 2026-08-18 — F6-B1: enum app_role + helpers SQL + trigger de alta de perfil — DONE

**Qué se ganó:** El rol pasó a vivir en `app_metadata` (JWT firmado, no editable por el usuario). Helpers declarativos `current_role()`, `has_role()`, `is_admin()` y trigger `on_auth_user_created` que crea el perfil y propaga el rol atómicamente. Rol ausente o inválido defaultea a `recepcion` (rechazo silencioso): se cierran los caminos de auto-promoción detectados en la auditoría (C1/C2).

**Archivos:** `supabase/schema-rbac.sql` (nuevo), `supabase/README.md` (orden de ejecución), `docs/MASTER_ROADMAP.md` (F6-B granularizada en F6-B1..F6-B6).

**Evidencia:** Supabase local (Docker): 8/8 objetos creados (enum + 6 funciones + trigger); INSERT en auth.users con rol `dentista` → perfil y `app_metadata.role` consistentes; sin rol → `recepcion`; rol inválido `superadmin` → `recepcion` sin error de constraint; `get_role_from_metadata()` correcto; 589/589 tests JS (regresión cero). PR mergeado.

**Siguiente:** F6-B2 (reescritura de RLS de las 9 tablas clínicas alineada con la matriz RBAC).

# BITÁCORA DE EJECUCIÓN — Studio Dental

## 2026-08-18 — F6-A: Versionar esquema SQL + seed del vademécum v1.1 — DONE

**Qué se ganó:** El dataset clínico crítico (164 registros: 94 fármacos, 11 urgencia, 6 antirresortivos, 25 alergias cruzadas, 15 interacciones, 7 profilaxis AHA, 5 anticoagulantes, 1 metadata) quedó versionado en el repo. Un proyecto Supabase limpio ejecutando los scripts de `supabase/` reproduce el vademécum completo y la app dispara las alertas de alergias cruzadas.

**Archivos:** `supabase/schema-vademecum.sql` (nuevo), `supabase/seed-vademecum.sql` (nuevo, 164 INSERT idempotentes), `supabase/README.md` (nuevo), `src/services/vademecumService.js` (fix F4-03i), `docs/DEPLOY_CHECKLIST.md` (conteo de tablas).

**Evidencia:** Proyecto Supabase local (Docker) limpio → 5 scripts en orden → 164 registros verificados → app con `.env.local` → login `test-f6a@studiodental.com` → paciente con alergia a penicilina + receta de Amoxicilina+Clavulánico → ALERTA GRAVE con alternativas seguras (captura).

**Métricas:** Tests 589/589 (`npx vitest run`, 2026-08-17). Tablas vademécum: 8. Registros: 164.

**Hallazgo derivado (no bloqueante):** en el entorno local limpio, `schema-clinical-tables.sql` no creó sus 9 tablas clínicas (18 tablas en vez de 27). Gap preexistente de ese script, no causado por F6-A. Registrado como F6-Aa.


**Documento complementario de `MASTER_ROADMAP.md`.**
El roadmap responde a *qué falta y en qué orden*. Esta bitácora responde a *qué se hizo, cuándo y con qué evidencia*.

**Orden:** cronológico inverso (lo más reciente arriba).

**Regla:** una entrada se añade aquí solo cuando la tarea cumple el 100 % de sus criterios de aceptación (Regla de Gobernanza 3). Si una entrada resulta prematura, no se borra: se corrige en el sitio con una nota fechada, para que quede constancia del error de registro.

---

### 📝 F6-06 PARCIAL — Checklist de despliegue redactado (2026-08-16)

> **Corrección 2026-08-16:** esta entrada decía "COMPLETADO". El documento se redactó, pero **ninguno de sus 80 pasos está ejecutado** y la restauración de backup no se probó. Ambos son criterios de aceptación de F6-06. La tarea vuelve a `IN PROGRESS` (Regla de Gobernanza 3).

**Qué ganamos:** documento único ejecutable `docs/DEPLOY_CHECKLIST.md` que consolida todos los pasos necesarios para llevar el sistema a producción. Elimina la dependencia de memoria, permite que cualquier miembro del equipo ejecute el despliegue, y documenta procedimientos de rollback y runbook de incidentes.

**Documento creado:** `docs/DEPLOY_CHECKLIST.md` (326 líneas)

**7 fases documentadas:**
1. Preparación de Supabase (Backend) — proyecto, migraciones, RLS, Realtime, backups
2. Preparación del Hosting (Frontend) — Vercel/Netlify, dominio, env vars
3. Migración de Datos (si aplica) — datos legacy desde localStorage
4. Verificación Post-Deploy — 8 flujos críticos (login RBAC, clínico, financiero, Realtime, offline, Error Boundary, seguridad clínica, logs)
5. Monitoreo y Observabilidad — Sentry, Web Vitals, UptimeRobot
6. Documentación Final — README, backup, rollback, runbook
7. Go-Live — comunicación, monitoreo inicial, celebración

**Contenido del checklist:**
- 80 checkboxes para marcar durante el despliegue
- Comandos SQL y configuración listos para copiar/pegar
- Procedimiento de rollback con tiempos estimados (2-5 min frontend, 5-15 min backend)
- Métricas de éxito: uptime >99.9%, LCP <2.5s, FID <100ms, CLS <0.1
- Decisiones técnicas documentadas (hosting, dominio, backups, monitoreo)

**Precondiciones técnicas confirmadas:**
- ✅ 589 tests unitarios/integración pasando
- ✅ 12/12 tests E2E pasando (100%)
- ✅ 0 vulnerabilidades en npm audit
- ✅ Lint: 0 warnings, 0 errors
- ✅ Build limpio (500 kB / 133 kB gzip)
- ✅ Arquitectura: todas las reglas cumplen (67 archivos en allowlist)
- ✅ Error Boundary global + por módulo crítico operativo (F6-01)
- ✅ 23 tablas Supabase (16 datos clínicos + audit_log + 7 vademécum)

**Nota de gobernanza:** La restauración de backup en staging (requisito de F6-06) y el despliegue real requieren acceso a Supabase Pro y credenciales de hosting. Estos pasos se ejecutarán durante el despliegue real y se marcarán como completados en el checklist físico.

**Esfuerzo real:** S (0.5 día, documento). **Prioridad:** P1.

---

### 🏁 F4-04 COMPLETADO — E2E con Playwright (2026-08-16)

**Infraestructura E2E completa con validación de seguridad clínica.** **12/12 tests pasando (100%)**, incluyendo el flujo crítico de alertas de alergias cruzadas.

**Resumen de lo resuelto en F4-04:**

- **Fase 4-04a — Usuarios de prueba:** 4 usuarios creados en Supabase Auth con roles admin, dentista, asistente, recepcion. Email confirmación deshabilitada para desarrollo.
- **Fase 4-04b — data-testid:** 20 atributos `data-testid` agregados a 6 componentes críticos (LoginScreen, Sidebar, DirectorioPacientes, ModalNuevoPaciente, RecetasSection, AlertaAlergiaMejorada). Selectores robustos y mantenibles.
- **Fase 4-04c — Refinamiento iterativo:** Tests ajustados con esperas explícitas, timeouts generosos, y estrategias de fallback. Flujo de seguridad clínica validado de punta a punta.

**Métricas finales de F4-04:**

| Métrica | Valor |
|---|---|
| Tests E2E creados | 12 (en 6 specs) |
| Tests E2E pasando | 12/12 (100%) |
| Usuarios de prueba creados | 4 en Supabase Auth |
| data-testid agregados | 20 en 6 componentes |
| Archivos E2E creados | 8 |
| Documentación | `docs/E2E_TESTING.md` |

**Tests que pasan:**
- ✅ Login como admin (4.7s)
- ✅ Login como dentista (4.5s)
- ✅ Login como asistente (4.5s)
- ✅ Login como recepcion (4.5s)
- ✅ **Alerta crítica de alergias cruzadas (11.1s)** — crea paciente con alergia a Penicilina, prescribe Amoxicilina, verifica alerta + alternativas seguras


**Lecciones de proceso registradas:**

1. **Estrategia iterativa funciona mejor que "escribir todo de una vez":** los tests E2E requieren refinamiento basado en errores reales. Escribir specs genéricos y ajustar según fallos es más eficiente que intentar predecir todos los selectores.
2. **data-testid son esenciales para tests robustos:** selectores basados en texto (`text=Nuevo Paciente`) son frágiles. Los `data-testid` hacen los tests mantenibles.
3. **Esperas explícitas > timeouts implícitos:** `waitForSelector()` con timeout generoso es más confiable que `waitForTimeout()` fijo.
4. **Fallbacks pragmáticos:** si `data-testid` no está disponible, fallback a `type="email"` permite continuar sin bloquear el test.
5. **El flujo crítico valida más que 10 flujos secundarios:** validar alertas de alergias (riesgo de muerte) tiene más valor clínico que validar flujos administrativos.
6. **Usuarios de prueba requieren configuración de Supabase:** deshabilitar "Confirm email" es esencial para que los usuarios puedan hacer login sin verificación por correo.
7. **Timing de Realtime requiere paciencia:** Supabase Realtime puede tener latencia de 1-3 segundos. Tests deben esperar explícitamente a que los datos aparezcan.

**Valor clínico validado:** El sistema detecta correctamente alergias cruzadas (Penicilina → Amoxicilina) y sugiere alternativas seguras (Clindamicina, Azitromicina, Doxiciclina), previniendo reacciones adversas graves.

---

### 📝 F6-01 PARCIAL — Error Boundary implementado (2026-08-15)

> **Corrección 2026-08-16:** esta entrada decía "COMPLETADO". Faltan los boundaries de `odontograma` y `periodontograma` (incluidos en el alcance original) y el test que verifica que el layout sobrevive al fallo (criterio de aceptación 2). La tarea vuelve a `IN PROGRESS` (Regla de Gobernanza 3).

**Qué ganamos:** hoy un error de render en cualquier componente crítico (odontograma, periodontograma, agenda, presupuestos, pacientes) puede dejar la pantalla en blanco sin aviso, en medio de una consulta clínica real. Con Error Boundary, el fallo se aísla dentro del módulo específico, se muestra un mensaje controlado, y el resto de la aplicación (Sidebar, navegación, otros módulos) sigue funcionando.

**Implementación:**

**Componentes creados (2):**
- `src/components/ErrorBoundary.jsx` (68 líneas) — componente de clase con lifecycle methods `getDerivedStateFromError` y `componentDidCatch`
- `src/components/ErrorFallback.jsx` (107 líneas) — UI de fallback con mensaje amigable, botones de recuperación, y detalles técnicos solo en desarrollo

**Tests creados (1):**
- `src/components/ErrorBoundary.test.jsx` (145 líneas) — 7 tests automatizados cubriendo todos los criterios de aceptación

**Integración:**
- `src/main.jsx` — ErrorBoundary global envolviendo toda la aplicación
- `src/App.jsx` — ErrorBoundaries específicos en 3 módulos críticos:
  - `pacientes` (FichaPaciente + DirectorioPacientes + odontograma + periodontograma)
  - `agenda` (AgendaModulo)
  - `presupuestos` (PresupuestosModulo)

**Criterios de aceptación cumplidos:**
- ✅ Un error forzado dentro de un módulo envuelto no rompe el resto de la aplicación
- ✅ Test automatizado verifica que el fallback se renderiza y que el resto del layout (Sidebar, navegación) sigue funcional
- ✅ No se muestra stack trace ni información técnica sensible al usuario final en producción (solo visible en `import.meta.env.DEV`)

**Métricas de verificación:**
- Tests: 589/589 pasando (582 originales + 7 nuevos)
- Lint: 0 warnings, 0 errors
- Build: limpio (500.08 kB, 133.64 kB gzip)
- Architecture: todas las reglas cumplen (App.jsx: 360 líneas, límite actualizado a 370)

**Decisiones de diseño:**
- ErrorBoundary de clase propio (sin librería externa `react-error-boundary`) para evitar dependencias adicionales
- Fallback con 2 botones: "Volver al inicio" (reset sin perder sesión) y "Recargar la página" (reload completo)
- Registro estructurado de errores con contexto (módulo, mensaje, stack, timestamp) — base para F6-03 (logger centralizado)
- Detalles técnicos en `<details>` cerrado por defecto, solo visible en desarrollo

**Limitación documentada:**
ErrorBoundary solo captura errores durante el render, en event handlers, y en métodos de ciclo de vida. NO captura errores dentro de `useEffect` / async / setTimeout. Para esos casos, cada módulo debe usar try/catch propio.

**Archivos modificados:**
- `src/main.jsx` — +4 líneas (import + wrapper)
- `src/App.jsx` — +7 líneas (import + 3 ErrorBoundaries)
- `scripts/architecture-allowlist.json` — App.jsx: 354 → 370 líneas

**Esfuerzo real:** S (1 día). **Prioridad:** P1.

---

### 📝 F6-02 PARCIAL — Auditoría E2E con evidencia (2026-08-15)

> **Corrección 2026-08-16:** esta entrada decía "COMPLETADO", pero su propio texto reconoce que el job E2E no está en CI, que es el segundo criterio de aceptación. Además, de las siete "inconsistencias corregidas" que lista, **dos no se aplicaron**: el bloque duplicado de F4-03a-h y la tabla "Tareas pendientes acumuladas" seguían en el documento hasta la revisión del 2026-08-16 (ambas eliminadas en esa fecha). La tarea vuelve a `IN PROGRESS`.
>
> **Hallazgo adicional no registrado entonces:** los E2E se ejecutaron contra Supabase de **producción**, no contra un entorno de prueba. Registrado como **F6-I**.

**Contradicción resuelta:** el documento presentaba dos valores diferentes para tests E2E ("5/11 passing" en algunas secciones y "12/12 passing" en otras). Tras ejecutar la suite completa con evidencia reproducible, el número oficial es **12/12 passing (100%)**.

**Evidencia recolectada:**
- Comando ejecutado: `npm run test:e2e` (Playwright 1.62.1)
- Entorno: Supabase de producción con usuarios de prueba reales (`e2e_*@studiodental.com`)
- Workers: 4 en paralelo
- Timestamp: 2026-08-15
- Tiempo total de ejecución: 23.6s
- Resultado: 6 specs, 12 tests, 12 passing, 0 failing

**Desglose por spec:**
| Spec | Tests | Tiempo |
|---|---|---|
| `00-verify-login.spec.js` | 4 passing | ~18s total |
| `flujo-seguridad.spec.js` | 1 passing | 9.1s |
| `flujo-clinico.spec.js` | 1 passing | 13.0s |
| `flujo-financiero.spec.js` | 2 passing | 12.0s |
| `flujo-inventario.spec.js` | 2 passing | 10.0s |
| `flujo-colaborativo.spec.js` | 2 passing | 12.9s |

**Inconsistencias corregidas en este documento:**
1. F2-07b en tablero principal: `TODO` → `DONE`
2. Bloque duplicado de F4-03 en tablero: eliminado
3. Fila duplicada de F4-04 en tablero: eliminada
4. Métricas de tests E2E: "5/11 passing" → "12/12 passing (100%)"
5. Sección "Tests pendientes de refinamiento": eliminada (obsoleta)
6. Sección "Tareas pendientes acumuladas": eliminada (obsoleta)
7. F6-02 marcada como `DONE`

**Hallazgos derivados (registrados como subtareas nuevas, Regla de Gobernanza 5):**
- **F6-02b** (P2): El pipeline CI/CD (`.github/workflows/ci.yml`) no incluye un job para tests E2E. Actualmente solo ejecuta lint, test (Vitest), build y validate-architecture. Los E2E corren solo localmente.
- **F6-02c** (P3): Los `data-testid` de `LoginScreen.jsx` no llegan al bundle final de Vite, lo que hace que el fixture de login siempre use el fallback `type="email"`. Funcional pero genera warnings en cada test. Requiere investigar el proceso de compilación.

**Estado del CI/CD:**
- Jobs actuales: lint ✅, test ✅, build ✅, architecture ✅
- Job faltante: e2e ❌ (F6-02b)

**Decisión de gobernanza:** la bitácora de F4-04 ahora refleja correctamente 12/12 passing como estado oficial. Las secciones que aún decían "5/11" han sido actualizadas. F6-06 (checklist de despliegue) puede proceder con evidencia sólida.

**Esfuerzo real:** XS (< 0.5 día). Prioridad: P1.

---

### 🏁 F4-03 COMPLETADO — Vademécum v1.1 integrado (2026-08-15)

**El vademécum v1.1 está completamente operativo.** 164 registros de datos clínicos enriquecidos, alertas de alergias cruzadas funcionales, módulo de administración con 8 tabs, y autocompletado de recetas con posologías detalladas.

**Resumen de lo resuelto en F4-03:**

- **F4-03a — Esquema SQL:** 7 tablas creadas en Supabase con RLS configurado para lectura pública
- **F4-03b — Carga de datos:** 164 registros cargados con posologías enriquecidas (94 fármacos + 11 urgencia + 6 antirresortivos + 25 alergias + 15 interacciones + 7 profilaxis + 5 anticoagulantes)
- **F4-03c — vademecumService:** servicio central con 33 tests, métodos para todas las tablas
- **F4-03d — anestesiaCalc:** integrado con dosis máximas reales del vademécum
- **F4-03e — Alertas de alergias:** `evaluarIncompatibilidadFarmaco` usa matriz completa de 25 reglas
- **F4-03f — Módulo admin:** contenedor con 8 tabs CRUD (vademécum, urgencia, antirresortivos, alergias, interacciones, profilaxis, anticoagulantes, metadata)
- **F4-03g — Autocompletado recetas:** RecetasSection usa los 94 fármacos del vademécum con posologías completas
- **F4-03h — Mejoras UI:** AlertaAlergiaMejorada con iconos, familia farmacológica, alternativas seguras y notas clínicas expandibles

**Métricas finales de F4-03:**

| Métrica | Valor |
|---|---|
| Tests pasando | 582/582 |
| Lint | 0 warnings, 0 errors |
| Build | limpio |
| Architecture | 67 archivos en allowlist, todas las reglas cumplen |
| Tablas Supabase nuevas | 7 (vademécum) |
| Registros cargados | 164 |
| Archivos nuevos creados | 19 |
| Tests de vademecumService | 33 |

**Lecciones de proceso registradas:**

1. **RLS debe configurarse explícitamente:** aunque las tablas existan, sin políticas de lectura pública el frontend con `anon key` no puede leerlas
2. **Posologías enriquecidas requieren múltiples campos:** combinar `posologia_adulto` + `duracion_dias` + vía produce posologías completas (dosis + frecuencia + duración + vía)
3. **Matriz de alergias cruzadas es bidireccional:** si penicilina → cefalosporina tiene reactividad, también cefalosporina → penicilina
4. **Alternativas seguras deben filtrar por familia:** función `obtenerAlternativasSeguras()` construye set de familias incompatibles y filtra fármacos del vademécum
5. **Componentes grandes requieren extracción:** `AdminVademecumModulo` con 8 tabs excedería 250 líneas → extraído `AdminProtocolosContenido` para los 4 tabs nuevos
6. **Alertas UI requieren estructura visual clara:** iconos grandes + colores diferenciados + sección expandible mejora usabilidad clínica

**Verificación manual ejecutada:**
- ✅ Módulo admin "💊 Vademécum" muestra los 94 fármacos en tab principal
- ✅ Autocompletado de recetas muestra posologías completas (ej: "1 comprimido cada 8 horas por 7 días vía oral")
- ✅ Alertas de alergias cruzadas funcionan (paciente con alergia a penicilina + Amoxicilina → alerta crítica)
- ✅ Alternativas seguras se muestran en alertas (3 fármacos de familias sin reactividad cruzada)

---

### 🏁 FASE 5 COMPLETAMENTE CERRADA (2026-08-14)

**La colaboración en tiempo real está operativa.** La app ahora sincroniza datos instantáneamente entre dispositivos, sobrevive a caídas de internet, detecta conflictos de edición y notifica al usuario de todo lo relevante.

**Resumen de lo resuelto en F5:**

- **F5-01 — Realtime setup:** infraestructura de suscripciones a 17 tablas con WebSockets. Realtime ya habilitado en Supabase, solo se creó la capa de abstracción en la app.
- **F5-02 — Sync en tiempo real:** 11 tablas monitoreadas con anti-loop (2s tolerancia), refresh de `pacientesStore` y eventos custom para tablas sin store Zustand.
- **F5-03 — Offline-first queue:** cola FIFO persistente con retry exponencial (0s, 1s, 2s, 4s, 8s), lock anti-concurrente, y 5 storage services soportados.
- **F5-04 — Conflict resolution:** detección vía `updated_at`, modal de resolución manual con diff visual, tabla `audit_log` en Supabase con RLS, y estrategias de resolución (manual_local, manual_remote, last_write_wins).
- **F5-05 — Notifications:** sistema de toasts con 4 tipos y auto-dismiss, indicador de conexión en Sidebar (online/offline/conectando), detección de conflictos de agenda, y toasts contextuales al recibir cambios externos o procesar cola offline.

**Métricas finales de Fase 5:**

| Métrica | Valor |
|---|---|
| Tests pasando | 517/517 |
| Lint | 0 warnings, 0 errors |
| Build | limpio |
| Architecture | 30 archivos en allowlist, todas las reglas cumplen |
| Tablas Supabase nuevas | 1 (audit_log) |
| Archivos nuevos creados | 20 |
| Hooks nuevos creados | 4 (useRealtimeSubscription, useRealtimeSync, useOfflineQueue, useNotifications) |
| Servicios nuevos creados | 5 (realtimeService, realtimeEvents, operationQueue, conflictDetectionService, notificationService) |
| Componentes UI nuevos | 3 (ConflictResolutionModal, ToastContainer, ConnectionIndicator) |

**Lecciones de proceso registradas en F5:**

1. **Crear infraestructura primero, integrar después:** F5 siguió el mismo patrón de F4 — primero infraestructura sólida, luego adopción progresiva por módulos. Evita romper flujos existentes.
2. **Loop prevention es crítico:** sin timestamps de escritura local, Realtime causaría loops infinitos. La tolerancia de 2s es empírica pero efectiva.
3. **Conflict resolution requiere UX cuidadosa:** modal de resolución con diff visual lado a lado es más usable que un simple "overwrite or discard".
4. **Notification system debe ser no-bloqueante:** errores en notificaciones NUNCA deben romper el flujo principal de la app. Fail silently + console.error.
5. **SQL schema ejecutado manualmente:** tablas de auditoría se crean una vez vía SQL Editor de Supabase, no via código (evita problemas de idempotencia).
6. **Allowlist debe permitir excepciones justificadas:** `conflictosAgenda.js` tiene 104 líneas pero es lógica de dominio pura con tests exhaustivos. Excepción válida documentada.
7. **Componentes UI compartidos sin librerías externas:** `ToastContainer` y `ConnectionIndicator` implementados con Tailwind puro, sin añadir dependencias al proyecto (sin react-hot-toast, sin sonner).

---

### 🏁 FASE 4 COMPLETAMENTE CERRADA (2026-08-13)

**La migración de datos a Supabase está completa y mergeada vía PR #22.** El sistema ahora opera con PostgreSQL como fuente de verdad y localStorage como caché optimista offline-first.

**Resumen de lo resuelto:**

- **F4-02a — DB schema + RLS:** 15 tablas creadas con políticas de aislamiento por usuario (PR #16)
- **F4-02b — Cliente Supabase + auth:** dual-mode con `VITE_USE_SUPABASE`, integración con `sesionStore` (PR #16 + hotfix)
- **F4-02c-1 — Tablas clínicas:** 11 tipos de datos clínicos con estructura JSONB flexible
- **F4-02c-2 — Pacientes:** UPSERT por RUT, filtro SEED, mapeo bidireccional legacyId ↔ UUID
- **F4-02c-3 — Citas:** normalización de estados, filtro de bloqueos de agenda, validación de paciente migrado
- **F4-02c-4 — Presupuestos:** migración de presupuestos globales + items vinculados + items huérfanos (PR #21)
- **F4-02c-5 — Pagos + Finanzas:** pagos globales (`paciente_id=NULL`) y abonos por paciente (`paciente_id=UUID`)
- **F4-02c-6 — Datos clínicos:** 11 tipos de datos migrados por paciente
- **F4-02d-1 — Lectura:** caché en memoria sincronizada desde Supabase, API síncrona preservada
- **F4-02d-2 — Escritura:** métodos de guardado con UPSERT inteligente y mapeo camelCase ↔ snake_case
- **F4-02e — Testing + UX:** persistencia de navegación, restauración de ficha de paciente, script de validación, fixes de logout/session restore

**Métricas finales de la fase:**

| Métrica | Valor |
|---|---|
| Tests pasando | 428/428 |
| Lint | 0 warnings, 0 errors |
| Build | limpio (sin warnings) |
| Architecture | 29 archivos en allowlist, todas las reglas cumplen |
| Tablas Supabase | 15 |
| Tipos de datos clínicos | 11 |
| Storage services dual-mode | 7 |
| Archivos nuevos creados | 13 |
| PRs mergeados | #16, #21, #22 |

**Lecciones de proceso registradas:**

1. **Commits incrementales vs commit único:** se decidió acumular cambios sin commit intermedio para avanzar rápido; riesgo asumido y documentado
2. **Reordenamiento de hooks:** los `useEffect` que dependen de variables declaradas después causan temporal dead zone — siempre declarar dependencias antes
3. **Filtrado de datos demo:** los SEED (pacientes de demostración) deben excluirse explícitamente de migraciones para evitar contaminación de producción
4. **Imports de barreras públicas en scripts:** los scripts de migración deben importar servicios directamente (no vía `index.js`) para evitar warnings de code-splitting
5. **Validación con script standalone:** `validate-f4-supabase.js` sin dependencias externas permite verificar el estado de Supabase desde CI o local sin instalar nada
6. **Persistencia de ficha con fallback seguro:** restaurar paciente desde Supabase al recargar requiere manejo graceful del caso "paciente eliminado" para no romper la app
7. **Session restore vs logout intencional:** delay de 100ms antes de verificar sesión evita logout-loop

---

### 🏁 FASE 3 COMPLETA (2026-08-13)

F3-06 absorbido por F4-02 (versionado implícito vía Supabase migrations). F3-08 resuelto durante F4-02e. Pendiente sin bloquear: F3-07 (mantenimiento, P3).

---

### F2-04e — Esquema Zod para `presupuesto` — DONE (2026-08-12)

**Cierre de la serie F2-04:** Con esta subtarea se completa el sistema de validación Zod para todas las estructuras de datos críticas del sistema.

**Archivos creados:**
- `src/modules/presupuestos/schemas/presupuestoSchema.js` — 4 campos obligatorios (id, folio, pacienteNombre, estado) + opcionales
- `src/modules/presupuestos/schemas/presupuestoSchema.test.js` — 22 tests

**Archivos modificados:**
- `src/modules/presupuestos/services/presupuestosStorageService.js` — integración de `validarListaPresupuestos()` en `guardarPresupuestos()`

**Decisiones de diseño:**
- **4 campos obligatorios mínimos** porque presupuestos pueden venir de dos orígenes con estructuras diferentes (consolidados desde pacientes vs presupuestos directos)
- **Solo `guardarPresupuestos` valida** — los métodos que usan claves dinámicas quedan sin validación por ahora

**Verificación:**
- ✅ 22 nuevos tests
- ✅ 400/400 tests totales pasando
- ✅ 0 regresiones en tests existentes
- ✅ Lint: 0 warnings, 0 errors

---

### F2-04d — Esquema Zod para `prestacion` — DONE (2026-08-12)

**Archivos creados:**
- `src/modules/prestaciones/schemas/prestacionSchema.js` — 6 campos obligatorios (id, nombre, especialidad, precioParticular, precioFonasa, codigoFonasa) + opcional (precio normalizado)
- `src/modules/prestaciones/schemas/prestacionSchema.test.js` — 28 tests

**Archivos modificados:**
- `src/modules/prestaciones/services/prestacionesStorageService.js` — integración de `validarListaPrestaciones()` con manejo graceful de null/undefined

**Verificación:**
- ✅ 28 nuevos tests
- ✅ 378/378 tests totales pasando
- ✅ Lint: 0 warnings, 0 errors

---

### F2-04c — Esquema Zod para `movimientoFinanciero` — DONE (2026-08-12)

**Archivos creados:**
- `src/modules/finanzas/schemas/movimientoFinancieroSchema.js` — 6 campos obligatorios (id, fecha, tipo, categoria, monto, metodoPago) + opcionales
- `src/modules/finanzas/schemas/movimientoFinancieroSchema.test.js` — 22 tests

**Archivos modificados:**
- `src/modules/finanzas/services/finanzasStorageService.js` — integración de `validarListaMovimientos()` antes de persistir

**Verificación:**
- ✅ 22 nuevos tests
- ✅ 350/350 tests totales pasando
- ✅ Lint: 0 warnings, 0 errors

---

### F2-04b — Esquema Zod para `cita` — DONE (2026-08-12)

**Archivos creados:**
- `src/modules/agenda/schemas/citaSchema.js` — 4 campos obligatorios (id, fecha, horaInicio, estado) + opcionales
- `src/modules/agenda/schemas/citaSchema.test.js` — 23 tests

**Archivos modificados:**
- `src/modules/agenda/services/agendaStorageService.js` — integración de `validarListaCitas()` antes de persistir
- `src/modules/agenda/hooks/useAgenda.test.js` — 13 fixtures actualizados para incluir campos obligatorios

**Lección aprendida:** Al agregar validación en el servicio, los tests existentes con fixtures malformados fallan. Esto es **comportamiento esperado** (el validador hace su trabajo), pero requiere actualizar los fixtures para representar datos válidos.

**Verificación:**
- ✅ 23 nuevos tests
- ✅ 328/328 tests totales pasando (después de actualizar fixtures)
- ✅ Lint: 0 warnings, 0 errors

---

### F2-07h — Corregir clave desincronizada en descuento de stock — DONE (2026-08-12)

**QA manual ejecutado:** El usuario marcó tratamiento como "Realizado" en Ficha de Paciente y confirmó que el stock baja correctamente en módulo Inventario real. ✅ Verificado.

**Criterios cumplidos:**
- [x] `PresupuestoSection.jsx` descuenta stock vía `inventarioStorageService`
- [x] QA manual confirmado

---

### F2-10 — Unificar imports internos en stores — DEFERRED (2026-08-12)

**Intento de implementación falló:** introdujo dependencia circular entre `prestacionesStore.js` → `prestaciones/index.js` → `PrestacionesModulo` → `usePrestacionesStore`.

**Decisión:** Marcar como DEFERRED con justificación técnica documentada. No se implementará workaround complejo. `prestacionesStore.js` sigue usando rutas internas como excepción válida documentada al Cap. III de la Constitución.

---

### F3-05 — RBAC básico — DONE (2026-08-12)

**Implementación completa:** Sistema de RBAC con 4 roles diferenciados, 11 permisos, matriz de acceso, y selector de rol en login. Ver detalles completos en la sección de Fase 3.

**PR:** #5 (mergeado 2026-08-12)

---

### F2-04 — Esquemas Zod — DONE (2026-08-10, criterio mínimo; 2026-08-12 serie completa)

`pacienteSchema` como base; F2-04b-e agregaron 4 esquemas adicionales para estructuras críticas.

---

### 🏁 FASE 2 COMPLETAMENTE CERRADA (2026-08-12)

**Todas las tareas principales y derivadas críticas de Fase 2 están en DONE.** Única subtarea pendiente: F2-07b (4 servicios nuevos), registrada como trabajo incremental no bloqueante. F2-10 documentada como `DEFERRED` con justificación técnica (dependencia circular).

**Resumen de lo resuelto:**
- **Estado global (Zustand):** 3 stores (sesión, pacientes, prestaciones) eliminan el prop drilling masivo
- **Capa de persistencia refactorizada:** factory `createLocalStorageRepository` (12/14 servicios migrados, 2 excepciones justificadas)
- **Validación de datos completa (F2-04 series):** 5 esquemas Zod para estructuras críticas con 95 tests de validación
- **Code-splitting:** 3 módulos eager + 11 lazy; chunk inicial 466.39 kB (gzip: 124.70 kB)
- **Barreras públicas completas:** todos los módulos tienen `index.js` con servicios y componentes
- **Accesos directos a localStorage:** migrados 24+ accesos en 12+ archivos; excepciones válidas: `authService.js` y `sesionStore.js` (claves propias de su dominio)

**Lecciones de proceso registradas:**
1. **Regla de entrega de código:** siempre enviar archivos COMPLETOS reemplazados, no parches tipo "cambia esta línea"
2. **Verificación previa de APIs:** antes de modificar código que depende de un servicio, verificar el contenido real del archivo
3. **Patrón de cierre documental:** cuando el código ya está implementado antes de la inspección formal, verificar estado real y cerrar documentalmente con métricas y decisiones técnicas correspondientes
4. **Regla de comunicación de valor:** cada tarea debe explicar explícitamente qué ganamos al realizarla (regla #7 de gobernanza)
5. **Dependencias circulares:** antes de refactorizar imports, analizar el grafo de dependencias completo. F2-10 demostró que incluso refactors "triviales" pueden romper el CI si introducen ciclos.

---

### F3-04 — Ampliar cobertura de testing — DONE (2026-08-11)

**Implementación:** 7 hooks testeados. Total: 287 tests (144 originales + 143 nuevos). Baseline establecido.

---

### F3-03 — Conventional Commits — DONE (2026-08-11)

**Implementación:** `CONTRIBUTING.md` con guía completa de commits convencionales y flujo de ramas. README actualizado.

---

### F3-02 — Validación arquitectónica — DONE (2026-08-11)

**Implementación:** `scripts/validate-architecture.js` con allowlist de 20 archivos excepcionales.

---

### F3-01 — Pipeline CI/CD — DONE (2026-08-11)

**Implementación:** `.github/workflows/ci.yml` con 4 jobs (lint, test, build, architecture). Branch protection en GitHub.

---

### F2-09 — Limpieza de 35 warnings de oxlint — DONE (2026-08-11)

3 categorías de warnings resueltas sistemáticamente: `no-useless-rename` (~12), `no-unused-vars` (~15), `no-unused-expressions` (~8).

---

### F2-07f — Migrar `localStorage.clear()` a servicio — DONE (2026-08-11)

`configuracionStorageService.limpiarBaseDeDatosCompleta()` reemplaza `localStorage.clear()` en `RespaldoDatosSection.jsx`.

---

### F2-06c — Completar exportación faltante en `finanzas/index.js` — DONE (2026-08-11)

**Patrón recurrente:** segundo incidente del mismo tipo (primero fue F1-05 con `pacientesStorageService`). Refuerza lección: siempre verificar contenido real de barreras públicas antes de migrar imports.

---

### F2-07 — Eliminar accesos directos a `localStorage` — CERRADA 7/8 subtareas (2026-08-10/11/12)

**Decisión de gobernanza:** dividir en subtareas F2-07a a F2-07h siguiendo patrón de F1-04 y F2-04.

---

### F2-01, F2-02, F2-02b — Store global + eliminación de prop drilling — DONE (2026-08-10)

3 stores Zustand con persistencia automática y sincronización cross-tab.

---

### F2-03, F2-03g — Repositorio genérico de `localStorage` — DONE (2026-08-10)

`createLocalStorageRepository` extraído a `src/services/localStorageRepository.js`. 12/14 servicios migrados.

---

### F2-05 — Code-splitting — DONE (2026-08-10)

Chunk principal: 721.57 kB → 466.39 kB (171.20 kB → 124.70 kB gzip). Warning `INEFFECTIVE_DYNAMIC_IMPORT` registrado como F3-08.

---

### F2-06 — `index.js` faltantes — DONE (2026-08-10)

Creados para `dsd`, `odontopediatria`, `periodontograma`, `quirurgico`.

---

### F2-08 — Extracción de `LoginScreen`, `Sidebar`, Directorio de Pacientes — DONE (2026-08-10)

`App.jsx` verificado en 172 líneas.

---

### 🏁 FASE 1 COMPLETA (2026-08-08)

Las 11 tareas de Fase 1 cerradas y verificadas. Sistema apto para datos clínicos reales.
