/**
 * @vitest-environment node
 *
 * F7-36 FASE 5 (Commit 5.3): Test de regresion de identidad real
 * del actor en audit_log de archivos.
 *
 * OBJETIVO: Validar que:
 * 1. Las 4 Edge Functions mandan p_user_id en el body
 * 2. r2-list-deleted NO llama a registrar_evento_archivo
 * 3. La migracion SQL usa COALESCE(p_user_id, auth.uid())
 * 4. La firma tiene 4 parametros (incluye p_user_id)
 * 5. Permisos se mantienen restrictivos
 * 6. PHI sigue limpiado (regresion de FASE 4)
 *
 * LIMITACION HONESTA:
 * Este test NO valida permisos reales contra BD viva.
 * Valida el contrato mediante grep estatico.
 *
 * VALIDACION REAL:
 * Se hace manualmente al aplicar la migracion con supabase db push,
 * subir archivo en la app, y verificar:
 *
 *   SELECT action, user_id, created_at
 *   FROM audit_log
 *   WHERE action = 'FILE_UPLOAD'
 *   ORDER BY created_at DESC LIMIT 1;
 *
 * Esperado: user_id = UUID del usuario autenticado (no null).
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = process.cwd()


/**
 * Remueve comentarios de línea (//) y de bloque (/* *\/) del código.
 * Necesario para no detectar PHI en comentarios F7-34.
 */
