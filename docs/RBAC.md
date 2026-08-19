# RBAC en Studio Dental — Arquitectura y Guía

Última actualización: 2026-08-18 (F6-B6)

## Resumen

Studio Dental implementa control de acceso basado en roles (RBAC) con políticas server-side en PostgreSQL (RLS) y verificación client-side en React. El sistema asegura que cada usuario solo pueda acceder a los recursos permitidos para su rol.

## Arquitectura

### Dónde vive el rol

El rol de cada usuario se almacena en auth.users.raw_app_meta_data.role (JWT firmado por Supabase, no editable por el usuario). Este valor se propaga automáticamente al crear usuarios vía el trigger on_auth_user_created (F6-B1).

Flujo:
auth.users.raw_app_meta_data.role -> JWT (app_metadata.role) -> authService.js -> userMetadata.role

### Helpers SQL

Cuatro funciones en public (definidas en schema-rbac.sql):

| Función | Descripción | Uso típico |
|---|---|---|
| current_role() | Retorna el rol del JWT actual (app_role o NULL) | Políticas RLS |
| has_role(app_role) | TRUE si el JWT tiene el rol especificado | Políticas RLS |
| is_admin() | TRUE si el rol es admin | Políticas de admin-only |
| role_in(app_role[]) | TRUE si el rol está en la lista | Políticas multi-rol |

### Frontend

- authService.js (F6-B4): lee user.app_metadata.role y lo expone como userMetadata.role. Default a 'recepcion' si falta (mínimo privilegio, nunca 'admin').
- useRBAC.js: hook que consume userMetadata.role y expone hasPermission() basado en la matriz de permisos.
- LoginScreen.jsx y Sidebar.jsx: consumen userMetadata.role sin cambios de arquitectura.

## Matriz de permisos (desde rbacConstants.js)

| Permiso | admin | dentista | asistente | recepcion |
|---|---|---|---|---|
| VER_PACIENTES | sí | sí | sí | sí |
| EDITAR_PACIENTES | sí | sí | no | no |
| VER_AGENDA | sí | sí | sí | sí |
| EDITAR_AGENDA | sí | sí | sí | no |
| VER_CLINICA | sí | sí | sí | no |
| EDITAR_CLINICA | sí | sí | no | no |
| VER_FINANZAS | sí | sí | no | no |
| EDITAR_FINANZAS | sí | sí | no | no |
| VER_INVENTARIO | sí | sí | sí | no |
| EDITAR_INVENTARIO | sí | sí | no | no |
| ADMINISTRAR_VADEMECUM | sí | sí | no | no |
| VER_LOGS_SISTEMA | sí | no | no | no |
| ADMIN_USUARIOS | sí | no | no | no |

Total: 13 permisos x 4 roles = 52 decisiones de acceso.

## Políticas RLS server-side

### Tablas clínicas (9 tablas)

Tablas: evoluciones_clinicas, recetas, odontogramas, periodontogramas, periodontogramas_historial, dsd_configs, odontopediatria, quirurgico_implantes, quirurgico_endodoncia

| Operación | Roles permitidos | Ownership |
|---|---|---|
| SELECT | admin, dentista, asistente | Solo propias (auth.uid() = user_id) |
| INSERT/UPDATE/DELETE | admin, dentista | Solo propias |

### Pacientes y citas

| Operación | Roles permitidos | Ownership |
|---|---|---|
| SELECT/INSERT/UPDATE | admin, dentista, asistente, recepcion | Solo propias |
| DELETE | admin, dentista | Solo propias |

### Finanzas (5 tablas)

Tablas: movimientos_financieros, pagos, presupuestos, presupuesto_items, inventario

| Tabla | Operación | Roles permitidos | Ownership |
|---|---|---|---|
| movimientos_financieros, pagos | CRUD | admin, dentista | Solo propias |
| presupuestos | SELECT/INSERT/UPDATE | 4 roles | Solo propias |
| presupuestos | DELETE | admin, dentista | Solo propias |
| presupuesto_items | CRUD | vía presupuesto padre (FK) | Solo propias |
| inventario | SELECT | admin, dentista, asistente | Solo propias |
| inventario | INSERT/UPDATE/DELETE | admin, dentista | Solo propias |

### Vademécum (8 tablas)

Tablas: vademecum, vademecum_urgencia, vademecum_antirresortivos, alergias_cruzadas, interacciones_farmacologicas, profilaxis_endocarditis, manejo_anticoagulantes, reference_data_meta

| Operación | Roles permitidos |
|---|---|
| SELECT | Pública (cualquier usuario, incluido anónimo) |
| INSERT/UPDATE/DELETE | admin, dentista |

### Audit log

| Operación | Roles permitidos |
|---|---|
| INSERT | 4 roles (solo propias) |
| SELECT | 4 roles (propias) + admin (todas) |
| UPDATE/DELETE | No permitido (append-only) |

### Profiles

- Rol espejo: inmutable vía UPDATE (trigger lock_profiles_role)
- Los cambios de rol van por set_app_metadata_role() o trigger de alta (F6-B1)

