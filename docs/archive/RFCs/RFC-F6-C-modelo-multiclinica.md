# RFC-F6-C — Modelo Multi-Clínica

**ID:** RFC-F6-C
**Tarea asociada:** F6-C (MASTER_ROADMAP, Fase 6 — bloque estructural)
**Protocolo:** Capítulo VIII, Constitución de Arquitectura v3 (7 preguntas mandatorias)
**Fecha:** 2026-08-17
**Estado:** APROBADO (aprobación explícita del usuario, 2026-08-17)
**Dependencia bloqueante:** F6-B debe estar `DONE` antes de implementar F6-C

---

## 1. Resumen ejecutivo

Transformar el modelo de datos actual (aislamiento por usuario: `auth.uid() = user_id`) en un modelo multi-clínica: varios profesionales con cuentas individuales comparten pacientes, citas, presupuestos y ficha clínica dentro de una misma clínica. El control de acceso pasa de `user_id` a `clinica_id`; `user_id` se conserva como autoría del registro.

**Alcance:** 2 tablas nuevas (`clinicas`, `miembros_clinica`), columna `clinica_id NOT NULL` en 18 tablas existentes, reescritura de las políticas RLS, función helper `public.clinica_actual()`, script de migración de datos existentes, módulo de configuración de clínica (branding) y flujo de onboarding manual.

**Fuera de alcance (YAGNI):** self-service de registro de clínicas, invitaciones por email con tokens, panel de superadmin, APIs específicas para plataformas nativas.

---

## 2. Decisiones de producto confirmadas (2026-08-17)

| # | Decisión | Opción elegida | Consecuencia técnica |
|---|---|---|---|
| 1 | Onboarding de clínicas | **C — Híbrido**: el proveedor crea la clínica y el admin inicial manualmente; camino a self-service futuro | No se construye flujo de signup público; el alta se resuelve con script SQL / panel administrativo |
| 2 | Branding y datos de contacto | **A — Solo el admin de la clínica** puede editar nombre, logo, dirección, teléfono, email, RUT | Módulo "Configuración de clínica" gated por rol `admin`; sin panel de superadmin |
| 3 | Entorno de trabajo | **Web primero (localhost)**; migración a Mac/iPhone/iPad al final | El diseño no asume restricciones de App Store; el modelo debe ser portable |
| 4 | Vademécum | **Global** (no por clínica) | Las 8 tablas del vademécum NO reciben `clinica_id` |

---

## 3. Las 7 preguntas del Capítulo VIII

### P1 — ¿Qué problema clínico o técnico específico resuelve?

El modelo actual no tiene el concepto de clínica: todas las políticas RLS son `USING (auth.uid() = user_id)`. Los dos escenarios posibles son excluyentes y ambos inaceptables:

- **Cuenta compartida:** el RBAC de F3-05 es decorativo (todos son admin), el `audit_log` no puede atribuir autoría, y las métricas por profesional no tienen fuente. Viola trazabilidad clínica.
- **Cuentas individuales:** el dentista no ve los pacientes que creó recepción. La Fase 5 (Realtime, conflictos) solo sincroniza entre dispositivos del mismo usuario.

Lo que hay hoy no es colaboración multiusuario; es la misma cuenta en varios dispositivos. Este RFC cierra la brecha entre "sistema de un profesional" y "sistema de clínica".

### P2 — ¿Qué módulos o capas se verán afectados?

| Capa | Afectación |
|---|---|
| Supabase (esquema) | 2 tablas nuevas; `clinica_id` en 18 tablas; reescritura de políticas RLS; función `public.clinica_actual()` |
| Supabase (Auth) | Alta manual de usuarios por clínica (onboarding híbrido) |
| Supabase (Storage) | Primer uso: bucket privado `clinica-logos` (F6-C-e); converge con F6-E |
| `realtimeService.js` | Verificación: Realtime respeta RLS, el filtrado por clínica es automático; si se requieren filtros explícitos por `clinica_id`, se agregan |
| `conflictDetectionService.js` | Sin cambios (sigue comparando `updated_at`; la consulta ya queda filtrada por RLS) |
| `*StorageService.js` | Sin cambio de API pública: el filtro por clínica lo aplica RLS en Supabase |
| `sesionStore.js` | Agregar `clinicaId` y datos de la clínica (nombre, logo) al perfil de sesión |
| `authService.js` | Converge con F6-B: eliminar `updateUser({ data: { role } })` del cliente |
| UI | Nuevo módulo "Configuración de clínica" (solo admin) |
| E2E | Reescritura de `flujo-colaborativo.spec.js` con dos cuentas distintas |

