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
