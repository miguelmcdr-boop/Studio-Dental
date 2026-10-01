# Deudas Técnicas — Studio Dental

**Última actualización:** 2026-09-29
**Responsable:** Equipo de desarrollo

## Deudas activas

### 1. E2E deshabilitado en CI (F7-36 FASE 10)

**Archivo:** `.github/workflows/ci.yml` (job `e2e`)
**Fecha de registro:** 2026-09-29
**Prioridad:** P2 (no bloqueante para release)
**Estado:** Activa

#### Descripción

El job E2E en el pipeline CI/CD está marcado con `if: false`, lo que significa que **no se ejecuta** en cada PR o push a main.

#### Razón técnica

**Supabase staging fue eliminado.** Solo existe Supabase producción.

Esto crea dos problemas:

1. **No hay entorno para E2E:** Los tests E2E requieren un entorno separado de producción para:
   - Crear/eliminar usuarios de prueba sin afectar datos reales
   - Ejecutar seeds de datos sin contaminar producción
   - Probar flujos destructivos (eliminar archivos, pacientes, etc.)

2. **Ejecutar contra producción es peligroso:**
   - Tests podrían modificar datos reales de pacientes
   - Seeds podrían sobrescribir datos de producción
   - Tests de eliminación podrían borrar archivos reales de R2

#### Impacto de mantener E2E deshabilitado

- ✅ **Ventaja:** CI no falla por falta de entorno
- ✅ **Ventaja:** No hay riesgo de modificar producción accidentalmente
- ❌ **Desventaja:** No hay validación E2E automática en cada PR
- ❌ **Desventaja:** Regresiones E2E solo se detectan en testing manual

#### Condiciones para reactivar E2E

Para volver a habilitar el job E2E (eliminar `if: false`), se requiere:

1. **Crear nuevo entorno staging:**
   - Nuevo proyecto Supabase separado de producción
   - Configuración de secrets: `E2E_SUPABASE_URL`, `E2E_SUPABASE_ANON_KEY`, `E2E_DATABASE_URL`
   - Configuración de storage bucket separado para E2E

2. **Seed automatizado confiable:**
   - Script `supabase/seed-multiclinica-e2e.sql` debe ejecutarse sin errores
   - Usuarios `e2e_*` deben crearse correctamente
   - Datos de prueba deben aislarse de producción

3. **Validación de seguridad:**
   - Confirmar que E2E nunca modifica producción
   - Verificar que R2 bucket de E2E está aislado
   - Validar que secrets de staging no tienen acceso a producción

4. **Estabilidad demostrada:**
   - E2E debe pasar consistentemente (≥95% success rate) durante 2 semanas
   - Tiempo de ejecución <10 minutos
   - Sin fallos intermitentes por red/IPv6

#### Plan de mitigación actual

Mientras E2E esté deshabilitado:

1. **Testing manual antes de releases:**
   - QA debe ejecutar tests E2E localmente contra entorno controlado
   - Validar flujos críticos: login, subida de archivos, eliminación, restauración
   - Documentar resultados en checklist de release

2. **Monitoreo de producción:**
   - Revisar logs de Edge Functions después de cada deploy
   - Verificar que no hay errores inesperados
   - Monitorear audit_log para detectar comportamientos anómalos

3. **Validación en staging manual:**
   - Si se necesita validar cambio crítico, crear entorno temporal
   - Ejecutar E2E manualmente
   - Destruir entorno después de validación

4. **Tests unitarios + integración como primera línea de defensa:**
   - Vitest: 1658+ tests pasando
   - Security Regression Suite: validación de aislamiento multi-tenant
   - Deno tests: validación de Edge Functions

#### Código preservado

El job E2E está **deshabilitado pero no eliminado**. Esto permite:

- Reactivar rápidamente cuando se cree nuevo staging
- No perder configuración de Playwright, caché de browsers, etc.
- Mantener documentación de cómo ejecutar E2E

**Líneas clave preservadas:**
- Configuración de Playwright
- Caché de browsers (`~/.cache/ms-playwright`)
- Generación de reportes HTML
- Subida de screenshots de fallos

#### Referencias

- **Workflow:** `.github/workflows/ci.yml` (job `e2e`, líneas 211-280)
- **Seed E2E:** `supabase/seed-multiclinica-e2e.sql` (preservado para futuro)
- **Configuración E2E:** `e2e/playwright.config.js`
- **Brief F7-36 FASE 10:** "Si staging no permite E2E confiable todavía, documentar explícitamente y dejar como deuda de release."

---



---

### 2. Secret management: internal_purge_secret en tabla SQL (F7-37 H-06)

**Archivo:** supabase/migrations/20260101000018_purga_automatica_archivos.sql
**Fecha de registro:** 2026-09-29
**Prioridad:** P2 (no bloqueante, seguro actualmente)
**Estado:** Activa

#### Descripción

El secreto compartido `internal_purge_secret` (usado por pg_cron para invocar Edge Functions de purge) está almacenado en la tabla SQL `system_config` en lugar de un gestor de secretos dedicado como Supabase Vault o environment variables.

#### Razón técnica

