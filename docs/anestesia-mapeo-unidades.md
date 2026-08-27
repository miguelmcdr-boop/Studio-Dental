# Mapeo de Unidades: Vademécum SQL → JS → UI (F7-02)

**Fecha:** 2026-08-27
**Tarea:** F7-02 - Corregir el cruce de unidades vademécum → calculadora de anestesia

## Problema detectado

La tabla `vademecum` en SQL tiene columnas con unidades explícitas, pero el mapeo a JavaScript
confundía valores absolutos (mg) con relativos (mg/kg), y mezclaba dosis adultas con pediátricas.

## Bug en vademecumService.obtenerDosisAnestesia() (ANTES)

El mapeo original tenía 3 problemas críticos:

1. `mgPorKgAdulto` usaba `dosis_max_pediatrica_mg_por_kg` (confundía adulto con pediátrico)
2. `mgPorKgAdultoMax` era un valor ABSOLUTO (mg), NO mg/kg (nombre engañoso)
3. No había `topeAbsolutoAdulto` ni `topeAbsolutoPediatrico` explícitos

## Tabla de mapeo corregido (campo → columna → unidad)

| Campo JS (DESPUÉS) | Columna SQL | Unidad | Tipo |
|--------------------|-------------|--------|------|
| `dosisMaxAdulto_mgPorKg` | (calculado) | mg/kg | Relativo |
| `dosisMaxPediatrico_mgPorKg` | `dosis_max_pediatrica_mg_por_kg` | mg/kg | Relativo |
| `topeAbsolutoAdulto_mg` | `dosis_max_adulto_mg` | mg | Absoluto |
| `topeAbsolutoPediatrico_mg` | (no existe) | mg | Absoluto |
| `contenidoPorUnidad_mg` | `contenido_por_unidad_mg` | mg | Absoluto |
| `volumenPorUnidad_ml` | `volumen_por_unidad_ml` | ml | Absoluto |
| `concentracion_mgPorMl` | `concentracion_mg_por_ml` | mg/ml | Relativo |

## Gap en schema SQL

La tabla `vademecum` NO tiene columnas para:
- `dosis_max_adulto_mg_por_kg` (necesario para calcular dosis adulta por peso)
- `dosis_max_pediatrica_mg` (tope absoluto pediátrico en mg)

Solución temporal (F7-02): `dosisMaxAdulto_mgPorKg` se calcula como
`topeAbsolutoAdulto_mg / 70kg` (peso estándar adulto). Solución futura (F7-04):
agregar columnas faltantes al schema SQL.

## Valores de ejemplo (Lidocaína 2% + Epinefrina)

| Campo | Valor | Unidad | Fuente |
|-------|-------|--------|--------|
| dosisMaxAdulto_mgPorKg | 4.28 | mg/kg | Calculado: 300mg / 70kg |
| dosisMaxPediatrico_mgPorKg | 4.4 | mg/kg | SQL |
| topeAbsolutoAdulto_mg | 300 | mg | SQL |
| topeAbsolutoPediatrico_mg | null | mg | No hay dato |
| contenidoPorUnidad_mg | 36 | mg | SQL |
| volumenPorUnidad_ml | 1.8 | ml | SQL |
| concentracion_mgPorMl | 20 | mg/ml | SQL |

## Referencias

- Schema SQL: supabase/schema-vademecum.sql
- Servicio JS: src/services/vademecumService.js
- Cálculos JS: src/utils/anestesiaCalculations.js
- Tests de integración: src/utils/anestesiaCalculations.integration.test.js
