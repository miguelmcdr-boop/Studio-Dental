# Guía de Contribución — Studio Dental OS

Este documento define las convenciones de trabajo en el proyecto. Todo cambio de código debe seguir estas reglas.

## 1. Convención de Conventional Commits

Cada commit debe tener un mensaje estructurado con el siguiente formato:

**Formato:** `tipo(alcance): descripción breve (ID-tarea)`

**Ejemplo real:** `feat(inventario): add modal for selecting materials (F2-12)`

## 2. Tipos de commit permitidos

| Tipo | Cuándo usarlo | Ejemplo |
|---|---|---|
| `feat` | Nueva funcionalidad | `feat(pacientes): agregar campo de alergias (F2-04)` |
| `fix` | Corrección de bug | `fix(auth): corregir verificación de contraseña (F1-01)` |
| `refactor` | Reestructuración sin cambio funcional | `refactor(pacientes): extraer hook de ficha (F2-02)` |
| `docs` | Cambios en documentación | `docs: actualizar ROADMAP con F3-02 (F3-02)` |
| `test` | Agregar o corregir tests | `test(anestesiaCalc): agregar casos edge (F1-03)` |
| `ci` | Cambios en pipeline/CI | `ci: agregar job de arquitectura (F3-02)` |
| `chore` | Mantenimiento sin impacto funcional | `chore: actualizar dependencias (F3-07)` |
| `style` | Formato, espacios, sin cambio de lógica | `style: aplicar formato a imports` |
| `perf` | Mejora de rendimiento | `perf(pacientes): optimizar renderizado (F2-05)` |

## 3. Alcances válidos

Usa el nombre del módulo afectado como alcance. Módulos disponibles:

- `auth`, `pacientes`, `agenda`, `inventario`, `finanzas`, `pagos`, `prestaciones`, `presupuestos`, `reportes`, `dashboard`, `configuracion`, `comunicaciones`, `laboratorio`, `esterilizacion`, `urgenciasGes`, `odontograma`, `periodontograma`, `quirurgico`, `odontopediatria`, `dsd`
- `ci` (para cambios de pipeline)
- `docs` (para documentación general)

Si el cambio afecta múltiples módulos y no hay uno dominante, omite el alcance: `feat: agregar notificaciones globales`

## 4. Flujo de trabajo con ramas

### Regla de oro: NUNCA commits directos a main

Todo cambio pasa por una rama de feature:

1. Crear rama desde main actualizado
2. Hacer cambios en la rama
3. Verificar que todo pasa antes de commit (ver sección 5)
4. Commit con mensaje convencional
5. Push y abrir PR en GitHub hacia main

### Comandos del flujo:

```bash
# 1. Crear rama desde main actualizado
git checkout main
git pull origin main
git checkout -b feature/F2-12-modal-descuento-inventario

# 2. Hacer cambios en la rama
# ... código ...

# 3. Verificar que todo pasa antes de commit
npm run lint
npm run test
npm run build
npm run validate:architecture

# 4. Commit con mensaje convencional
git add .
git commit -m "feat(inventario): add modal for selecting materials on treatment completion (F2-12)"

# 5. Push y abrir PR en GitHub
git push origin feature/F2-12-modal-descuento-inventario
```

## 5. Comandos obligatorios antes de cada commit

No hagas commit sin ejecutar estos 4 comandos y que todos pasen:

```bash
npm run lint                      # 0 warnings, 0 errors
npm run test                      # 144/144 tests passing
npm run build                     # build de producción exitoso
npm run validate:architecture     # reglas arquitectónicas cumplidas
```

Si alguno falla, el PR será bloqueado automáticamente por GitHub (branch protection configurado en F3-01).

## 6. Ejemplos reales del proyecto

Estos son commits que ya hicimos, reescritos con la convención:

### Ejemplo 1: Autenticación real (F1-01)

```
feat(auth): implementar verificación de credenciales con PBKDF2 (F1-01)

- Agregar authService con hashing PBKDF2 vía Web Crypto API
- Salt aleatorio de 16 bytes por credencial, 100.000 iteraciones
- Bloqueo por intentos fallidos (5 intentos, 5 minutos)
- Migración automática de perfiles antiguos
- Tests: 9 casos cubriendo creación, verificación y bloqueo

Archivos: src/services/authService.js, src/services/authService.test.js
Roadmap: F1-01
```

### Ejemplo 2: Modal de descuento de inventario (F2-12)

```
feat(inventario): add modal for selecting materials on treatment completion (F2-12)

- New ModalDescuentoInventario component with checkboxes
- Editable quantities per material (0.01 step)
- Preview of stock before and after discount
- Cancel option marks treatment as Done without discount
- Integrates with AsociacionesInsumos.jsx for per-category config
- 4 files modified, 2 files created

Archivos: inventarioCalculations.js, AsociacionesInsumos.jsx, ModalDescuentoInventario.jsx, PresupuestoSection.jsx
Roadmap: F2-12
```

### Ejemplo 3: Pipeline CI/CD (F3-01)

```
ci: add GitHub Actions workflow for lint/test/build (F3-01)

- Add .github/workflows/ci.yml with 3 parallel jobs
- Triggers on push to main and pull requests
- Uses Node 20 LTS with npm caching
- Validates dist/ generation after build
- Branch protection configured with all 3 checks required

Archivos: .github/workflows/ci.yml
Roadmap: F3-01
```

### Ejemplo 4: Validación arquitectónica (F3-02)

```
ci: add architectural validation script (F3-02)

- Add scripts/validate-architecture.js
- Add scripts/architecture-allowlist.json (20 files frozen)
- Validates: JSX max 250 lines, Hooks max 150, Utils max 50
- Validates: index.js presence in all modules
- Validates: no export default outside App.jsx
- Integrated as architecture job in CI pipeline

Archivos: scripts/validate-architecture.js, scripts/architecture-allowlist.json, package.json, .github/workflows/ci.yml
Roadmap: F3-02
```

## 7. Reglas adicionales

- **Un commit = un propósito lógico.** No mezcles cambios de features distintas en un solo commit.
- **Mensajes en presente imperativo:** "add feature" (no "added feature" ni "adds feature").
- **ID de tarea obligatorio** entre paréntesis al final del título (excepto chore menores).
- **Cuerpo del commit opcional** pero recomendado para cambios grandes — explica el por qué, no el qué.
- **PRs hacia main siempre**, incluso si trabajas solo. El pipeline CI/CD corre en PRs y bloquea merges con checks fallidos.

## 8. Documentación relacionada

- Constitución de Arquitectura: `docs/01-Constitucion_Arquitectura_Studio_Dental_v3.md` — reglas técnicas detalladas
- MASTER_ROADMAP: `docs/MASTER_ROADMAP.md` — plan de tareas con IDs que deben referenciarse en los commits