# Studio Dental OS 🦷

Aplicación web de gestión clínica odontológica con 14 módulos especializados, desarrollada con React 19 + Vite + Zustand + Tailwind CSS.

## 🏗️ Arquitectura

- **Frontend:** React 19 + Vite 8
- **Estado global:** Zustand 5 (3 stores: sesión, pacientes, prestaciones)
- **Persistencia:** LocalStorage + IndexedDB (adjuntos clínicos)
- **Validación:** Zod 4 (esquemas de datos)
- **Estilos:** Tailwind CSS 4
- **Testing:** Vitest 3 + @testing-library/react
- **Linting:** oxlint
- **CI/CD:** GitHub Actions (4 jobs: lint, test, build, architecture)

## 📚 Documentación

- 📖 **[Constitución de Arquitectura](docs/01-Constitucion_Arquitectura_Studio_Dental_v3.md)** — reglas técnicas detalladas (tamaño de archivos, exportaciones, barreras públicas, etc.)
- 📋 **[MASTER_ROADMAP](docs/MASTER_ROADMAP.md)** — plan técnico ejecutable con todas las tareas, bitácoras y decisiones
- 🤝 **[Guía de Contribución](CONTRIBUTING.md)** — convención de commits y flujo de trabajo con ramas

## 🚀 Comandos disponibles

```bash
# Desarrollo
npm run dev                      # Servidor de desarrollo (http://localhost:5173)

# Calidad (ejecutar todos antes de commit)
npm run lint                     # oxlint (0 warnings, 0 errors)
npm run test                     # Vitest (144 tests)
npm run build                    # Build de producción
npm run validate:architecture    # Validación arquitectónica

# Otros
npm run preview                  # Preview del build de producción
npm run test:watch               # Tests en modo watch
npm run test:coverage            # Tests con reporte de cobertura
```

## 📦 Módulos del sistema

**Módulos eager (cargan al inicio):**
- 📅 **Agenda** — gestión de citas y bloqueos horarios
- 👥 **Pacientes** — fichas clínicas completas con 7 secciones
- 📊 **Dashboard** — indicadores clave y métricas

**Módulos lazy (cargan bajo demanda):**
- 💰 Finanzas, Pagos, Presupuestos, Prestaciones
- 🦷 Odontograma, Periodontograma, Quirúrgico, Odontopediatría
- ✨ DSD (Diseño de Sonrisa), Laboratorio, Esterilización
- 📞 Comunicaciones, Reportes, Urgencias GES, Configuración

## 🛡️ Red de seguridad automatizada

Cada PR a `main` ejecuta 4 checks obligatorios vía GitHub Actions:

1. ✅ **Lint** — oxlint sin warnings
2. ✅ **Tests** — 144 tests pasando (Vitest)
3. ✅ **Build** — build de producción exitoso
4. ✅ **Architecture** — reglas de la Constitución cumplidas

Los PRs con cualquier check fallido son bloqueados automáticamente por branch protection.

## 📊 Métricas del proyecto

- **Tests:** 144 tests en 10 archivos (`*.test.js`)
- **Lint:** 0 warnings, 0 errors (235 archivos)
- **Bundle inicial:** 594.74 kB (148.75 kB gzip)
- **Módulos:** 14 (3 eager + 11 lazy-loaded)
- **Líneas de código:** ~16,000 (src/)

## 📝 Convención de commits

Este proyecto usa **Conventional Commits**. Ver [CONTRIBUTING.md](CONTRIBUTING.md) para detalles.

Formato: `tipo(alcance): descripción (ID-tarea)`

Ejemplo: `feat(inventario): add modal for selecting materials (F2-12)`

## 🗂️ Estructura del proyecto

```
Studio Dental/
├── src/
│   ├── App.jsx                          # Componente raíz (único export default)
│   ├── main.jsx                         # Entry point
│   ├── components/                      # Componentes compartidos
│   ├── store/                           # Zustand stores (3)
│   ├── services/                        # Servicios transversales
│   ├── utils/                           # Utilidades globales
│   └── modules/                         # 14 módulos de dominio
│       ├── agenda/
│       ├── pacientes/
│       ├── inventario/
│       └── ... (11 más)
├── scripts/
│   ├── validate-architecture.js         # Script de validación arquitectónica
│   └── architecture-allowlist.json      # Allowlist de archivos excepcionales
├── docs/
│   ├── 01-Constitucion_Arquitectura_Studio_Dental_v3.md
│   └── MASTER_ROADMAP.md
├── CONTRIBUTING.md                      # Guía de contribución
├── package.json
└── README.md                            # Este archivo
```

---

*Última actualización: Agosto 2026 (Fase 3 — Calidad, Gobernanza y Equipo)*

---

## Información del template original de Vite (referencia)

Este proyecto fue creado con el template React + Vite. Información original del template:

### React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

### React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

### Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.