### P3 — ¿Rompe compatibilidad con el estado actual?

- **Esquema:** sí — requiere migración (no puede hacerse en caliente). Se mitiga con script idempotente + backup previo (F6-06 ya exige probar restauración).
- **API pública de servicios:** no — los componentes llaman a los mismos métodos; el cambio de filtro es transparente (lo aplica RLS).
- **Datos existentes:** se migran a una clínica inicial (sección 5). Ningún registro se pierde.

### P4 — ¿Existe una solución más simple con el código existente?

No. Alternativas descartadas:
- **Cuenta compartida:** viola trazabilidad legal y RBAC.
- **Replicar datos entre usuarios:** inconsistencias garantizadas, complejidad explosiva.
- **Vistas compartidas sin cambiar el modelo:** inviable en PostgreSQL con RLS por usuario.

El cambio de modelo de datos es la única solución; por eso el roadmap exige este RFC (Regla de Gobernanza 4).

### P5 — ¿Qué componentes actuales se reutilizan?

Sin cambios: `conflictDetectionService`, `notificationService`, `operationQueue`, `migrationStorageService`, todos los `*StorageService` (API pública).
Con cambios menores: `sesionStore` (campo `clinicaId`), `authService` (convergencia F6-B), `realtimeService` (verificación/filtros).
Nuevos: tablas `clinicas` y `miembros_clinica`, función `public.clinica_actual()`, módulo de configuración de clínica, script de migración.

### P6 — ¿Afecta rendimiento o límites de LocalStorage/IndexedDB?

- **Renderizado:** no.
- **Queries:** el filtro pasa de `user_id = auth.uid()` a `clinica_id = public.clinica_actual()`. La función es `STABLE` (PostgreSQL la evalúa una vez por sentencia) y `SECURITY DEFINER` (evita recursión de RLS). Índices compuestos en `miembros_clinica(user_id, activo, clinica_id)` y en `clinica_id` de cada tabla. Overhead estimado despreciable (<1 ms).
- **LocalStorage/IndexedDB:** sin cambio; pasan a ser caché, no fuente de verdad (consistente con F6-D).

### P7 — ¿Cómo se probará?

1. **SQL (staging, F6-I):** dos clínicas, cuatro usuarios con roles distintos en la clínica A y uno en la clínica B. Verificado por consulta directa (no UI): usuarios de A ven los mismos pacientes; usuario de B recibe 0 filas.
2. **Intento de escalada:** usuario sin rol admin intenta INSERT/UPDATE en `clinicas` y `miembros_clinica` → denegado.
3. **Realtime:** usuario A1 crea cita → usuario A2 (misma clínica) la recibe en <3 s sin recargar.
4. **Migración:** en copia de la base, todos los registros existentes quedan con `clinica_id` de la clínica inicial; conteos antes/después idénticos.
5. **E2E:** `flujo-colaborativo.spec.js` reescrito con dos cuentas reales distintas (criterio del roadmap).

---

## 4. Modelo de datos propuesto

### 4.1 Tabla `clinicas`

