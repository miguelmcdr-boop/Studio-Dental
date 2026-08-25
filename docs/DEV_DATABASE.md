# 🗄️ Base de Datos de Desarrollo Local — Studio Dental

**Versión:** 1.0
**Última actualización:** 2026-08-24
**Relacionado con:** F6-I (staging), F6-Ib (alineación dev)

---

## 📋 Resumen

| Proyecto | URL | Rol |
|----------|-----|-----|
| **Desarrollo local** | nagduvivilmzupdpoayo.supabase.co | Desarrollo diario (tu .env apunta aquí) |
| **Staging** | bjuqqtkiqnfyejitmowc.supabase.co | CI/CD E2E + previews de Vercel |
| **Producción** | ⏳ Pendiente | Requiere Supabase Pro en F6-06b |

---

## ⚠️ IMPORTANTE: El proyecto de desarrollo NO se actualiza automáticamente

A diferencia de staging (que tiene CI/CD vía F6-I), el proyecto de desarrollo local **NO aplica automáticamente** los cambios de schema en supabase/. 

**Cada cambio de schema debe aplicarse manualmente** siguiendo el proceso de abajo.

---

## 🔄 Proceso manual para aplicar cambios de schema

### Paso 1 — Identificar el script a aplicar

Los scripts SQL están en supabase/. Los principales son:

| Script | Propósito | Cuándo usarlo |
|--------|-----------|---------------|
| schema.sql | Tablas base (F4-02a) | Solo en proyecto nuevo |
| schema-clinical-tables.sql | Tablas clínicas (F4-02c-1) | Solo en proyecto nuevo |
| schema-rbac.sql | Tipo app_role + helpers (F6-B1) | Solo en proyecto nuevo |
| schema-rbac-policies.sql | Políticas RBAC (F6-B2) | Solo en proyecto nuevo |
| schema-rbac-policies-fin.sql | Políticas financieras (F6-B3) | Solo en proyecto nuevo |
| schema-multiclinica-base.sql | clinicas + miembros_clinica (F6-C-a) | Solo en proyecto nuevo |
| schema-multiclinica-helpers-rol.sql | Helpers de rol (F6-C) | Solo en proyecto nuevo |
| schema-multiclinica-rls.sql | Políticas multi-clínica (F6-C-c) | Solo en proyecto nuevo |
| schema-multiclinica-trigger-clinica-id.sql | Trigger de clinica_id | Solo en proyecto nuevo |
| schema-multiclinica-add-clinica-id.sql | Agregar clinica_id a tablas (F6-C-c) | Solo en proyecto nuevo |
| migrate-multiclinica-inicial.sql | Migrar datos a clínica inicial (F6-C-b) | Solo si hay datos existentes |
| migrate-roles-to-app-metadata.sql | Migrar roles a app_metadata (F6-B3) | Solo si hay usuarios existentes |
| schema-audit-log.sql | Tabla audit_log (F5-04) | Solo en proyecto nuevo |
| add-audit-log-clinica-policy.sql | Política audit_log_select_clinica (F6-M) | Si falta la política |
| schema-vademecum.sql | Tablas vademécum (F6-A) | Solo en proyecto nuevo |
| seed-vademecum.sql | Datos de vademécum (F6-A) | Solo si faltan datos |
| schema-soft-delete.sql | Soft delete de pacientes (F6-Fa) | Solo en proyecto nuevo |

### Paso 2 — Ejecutar en el SQL Editor de Supabase

1. Ir a https://supabase.com/dashboard/project/nagduvivilmzupdpoayo/sql
2. Copiar el contenido del script
3. Pegar en el SQL Editor
4. Click en "Run"
5. Verificar el resultado

### Paso 3 — Verificar con el script de diagnóstico

Después de aplicar cambios, ejecutar supabase/diagnose-dev-supabase.sql para verificar que todo está alineado.

---

## 🚨 Scripts de mantenimiento

| Script | Propósito | Cuándo usarlo |
|--------|-----------|---------------|
| diagnose-dev-supabase.sql | Verificar estado actual | Antes de aplicar cambios |
| verify-audit-log.sql | Verificar audit_log | Después de aplicar F6-M |
| verify-e2e-data-in-dev.sql | Verificar datos de E2E | Antes de limpiar |
| cleanup-e2e-data-from-dev.sql | Limpiar datos de E2E | Solo si hay datos de E2E |
| align-dev-supabase.sql | Alinear con schemas versionados | Cuando hay desalineación |

---

## ⚠️ Advertencias

1. **NO ejecutar scripts de limpieza en staging ni producción**
2. **NO ejecutar migraciones (migrate-*) en proyectos nuevos** (solo si hay datos existentes)
3. **NO borrar datos reales** sin backup previo
4. **Verificar con diagnose-dev-supabase.sql** antes de aplicar cambios

---

## 📊 Estado actual del proyecto de desarrollo (2026-08-24)

| Componente | Estado |
|-----------|--------|
| Tablas base | ✅ Aplicado |
| Tablas clínicas | ✅ Aplicado |
| Multi-clínica | ✅ Aplicado |
| RBAC | ✅ Aplicado |
| audit_log | ✅ Aplicado |
| Vademécum | ⚠️ Parcial (3 de 8 tablas) |
| Soft delete | ✅ Aplicado |
| Políticas audit_log | ⚠️ 2 de 4 (faltan F6-M) |
| Datos de E2E | ⚠️ 6 usuarios + 98 odontogramas (limpiar) |

**Próxima acción:** Ejecutar align-dev-supabase.sql y cleanup-e2e-data-from-dev.sql.

---

## 🔗 Referencias

- **Staging:** docs/STAGING.md
- **Checklist de despliegue:** docs/DEPLOY_CHECKLIST.md
- **Backup y restauración:** docs/BACKUP_RESTORE.md
- **Rollback:** docs/ROLLBACK.md
- **Runbook:** docs/RUNBOOK.md
