/**
 * @vitest-environment node
 *
 * F7-36 FASE 6 (Commit 6.3): Tests de regresion de fail-safe en
 * pacientes-purge y hardening en registrar_evento_purge.
 *
 * OBJETIVO: Validar estaticamente que:
 * 1. pacientes-purge tiene contador archivosFallidos
 * 2. pacientes-purge verifica archivosFallidos antes del DELETE
 * 3. pacientes-purge usa razon r2_parcial_X_de_Y_fallidos
 * 4. pacientes-purge hace continue si archivosFallidos > 0
 * 5. Migracion SQL tiene SET search_path = '' en registrar_evento_purge
 * 6. Migracion SQL tiene REVOKE FROM authenticated (alineado con FASE 2)
 * 7. Migracion SQL tiene GRANT EXECUTE TO service_role
 * 8. Deno tests T11 y T12 existen (casos D y E del brief)
 *
 * LIMITACION HONESTA:
 * Estos tests son estaticos (grep-based). Los tests de comportamiento
 * real estan en Deno (supabase/functions/pacientes-purge/index.test.ts
 * T11 y T12) y se ejecutan con deno test.
 *
 * VALIDACION REAL:
 * Despues de deploy con supabase functions deploy pacientes-purge,
 * probar manualmente:
 * 1. Crear paciente con deleted_at de 2010 + 3 archivos R2
 * 2. Provocar fallo de R2 (mock o fallo real)
 * 3. Confirmar que paciente NO se elimina
 * 4. Confirmar que audit_log NO registra ADMIN_PURGE_PACIENTES
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = process.cwd()

describe('F7-36 FASE 6: Regresion fail-safe en purge', () => {
  // ============================================================
  // TEST 1: pacientes-purge tiene contador archivosFallidos
  // ============================================================
  it('1. pacientes-purge declara contador archivosFallidos', () => {
    const ruta = join(ROOT, 'supabase/functions/pacientes-purge/index.ts')
    const contenido = readFileSync(ruta, 'utf-8')
    expect(contenido).toMatch(/let\s+archivosFallidos\s*=\s*0/)
  })

  // ============================================================
  // TEST 2: pacientes-purge verifica archivosFallidos antes del DELETE
  // ============================================================
  it('2. pacientes-purge verifica archivosFallidos antes de DELETE de paciente', () => {
    const ruta = join(ROOT, 'supabase/functions/pacientes-purge/index.ts')
    const contenido = readFileSync(ruta, 'utf-8')
    // El fail-safe debe aparecer ANTES del DELETE del paciente
    const idxFailSafe = contenido.indexOf('if (archivosFallidos > 0)')
    const idxDelete = contenido.indexOf('// 7. DELETE del paciente')
    expect(idxFailSafe).toBeGreaterThan(-1)
    expect(idxDelete).toBeGreaterThan(-1)
    expect(idxFailSafe).toBeLessThan(idxDelete)
  })

  // ============================================================
  // TEST 3: pacientes-purge usa razon r2_parcial_X_de_Y_fallidos
  // ============================================================
  it('3. pacientes-purge usa razon r2_parcial_X_de_Y_fallidos', () => {
    const ruta = join(ROOT, 'supabase/functions/pacientes-purge/index.ts')
    const contenido = readFileSync(ruta, 'utf-8')
    expect(contenido).toMatch(/r2_parcial_\$\{archivosFallidos\}_de_\$\{totalArchivos\}_fallidos/)
  })

  // ============================================================
  // TEST 4: pacientes-purge hace continue si archivosFallidos > 0
  // ============================================================
  it('4. pacientes-purge hace continue si archivosFallidos > 0 (no ejecuta DELETE)', () => {
    const ruta = join(ROOT, 'supabase/functions/pacientes-purge/index.ts')
    const contenido = readFileSync(ruta, 'utf-8')
    
    // Encontrar posiciones clave
    const idxCondicion = contenido.indexOf('if (archivosFallidos > 0)')
    const idxContinue = contenido.indexOf('continue; // NO hacer DELETE del paciente')
    const idxDelete = contenido.indexOf('// 7. DELETE del paciente')
    
    // Todas deben existir
    expect(idxCondicion).toBeGreaterThan(-1)
    expect(idxContinue).toBeGreaterThan(-1)
    expect(idxDelete).toBeGreaterThan(-1)
    
    // Orden correcto: condicion -> continue -> DELETE
    expect(idxContinue).toBeGreaterThan(idxCondicion)
    expect(idxContinue).toBeLessThan(idxDelete)
    
    // El continue debe estar dentro de las 200 lineas despues de la condicion
    const bloque = contenido.substring(idxCondicion, idxCondicion + 500)
    expect(bloque).toContain('continue')
    expect(bloque).toContain('NO hacer DELETE')
  })

  // ============================================================
  // TEST 5: Migracion SQL tiene SET search_path = ''
  // ============================================================
  it('5. Migracion SQL de hardening registrar_evento_purge tiene SET search_path = \'\'', () => {
    const ruta = join(
      ROOT,
      'supabase/migrations/20260929000200_f7_36_fase6_hardening_registrar_evento_purge.sql'
    )
    const contenido = readFileSync(ruta, 'utf-8')
    expect(contenido).toMatch(/SET search_path = ''/)
  })

  // ============================================================
  // TEST 6: Migracion SQL tiene REVOKE FROM authenticated
  // ============================================================
  it('6. Migracion SQL tiene REVOKE EXECUTE FROM authenticated', () => {
    const ruta = join(
      ROOT,
      'supabase/migrations/20260929000200_f7_36_fase6_hardening_registrar_evento_purge.sql'
    )
    const contenido = readFileSync(ruta, 'utf-8')
    expect(contenido).toMatch(/REVOKE EXECUTE ON FUNCTION public\.registrar_evento_purge.*FROM authenticated/)
  })

  // ============================================================
  // TEST 7: Migracion SQL tiene GRANT EXECUTE TO service_role
  // ============================================================
  it('7. Migracion SQL tiene GRANT EXECUTE TO service_role', () => {
    const ruta = join(
      ROOT,
      'supabase/migrations/20260929000200_f7_36_fase6_hardening_registrar_evento_purge.sql'
    )
    const contenido = readFileSync(ruta, 'utf-8')
    expect(contenido).toMatch(/GRANT EXECUTE ON FUNCTION public\.registrar_evento_purge.*TO service_role/)
  })

  // ============================================================
  // TEST 8: Deno test T11 existe (caso D: archivo fail)
  // ============================================================
  it('8. Deno test T11 existe (caso D: archivo R2 falla, paciente NO eliminado)', () => {
    const ruta = join(ROOT, 'supabase/functions/pacientes-purge/index.test.ts')
    const contenido = readFileSync(ruta, 'utf-8')
    expect(contenido).toMatch(/Deno\.test\("T11:/)
    expect(contenido).toMatch(/r2_parcial_1_de_1_fallidos/)
  })

  // ============================================================
  // TEST 9: Deno test T12 existe (caso E: R2 parcial)
  // ============================================================
  it('9. Deno test T12 existe (caso E: R2 parcial, BD consistente)', () => {
    const ruta = join(ROOT, 'supabase/functions/pacientes-purge/index.test.ts')
    const contenido = readFileSync(ruta, 'utf-8')
    expect(contenido).toMatch(/Deno\.test\("T12:/)
    expect(contenido).toMatch(/r2_parcial_1_de_3_fallidos/)
  })

  // ============================================================
  // TEST 10: Deno test T7 existe en archivos-purge (caso D)
  // ============================================================
  it('10. Deno test T7 existe en archivos-purge (caso D: R2 falla, archivo NO eliminado)', () => {
    const ruta = join(ROOT, 'supabase/functions/archivos-purge/index.test.ts')
    const contenido = readFileSync(ruta, 'utf-8')
    expect(contenido).toMatch(/Deno\.test\("T7:/)
    expect(contenido).toMatch(/error_delete_r2/)
  })

  // ============================================================
  // TEST 11: Deno test T8 existe en archivos-purge (caso E)
  // ============================================================
  it('11. Deno test T8 existe en archivos-purge (caso E: mixto, solo exitos purgados)', () => {
    const ruta = join(ROOT, 'supabase/functions/archivos-purge/index.test.ts')
    const contenido = readFileSync(ruta, 'utf-8')
    expect(contenido).toMatch(/Deno\.test\("T8:/)
  })
})
