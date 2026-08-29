# Migraciones de Esquema — Studio Dental (F7-13)

## Propósito

Todos los objetos de base de datos (tablas, columnas, índices, políticas RLS,
funciones, triggers) deben poder reconstruirse desde supabase/migrations/.
Esto garantiza:

- Reproducibilidad: cualquier entorno (dev, staging, prod) puede reconstruirse desde cero
- Trazabilidad: cada cambio de esquema queda versionado con timestamp
- Seguridad: los cambios de esquema se revisan en PR antes de aplicarse

## Estructura

supabase/
  config.toml                  -> Configuración de Supabase CLI
  migrations/                  -> Migraciones versionadas (orden cronológico)
    20260101000001_base_schema.sql
    20260101000002_clinical_tables.sql
    20260101000003_multiclinica_base.sql
    20260101000004_multiclinica_rls.sql
    20260101000005_rbac_base.sql
    20260101000006_rbac_policies.sql
    20260101000007_soft_delete.sql
    20260101000008_audit_log.sql
    20260101000009_certificados.sql
    20260101000010_vademecum.sql
    2026_08_28_0001_f7_04_integridad_dosis_anestesia.sql
  seeds/                       -> Seeds por entorno
    dev.seed.sql               -> Datos mínimos de desarrollo (sin PHI)
    staging.seed.sql           -> 2 clínicas para aislamiento (sin PHI)
    e2e.seed.sql               -> 6 usuarios E2E (F7-21)
    vademecum.seed.sql         -> Vademécum completo
  README_MIGRATIONS.md         -> Este archivo

## Formato de nombres

Las migraciones usan timestamp para orden cronológico:

- Formato recomendado: YYYYMMDDHHMMSS_descripcion.sql (14 dígitos seguidos)
- Formato legacy aceptado: YYYY_MM_DD_NNNN_descripcion.sql (con guiones bajos)

Supabase CLI aplica las migraciones en orden alfabético (= cronológico).

## Comandos npm

- npm run db:reset   -> Resetear BD local (aplica migraciones + seeds)
- npm run db:push    -> Aplicar migraciones pendientes a entorno remoto
- npm run db:pull    -> Extraer esquema actual de remoto como nueva migración
- npm run db:diff    -> Comparar esquema local con remoto
- npm run db:seed    -> Ejecutar seeds en BD local
- npm run db:verify  -> Verificar migraciones vs esquema de producción

## Flujo de trabajo para cambios de esquema

1. Crear migración: agregar supabase/migrations/YYYYMMDDHHMMSS_descripcion.sql
2. Probar localmente: npm run db:reset (requiere Docker)
3. Verificar: npm run db:verify (compara con producción)
4. Commit + PR: el cambio de esquema se revisa en el PR
5. Aplicar a staging: supabase db push --linked
6. Aplicar a producción: supabase db push --linked

## Linkear entornos remotos

- supabase link --project-ref REF_STAGING   (staging)
- supabase link --project-ref REF_PROD      (producción)

## Verificación

El script scripts/db/verify-migrations.js compara:

- Tablas: nombres en migraciones vs producción
- Funciones: nombres en migraciones vs producción
- Triggers: nombres en migraciones vs producción

Reporta diferencias (objetos faltantes o extra en producción).

## Seeds por entorno

- dev.seed.sql: 1 clínica + datos mínimos (sin PHI)
- staging.seed.sql: 2 clínicas para pruebas de aislamiento (sin PHI)
- e2e.seed.sql: 6 usuarios E2E (F7-21) con roles y vinculaciones
- vademecum.seed.sql: vademécum completo (datos farmacológicos, no PHI)

Importante: los seeds NO contienen PHI real. Solo datos de prueba.

## Notas

- Los archivos schema-*.sql sueltos en la raíz de supabase/ se mantienen como
  backup histórico, pero la fuente de verdad es supabase/migrations/
- Nunca edites una migración ya aplicada a producción; crea una nueva
- Las migraciones deben ser idempotentes cuando sea posible
  (IF NOT EXISTS, ON CONFLICT DO NOTHING)