- La migración `20260101000018_purga_automatica_archivos.sql` creó la tabla `system_config` con RLS estricto (solo `service_role` puede leer/escribir).
- Este diseño era apropiado en F7-32 cuando se creó.
- Migrar a Supabase Vault requeriría refactorización grande de:
  - `purgar_archivos_expirados()` (pg_cron)
  - `purgar_certificados_expirados()` (pg_cron)
  - Cualquier otro caller que lea `internal_purge_secret`

#### ¿Por qué es seguro actualmente?

- ✅ RLS estricto: solo `service_role` puede acceder a `system_config`
- ✅ Usuarios `authenticated` y `anon` NO tienen acceso
- ✅ No hay RPCs que expongan el secreto al frontend
- ✅ El secreto nunca se loggea ni se retorna en respuestas

#### Impacto de no resolver

- ✅ No hay impacto de seguridad inmediato (RLS protege el dato)
- ⚠️ No cumple con best-practices de secret management
- ⚠️ Backups de la BD incluirían el secreto (aunque también están protegidos)

#### Condiciones para resolver

1. Habilitar Supabase Vault en el proyecto
2. Migrar `internal_purge_secret` a Vault
3. Refactorizar `purgar_archivos_expirados()` y `purgar_certificados_expirados()` para leer desde Vault
4. Probar en staging antes de aplicar a producción

#### Plan de mitigación actual

- RLS estricto en `system_config` (policy `system_config_service_role_only`)
- Solo Edge Functions (service_role) pueden leer el secreto
- El secreto se pasa como header `X-Internal-Secret` (no en URL ni query string)

#### Referencias

- Migración: `supabase/migrations/20260101000018_purga_automatica_archivos.sql`
- Funciones afectadas: `purgar_archivos_expirados()`, `purgar_certificados_expirados()`
- F7-37 cierre: `docs/F7-37-CIERRE.md` sección 8



---

### 3. Audit log retention policy no definida

**Archivo:** supabase/migrations/20260101000000_audit_log.sql
**Fecha de registro:** 2026-09-29
**Prioridad:** P2 (no bloqueante)
**Estado:** Activa

#### Descripción

La tabla `audit_log` no tiene política de retención definida. Los snapshots clínicos (`old_data`, `new_data`) se acumulan indefinidamente.

#### Razón técnica

- Diseñada como append-only estricta (correcto para auditabilidad)
- No hay mecanismo de purga programada
- Con el tiempo, la tabla crecerá sin límite

#### Impacto de no resolver

- ✅ No hay impacto de seguridad
- ⚠️ Costo de storage aumenta con el tiempo
- ⚠️ Queries históricas pueden volverse lentas

#### Condiciones para resolver

1. Definir política de retención (ej: 7 años para cumplimiento regulatorio)
2. Crear job pg_cron que archive/purge registros antiguos
3. Considerar particionado por fecha
4. Asegurar cumplimiento normativo (HIPAA/GDPR si aplica)

#### Plan de mitigación actual

- Monitoreo de tamaño de tabla (manual)
- Índices en `created_at` para queries históricas
- Particionado futuro cuando el volumen lo requiera

#### Referencias

- Migración: `supabase/migrations/20260101000000_audit_log.sql`
- Función: `auditar_cambio()` (trigger que escribe en audit_log)
- F7-37 cierre: `docs/F7-37-CIERRE.md` sección 5


## Deudas resueltas

(Agregar aquí deudas que fueron pagadas)

---

## Proceso para registrar nueva deuda técnica

1. Identificar deuda durante desarrollo o auditoría
2. Documentar en este archivo con:
   - Descripción clara del problema
   - Razón técnica (por qué existe)
   - Impacto de no resolverla
   - Condiciones para resolverla
   - Plan de mitigación actual
3. Agregar referencia en MASTER_ROADMAP.md si aplica
4. Revisar deudas activas en cada planning de release


### 2026-09-30 — P2: Posible r2ArchivoId duplicado en certificados

**Clasificación:** P2 (robustez/operación, no seguridad)
**Origen:** Auditoría F7-37 v6

**Descripción:**
La columna datos->>'r2ArchivoId' en la tabla certificados no tiene constraint UNIQUE ni índice GIN. Teóricamente, múltiples certificados podrían referenciar el mismo archivo R2.

**Por qué NO es P1:**
- No hay evidencia de duplicados en producción
- No permite violar aislamiento cross-tenant
- El flujo de creación podría garantizar unicidad por diseño (no inspeccionado)
- Sin impacto de seguridad demostrable

**Recomendación futura (si se detectan duplicados):**
Crear índice UNIQUE funcional:
```sql
CREATE UNIQUE INDEX idx_certificados_r2_archivo_id_unico
ON public.certificados ((datos->>'r2ArchivoId'))
WHERE datos->>'r2ArchivoId' IS NOT NULL
  AND eliminado_at IS NULL;
```

**Query de detección de duplicados:**
```sql
SELECT datos->>'r2ArchivoId' AS r2_id, COUNT(*) AS duplicados
FROM public.certificados
WHERE datos->>'r2ArchivoId' IS NOT NULL
  AND eliminado_at IS NULL
GROUP BY datos->>'r2ArchivoId'
HAVING COUNT(*) > 1;
```

**Estado:** Documentado, sin migración creada (evitar migración por hipótesis).
