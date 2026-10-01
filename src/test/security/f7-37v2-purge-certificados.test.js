import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

const ROOT = process.cwd()

describe('F7-37 v2: Purge de certificados con eventual consistency', () => {
  // ============================================================
  // T1: purgar_certificados_expirados marca purga_pendiente=TRUE
  // ============================================================
  it('T1: Migración 000700 agrega columnas purga_pendiente y purga_iniciada_at', () => {
    const ruta = join(ROOT, 'supabase/migrations/20260929000700_f7_37v2_purge_certificados_fix.sql')
    const contenido = readFileSync(ruta, 'utf-8')
    expect(contenido).toMatch(/ADD COLUMN.*purga_pendiente/)
    expect(contenido).toMatch(/ADD COLUMN.*purga_iniciada_at/)
  })

  it('T1b: Migración 000700 crea índice parcial', () => {
    const ruta = join(ROOT, 'supabase/migrations/20260929000700_f7_37v2_purge_certificados_fix.sql')
    const contenido = readFileSync(ruta, 'utf-8')
    expect(contenido).toMatch(/CREATE INDEX.*certificados_purga_pendiente_idx/)
    expect(contenido).toMatch(/WHERE purga_pendiente = TRUE/)
  })

  // ============================================================
  // T2: purgar_certificados_expirados NO hace DELETE directo
  // ============================================================
  it('T2: purgar_certificados_expirados actualiza purga_pendiente en lugar de DELETE', () => {
    const ruta = join(ROOT, 'supabase/migrations/20260929000700_f7_37v2_purge_certificados_fix.sql')
    const contenido = readFileSync(ruta, 'utf-8')
    // Debe tener UPDATE de purga_pendiente
    expect(contenido).toMatch(/UPDATE public.certificados[\s\S]*SET purga_pendiente = TRUE/)
    // Debe encolar HTTP a archivos-purge con source_type=certificado
    expect(contenido).toMatch(/source_type.*certificado/)
    expect(contenido).toMatch(/source_ids/)
  })

  // ============================================================
  // T3: archivos-purge maneja source_type === 'certificado'
  // ============================================================
  it('T3: archivos-purge detecta source_type === certificado', () => {
    const ruta = join(ROOT, 'supabase/functions/archivos-purge/index.ts')
    const contenido = readFileSync(ruta, 'utf-8')
    expect(contenido).toMatch(/source_type === 'certificado'/)
    expect(contenido).toMatch(/sourceType === 'certificado'/)
  })

  it('T3b: archivos-purge usa RPC atómica para eliminar certificado (v3.2)', () => {
    const ruta = join(ROOT, 'supabase/functions/archivos-purge/index.ts')
    const contenido = readFileSync(ruta, 'utf-8')
    // F7-37 v3.2: Uso de RPC atómica en lugar de DELETE REST separados
    expect(contenido).toMatch(/\/rest\/v1\/rpc\/purgar_archivo_y_certificado/)
    expect(contenido).toMatch(/p_certificado_id/)
  })

  // ============================================================
  // T4: R2 failure → certificado preservado para retry
  // ============================================================
  it('T4: archivos-purge preserva certificado cuando R2 falla (v3.2)', () => {
    const ruta = join(ROOT, 'supabase/functions/archivos-purge/index.ts')
    const contenido = readFileSync(ruta, 'utf-8')
    // F7-37 v3.2: R2 failure → RPC no se llama → certificado preservado
    expect(contenido).toMatch(/error_delete_r2/)
    // El R2 check debe ocurrir ANTES de la URL de llamada a RPC atómica
    // Buscamos la URL completa (con /rest/v1/rpc/) que aparece después del error_delete_r2
    const idxR2Fail = contenido.indexOf('error_delete_r2')
    const idxRPC = contenido.indexOf('/rest/v1/rpc/purgar_archivo_y_certificado')
    expect(idxR2Fail).toBeGreaterThan(-1)
    expect(idxRPC).toBeGreaterThan(-1)
    expect(idxR2Fail).toBeLessThan(idxRPC)
  })

  // ============================================================
  // T5: Idempotencia y duplicate retry
  // ============================================================
  it('T5: purgar_certificados_expirados es idempotente (no duplica purga_pendiente)', () => {
    const ruta = join(ROOT, 'supabase/migrations/20260929000700_f7_37v2_purge_certificados_fix.sql')
    const contenido = readFileSync(ruta, 'utf-8')
    // Debe filtrar por purga_pendiente = FALSE para no duplicar
    expect(contenido).toMatch(/AND purga_pendiente = FALSE/)
  })

  it('T5b: archivos-purge trata 404 como idempotente', () => {
    const ruta = join(ROOT, 'supabase/functions/archivos-purge/index.ts')
    const contenido = readFileSync(ruta, 'utf-8')
    // Ya existía: res.ok || res.status === 404
    expect(contenido).toMatch(/res\.ok \|\| res\.status === 404/)
  })

  // ============================================================
  // T6: cleanup_stale_purges recupera certificaciones atascados
  // ============================================================
  it('T6: cleanup_stale_purges existe y resetea después de 24h', () => {
    const ruta = join(ROOT, 'supabase/migrations/20260929000700_f7_37v2_purge_certificados_fix.sql')
    const contenido = readFileSync(ruta, 'utf-8')
    expect(contenido).toMatch(/CREATE OR REPLACE FUNCTION.*cleanup_stale_purges/)
    expect(contenido).toMatch(/24 hours/)
    expect(contenido).toMatch(/SET purga_pendiente = FALSE/)
  })

  // ============================================================
  // T7: Multi-tenant isolation preservado
  // ============================================================
  it('T7: archivos-purge preserva validación de clinica_id por archivo', () => {
    const ruta = join(ROOT, 'supabase/functions/archivos-purge/index.ts')
    const contenido = readFileSync(ruta, 'utf-8')
    // Debe validar clinica_id del archivo en cada iteración
    expect(contenido).toMatch(/no_pertenece_clinica/)
    expect(contenido).toMatch(/archivo\.clinica_id/)
  })

  it('T7b: source_ids es referencia no confiable, validada server-side (v3.1)', () => {
    const ruta = join(ROOT, 'supabase/functions/archivos-purge/index.ts')
    const contenido = readFileSync(ruta, 'utf-8')
    // F7-37 v4 H-09: validación fail-closed de source_ids
    expect(contenido).toMatch(/if \(sourceType === 'certificado'\)/)
    // Pero ANTES de usarlo, se valida server-side con validarCertificadoParaPurge
    expect(contenido).toMatch(/certificadoId = sourceIds\[archivoId\]/)
    expect(contenido).toMatch(/validarCertificadoParaPurge\(/)
    // Y si la validación falla, NO se hace DELETE
    expect(contenido).toMatch(/if \(!validacion\.valido\)/)
    expect(contenido).toMatch(/certificado_invalido/)
  })

  // ============================================================
  // T8: Permisos de cleanup_stale_purges
  // ============================================================
  it('T8: cleanup_stale_purges tiene permisos restrictivos', () => {
    const ruta = join(ROOT, 'supabase/migrations/20260929000700_f7_37v2_purge_certificados_fix.sql')
    const contenido = readFileSync(ruta, 'utf-8')
    // Debe hacer REVOKE de PUBLIC, anon, authenticated, service_role
    expect(contenido).toMatch(/REVOKE ALL ON FUNCTION.*cleanup_stale_purges.*FROM PUBLIC/)
    expect(contenido).toMatch(/REVOKE ALL ON FUNCTION.*cleanup_stale_purges.*FROM anon/)
    expect(contenido).toMatch(/REVOKE ALL ON FUNCTION.*cleanup_stale_purges.*FROM authenticated/)
    expect(contenido).toMatch(/REVOKE ALL ON FUNCTION.*cleanup_stale_purges.*FROM service_role/)
  })

  // ============================================================
  // T9: pg_cron condicional (portabilidad entre entornos)
  // ============================================================
  it('T9: pg_cron schedule es condicional (portable entre entornos)', () => {
    const ruta = join(ROOT, 'supabase/migrations/20260929000700_f7_37v2_purge_certificados_fix.sql')
    const contenido = readFileSync(ruta, 'utf-8')
    // Debe verificar si cron schema existe antes de programar
    expect(contenido).toMatch(/information_schema\.schemata.*schema_name = 'cron'/)
    expect(contenido).toMatch(/pg_cron no está disponible/)
  })

  // ============================================================
  // T10: Validaciones fail-closed
  // ============================================================
  it('T10: Migración 000700 incluye validaciones fail-closed', () => {
    const ruta = join(ROOT, 'supabase/migrations/20260929000700_f7_37v2_purge_certificados_fix.sql')
    const contenido = readFileSync(ruta, 'utf-8')
    // Debe verificar que columnas y funciones existan
    expect(contenido).toMatch(/RAISE EXCEPTION.*columna purga_pendiente no existe/)
    expect(contenido).toMatch(/RAISE EXCEPTION.*cleanup_stale_purges no existe/)
  })

  // ============================================================
  // F7-37 v3: Tests H-08 (cross-tenant validation)
  // ============================================================

  it('H-08-1: archivos-purge incluye función validarCertificadoParaPurge', () => {
    const ruta = join(ROOT, 'supabase/functions/archivos-purge/index.ts')
    const contenido = readFileSync(ruta, 'utf-8')
    expect(contenido).toMatch(/async function validarCertificadoParaPurge/)
    expect(contenido).toMatch(/certificado_cross_tenant/)
    expect(contenido).toMatch(/certificado_inexistente/)
    expect(contenido).toMatch(/certificado_no_referencia_archivo/)
  })

  it('H-08-2: validación de clinica_id antes de DELETE certificado', () => {
    const ruta = join(ROOT, 'supabase/functions/archivos-purge/index.ts')
    const contenido = readFileSync(ruta, 'utf-8')
    // Debe comparar clinica_id del certificado con clinica_id del archivo
    expect(contenido).toMatch(/cert\.clinica_id !== clinicaId/)
  })

  it('H-08-3: validación de relación r2ArchivoId antes de DELETE', () => {
    const ruta = join(ROOT, 'supabase/functions/archivos-purge/index.ts')
    const contenido = readFileSync(ruta, 'utf-8')
    // Debe validar que certificado.datos.r2ArchivoId === archivoId
    expect(contenido).toMatch(/r2ArchivoId !== archivoId/)
  })

  it('H-08-4: validación ANTES de CUALQUIER DELETE (v3.1)', () => {
    const ruta = join(ROOT, 'supabase/functions/archivos-purge/index.ts')
    const contenido = readFileSync(ruta, 'utf-8')
    // F7-37 v3.1: validarCertificadoParaPurge debe aparecer ANTES de eliminarDeR2
    // dentro del mismo loop (bloque FASE A antes de FASE B)
    const idxValidacion = contenido.indexOf('FASE A')
    const idxEliminarR2 = contenido.indexOf('FASE B')
    expect(idxValidacion).toBeGreaterThan(-1)
    expect(idxEliminarR2).toBeGreaterThan(-1)
    expect(idxValidacion).toBeLessThan(idxEliminarR2)
    // Además, validarCertificadoParaPurge debe estar en FASE A
    const bloqueFaseA = contenido.substring(idxValidacion, idxEliminarR2)
    expect(bloqueFaseA).toMatch(/validarCertificadoParaPurge/)
    expect(bloqueFaseA).toMatch(/certificado_invalido/)
    // Y eliminarDeR2 debe estar en FASE B
    const bloqueFaseB = contenido.substring(idxEliminarR2)
    expect(bloqueFaseB).toMatch(/eliminarDeR2/)
  })

  it('H-08-5: Deno tests incluyen casos H-08 (T9-T18)', () => {
    const ruta = join(ROOT, 'supabase/functions/archivos-purge/index.test.ts')
    const contenido = readFileSync(ruta, 'utf-8')
    expect(contenido).toMatch(/T9: H-08 mismo tenant/)
    expect(contenido).toMatch(/T10: H-08 cross-tenant/)
    expect(contenido).toMatch(/T11: H-08 certificado inexistente/)
    expect(contenido).toMatch(/T12: H-08 r2ArchivoId incorrecto/)
    expect(contenido).toMatch(/T13: H-08 R2 OK/)
    expect(contenido).toMatch(/T14: H-08 R2 404/)
    expect(contenido).toMatch(/T15: H-08 R2 failure/)
    expect(contenido).toMatch(/T16: H-08 retry/)
    expect(contenido).toMatch(/T17: H-08 duplicate retry/)
    expect(contenido).toMatch(/T18: H-08 DB failure/)
  })

  it('H-08-6: testUtils.ts soporta mocks de certificados', () => {
    const ruta = join(ROOT, 'supabase/functions/_shared/testUtils.ts')
    const contenido = readFileSync(ruta, 'utf-8')
    expect(contenido).toMatch(/certificados\?:/)
    expect(contenido).toMatch(/certificadoDeleteOk\?:/)
    expect(contenido).toMatch(/\/rest\/v1\/certificados/)
  })

  // ============================================================
  // F7-37 v3.1: Tests conductuales (orden de operaciones)
  // ============================================================

  it('H-08-7: Deno tests T19-T21 verifican CERO deletes en casos inválidos', () => {
    const ruta = join(ROOT, 'supabase/functions/archivos-purge/index.test.ts')
    const contenido = readFileSync(ruta, 'utf-8')
    // T19-T21 deben verificar que operationCounters.delete_r2 === 0
    expect(contenido).toMatch(/T19: H-08 residual cross-tenant → CERO deletes/)
    expect(contenido).toMatch(/T20: H-08 residual cert inexistente → CERO deletes/)
    expect(contenido).toMatch(/T21: H-08 residual r2ArchivoId incorrecto → CERO deletes/)
    // Deben verificar contadores
    expect(contenido).toMatch(/operationCounters\.delete_r2, 0/)
    expect(contenido).toMatch(/operationCounters\.delete_archivo, 0/)
    expect(contenido).toMatch(/operationCounters\.delete_cert, 0/)
  })

  it('H-08-8: Deno test T22 verifica 3 deletes en caso válido', () => {
    const ruta = join(ROOT, 'supabase/functions/archivos-purge/index.test.ts')
    const contenido = readFileSync(ruta, 'utf-8')
    expect(contenido).toMatch(/T22: H-08 residual mismo tenant \+ relación correcta → 3 deletes/)
    expect(contenido).toMatch(/operationCounters\.delete_r2, 1/)
    expect(contenido).toMatch(/operationCounters\.delete_archivo, 1/)
    expect(contenido).toMatch(/operationCounters\.delete_cert, 1/)
  })

  it('H-08-9: testUtils.ts soporta operationCounters para tests conductuales', () => {
    const ruta = join(ROOT, 'supabase/functions/_shared/testUtils.ts')
    const contenido = readFileSync(ruta, 'utf-8')
    expect(contenido).toMatch(/operationCounters\?:/)
    expect(contenido).toMatch(/validate_cert\?: number/)
    expect(contenido).toMatch(/delete_r2\?: number/)
    expect(contenido).toMatch(/delete_archivo\?: number/)
    expect(contenido).toMatch(/delete_cert\?: number/)
  })

  // ============================================================
  // F7-37 v3.2: Tests de RPC atómica y manejo robusto
  // ============================================================

  it('H-08-10: existe RPC purgar_archivo_y_certificado en migración 000800', () => {
    const ruta = join(ROOT, 'supabase/migrations/20260929000800_f7_37v3_2_atomic_db_purge.sql')
    const contenido = readFileSync(ruta, 'utf-8')
    expect(contenido).toMatch(/CREATE OR REPLACE FUNCTION public\.purgar_archivo_y_certificado/)
    expect(contenido).toMatch(/SECURITY DEFINER/)
    expect(contenido).toMatch(/search_path = ''/)
  })

  it('H-08-11: RPC tiene permisos restrictivos (solo service_role)', () => {
    const ruta = join(ROOT, 'supabase/migrations/20260929000800_f7_37v3_2_atomic_db_purge.sql')
    const contenido = readFileSync(ruta, 'utf-8')
    expect(contenido).toMatch(/REVOKE ALL ON FUNCTION public\.purgar_archivo_y_certificado/)
    expect(contenido).toMatch(/REVOKE EXECUTE.*FROM anon/)
    expect(contenido).toMatch(/REVOKE EXECUTE.*FROM authenticated/)
    expect(contenido).toMatch(/GRANT EXECUTE.*TO service_role/)
  })

  it('H-08-12: cron maneja UUID inválido con EXCEPTION por iteración', () => {
    const ruta = join(ROOT, 'supabase/migrations/20260929000800_f7_37v3_2_atomic_db_purge.sql')
    const contenido = readFileSync(ruta, 'utf-8')
    expect(contenido).toMatch(/BEGIN[\s\S]*?EXCEPTION[\s\S]*?invalid_text_representation/)
    expect(contenido).toMatch(/CONTINUE/)
  })

  it('H-08-13: Deno tests T28-T34 verifican atomicidad, UUID, política', () => {
    const ruta = join(ROOT, 'supabase/functions/archivos-purge/index.test.ts')
    const contenido = readFileSync(ruta, 'utf-8')
    expect(contenido).toMatch(/T28: v3\.2 DB transaction failure \+ retry/)
    expect(contenido).toMatch(/T29: v3\.2 Atomicidad PostgreSQL/)
    expect(contenido).toMatch(/T30: v3\.2 UUID inválido en cron/)
    expect(contenido).toMatch(/T31: v3\.2 UUID NULL/)
    expect(contenido).toMatch(/T32: v3\.2 Política admin \+ dentista/)
    expect(contenido).toMatch(/T33: v3\.2 Retry con archivo DB inexistente/)
    expect(contenido).toMatch(/T34: v3\.2 Idempotencia/)
  })

  it('H-08-14: archivos-purge NO hace DELETE REST de archivos/certificados en v3.2', () => {
    const ruta = join(ROOT, 'supabase/functions/archivos-purge/index.ts')
    const contenido = readFileSync(ruta, 'utf-8')
    // No debe haber DELETE REST a archivos_clinicos ni certificados
    expect(contenido).not.toMatch(/\/rest\/v1\/archivos_clinicos\?id=eq/)
    expect(contenido).not.toMatch(/\/rest\/v1\/certificados\?id=eq.*DELETE/)
    // Sí debe haber RPC atómica
    expect(contenido).toMatch(/\/rest\/v1\/rpc\/purgar_archivo_y_certificado/)
  })

  it('H-08-15: testUtils.ts soporta mock de RPC atómica', () => {
    const ruta = join(ROOT, 'supabase/functions/_shared/testUtils.ts')
    const contenido = readFileSync(ruta, 'utf-8')
    expect(contenido).toMatch(/\/rest\/v1\/rpc\/purgar_archivo_y_certificado/)
    expect(contenido).toMatch(/rpcOk\?: boolean/)
    expect(contenido).toMatch(/rpcRazon\?: string/)
  })
})
