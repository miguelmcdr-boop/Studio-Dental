# Guía de Staging — Studio Dental (F6-I)

Este documento describe cómo configurar y mantener el entorno de **staging**
de Studio Dental: un entorno de pruebas aislado con Vercel Preview + Supabase
separado, funcionalmente equivalente a producción pero sin datos reales.

## Índice

1. [Prerequisitos](#1-prerequisitos)
2. [Crear proyecto Supabase de staging](#2-crear-proyecto-supabase-de-staging)
3. [Aplicar scripts SQL en orden](#3-aplicar-scripts-sql-en-orden)
4. [Obtener variables de entorno](#4-obtener-variables-de-entorno)
5. [Configurar variables en Vercel](#5-configurar-variables-en-vercel)
6. [Validar el entorno](#6-validar-el-entorno)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. Prerequisitos

- Cuenta en [Supabase](https://supabase.com) (plan Free es suficiente)
- Proyecto Vercel ya conectado al repo GitHub (`studio-dental1/studio-dental`)
- Acceso al SQL Editor del proyecto Supabase de staging

## 2. Crear proyecto Supabase de staging

1. Ir a [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click en **"New project"**
3. Configurar:
   - **Name**: `studio-dental-staging`
   - **Database Password**: generar una segura y guardarla en un gestor de contraseñas
   - **Region**: la más cercana (ej: `South America (São Paulo)` — sa-east-1)
   - **Pricing Plan**: **Free**
4. Click en **"Create new project"** y esperar ~2 minutos a que se provisione

> **Nota:** El plan Free de Supabase permite múltiples proyectos.
> No hay costo adicional por tener un proyecto de staging.

## 3. Aplicar scripts SQL en orden

En el **SQL Editor** del proyecto de staging recién creado, ejecutar estos
scripts **uno por uno, en este orden exacto**. Cada uno debe devolver
`Success` antes de pasar al siguiente.

| # | Archivo | Descripción |
|---|---------|-------------|
| 1 | `supabase/schema.sql` | Función `update_updated_at_column()` y tabla perfiles |
| 2 | `supabase/schema-rbac.sql` | Enum `app_role` + helpers + trigger de alta (F6-B1) |
| 3 | `supabase/schema-clinical-tables.sql` | 15 tablas clínicas + audit_log |
| 4 | `supabase/schema-audit-log.sql` | Tabla de auditoría + RLS + índices |
| 5 | `supabase/schema-vademecum.sql` | 8 tablas del vademécum (F6-A) |
| 6 | `supabase/seed-vademecum.sql` | 164 registros del vademécum (F6-A) |
| 7 | `supabase/schema-rbac-policies.sql` | Privilegios + RLS por rol server-side (F6-B2) |
| 8 | `supabase/schema-rbac-policies-fin.sql` | RLS financiero + vademécum + audit (F6-B3) |
| 9 | `supabase/schema-multiclinica-base.sql` | Funciones base multi-clínica (F6-C) |
| 10 | `supabase/schema-multiclinica-add-clinica-id.sql` | Agrega columna `clinica_id` a tablas (F6-C) |
| 11 | `supabase/schema-multiclinica-helpers-rol.sql` | Helpers de rol por clínica (F6-C) |
| 12 | `supabase/schema-multiclinica-trigger-clinica-id.sql` | Trigger para `clinica_id` automático (F6-C) |
| 13 | `supabase/schema-multiclinica-rls.sql` | Políticas RLS multi-clínica (F6-C-c) |
| 14 | `supabase/schema-soft-delete.sql` | Columna `deleted_at` + políticas RLS soft delete (F6-Fa) |

> **⚠️ ORDEN CRÍTICO:** `schema-soft-delete.sql` (14) DEBE ejecutarse DESPUÉS de
> `schema-multiclinica-rls.sql` (13), porque soft-delete reemplaza las políticas
> de pacientes creadas por multiclinica-rls. Si se invierte el orden, las políticas
> de soft delete serán sobrescritas.

> **Nota:** Los scripts 1-4 NO son idempotentes. Si necesitas re-ejecutarlos,
> primero ejecuta `DROP TABLE IF EXISTS ... CASCADE` para las tablas afectadas.
> Los scripts 5, 6 y 9 SÍ son idempotentes (usan `IF NOT EXISTS` / `IF EXISTS`).

### Verificación post-ejecución

Ejecutar esta query en el SQL Editor:

```sql
-- Debe devolver 27+ tablas
SELECT count(*) AS tablas_totales
FROM information_schema.tables
WHERE table_schema = 'public';

-- Debe devolver las 4 políticas de pacientes (F6-Fa)
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'pacientes'
ORDER BY policyname;
```

Resultado esperado de políticas:

| policyname | cmd |
|-----------|-----|
| pacientes_insert_clinica | INSERT |
| pacientes_select_activos | SELECT |
| pacientes_select_admin_todos | SELECT |
| pacientes_update_activos | UPDATE |

## 4. Obtener variables de entorno

En el proyecto de staging de Supabase:

1. Ir a **Settings → API**
2. Copiar:
   - **Project URL** → valor para `VITE_SUPABASE_URL`
   - **anon public** key → valor para `VITE_SUPABASE_ANON_KEY`

Ejemplo:
```
VITE_SUPABASE_URL=https://abcdefghijk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

## 5. Configurar variables en Vercel

1. Ir a [vercel.com/dashboard](https://vercel.com/dashboard) → proyecto `studio-dental`
2. **Settings → Environment Variables**
3. Crear/editar estas variables para el entorno **Preview**:

| Variable | Valor | Environment |
|----------|-------|-------------|
| `VITE_SUPABASE_URL` | URL del proyecto staging | **Preview** |
| `VITE_SUPABASE_ANON_KEY` | Anon key del proyecto staging | **Preview** |
| `VITE_USE_SUPABASE` | `true` | **Preview** |
| `VITE_ENVIRONMENT` | `staging` | **Preview** |

> **Importante:** NO sobreescribir las variables de **Production**.
> Production debe seguir apuntando al Supabase de producción.
> Vercel permite tener valores diferentes por entorno.

4. Click en **"Save"**
5. Hacer **Redeploy** de la rama `main` si es necesario (Deployments → ... → Redeploy)

## 6. Validar el entorno

### 6.1 — Preview por PR

1. Crear una rama de prueba: `git checkout -b test/staging-check`
2. Hacer un cambio trivial (ej: editar un comentario)
3. `git commit + git push`
4. En GitHub, crear un PR (no mergear)
5. Vercel generará automáticamente una URL de preview (aparece en el PR)
6. Abrir la URL de preview

### 6.2 — Checklist de validación

- [ ] La app carga sin errores en la consola (F12 → Console)
- [ ] Login funciona (crear un usuario de prueba en el Supabase staging)
- [ ] Directorio de pacientes carga (vacío al inicio)
- [ ] Crear un paciente de prueba funciona
- [ ] Eliminar el paciente (soft delete) funciona
- [ ] Papelera muestra el paciente eliminado (F6-L)
- [ ] Restaurar el paciente funciona
- [ ] Service worker se registra (F12 → Application → Service Workers)

### 6.3 — Crear usuario de prueba en staging

En el SQL Editor del proyecto staging:

```sql
-- Crear perfil de admin para un usuario existente de Supabase Auth
-- (primero crear el usuario en Authentication → Users → Add user)
INSERT INTO profiles (id, email, full_name, role)
VALUES (
  '<user-uuid-de-supabase-auth>',
  'admin@staging.studiodental.cl',
  'Admin Staging',
  'admin'
)
ON CONFLICT (id) DO UPDATE SET role = 'admin';
```

## 7. Troubleshooting

### Error: "Failed to fetch" al cargar pacientes

**Causa probable:** `VITE_SUPABASE_URL` o `VITE_SUPABASE_ANON_KEY` incorrectas
en el entorno Preview de Vercel.

**Solución:** Verificar en Vercel → Settings → Environment Variables que las
variables de Preview apunten al proyecto staging correcto.

### Error: RLS "permission denied" al crear paciente

**Causa probable:** El usuario no tiene un perfil en la tabla `profiles` del
proyecto staging, o el `clinica_id` no coincide.

**Solución:** Ejecutar la query de creación de perfil (sección 6.3) y verificar
que el usuario tenga `clinica_id` asignado.

### Error: Service worker no se registra

**Causa probable:** Los headers de `sw.js` no se están sirviendo correctamente.

**Solución:** Verificar que `vercel.json` existe en la raíz del repo y contiene
el header `Service-Worker-Allowed: /` para la ruta `/sw.js`.

### La preview apunta a producción en vez de staging

**Causa probable:** Las variables de entorno están configuradas para
"All Environments" en vez de solo "Preview".

**Solución:** En Vercel → Settings → Environment Variables, editar cada
variable y asegurar que el entorno sea **Preview** (no "All Environments").

---

_Última actualización: 2026-08-23 (F6-I)_
