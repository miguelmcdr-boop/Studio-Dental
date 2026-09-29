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

  it('T3b: archivos-purge elimina certificados cuando sourceType es certificado', () => {
    const ruta = join(ROOT, 'supabase/functions/archivos-purge/index.ts')
    const contenido = readFileSync(ruta, 'utf-8')
    // Debe hacer DELETE de certificados
    expect(contenido).toMatch(/rest\/v1\/certificados/)
    expect(contenido).toMatch(/error_delete_certificado/)
  })

  // ============================================================
  // T4: R2 failure → certificado preservado para retry
  // ============================================================
  it('T4: archivos-purge preserva certificado cuando R2 falla', () => {
    const ruta = join(ROOT, 'supabase/functions/archivos-purge/index.ts')
    const contenido = readFileSync(ruta, 'utf-8')
    // Debe haber reject sin delete cuando R2 falla
    expect(contenido).toMatch(/error_delete_r2/)
    // El DELETE de certificado solo ocurre DESPUÉS del DELETE de archivos_clinicos
    // Si R2 falla, archivos_clinicos no se elimina → certificado tampoco
    const idxR2Fail = contenido.indexOf('error_delete_r2')
    const idxDeleteCert = contenido.indexOf('error_delete_certificado')
    expect(idxR2Fail).toBeLessThan(idxDeleteCert)
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

  it('T7b: source_ids solo se usa internamente (no expone cross-clínica)', () => {
    const ruta = join(ROOT, 'supabase/functions/archivos-purge/index.ts')
    const contenido = readFileSync(ruta, 'utf-8')
    // source_ids se usa SOLO cuando sourceType es certificado
    expect(contenido).toMatch(/sourceType === 'certificado' && sourceIds\[archivoId\]/)
    // El DELETE de certificado usa el certificado_id del mapa
    expect(contenido).toMatch(/const certificadoId = sourceIds\[archivoId\]/)
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
})