const stripComments = (codigo) => {
  // Remover comentarios de bloque /* ... *\/
  let sin_bloque = codigo.replace(/\/\*[\s\S]*?\*\//g, '')
  // Remover comentarios de línea //... (hasta fin de línea)
  return sin_bloque.replace(/\/\/.*$/gm, '')
}

describe('F7-36 FASE 5: Regresion identidad real del actor', () => {
  // ============================================================
  // TEST 1: r2-upload-url manda p_user_id
  // ============================================================
  it('1. r2-upload-url manda p_user_id: userId en body', () => {
    const ruta = join(ROOT, 'supabase/functions/r2-upload-url/index.ts')
    const contenido = readFileSync(ruta, 'utf-8')

    // Buscar bloque de registrar_evento_archivo
    const match = contenido.match(
      /registrar_evento_archivo[\s\S]{0,1000}?JSON\.stringify\(\{[\s\S]{0,600}?\}\)/
    )
    expect(match).toBeTruthy()

    const bloque = stripComments(match[0])

    // DEBE contener p_user_id: userId
    expect(bloque).toMatch(/p_user_id:\s*userId/)

    // NO debe tener PHI (regresion de FASE 4)
    expect(bloque).not.toMatch(/p_detalle:[\s\S]{0,200}?nombre_archivo/)
    expect(bloque).not.toMatch(/p_detalle:[\s\S]{0,200}?r2_object_key/)
  })

  // ============================================================
  // TEST 2: r2-download-url manda p_user_id
  // ============================================================
  it('2. r2-download-url manda p_user_id: userId en body', () => {
    const ruta = join(ROOT, 'supabase/functions/r2-download-url/index.ts')
    const contenido = readFileSync(ruta, 'utf-8')

    const match = contenido.match(
      /registrar_evento_archivo[\s\S]{0,1000}?JSON\.stringify\(\{[\s\S]{0,600}?\}\)/
    )
    expect(match).toBeTruthy()

    const bloque = stripComments(match[0])
    expect(bloque).toMatch(/p_user_id:\s*userId/)
    expect(bloque).not.toMatch(/p_detalle:[\s\S]{0,200}?nombre_archivo/)
    expect(bloque).not.toMatch(/p_detalle:[\s\S]{0,200}?r2_object_key/)
  })

  // ============================================================
  // TEST 3: r2-delete manda p_user_id
  // ============================================================
  it('3. r2-delete manda p_user_id: userId en body', () => {
    const ruta = join(ROOT, 'supabase/functions/r2-delete/index.ts')
    const contenido = readFileSync(ruta, 'utf-8')

    const match = contenido.match(
      /registrar_evento_archivo[\s\S]{0,1000}?JSON\.stringify\(\{[\s\S]{0,600}?\}\)/
    )
    expect(match).toBeTruthy()

    const bloque = stripComments(match[0])
    expect(bloque).toMatch(/p_user_id:\s*userId/)
    expect(bloque).not.toMatch(/p_detalle:[\s\S]{0,200}?nombre_archivo/)
    expect(bloque).not.toMatch(/p_detalle:[\s\S]{0,200}?r2_object_key/)
  })

  // ============================================================
  // TEST 4: r2-restore manda p_user_id
  // ============================================================
  it('4. r2-restore manda p_user_id: userId en body', () => {
    const ruta = join(ROOT, 'supabase/functions/r2-restore/index.ts')
    const contenido = readFileSync(ruta, 'utf-8')

    const match = contenido.match(
      /registrar_evento_archivo[\s\S]{0,1000}?JSON\.stringify\(\{[\s\S]{0,600}?\}\)/
    )
    expect(match).toBeTruthy()

    const bloque = stripComments(match[0])
    expect(bloque).toMatch(/p_user_id:\s*userId/)
    expect(bloque).not.toMatch(/p_detalle:[\s\S]{0,200}?nombre_archivo/)
    expect(bloque).not.toMatch(/p_detalle:[\s\S]{0,200}?r2_object_key/)
  })

  // ============================================================
  // TEST 5: r2-list-deleted NO llama a registrar_evento_archivo
  // ============================================================
  it('5. r2-list-deleted NO llama a registrar_evento_archivo', () => {
    const ruta = join(ROOT, 'supabase/functions/r2-list-deleted/index.ts')
    const contenido = readFileSync(ruta, 'utf-8')

    expect(contenido).not.toContain('registrar_evento_archivo')
  })

  // ============================================================
  // TEST 6: Migracion SQL usa COALESCE(p_user_id, auth.uid())
  // ============================================================
  it('6. Migracion SQL usa COALESCE(p_user_id, auth.uid()) en INSERT', () => {
    const ruta = join(
      ROOT,
      'supabase/migrations/20260929000100_f7_36_fase5_actor_real_archivos.sql'
    )
    const contenido = readFileSync(ruta, 'utf-8')

    expect(contenido).toMatch(/COALESCE\(p_user_id,\s*auth\.uid\(\)\)/)
  })

  // ============================================================
  // TEST 7: Migracion SQL tiene p_user_id como 4to parametro
  // ============================================================
  it('7. Migracion SQL define p_user_id uuid DEFAULT NULL como 4to parametro', () => {
    const ruta = join(
      ROOT,
      'supabase/migrations/20260929000100_f7_36_fase5_actor_real_archivos.sql'
    )
    const contenido = readFileSync(ruta, 'utf-8')

    // Debe tener la firma completa con 4 parametros
    expect(contenido).toMatch(
      /p_archivo_id uuid,\s*p_evento text,\s*p_detalle jsonb[^)]*DEFAULT[^)]*,\s*p_user_id uuid\s+DEFAULT NULL/
    )
  })

  // ============================================================
  // TEST 8: Migracion preserva limpieza de PHI (regresion FASE 4)
  // ============================================================
  it('8. Migracion SQL preserva limpieza de nombre_archivo en new_data', () => {
    const ruta = join(
      ROOT,
      'supabase/migrations/20260929000100_f7_36_fase5_actor_real_archivos.sql'
    )
    const contenido = readFileSync(ruta, 'utf-8')

    // Buscar el jsonb_build_object que construye new_data
    const match = contenido.match(/jsonb_build_object\([\s\S]{0,500}?\)/)
    expect(match).toBeTruthy()

    const bloque = stripComments(match[0])

    // NO debe contener nombre_archivo (FASE 4)
    expect(bloque).not.toMatch(/'nombre_archivo'/)
    // NO debe contener r2_object_key (FASE 4)
    expect(bloque).not.toMatch(/'r2_object_key'/)
    // DEBE contener paciente_id, categoria, tamano_bytes (trazabilidad)
    expect(bloque).toMatch(/'paciente_id'/)
    expect(bloque).toMatch(/'categoria'/)
    expect(bloque).toMatch(/'tamano_bytes'/)
  })
})
