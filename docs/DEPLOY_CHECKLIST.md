# 🚀 Checklist de Despliegue a Producción — Studio Dental

**Estado:** 📋 EN PROCESO
**Última actualización:** 2026-08-16
**Responsable:** Principal Software Architect
**Dependencias cumplidas:** F6-02 ✅ (E2E 12/12) · F6-01 ✅ (Error Boundary)

---

## 📋 Resumen Ejecutivo

- **Tiempo estimado:** 2-4 horas
- **Nivel de riesgo:** Medio
- **Rollback:** sección 7
- **Precondiciones técnicas confirmadas:**
  - ✅ 589 tests unitarios/integración pasando
  - ✅ 12/12 tests E2E pasando (100%)
  - ✅ 0 vulnerabilidades en npm audit
  - ✅ Lint: 0 warnings, 0 errors
  - ✅ Build limpio (500 kB / 133 kB gzip)
  - ✅ Arquitectura: todas las reglas cumplen (67 archivos en allowlist)
  - ✅ Error Boundary global + por módulo crítico operativo
  - ✅ 27 tablas Supabase (19 datos clínicos/operacionales + audit_log + 8 vademécum)

---

## ✅ Fase 1: Preparación de Supabase (Backend)

### 1.1 Crear proyecto de producción

- [ ] Crear proyecto `studio-dental-production` en https://app.supabase.com
- [ ] Región: South America (São Paulo)
- [ ] Plan: Pro ($25/mes) — incluye backups automáticos y PITR
- [ ] ⚠️ NO usar el proyecto de desarrollo
- [ ] Guardar credenciales: Project URL, Anon Key, Service Role Key, DB Password

### 1.2 Ejecutar migraciones SQL

- [ ] Conectar al SQL Editor: `https://app.supabase.com/project/xxxxx/sql`
- [ ] Ejecutar en orden:
  1. `supabase/schema-base.sql` (15 tablas clínicas)
  2. `supabase/schema-audit-log.sql` (tabla auditoría)
  3. `supabase/schema-vademecum.sql` (7 tablas vademécum)
- [ ] Verificar 27 tablas:

  ```sql
  SELECT table_name FROM information_schema.tables
  WHERE table_schema = 'public' ORDER BY table_name;
  ```

- [ ] Verificar RLS:

  ```sql
  SELECT tablename, policyname, cmd FROM pg_policies
  WHERE schemaname = 'public';
  ```

- [ ] Habilitar Realtime en 17 tablas (Database → Replication):
  pacientes, citas, presupuestos, presupuesto_items, pagos, movimientos_financieros, evoluciones_clinicas, recetas, odontogramas, periodontogramas, inventario, vademecum, vademecum_urgencia, vademecum_antirresortivos, alergias_cruzadas, interacciones_farmacologicas, audit_log

### 1.3 Configurar Autenticación

- [ ] Authentication → URL Configuration → Site URL: `https://app.studiodental.cl`
- [ ] Redirect URLs: `https://app.studiodental.cl/**`
- [ ] Decisión confirm email: habilitar (seguro) o deshabilitar (MVP rápido)
- [ ] Crear usuarios de producción (NO usar e2e_*@studiodental.com):
  - admin@studiodental.cl (rol: admin)
  - dentista1@studiodental.cl (rol: dentista)
  - recepcion1@studiodental.cl (rol: recepcion)

### 1.4 Configurar Backups

- [ ] Database → Backups: verificar backups diarios (Plan Pro)
- [ ] ⚠️ CRÍTICO: probar restauración en proyecto staging
- [ ] Documentar tiempo de restauración (esperado: 5-15 min)

---

## ✅ Fase 2: Preparación del Hosting (Frontend)

### 2.1 Elegir hosting

| Hosting | Costo | Recomendación |
|---|---|---|
| Vercel | $20/mes | ✅ Recomendado |
| Netlify | $19/mes | Alternativa |
| Railway | $5-10/mes | Presupuesto |

### 2.2 Conectar repositorio

- [ ] Autorizar GitHub → repositorio `Studio-Dental`
- [ ] Rama: `main`
- [ ] Build command: `npm run build`
- [ ] Output directory: `dist`

### 2.3 Variables de entorno

- [ ] Settings → Environment Variables:

  ```
  VITE_SUPABASE_URL=https://xxxxx.supabase.co
  VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
  VITE_USE_SUPABASE=true
  NODE_ENV=production
  ```

- [ ] ⚠️ NO commitear .env

### 2.4 Dominio personalizado

- [ ] Comprar dominio (ej: studiodental.cl)
- [ ] Configurar DNS:

  ```
  A    @     76.76.21.21
  CNAME www  cname.vercel-dns.com
  ```

- [ ] Verificar SSL/TLS automático
- [ ] Configurar redirects http→https, www→apex

---

## ✅ Fase 3: Migración de Datos (si aplica)

### 3.1 Verificar datos legacy

- [ ] DevTools → Application → Local Storage
- [ ] Buscar claves: clinica_lista_pacientes, clinica_citas, clinica_presupuestos
- [ ] Si existen: continuar. Si no: saltar a Fase 4

### 3.2 Migración automática

- [ ] Login con admin en producción
- [ ] Hook useDataMigration (F4-02b) ejecuta migración automática
- [ ] Verificar integridad:

  ```sql
  SELECT COUNT(*) FROM pacientes;
  SELECT COUNT(*) FROM citas;
  SELECT COUNT(*) FROM presupuestos;
  ```

### 3.3 Limpieza

- [ ] Limpiar localStorage tras migración exitosa
- [ ] Verificar datos en Supabase persisten

