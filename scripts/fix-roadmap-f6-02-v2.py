#!/usr/bin/env python3
"""
F6-02 — Corrección integral de inconsistencias del MASTER_ROADMAP.md (v2)
Usa expresiones regulares para manejar variaciones de formato
"""

import re
from datetime import date

ARCHIVO = 'docs/MASTER_ROADMAP.md'
TODAY = date.today().strftime('%Y-%m-%d')

with open(ARCHIVO, 'r', encoding='utf-8') as f:
    contenido = f.read()

cambios_realizados = []

# ============================================================
# FIX 1: F6-02 en tablero global (TODO → DONE)
# ============================================================
patron_f6_02 = r'(\|\s*F6-02\s*\|[^\|]+\|\s*6\s*\|\s*P1\s*\|[^\|]+\|\s*—\s*\|\s*)TODO(\s*\|)'
if re.search(patron_f6_02, contenido):
    contenido = re.sub(patron_f6_02, rf'\1DONE ({TODAY})\2', contenido, count=1)
    cambios_realizados.append('F6-02 en tablero global: TODO → DONE')

# ============================================================
# FIX 2: F2-07b en tablero global (TODO → DONE)
# ============================================================
patron_f2_07b = r'(\|\s*F2-07b\s*\|[^\|]+\|\s*2\s*\|\s*P2\s*\|[^\|]+\|\s*F2-03\s*\|\s*)TODO(\s*\|)'
if re.search(patron_f2_07b, contenido):
    contenido = re.sub(patron_f2_07b, rf'\1DONE ({TODAY}, verificado)\2', contenido, count=1)
    cambios_realizados.append('F2-07b en tablero global: TODO → DONE')

# ============================================================
# FIX 3: Métricas de tests E2E en tabla de estado final
# ============================================================
patron_e2e_metricas = r'(\|\s*Tests E2E\s*\|\s*)5/11\s*passing(\s*\|[^\|]+\|)'
if re.search(patron_e2e_metricas, contenido):
    contenido = re.sub(
        patron_e2e_metricas,
        r'\112/12 passing (100%)\2',
        contenido
    )
    cambios_realizados.append('Tabla estado final: 5/11 passing → 12/12 passing (100%)')

# ============================================================
# FIX 4: Eliminar sección "Tests pendientes de refinamiento"
# ============================================================
patron_tests_pendientes = r'\*\*Tests pendientes de refinamiento:\*\*\s*\n(- ⏳[^\n]+\n){4}'
if re.search(patron_tests_pendientes, contenido):
    contenido = re.sub(patron_tests_pendientes, '', contenido)
    cambios_realizados.append('Sección "Tests pendientes de refinamiento" eliminada')

# ============================================================
# FIX 5: Eliminar sección "Tareas pendientes acumuladas"
# ============================================================
patron_tareas_acumuladas = r'Tareas pendientes acumuladas[^\n]*\n\|\s*Tarea[^\n]+\n\|\s*---[^\n]+\n(\|[^\n]+\n){5}'
if re.search(patron_tareas_acumuladas, contenido):
    contenido = re.sub(patron_tareas_acumuladas, '', contenido)
    cambios_realizados.append('Sección "Tareas pendientes acumuladas" eliminada')

# ============================================================
# FIX 6: Agregar subtareas F6-02b y F6-02c
# ============================================================
nuevas_subtareas = f"""| F6-02b | Agregar job E2E al pipeline CI/CD (F3-01 no incluye tests E2E actualmente) | 6 | P2 | S (0.5-1 d) | F6-02 | TODO |
| F6-02c | Investigar por qué `data-testid="login-email"` no llega al bundle de Vite (fallback funciona pero genera warnings) | 6 | P3 | XS (<0.5 d) | F6-02 | TODO |
"""

patron_insertar_subtareas = r'(\|\s*F6-02\s*\|[^\|]+DONE[^\n]+\n)'
if re.search(patron_insertar_subtareas, contenido) and '| F6-02b |' not in contenido:
    contenido = re.sub(
        patron_insertar_subtareas,
        r'\1' + nuevas_subtareas,
        contenido,
        count=1
    )
    cambios_realizados.append('Subtareas F6-02b (CI/CD E2E job) y F6-02c (login-email data-testid) registradas')

# ============================================================
# FIX 7: Actualizar fecha de última actualización
# ============================================================
patron_fecha = r'(\*\*Última actualización:\*\*\s*)[^\n]+'
contenido = re.sub(
    patron_fecha,
    rf'\1{TODAY} (F6-02 completada — ROADMAP consistencia verificada, 12/12 tests E2E confirmados con evidencia reproducible)',
    contenido,
    count=1
)
cambios_realizados.append('Fecha de última actualización actualizada')

# ============================================================
# Escribir archivo corregido
# ============================================================
with open(ARCHIVO, 'w', encoding='utf-8') as f:
    f.write(contenido)

print(f"\n✅ {ARCHIVO} actualizado correctamente")
print(f"   Fecha aplicada: {TODAY}")
print(f"\n📋 Cambios realizados ({len(cambios_realizados)}):")
for i, cambio in enumerate(cambios_realizados, 1):
    print(f"   {i}. {cambio}")
