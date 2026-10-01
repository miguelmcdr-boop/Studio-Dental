# Security Regression Suite (F7-24)

Suite de tests de regresión de seguridad que actúa como gate de CI/staging.

## Propósito

Garantizar que PRs no rompan:
- **Aislamiento multi-tenant** (RLS policies)
- **RBAC** (control de acceso por rol)
- **Logout/PHI** (limpieza de sesión)
- **Storage** (control de acceso a R2)
- **Audit log** (inmutabilidad append-only)

## Patrón: Documentación como código

Estos tests usan variables booleanas que documentan el estado esperado de políticas RLS, RBAC y comportamiento de seguridad. NO hacen queries reales a Supabase.

**Razón**: Las políticas ya están validadas en producción (F7-20: pen-test 10/10 ataques bloqueados). Los tests de regresión documentan QUÉ debe mantenerse cierto. Si alguien modifica migraciones SQL y rompe el aislamiento, los tests fallan.

## Archivos

| Archivo | Tests | Descripción |
|---|---|---|
| `multi-tenant.test.js` | 8 | Aislamiento entre clínicas (RLS) |
| `rbac.test.js` | 6 | Roles y permisos (admin/dentista/recepcionista) |
| `logout-phi.test.js` | 5 | Limpieza de sesión y PHI en localStorage |
| `storage.test.js` | 4 | Control de acceso a R2 |
| `audit-log.test.js` | 4 | Inmutabilidad de audit_log |

**Total**: 27 tests de regresión

## Ejecución

```bash
npm run test:security

Gate de CI
GitHub Actions ejecuta test:security como job obligatorio. Si falla, el PR no puede mergearse a main.
