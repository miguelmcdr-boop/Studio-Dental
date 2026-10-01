# 🚨 Runbook de Incidentes — Studio Dental

**Versión:** 1.0
**Última actualización:** 2026-08-24
**Relacionado con:** F6-01 (Error Boundary), F6-F (audit_log), F6-03 (logger futuro)

---

## 📋 Resumen

Este runbook cubre los incidentes más comunes que puede enfrentar el equipo de soporte técnico de Studio Dental. Cada incidente tiene:
- Síntomas para identificarlo
- Pasos de diagnóstico
- Soluciones posibles
- Procedimiento de escalación

**Audiencia:** soporte técnico nivel 1 y 2.

---

## 🔴 Incidentes Críticos (P0)

### P0-1: La aplicación no carga

**Síntomas:**
- Pantalla en blanco al abrir la app
- Error 500 o 502 en el browser
- La app carga pero no muestra contenido

**Diagnóstico:**

1. Verificar [status.vercel.com](https://vercel-status.com) — ¿hay incidente en Vercel?
2. Verificar [status.supabase.com](https://status.supabase.com) — ¿hay incidente en Supabase?
3. Abrir DevTools → Console: ¿hay errores de JavaScript?
4. Abrir DevTools → Network: ¿las requests a Supabase retornan 200?

**Soluciones posibles:**

| Causa | Solución |
|-------|----------|
| Incidente en Vercel | Esperar resolución del proveedor |
| Incidente en Supabase | Esperar resolución del proveedor |
| Error en el build | Rollback de frontend (ver `docs/ROLLBACK.md`) |
| Variables de entorno mal configuradas | Verificar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en Vercel |

**Escalación:** si no se resuelve en 15 min, escalar a nivel 2.

---

### P0-2: Login falla para todos los usuarios

**Síntomas:**
- Ningún usuario puede iniciar sesión
- Error "Invalid credentials" aunque la contraseña sea correcta
- La página de login carga pero el submit no funciona

**Diagnóstico:**

1. Verificar que Supabase Auth está operativo en [status.supabase.com](https://status.supabase.com)
2. Verificar que el proyecto de Supabase no está pausado (Dashboard → Overview)
3. Verificar RLS de la tabla `profiles`:

```sql
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

4. Verificar que hay usuarios activos:

```sql
SELECT COUNT(*) FROM auth.users WHERE deleted_at IS NULL;
```

**Soluciones posibles:**

| Causa | Solución |
|-------|----------|
| Supabase Auth caído | Esperar resolución del proveedor |
| Proyecto pausado | Re-activar en Supabase Dashboard |
| RLS de profiles roto | Re-aplicar scripts de RLS de `supabase/` |
| Usuarios eliminados | Restaurar desde backup (ver `docs/BACKUP_RESTORE.md`) |

**Escalación:** si no se resuelve en 15 min, escalar a nivel 2.

---

### P0-3: Los datos no sincronizan entre dispositivos

**Síntomas:**
- Un usuario crea una cita pero otro usuario no la ve
- Los cambios no aparecen en tiempo real
- Los datos aparecen solo después de recargar la página

**Diagnóstico:**

1. Verificar que Realtime está habilitado en las tablas relevantes (Supabase → Database → Replication)
2. Abrir DevTools → Network → filtrar por "websocket": ¿hay conexión WebSocket activa?
3. Verificar que las políticas RLS permiten SELECT para el rol del usuario:

```sql
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('citas', 'pacientes', 'evoluciones_clinicas')
AND cmd = 'SELECT';
```

4. Verificar que el usuario está en `miembros_clinica`:

```sql
SELECT * FROM miembros_clinica WHERE user_id = '[ID_DEL_USUARIO]';
```

**Soluciones posibles:**

| Causa | Solución |
|-------|----------|
| Realtime no habilitado | Habilitar en Supabase → Database → Replication |
| WebSocket bloqueado por firewall | Verificar configuración de red del cliente |
| RLS de SELECT denegado | Revisar y corregir políticas RLS |
| Usuario sin membresía | Agregar a `miembros_clinica` manualmente |

**Escalación:** si no se resuelve en 30 min, escalar a nivel 2.

---

## 🟠 Incidentes Graves (P1)

### P1-1: Pérdida de datos detectada

**Síntomas:**
- Un usuario reporta que sus pacientes/citas/presupuestos desaparecieron
- Query en Supabase retorna 0 registros cuando debería haber datos

**Diagnóstico:**

1. Verificar que los datos realmente no existen:

```sql
SELECT COUNT(*) FROM pacientes;
SELECT COUNT(*) FROM citas;
SELECT COUNT(*) FROM presupuestos;
```

2. Verificar `audit_log` para identificar quién/qué eliminó los datos:

```sql
SELECT * FROM audit_log
WHERE table_name = 'pacientes'
AND action IN ('DELETE', 'UPDATE')
ORDER BY created_at DESC
LIMIT 50;
```

3. Verificar el último backup disponible

**Solución:**

- Si hay backup reciente con los datos: restaurar (ver `docs/BACKUP_RESTORE.md`)
- Si no hay backup: intentar recuperar desde `audit_log` (si el modo está en `full`)
- Comunicar al usuario afectado el estado del incidente

**Escalación:** inmediata a nivel 2. Este incidente requiere acción urgente.

---

### P1-2: Error 500 persistente en una operación específica

**Síntomas:**
- Una operación específica (ej: crear presupuesto) siempre falla con error 500
- El resto de la app funciona correctamente

**Diagnóstico:**

1. Verificar los logs de Supabase:
   - Dashboard → Logs → Postgres Logs
   - Filtrar por la hora del error

2. Verificar que la tabla y columna existen:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = '[NOMBRE_TABLA]';
```

**Soluciones posibles:**

| Causa | Solución |
|-------|----------|
| Columna faltante | Aplicar migración SQL correspondiente |
| Constraint de unicidad violada | Verificar datos duplicados y corregir |
| RLS denegando la operación | Revisar políticas RLS de la tabla |
| Bug en el código | Reportar a desarrollo para fix en próxima versión |

**Escalación:** si no se resuelve en 1 hora, escalar a nivel 2.

---

### P1-3: Performance degradada (app lenta)

**Síntomas:**
- La app tarda > 5 segundos en cargar
- Las operaciones tardan más de lo normal
- Los usuarios reportan "la app está lenta"

**Diagnóstico:**

1. Verificar métricas de Supabase: Dashboard → Reports → Database
2. Identificar queries lentas:

```sql
SELECT query, calls, mean_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;
```

3. Verificar que no hay queries sin índice:

```sql
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public';
```

**Soluciones posibles:**

| Causa | Solución |
|-------|----------|
| Query lenta sin índice | Agregar índice en la columna filtrada |
| Tabla muy grande | Considerar particionamiento o archivado |
| Exceso de conexiones | Verificar pool de conexiones de Supabase |
| Problema de red del usuario | Descartar problema del cliente antes de escalar |

**Escalación:** si no se resuelve en 2 horas, escalar a nivel 2.

---

## 🟡 Incidentes Menores (P2)

### P2-1: Error Boundary activo para un usuario específico

**Síntomas:**
- Un usuario ve el fallback de ErrorBoundary
- El resto de usuarios no tienen problemas

**Diagnóstico:**

1. Pedir al usuario que recargue la página (F5)
2. Si persiste, pedir al usuario que abra DevTools → Console y tome un screenshot del stack trace
3. Verificar en `audit_log` las últimas acciones del usuario:

```sql
SELECT * FROM audit_log
WHERE user_id = '[ID_DEL_USUARIO]'
ORDER BY created_at DESC
LIMIT 20;
```

**Solución:**

- Si el error es reproducible: reportar a desarrollo con el stack trace
- Si el error es esporádico: monitorear y documentar en el registro de incidentes

**Escalación:** a nivel 2 solo si el error es reproducible y afecta la operación del usuario.

---

### P2-2: Un solo usuario reporta un problema

**Síntomas:**
- Un usuario reporta que algo no funciona
- El resto de usuarios no tienen problemas

**Diagnóstico:**

1. Verificar la sesión del usuario:
   - ¿Está autenticado correctamente?
   - ¿Su rol es el esperado?

```sql
SELECT u.email, u.raw_app_meta_data->>'role' AS rol
FROM auth.users u
WHERE u.email = '[EMAIL_DEL_USUARIO]';
```

2. Verificar membresía del usuario:

```sql
SELECT mc.*, c.nombre AS clinica_nombre
FROM miembros_clinica mc
JOIN clinicas c ON mc.clinica_id = c.id
WHERE mc.user_id = '[ID_DEL_USUARIO]';
```

3. Verificar que el usuario tiene acceso a los módulos esperados según su rol

**Solución:**

- Si el rol es incorrecto: corregir en `auth.users` → `raw_app_meta_data`
- Si la membresía es incorrecta: corregir en `miembros_clinica`
- Si el problema persiste: pedir al usuario que limpie caché del browser

**Escalación:** a nivel 2 solo si el problema persiste después de las soluciones básicas.

---

## 📞 Escalación

### Nivel 1: Soporte interno (15 min)

- Diagnóstico inicial usando este runbook
- Aplicar soluciones básicas documentadas
- Si no se resuelve, escalar a nivel 2

### Nivel 2: Desarrollador (1 hora)

- Análisis profundo del incidente
- Acceso a logs completos de Supabase y Vercel
- Posibilidad de ejecutar queries SQL directamente
- Si no se resuelve, escalar a nivel 3

### Nivel 3: Proveedor (según SLA)

- Supabase: [status.supabase.com](https://status.supabase.com) + soporte en dashboard
- Vercel: [vercel-status.com](https://vercel-status.com) + soporte en dashboard

---

## 📇 Contactos de Emergencia

| Servicio | Status page | Soporte |
|----------|-------------|---------|
| Supabase | [status.supabase.com](https://status.supabase.com) | Dashboard → Support |
| Vercel | [vercel-status.com](https://vercel-status.com) | Dashboard → Support |
| Sentry (cuando F6-03 esté implementado) | [status.sentry.io](https://status.sentry.io) | Dashboard → Settings |

---

## 📊 Registro de Incidentes

| Fecha | Tipo (P0/P1/P2) | Descripción | Usuario afectado | Solución aplicada | Duración | Responsable |
|-------|------------------|-------------|-------------------|-------------------|----------|-------------|
| _YYYY-MM-DD_ | _P0/P1/P2_ | _Descripción breve_ | _Email o "global"_ | _Solución aplicada_ | _min/horas_ | _Nombre_ |

---

## 🔗 Referencias Cruzadas

- **Backup y restauración:** `docs/BACKUP_RESTORE.md`
- **Rollback:** `docs/ROLLBACK.md`
- **Error Boundary:** F6-01 en `docs/MASTER_ROADMAP.md`
- **Audit log:** F6-F en `docs/MASTER_ROADMAP.md`
- **Logger centralizado (futuro):** F6-03 en `docs/MASTER_ROADMAP.md`
