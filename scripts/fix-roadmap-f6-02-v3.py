#!/usr/bin/env python3
"""
F6-02 — Corrección final de inconsistencias del MASTER_ROADMAP.md (v3)
Enfoque: regex flexibles + correcciones específicas de contenido
"""

import re
from datetime import date

ARCHIVO = 'docs/MASTER_ROADMAP.md'
TODAY = '2026-08-16'  # Fecha oficial del proyecto

with open(ARCHIVO, 'r', encoding='utf-8') as f:
    contenido = f.read()

cambios_realizados = []

# ============================================================
# FIX 1: Métricas E2E en tabla "Estado final del proyecto"
# ============================================================
patron = r'(\|\s*Tests E2E\s*\|\s*)5/11\s*passing(\s*\|[^\n]*\|)'
if re.search(patron, contenido):
    contenido = re.sub(
        patron,
        r'\g<1>12/12 passing (100%)\g<2>',
        contenido
    )
    cambios_realizados.append('Tabla estado final: 5/11 passing → 12/12 passing (100%)')

# ============================================================
# FIX 2: Bitácora F4-04 — corregir "5/11 tests pasando"
# ============================================================
patron = r'Infraestructura E2E completa con validación de seguridad clínica\. 5/11 tests pasando'
if re.search(patron, contenido):
    contenido = re.sub(
        patron,
        'Infraestructura E2E completa con validación de seguridad clínica. **12/12 tests pasando (100%)**',
        contenido
    )
    cambios_realizados.append('Bitácora F4-04: 5/11 tests pasando → 12/12 tests pasando (100%)')

# ============================================================
# FIX 3: Bitácora F4-04 — eliminar sección "Tests pendientes de refinamiento"
# ============================================================
patron = r'\*\*Tests pendientes de refinamiento:\*\*\s*\n(- ⏳[^\n]+\n)+'
if re.search(patron, contenido):
    contenido = re.sub(patron, '', contenido)
    cambios_realizados.append('Bitácora F4-04: sección "Tests pendientes de refinamiento" eliminada (obsoleta)')

# ============================================================
# FIX 4: Eliminar sección "Tareas pendientes acumuladas" (obsoleta)
# ============================================================
patron = r'Tareas pendientes acumuladas[^\n]*:\s*\n\|\s*Tarea\s*\|[^\n]+\n\|\s*-+\|[^\n]+\n(?:\|[^\n]+\n)+'
if re.search(patron, contenido):
    contenido = re.sub(patron, '', contenido)
    cambios_realizados.append('Sección "Tareas pendientes acumuladas" eliminada (todas las tareas ya están DONE)')

# ============================================================
# FIX 5: Agregar F6-02b y F6-02c al tablero global
# ============================================================
nuevas_tareas = """| F6-02b | Agregar job E2E al pipeline CI/CD (hallazgo F6-02) | 6 | P2 | S (0.5-1 d) | F6-02 | TODO |
| F6-02c | Investigar `data-testid` faltantes en bundle de LoginScreen (hallazgo F6-02) | 6 | P3 | XS (<0.5 d) | F6-02 | TODO |
"""

patron_f6_02 = r'(\|\s*F6-02\s*\|[^\n]+DONE[^\n]+\n)'
if re.search(patron_f6_02, contenido) and '| F6-02b |' not in contenido:
    contenido = re.sub(
        patron_f6_02,
        r'\g<1>' + nuevas_tareas,
        contenido,
        count=1
    )
    cambios_realizados.append('Tablero global: F6-02b y F6-02c agregadas como subtareas')

# ============================================================
# FIX 6: Actualizar fecha a 2026-08-16
# ============================================================
patron = r'(\*\*Última actualización:\*\*\s*)[^\n]+'
contenido = re.sub(
    patron,
    r'\g<1>2026-08-16 (F6-02 completada — ROADMAP consistencia verificada, 12/12 tests E2E confirmados con evidencia reproducible)',
    contenido,
    count=1
)
cambios_realizados.append('Fecha de última actualización: 2026-08-16')

# ============================================================
# Escribir archivo corregido
# ============================================================
with open(ARCHIVO, 'w', encoding='utf-8') as f:
    f.write(contenido)

print(f"\n✅ {ARCHIVO} actualizado correctamente")
print(f"\n📋 Cambios realizados ({len(cambios_realizados)}):")
for i, cambio in enumerate(cambios_realizados, 1):
    print(f"   {i}. {cambio}")