```sql
CREATE TABLE IF NOT EXISTS public.clinicas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  rut_empresa TEXT,
  direccion TEXT,
  telefono TEXT,
  email_contacto TEXT,
  logo_url TEXT,
  color_primario TEXT DEFAULT '#3B82F6',
  color_secundario TEXT DEFAULT '#10B981',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_clinicas_rut
  ON public.clinicas(rut_empresa) WHERE rut_empresa IS NOT NULL;

ALTER TABLE public.clinicas ENABLE ROW LEVEL SECURITY;

-- Lectura: cualquier miembro activo de la clínica
CREATE POLICY "miembros_leen_su_clinica" ON public.clinicas
  FOR SELECT
  USING (id = public.clinica_actual());

-- Escritura: SOLO admin de la clínica (Decisión de producto #2)
CREATE POLICY "admin_actualiza_su_clinica" ON public.clinicas
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.miembros_clinica mc
      WHERE mc.clinica_id = clinicas.id
        AND mc.user_id = (select auth.uid())
        AND mc.rol = 'admin'
        AND mc.activo
    )
  )
  WITH CHECK (id = public.clinica_actual());
```

### 4.2 Tabla `miembros_clinica`

```sql
CREATE TABLE IF NOT EXISTS public.miembros_clinica (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinica_id UUID NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rol TEXT NOT NULL CHECK (rol IN ('admin', 'dentista', 'asistente', 'recepcion')),
  activo BOOLEAN NOT NULL DEFAULT true,
  invitado_por UUID REFERENCES auth.users(id),
  fecha_invitacion TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (clinica_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_miembros_usuario
  ON public.miembros_clinica(user_id, activo, clinica_id);
CREATE INDEX IF NOT EXISTS idx_miembros_clinica
  ON public.miembros_clinica(clinica_id, activo);

ALTER TABLE public.miembros_clinica ENABLE ROW LEVEL SECURITY;

-- Leer membresías de mi(s) clínica(s) — usa la función SECURITY DEFINER, sin recursión
CREATE POLICY "miembros_leen_membresias" ON public.miembros_clinica
  FOR SELECT
  USING (clinica_id = public.clinica_actual());

-- Gestionar miembros: SOLO admin de la clínica
CREATE POLICY "admin_gestiona_miembros" ON public.miembros_clinica
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.miembros_clinica mc
      WHERE mc.clinica_id = miembros_clinica.clinica_id
        AND mc.user_id = (select auth.uid())
        AND mc.rol = 'admin'
        AND mc.activo
    )
  )
  WITH CHECK (
    clinica_id = public.clinica_actual()
    AND EXISTS (
      SELECT 1 FROM public.miembros_clinica mc
      WHERE mc.clinica_id = miembros_clinica.clinica_id
        AND mc.user_id = (select auth.uid())
        AND mc.rol = 'admin'
        AND mc.activo
    )
  );
```

### 4.3 Función helper `public.clinica_actual()`

```sql
-- SECURITY DEFINER: se ejecuta como el owner y evita recursión de RLS.
-- STABLE: PostgreSQL puede cachear el resultado dentro de una misma sentencia.
CREATE OR REPLACE FUNCTION public.clinica_actual()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT clinica_id
  FROM public.miembros_clinica
  WHERE user_id = (select auth.uid())
    AND activo
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.clinica_actual() FROM anon;
GRANT EXECUTE ON FUNCTION public.clinica_actual() TO authenticated;
```

Nota: se usa `public.clinica_actual()` y no `auth.clinica_actual()` porque el schema `auth` es administrado por Supabase y no debe intervenirse.

### 4.4 Columna `clinica_id` en las 18 tablas existentes

Patrón a aplicar a cada tabla (ejemplo: `pacientes`):

```sql
ALTER TABLE public.pacientes
  ADD COLUMN IF NOT EXISTS clinica_id UUID REFERENCES public.clinicas(id);

-- Backfill con la clínica inicial (ver sección 5)
UPDATE public.pacientes
  SET clinica_id = '00000000-0000-0000-0000-000000000001'
  WHERE clinica_id IS NULL;

ALTER TABLE public.pacientes
  ALTER COLUMN clinica_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pacientes_clinica ON public.pacientes(clinica_id);

-- Reescritura de la política RLS
DROP POLICY IF EXISTS "Users can manage own pacientes" ON public.pacientes;
CREATE POLICY "miembros_gestionan_pacientes" ON public.pacientes
  FOR ALL
  USING (clinica_id = public.clinica_actual())
  WITH CHECK (clinica_id = public.clinica_actual());
```