## Guía de desarrollo

### Agregar un nuevo rol

1. Enum: agregar valor al enum app_role en schema-rbac.sql
2. Matriz: agregar columna en src/constants/rbacConstants.js y definir permisos
3. Políticas: actualizar las políticas de tablas afectadas para incluir el nuevo rol
4. Migración: si hay usuarios existentes, asignarles el rol vía migrate-roles-to-app-metadata.sql
5. Tests: actualizar tests/e2e/rbac_clinical_e2e.py y rbac_financial_e2e.py para incluir el nuevo rol

### Agregar una nueva tabla

1. Schema: crear la tabla con user_id uuid REFERENCES auth.users(id) (ownership)
2. Políticas: agregar políticas en schema-rbac-policies.sql o schema-rbac-policies-fin.sql usando role_in() + ownership estricto
3. GRANTs: agregar GRANT ALL ON tabla TO authenticated, service_role
4. Verificación: actualizar supabase/verify-rbac.sql para incluir la nueva tabla
5. Tests: agregar checks en tests/e2e/ para validar la matriz de permisos

### Probar políticas

SQL (verificación de esquema):
    # En SQL Editor local
    cat supabase/verify-rbac.sql | pbcopy
    # Pegar y ejecutar -> debe dar 12/12 PASS

E2E (verificación de comportamiento):
    python3 tests/e2e/rbac_clinical_e2e.py    # 17 checks
    python3 tests/e2e/rbac_financial_e2e.py   # 31 checks

JS (verificación de authService):
    npx vitest run src/services/authService.appMetadata.test.js

## Troubleshooting

### RLS filtra filas en UPDATE/DELETE (no lanza 42501)

Síntoma: un PATCH o DELETE retorna 200 pero no afecta filas.

Causa: Postgres filtra filas en UPDATE/DELETE en vez de lanzar error. Si la política RLS no permite la operación sobre esa fila específica, 0 filas son afectadas.

Verificación: comprobar por efecto (el valor no cambió / la fila sigue existiendo).

### JWT sin rol (current_role() retorna NULL)

Síntoma: todas las políticas deniegan acceso.

Causa: el usuario no tiene app_metadata.role (trigger de alta no se ejecutó, o migración no corrió).

Solución: ejecutar migrate-roles-to-app-metadata.sql en el proyecto afectado.

### Frontend lee user_metadata en vez de app_metadata

Síntoma: un usuario puede auto-promoverse a admin desde la consola del navegador.

Causa: el frontend lee user.user_metadata.role (editable) en vez de user.app_metadata.role (JWT firmado).

Solución: asegurar que authService.js y App.jsx lean de app_metadata (F6-B4).

### Políticas legacy de solo ownership

Síntoma: verify-rbac.sql reporta FAIL en "Tablas usan role_in".

Causa: quedaron políticas de F4 (antes de RBAC) que solo verifican ownership sin rol.

Solución: re-aplicar schema-rbac-policies.sql y schema-rbac-policies-fin.sql para sobrescribir las políticas legacy.

## Despliegue a producción

### Orden seguro de despliegue

1. schema.sql (funciones base)
2. schema-rbac.sql (enum + helpers + trigger, SIN políticas restrictivas)
3. migrate-roles-to-app-metadata.sql (asigna roles a usuarios existentes)
4. Verificar: SELECT email, app_metadata->>'role' FROM auth.users -> todos tienen rol
5. schema-rbac-policies.sql + schema-rbac-policies-fin.sql (políticas restrictivas)
6. schema-clinical-tables.sql + schema-audit-log.sql + schema-vademecum.sql (tablas)
7. seed-vademecum.sql (datos de vademécum)

Riesgo: si aplicas las políticas restrictivas (paso 5) antes de asignar roles (paso 3), current_role() retorna NULL y todos los usuarios quedan bloqueados.

### Estado actual (2026-08-18)

- Local: RBAC 100% desplegado y verificado (SQL 12/12, JS 4/4, e2e 17/17 + 31/31)
- Cloud: esquema RBAC NO desplegado (decisión diferida por riesgo de bloqueo de usuarios reales)

Siguiente paso: cuando se decida desplegar en cloud, seguir el orden seguro de arriba, asignar roles a los 5 usuarios existentes, y verificar con verify-rbac.sql antes de aplicar las políticas restrictivas.

## Referencias

- F6-B1: supabase/schema-rbac.sql (enum + helpers + trigger)
- F6-B2: supabase/schema-rbac-policies.sql (políticas grupo clínico)
- F6-B3: supabase/schema-rbac-policies-fin.sql (políticas financiero/vademécum/audit) + migrate-roles-to-app-metadata.sql
- F6-B4: src/services/authService.js + src/App.jsx (lectura de app_metadata)
- F6-B5: supabase/verify-rbac.sql + tests/e2e/ + src/services/authService.appMetadata.test.js
- F6-B6: este documento (docs/RBAC.md)