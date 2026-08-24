# 💾 Procedimiento de Backup y Restauración — Studio Dental

**Versión:** 1.0
**Última actualización:** 2026-08-24
**Relacionado con:** F6-06 (checklist despliegue), F6-I (staging)

---

## 📋 Resumen

| Parámetro | Valor |
|-----------|-------|
| **Frecuencia de backup** | Diaria (Supabase Pro con PITR) |
| **Retención** | 7 días (configurable en Supabase) |
| **RPO (Recovery Point Objective)** | ≤ 24 horas |
| **RTO (Recovery Time Objective)** | ≤ 15 minutos |
| **Responsable** | Admin de Supabase |

---

## ⚙️ Pre-requisitos

- ✅ Supabase Pro con **Point-in-Time Recovery (PITR)** habilitado
- ✅ Permisos de admin en el proyecto de Supabase
- ✅ Acceso al SQL Editor de Supabase
- ✅ Entendimiento de que **la restauración sobrescribe datos actuales**

---

## 📦 Procedimiento de Backup Manual (Supabase Dashboard)

1. Ir a [supabase.com/dashboard](https://supabase.com/dashboard)
2. Seleccionar proyecto → **Database** → **Backups**
3. Click en **"Create backup"**
4. Esperar a que el backup aparezca como "Completed"
5. Anotar la fecha/hora del backup en el registro (ver sección 8)

**Nota:** En el plan Pro, Supabase crea backups diarios automáticamente. El backup manual es para antes de cambios críticos.

---

## 🔄 Procedimiento de Restauración Paso a Paso

### Opción A: Desde Supabase Dashboard (PITR)

1. Ir a **Database** → **Backups** → **Restore**
2. Seleccionar el backup deseado (o punto en el tiempo con PITR)
3. **Advertencia:** la restauración sobrescribe todos los datos actuales
4. Click en **"Restore"**
5. Esperar a que el proceso termine (5-15 min dependiendo del tamaño)

### Opción B: Desde backup local (pg_dump / pg_restore)

**Si tienes un archivo SQL de backup:**

```bash
ls -la backup_studio_dental.sql
psql "$DATABASE_URL" -f backup_studio_dental.sql
```

**Si tienes un backup en formato custom (pg_dump -Fc):**

```bash
pg_restore --dbname="$DATABASE_URL" --clean --if-exists backup_studio_dental.dump
```

### Opción C: Migración inversa (staging → producción)

**⚠️ Solo usar en caso de emergencia.**

```bash
pg_dump "$STAGING_DATABASE_URL" > staging_backup.sql
psql "$PRODUCTION_DATABASE_URL" -f staging_backup.sql
```

---

## ✅ Verificación Post-Restauración

### 1. Contar registros por tabla

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

### 2. Comparar con backup anterior

```sql
SELECT COUNT(*) AS pacientes_count FROM pacientes;
SELECT COUNT(*) AS citas_count FROM citas WHERE paciente_id IS NOT NULL;
```

### 3. Test de integridad (foreign keys)

```sql
SELECT 'citas sin paciente' AS check_name, COUNT(*) AS orphan_count
FROM citas c
LEFT JOIN pacientes p ON c.paciente_id = p.id
WHERE p.id IS NULL;
```

### 4. Verificar RLS operativo

```sql
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public';
```

---

## 🐛 Troubleshooting

| Problema | Causa probable | Solución |
|----------|----------------|----------|
| "Permission denied" al restaurar | Falta de permisos de admin | Verificar rol en Supabase Dashboard |
| "Backup not found" | Backup eliminado por retención | Usar backup más reciente disponible |
| Restauración toma > 15 min | Base de datos muy grande | Esperar o contactar soporte de Supabase |
| Datos faltantes post-restore | Backup incompleto | Restaurar desde backup anterior |
| RLS no funciona post-restore | Políticas no incluidas en el backup | Re-aplicar scripts de RLS de `supabase/` |

---

## 📊 Registro de Restauraciones

| Fecha | Backup usado | Motivo | Responsable | Resultado | Duración |
|-------|--------------|--------|-------------|-----------|----------|
| _YYYY-MM-DD_ | _ID del backup_ | _Motivo del restore_ | _Nombre_ | ✅/❌ | _min_ |

---

## ✅ Checklist de Prueba en Staging (F6-I)

- [ ] Crear backup manual en staging
- [ ] Modificar datos en staging (crear paciente de prueba)
- [ ] Restaurar el backup en staging
- [ ] Verificar que el paciente de prueba desapareció
- [ ] Verificar integridad de datos (queries de la sección 4)
- [ ] Documentar el tiempo de restauración
- [ ] Actualizar el registro de restauraciones

---

**Nota:** Este procedimiento debe probarse al menos una vez antes del go-live a producción (F6-06, Fase 1.4).
