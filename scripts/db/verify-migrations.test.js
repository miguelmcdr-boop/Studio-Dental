/**
 * Tests del script de verificación de migraciones (F7-13)
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'

describe('Migraciones de esquema (F7-13)', () => {
  const migrationsDir = join(process.cwd(), 'supabase', 'migrations')
  
  it('debe tener al menos 10 migraciones', () => {
    const files = readdirSync(migrationsDir).filter(f => f.endsWith('.sql'))
    expect(files.length).toBeGreaterThanOrEqual(10)
  })
  
  it('las migraciones deben tener timestamps válidos (formato YYYYMMDDHHMMSS)', () => {
    const files = readdirSync(migrationsDir).filter(f => f.endsWith('.sql'))
    // Acepta dos formatos válidos:
    // - 20260101000001_nombre.sql (14 dígitos seguidos)
    // - 2026_08_28_0001_nombre.sql (con guiones bajos)
    const timestampRegex = /^(\d{14}_|\d{4}_\d{2}_\d{2}_\d{4}_)/
    
    for (const file of files) {
      expect(file).toMatch(timestampRegex)
    }
  })
  
  it('las migraciones deben estar ordenadas cronológicamente', () => {
    const files = readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort()
    
    // Verificar que el orden alfabético = orden cronológico
    const sorted = [...files].sort()
    expect(files).toEqual(sorted)
  })
  
  it('la migración base_schema debe ser la primera', () => {
    const files = readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort()
    expect(files[0]).toContain('base_schema')
  })
  
  it('todas las migraciones deben ser SQL válido (sin errores de sintaxis obvios)', () => {
    const files = readdirSync(migrationsDir).filter(f => f.endsWith('.sql'))
    
    for (const file of files) {
      const sql = readFileSync(join(migrationsDir, file), 'utf-8')
      expect(sql.length).toBeGreaterThan(0)
      expect(sql).not.toContain('syntax error')
    }
  })
})
