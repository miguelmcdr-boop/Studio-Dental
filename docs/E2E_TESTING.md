# E2E Testing con Playwright — Studio Dental

**Creado:** 2026-08-15
**Tarea:** F4-04
**Framework:** Playwright v1.x

## Objetivo

Validar end-to-end los flujos de negocio críticos del sistema antes de despliegue multi-clínica. Los tests E2E complementan los 582 tests unitarios/integración (vitest) verificando que los flujos completos funcionan desde la perspectiva del usuario.

## Ejecución local

Ejecutar todos los tests E2E (headless):
    npm run test:e2e

Ejecutar con UI interactiva (modo debug):
    npm run test:e2e:ui

Ejecutar con navegador visible:
    npm run test:e2e:headed

## Flujos cubiertos

| Spec | Flujo | Tests |
|---|---|---|
| flujo-clinico.spec.js | Crear paciente → cita → receta | 2 |
| flujo-financiero.spec.js | Presupuesto → pago | 2 |
| flujo-inventario.spec.js | Stock → descuento | 2 |
| flujo-seguridad.spec.js | Alergias → alerta crítica | 3 |
| flujo-colaborativo.spec.js | Realtime entre usuarios | 2 |

**Total:** 11 tests E2E

## Estructura

    e2e/
    ├── playwright.config.js
    ├── fixtures/
    │   └── auth.setup.js
    └── specs/
        ├── flujo-clinico.spec.js
        ├── flujo-financiero.spec.js
        ├── flujo-inventario.spec.js
        ├── flujo-seguridad.spec.js
        └── flujo-colaborativo.spec.js

## Credenciales de prueba

Los tests usan credenciales de prueba definidas en e2e/fixtures/auth.setup.js:

| Rol | Email | Password |
|---|---|---|
| admin | admin@studiodental.test | TestPass123! |
| dentista | dentista@studiodental.test | TestPass123! |
| asistente | asistente@studiodental.test | TestPass123! |
| recepcion | recepcion@studiodental.test | TestPass123! |

**Nota:** Estas credenciales deben existir en Supabase Auth antes de ejecutar los tests. Si no existen, los tests fallarán en el paso de login.

## Configuración

- **Base URL:** http://localhost:5173 (servidor de desarrollo Vite)
- **Timeout por test:** 60 segundos
- **Reintentos en CI:** 2
- **Screenshots:** solo en fallo
- **Video:** solo en fallo
- **Trace:** en primer reintento

## Integración con CI/CD

El job E2E está configurado como **no bloqueante** (continue-on-error: true) en .github/workflows/ci.yml. Esto permite:
- Detectar regresiones sin bloquear merges durante la fase de estabilización
- Una vez que los tests sean estables, cambiar a bloqueante

## Troubleshooting

### Tests fallan en login
- Verificar que las credenciales existen en Supabase Auth
- Verificar que VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY están en .env

### Tests fallan por timeout
- Aumentar timeout en playwright.config.js
- Verificar que el servidor de desarrollo inicia correctamente (npm run dev)

### Tests de Realtime fallan
- Verificar que Supabase Realtime está habilitado en las tablas
- Verificar que VITE_USE_SUPABASE=true en .env

## Métricas

- **Tests E2E:** 11
- **Flujos cubiertos:** 5
- **Tiempo de ejecución estimado:** 2-5 minutos
- **Navegador:** Chromium (headless)

## Próximos pasos

1. Ejecutar los tests localmente y ajustar selectores según la UI real
2. Crear credenciales de prueba en Supabase Auth
3. Una vez estables, hacer el job E2E bloqueante en CI/CD
4. Agregar más flujos según se detecten necesidades