**Las 18 tablas:** `pacientes`, `citas`, `prestaciones`, `presupuestos`, `presupuesto_items`, `pagos`, `movimientos_financieros`, `inventario`, `evoluciones_clinicas`, `recetas`, `odontogramas`, `periodontogramas`, `periodontogramas_historial`, `dsd_configs`, `odontopediatria`, `quirurgico_implantes`, `quirurgico_endodoncia`, `audit_log`.

**Excluida:** `profiles` — es identidad por usuario, no dato de clínica.

### 4.5 Decisiones sobre tablas específicas

| Tabla | Decisión | Justificación |
|---|---|---|
| `profiles` | Sin `clinica_id` | Identidad individual; la clínica se deriva de `miembros_clinica` |
| 8 tablas del vademécum | Sin `clinica_id` (globales) | Datos de referencia curados por el proveedor (Decisión #4). Si una clínica necesitara overrides, se agregará como tarea nueva (Regla 1) |
| `audit_log` | Recibe `clinica_id` ahora | Evita una segunda migración en F6-F; la reescritura completa de sus políticas (append-only, triggers) es alcance de F6-F |

### 4.6 Convergencia con F6-B (roles)

- El **rol autoritativo por clínica** vive en `miembros_clinica.rol`.
- F6-B elimina el `supabase.auth.updateUser({ data: { role } })` del cliente (hoy en `authService.js`) y bloquea la auto-asignación.
- `app_metadata` queda reservado para flags de nivel proveedor (ej. `is_superadmin`), no para roles de clínica.
- Fallback fail-safe consistente con F3-05: usuario sin membresía activa → sin acceso a datos (función retorna NULL → las políticas no devuelven filas).

---

## 5. Script de migración de datos existentes

```sql
-- Ejecutar en SQL Editor con rol postgres, previa copia de respaldo.
BEGIN;

-- 1. Clínica inicial
INSERT INTO public.clinicas (id, nombre)
VALUES ('00000000-0000-0000-0000-000000000001', 'Clínica Studio Dental')
ON CONFLICT (id) DO NOTHING;

-- 2. Membresías: todos los usuarios existentes entran a la clínica inicial.
--    Rol desde user_metadata; fail-safe: 'recepcion' (el más restrictivo, F3-05).
INSERT INTO public.miembros_clinica (clinica_id, user_id, rol, activo)
SELECT
  '00000000-0000-0000-0000-000000000001',
  u.id,
  CASE WHEN u.raw_user_meta_data->>'role'
       IN ('admin', 'dentista', 'asistente', 'recepcion')
       THEN u.raw_user_meta_data->>'role'
       ELSE 'recepcion' END,
  true
FROM auth.users u
ON CONFLICT (clinica_id, user_id) DO NOTHING;

-- 3. Backfill de clinica_id en las 18 tablas (una sentencia por tabla)
UPDATE public.pacientes                    SET clinica_id = '00000000-0000-0000-0000-000000000001' WHERE clinica_id IS NULL;
UPDATE public.citas                        SET clinica_id = '00000000-0000-0000-0000-000000000001' WHERE clinica_id IS NULL;
-- ... repetir para las 16 tablas restantes ...

-- 4. Verificación dentro de la misma transacción
SELECT count(*) AS registros_sin_clinica FROM (
  SELECT id FROM public.pacientes WHERE clinica_id IS NULL
  UNION ALL SELECT id FROM public.citas WHERE clinica_id IS NULL
  -- ... resto de tablas ...
) t;
-- Debe devolver 0. Si no, ROLLBACK.

COMMIT;
```

El orden de aplicación del esquema (columnas NULLables → backfill → SET NOT NULL) garantiza que el script sea idempotente y seguro.

---

## 6. Módulo de configuración de clínica (F6-C-e)

- **UI:** sección dentro del módulo `configuracion`, visible solo para rol `admin` (RBAC F3-05). Campos: nombre, RUT empresa, dirección, teléfono, email de contacto, colores primario/secundario, logo.
- **Logo:** bucket privado `clinica-logos` en Supabase Storage, path `{clinica_id}/logo.{ext}`. Descarga por URL firmada de vida corta; nunca URL pública. Es la primera llamada a `supabase.storage` del proyecto (hoy el conteo es 0); se coordina con F6-E para establecer el patrón.
- **Servicio:** `clinicaConfigService.js` en el módulo `configuracion` (`obtenerClinica`, `actualizarClinica`, `subirLogo`), expuesto por la barrera pública del módulo (Cap. III).
- **Validación:** RUT de empresa con módulo 11 (reutiliza `validarRut` de F6-G si ya existe; si no, se crea en F6-G y este módulo lo consume después).
- **Sesión:** `sesionStore` carga `clinicaId`, nombre y logo al autenticar; el Sidebar muestra el nombre/logo de la clínica.

---

## 7. Plan de implementación (subtareas)

| ID | Subtarea | Esfuerzo | Dependencias |
|---|---|---|---|
| F6-C-a | Tablas `clinicas` y `miembros_clinica` + función `public.clinica_actual()` + políticas base (en staging, F6-I) | S (0.5 d) | F6-B, F6-I |
| F6-C-b | Script de migración de datos existentes a clínica inicial + prueba en copia | S (0.5 d) | F6-C-a |
| F6-C-c | `clinica_id` en las 18 tablas + reescritura de políticas RLS + índices | M (2 d) | F6-C-b |
| F6-C-d | Verificación de servicios/hooks contra el nuevo RLS (Realtime, stores, sesión) + fixes si aparecen | M (2 d) | F6-C-c |
| F6-C-e | Módulo Configuración de clínica (branding + logo en Storage) | S (1 d) | F6-C-d |
| F6-C-f | Reescritura E2E `flujo-colaborativo.spec.js` con dos cuentas distintas | S (0.5 d) | F6-C-d, F6-I |

Esfuerzo total: ~6.5 días. Secuencia: a → b → c → d → (e, f en paralelo).

---

## 8. Criterios de aceptación (heredados del roadmap + RFC)

1. Cuatro usuarios con roles distintos, en la misma clínica, ven el mismo directorio de pacientes.
2. Un usuario de otra clínica no ve ninguno de esos pacientes — verificado por consulta directa, no por UI.
3. Los tests E2E de `flujo-colaborativo.spec.js` usan dos cuentas distintas, no dos sesiones de la misma cuenta.
4. Un usuario no-admin no puede modificar los datos de la clínica ni la membresía (verificado con intento explícito).
5. El admin edita nombre, logo y contacto, y el cambio es visible para todos los miembros.
6. La migración no pierde registros (conteos antes/después idénticos) y es reversible desde backup.

---

## 9. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Exposición de datos entre clínicas por política mal escrita | Crítico | Tests SQL en staging (F6-I) antes de producción; verificación por consulta directa con usuarios de prueba |
| Recursión de RLS en `miembros_clinica` | Alto | Función `SECURITY DEFINER` (patrón documentado en §4.3) |
| Pérdida de datos en migración | Crítico | Backup + transacción con verificación + prueba de restauración (F6-06) |
| Degradación de performance por subquery en políticas | Medio | Función `STABLE` + índices compuestos; medición antes/después |
| E2E rompiéndose por el cambio de modelo | Medio | F6-C-f dedicada; se ejecuta contra staging (F6-I), nunca contra producción |

---

## 10. Fuera de alcance (YAGNI documentado)

- Self-service de registro de clínicas (futuro: Fase 7 si el producto escala).
- Invitaciones por email con tokens.
- Panel de superadmin multi-clínica.
- Un usuario en varias clínicas simultáneamente (el esquema lo permite —`miembros_clinica` admite múltiples filas por usuario— pero la UI y `clinica_actual()` asumen una clínica activa; el selector de clínica será tarea nueva si se necesita).
- Vademécum por clínica.

---

## 11. Aprobación

Aprobado explícitamente por el usuario el 2026-08-17 (decisiones de producto #1 a #4 incluidas). La implementación queda bloqueada hasta que F6-B esté `DONE` (dependencia del tablero).