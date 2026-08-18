# Scripts SQL versionados — Studio Dental

Este directorio contiene **todos** los scripts necesarios para levantar desde cero el esquema de datos completo del sistema. Un proyecto Supabase vacío ejecutando estos scripts en el orden correcto queda **funcionalmente equivalente** al entorno de desarrollo/producción actual.

## ⚠️ Orden de ejecución

El orden es **crítico** porque hay dependencias entre scripts (funciones, tipos, triggers). Ejecutarlos fuera de orden genera errores de sintaxis.

    1. schema.sql                       ← función update_updated_at_column() y perfiles
    2. schema-rbac.sql                  ← enum app_role + helpers + trigger de alta (F6-B1)
    3. schema-clinical-tables.sql       ← 15 tablas clínicas + audit_log
    4. schema-audit-log.sql             ← tabla de auditoría + RLS + índices
    5. schema-vademecum.sql             ← 8 tablas del vademécum (F6-A)
    6. seed-vademecum.sql               ← 164 registros del vademécum (F6-A)
    7. schema-rbac-policies.sql         ← privilegios + RLS por rol server-side (F6-B2)
    8. schema-rbac-policies-fin.sql     ← RLS financiero + vademécum + audit (F6-B3)
    9. migrate-roles-to-app-metadata.sql← SOLO producción, una vez, service_role (F6-B3)

## Cómo ejecutar

### Opción A: desde el SQL Editor de Supabase (recomendado para primera vez)

1. Abre tu proyecto Supabase → **SQL Editor** → **New query**
2. Copia y pega **todo** el contenido de cada archivo, en el orden indicado
3. Ejecuta cada archivo por separado (botón **Run**)
4. Verifica que el resultado sea `Success` antes de pasar al siguiente

### Opción B: desde la CLI de Supabase (para CI/CD o despliegues)

    supabase db reset   # opcional: limpia la base local
    supabase db push    # aplica las migraciones

## Verificación post-ejecución

Tras ejecutar los 5 scripts, estas consultas deben devolver los valores esperados:

    -- Debe devolver 27 tablas (19 previas + 8 del vademécum)
    SELECT count(*) AS tablas_totales
    FROM information_schema.tables
    WHERE table_schema = 'public';

    -- Desglose de los 164 registros del vademécum
    SELECT 'vademecum' AS tabla, count(*) FROM public.vademecum UNION ALL
    SELECT 'vademecum_urgencia', count(*) FROM public.vademecum_urgencia UNION ALL
    SELECT 'vademecum_antirresortivos', count(*) FROM public.vademecum_antirresortivos UNION ALL
    SELECT 'alergias_cruzadas', count(*) FROM public.alergias_cruzadas UNION ALL
    SELECT 'interacciones_farmacologicas', count(*) FROM public.interacciones_farmacologicas UNION ALL
    SELECT 'profilaxis_endocarditis', count(*) FROM public.profilaxis_endocarditis UNION ALL
    SELECT 'manejo_anticoagulantes', count(*) FROM public.manejo_anticoagulantes UNION ALL
    SELECT 'reference_data_meta', count(*) FROM public.reference_data_meta;
    -- Resultado esperado: 94 + 11 + 6 + 25 + 15 + 7 + 5 + 1 = 164

## Notas sobre idempotencia

- `schema-vademecum.sql` usa `CREATE TABLE IF NOT EXISTS` y `CREATE INDEX IF NOT EXISTS`: puede ejecutarse múltiples veces sin error
- `seed-vademecum.sql` usa `ON CONFLICT DO NOTHING`: puede ejecutarse múltiples veces sin duplicar registros
- Los scripts `schema-clinical-tables.sql` y `schema-audit-log.sql` originales **no** son idempotentes — si necesitas re-ejecutarlos, primero ejecuta `DROP TABLE IF EXISTS ... CASCADE`

## Archivos no incluidos (todavía)

Las siguientes tablas existen en Supabase de desarrollo pero **no** están versionadas en el repo todavía. Su incorporación corresponde a tareas específicas:

- **Tabla `inventario`** — monitoreada por Realtime (F5-02) pero sin DDL versionado
- **Tabla `profiles`** — existe en Supabase pero no es consultada desde ningún archivo del repo (esquema muerto)

Ver tareas **F6-D** (cablear ficha clínica a Supabase) y **F6-B** (RLS por rol server-side) en `docs/MASTER_ROADMAP.md`.