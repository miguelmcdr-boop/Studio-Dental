# 🔙 Procedimiento de Rollback — Studio Dental

**Versión:** 1.0
**Última actualización:** 2026-08-24
**Relacionado con:** F6-06 (checklist despliegue), `docs/BACKUP_RESTORE.md`

---

## 📋 Resumen

| Parámetro | Valor |
|-----------|-------|
| **Tiempo objetivo de rollback** | ≤ 30 minutos |
| **Responsable** | Admin del proyecto + desarrollador |
| **Comunicación** | Email al equipo durante el proceso |

---

## 🎯 ¿Cuándo hacer rollback?

| Situación | ¿Rollback? | Tiempo esperado |
|-----------|------------|-----------------|
| Error crítico que impide uso del sistema | ✅ Sí | ≤ 15 min |
| Pérdida de datos detectada | ✅ Sí | ≤ 30 min |
| Problema de seguridad (RLS roto, datos expuestos) | ✅ Sí | ≤ 15 min |
| Bug menor que no impide uso | ❌ No | Fix en próximo deploy |
| Problema de performance no crítico | ❌ No | Optimizar en próxima versión |

---

## 🔄 Tipos de Rollback

### Tipo 1: Rollback de Frontend (Vercel)

**Cuándo usar:** el problema está en el código del frontend (React), no en la base de datos.

**Procedimiento:**

1. Ir a [vercel.com/dashboard](https://vercel.com/dashboard)
2. Seleccionar proyecto → **Deployments**
3. Identificar el deploy anterior al problemático
4. Click en el deploy anterior → **"Promote to Production"**
5. Esperar 2-5 min a que el deploy se complete
6. Verificar que la app carga correctamente

**Tiempo estimado:** 2-5 minutos

### Tipo 2: Rollback de Backend (Supabase)

**Cuándo usar:** el problema está en la base de datos (schema, datos, RLS).

**Procedimiento:**

1. Ir a [supabase.com/dashboard](https://supabase.com/dashboard)
2. Seleccionar proyecto → **Database** → **Backups**
3. Identificar el backup anterior al problema
4. Click en **"Restore"** y seleccionar el backup
5. **Advertencia:** la restauración sobrescribe todos los datos actuales
6. Esperar 5-15 min a que termine

**Tiempo estimado:** 5-15 minutos

**Nota:** Ver `docs/BACKUP_RESTORE.md` para el procedimiento completo de restauración.

### Tipo 3: Rollback Completo (Frontend + Backend)

**Cuándo usar:** el problema afecta tanto al código como a la base de datos.

**Orden correcto:**

1. **Primero:** Rollback de backend (Supabase) — para evitar que el frontend nuevo escriba en el schema antiguo
2. **Segundo:** Rollback de frontend (Vercel) — una vez que la BD está en estado consistente
3. **Tercero:** Verificación post-rollback

**Tiempo estimado:** 15-30 minutos

---

## ✅ Verificación Post-Rollback

### 1. Login funcional
- [ ] Login con admin funciona
- [ ] Login con dentista funciona
- [ ] Login con recepción funciona

### 2. Datos coherentes
- [ ] Pacientes visibles en el módulo Pacientes
- [ ] Citas visibles en Agenda
- [ ] Presupuestos visibles en Presupuestos

### 3. Realtime operativo
- [ ] Abrir la app en dos dispositivos
- [ ] Crear una cita en el dispositivo A
- [ ] Verificar que aparece en el dispositivo B en < 1 segundo

### 4. Error Boundary operativo
- [ ] Forzar un error (si es posible)
- [ ] Verificar que el fallback aparece
- [ ] Verificar que el resto de la app sigue funcional

---

## 📢 Comunicación de Incidentes

### Plantilla de email al equipo

```
Asunto: [Studio Dental] Rollback en progreso — mantenimiento estimado 30 min

Estimado equipo,

Se detectó un problema crítico en la versión desplegada hoy a las [hora].
Estamos realizando un rollback a la versión anterior estable.

Tiempo estimado de mantenimiento: 30 minutos.
Impacto: la aplicación puede estar intermitente durante este período.

Les avisaremos cuando el sistema esté operativo nuevamente.

Saludos,
Equipo Técnico
```

### Actualización en el checklist de F6-06

Después del rollback, actualizar en `docs/DEPLOY_CHECKLIST.md`:
- Marcar el incidente en la sección de métricas
- Registrar el rollback en la tabla de la sección "Registro de Rollbacks" (abajo)
- Si el rollback fue exitoso, continuar con el checklist desde donde quedó

---

## 📊 Registro de Rollbacks

| Fecha | Tipo de rollback | Motivo | Responsable | Resultado | Duración | Datos perdidos |
|-------|------------------|--------|-------------|-----------|----------|----------------|
| _YYYY-MM-DD_ | _Frontend/Backend/Completo_ | _Motivo_ | _Nombre_ | ✅/❌ | _min_ | _Sí/No + descripción_ |

---

## 🔗 Referencias Cruzadas

- **Backup y restauración completa:** `docs/BACKUP_RESTORE.md`
- **Diagnóstico de incidentes:** `docs/RUNBOOK.md`
- **Checklist de despliegue:** `docs/DEPLOY_CHECKLIST.md` (Fase 7)
- **Error Boundary:** F6-01 en `docs/MASTER_ROADMAP.md`