---

## ✅ Fase 4: Verificación Post-Deploy

### 4.1 Login y RBAC

- [ ] Admin: 14/14 módulos
- [ ] Dentista: 11/14 módulos
- [ ] Asistente: 9/14 módulos
- [ ] Recepción: 7/14 módulos

### 4.2 Flujo clínico básico

- [ ] Crear paciente → verificar en Supabase
- [ ] Agendar cita → verificar en Supabase
- [ ] Evolución clínica → verificar en Supabase
- [ ] Receta médica → verificar en Supabase

### 4.3 Flujo financiero básico

- [ ] Crear presupuesto → verificar en Supabase
- [ ] Registrar pago → verificar en Supabase

### 4.4 Realtime

- [ ] Dispositivo A crea cita → Dispositivo B la ve en <1 segundo

### 4.5 Offline-first

- [ ] Desconectar internet → crear dato → reconectar → verificar sync

### 4.6 Error Boundary

- [ ] Forzar error → verificar fallback → verificar recuperación

### 4.7 Seguridad clínica

- [ ] Paciente alérgico a Penicilina → prescribir Amoxicilina → verificar alerta crítica

### 4.8 Logs en producción

- [ ] Verificar que logs técnicos están silenciados (F6-03 pendiente)

---

## ✅ Fase 5: Monitoreo y Observabilidad

### 5.1 Error tracking

- [ ] Configurar Sentry (https://sentry.io, plan Free)
- [ ] Instalar: `npm install @sentry/react @sentry/tracing`
- [ ] Configurar en main.jsx con DSN

### 5.2 Performance monitoring

- [ ] Instalar: `npm install web-vitals`
- [ ] Configurar onCLS, onFID, onLCP

### 5.3 Uptime monitoring

- [ ] Configurar UptimeRobot (https://uptimerobot.com)
- [ ] Monitor HTTP(s) cada 5 minutos

---

## ✅ Fase 6: Documentación Final

### 6.1 Actualizar README

- [ ] Agregar URL de producción
- [ ] Documentar credenciales (canal seguro)

### 6.2 Procedimiento de backup

- [ ] Crear `docs/BACKUP_RESTORE.md`
- [ ] Frecuencia: diaria, retención: 7 días

### 6.3 Procedimiento de rollback

- [ ] Crear `docs/ROLLBACK.md`
- [ ] Hosting: revertir deploy anterior
- [ ] Supabase: restaurar backup

### 6.4 Runbook de incidentes

- [ ] Crear `docs/RUNBOOK.md`
- [ ] Incidentes comunes: app no carga, datos no sincronizan, login falla

---

## ✅ Fase 7: Go-Live

### 7.1 Comunicar al equipo

- [ ] Email con URL de acceso
- [ ] Credenciales por canal seguro
- [ ] Link a manual de usuario (F6-07)

### 7.2 Monitoreo inicial

- [ ] Monitorear primeras 24 horas
- [ ] Uptime: 100%, Errores críticos: 0

### 7.3 Celebrar 🎉

- [ ] Marcar checklist como DONE
- [ ] Actualizar MASTER_ROADMAP.md (F6-06 → DONE)

---

## 📊 Métricas de Éxito

| Métrica | Objetivo | Actual |
|---|---|---|
| Uptime | >99.9% | ⬜ Pendiente |
| Errores críticos | 0 | ⬜ Pendiente |
| LCP | <2.5s | ⬜ Pendiente |
| FID | <100ms | ⬜ Pendiente |
| CLS | <0.1 | ⬜ Pendiente |
| Tiempo de rollback | <30 min | ⬜ Pendiente |

---

## 🔄 Procedimiento de Rollback

### Cuándo hacer rollback
- Error crítico que impide uso del sistema
- Pérdida de datos
- Problema de seguridad

### Cómo hacer rollback

**1. Rollback de frontend (hosting):**
En Vercel/Netlify: Deployments → seleccionar deploy anterior → Promote to Production (2-5 min)

**2. Rollback de backend (Supabase):**
Database → Backups → Restore → seleccionar backup anterior (5-15 min)

**3. Comunicar al equipo:**
Email: "Sistema en mantenimiento, rollback en progreso" (30 min estimado)

---

## 📝 Decisiones Técnicas

### Hosting: Vercel (Pro plan)
Deploy automático, edge network global, integración con GitHub

### Dominio: studiodental.cl
Dominio local para Chile, fácil de recordar, profesional

### Backups: Supabase diarios + restauración probada
Plan Pro incluye PITR, restauración probada en staging

### Monitoreo: Sentry + Web Vitals + UptimeRobot
Cobertura completa, planes gratuitos suficientes para MVP

---

## ✅ Checklist Final (resumen)

- [ ] Fase 1: Supabase configurado (27 tablas, RLS, Realtime, backups)
- [ ] Fase 2: Hosting configurado (dominio, SSL, variables de entorno)
- [ ] Fase 3: Datos migrados (si aplica)
- [ ] Fase 4: Verificación post-deploy (8 flujos críticos)
- [ ] Fase 5: Monitoreo configurado (errores, performance, uptime)
- [ ] Fase 6: Documentación completa (README, backup, rollback, runbook)
- [ ] Fase 7: Go-live (comunicación, monitoreo, celebración)

**Fecha de go-live:** ⬜ Pendiente
**Responsable:** ⬜ Pendiente
**Firma:** ⬜ Pendiente

---

**Documento creado:** 2026-08-16
**Versión:** 1.0
**Próxima revisión:** después del primer despliegue exitoso
