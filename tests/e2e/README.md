# Tests E2E de RBAC por rol (F6-B5)

Verifican las políticas RLS de F6-B2 (clínico) y F6-B3 (financiero/vademécum/audit)
contra el proyecto Supabase local (Docker) usando requests HTTP reales con
JWTs de los 4 roles (admin, dentista, asistente, recepcion).

## Requisitos

- Supabase local corriendo (supabase start) en http://127.0.0.1:54321
- Esquemas aplicados: schema-rbac.sql, schema-rbac-policies.sql, schema-rbac-policies-fin.sql
- Python 3 (sin dependencias externas)

## Ejecución

Desde la raíz del repo:

    python3 tests/e2e/rbac_clinical_e2e.py
    python3 tests/e2e/rbac_financial_e2e.py

- rbac_clinical_e2e.py: 17 checks (matriz clínica F6-B2)
- rbac_financial_e2e.py: 31 checks (matriz financiera F6-B3)

Cada script crea 4 usuarios de prueba con emails únicos (timestamp), ejecuta la
matriz de verificación, y limpia usuarios y filas al terminar.
Salida esperada: RESULTADO: N/N PASS

## Convenciones

- Denegación de UPDATE/DELETE se verifica por efecto (valor intacto / fila sigue
  existiendo), porque RLS en UPDATE/DELETE filtra filas en vez de lanzar 42501.
- Denegación de INSERT sí retorna 403 (WITH CHECK).
- Ownership estricto (D7): cada rol solo ve/edita sus propias filas.
