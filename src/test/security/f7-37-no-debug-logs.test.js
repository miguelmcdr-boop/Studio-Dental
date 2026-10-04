/**
 * F7-37: Regresión de debug logs peligrosos
 * 
 * Verifica que:
 * - No hay console.log con [TRACE-*] en código de producción
 * - No hay console.log con userId en Edge Functions
 * - No hay console.log con PHI real (paciente_id, nombre_paciente, etc.)
 * 
 * Nota: Los logs de observabilidad legítimos (como "[pacientes-purge] Error...")
 * son permitidos porque solo contienen nombres de módulos, no datos clínicos.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();

// Helper: contar ocurrencias de patrón excluyendo comentarios SQL (--)
const contarEnCodigo = (contenido, patron) => {
  const lineas = contenido.split('\n');
  let total = 0;
  
  for (const linea of lineas) {
    const lineaTrimmed = linea.trim();
    // Excluir líneas que son comentarios SQL
    if (lineaTrimmed.startsWith('--')) continue;
    
    const matches = linea.match(patron);
    if (matches) {
      total += matches.length;
    }
  }
  
  return total;
};

describe('F7-37: No debug logs peligrosos', () => {
  describe('Frontend: no TRACE logs', () => {
    const archivosFrontend = [
      'src/domains/clinical/patient/components/ModalPapeleraCertificados.tsx',
      'src/domains/clinical/patient/components/CertificadosSection.tsx',
      'src/domains/clinical/patient/services/certificadosPDFService.ts',
    ];

    archivosFrontend.forEach((archivo) => {
      it(`${archivo} no contiene [TRACE-*]`, () => {
        const contenido = readFileSync(join(ROOT, archivo), 'utf-8');
        expect(contenido).not.toContain('[TRACE-');
      });
    });
  });

  describe('Edge Functions: no debug logs con userId', () => {
    const archivosEdge = [
      'supabase/functions/archivos-purge/index.ts',
      'supabase/functions/r2-upload-url/index.ts',
      'supabase/functions/r2-download-url/index.ts',
      'supabase/functions/r2-delete/index.ts',
      'supabase/functions/r2-restore/index.ts',
      'supabase/functions/r2-list-deleted/index.ts',
      'supabase/functions/r2-health-check/index.ts',
      'supabase/functions/pacientes-purge/index.ts',
    ];

    archivosEdge.forEach((archivo) => {
      it(`${archivo} no expone userId en logs`, () => {
        const contenido = readFileSync(join(ROOT, archivo), 'utf-8');
        
        // Buscar console.log con userId (pero no en comentarios)
        const lineas = contenido.split('\n').filter(l => !l.trim().startsWith('//'));
        const contenidoSinComentarios = lineas.join('\n');
        
        const patronUserId = /console\.(log|error|warn).*\buserId\b/i;
        expect(patronUserId.test(contenidoSinComentarios)).toBe(false);
        
        const patronUserIdSnake = /console\.(log|error|warn).*\buser_id\b/i;
        expect(patronUserIdSnake.test(contenidoSinComentarios)).toBe(false);
      });
    });
  });

  describe('Edge Functions: no logs con PHI real', () => {
    const archivosEdge = [
      'supabase/functions/archivos-purge/index.ts',
      'supabase/functions/r2-upload-url/index.ts',
      'supabase/functions/r2-download-url/index.ts',
      'supabase/functions/r2-delete/index.ts',
      'supabase/functions/r2-restore/index.ts',
      'supabase/functions/r2-list-deleted/index.ts',
      'supabase/functions/pacientes-purge/index.ts',
    ];

    // Patrones específicos que buscan DATOS reales de paciente, no nombres de módulos
    // Por ejemplo: "paciente_id" o "pacienteId" son datos, pero "[pacientes-purge]" es nombre de módulo
    const patronesPHI = [
      /console\.(log|error|warn).*\bnombre\b/i,
      /console\.(log|error|warn).*\brut\b/i,
      /console\.(log|error|warn).*(?:paciente_id|pacienteId|patient_id|patientId|nombre_paciente|nombrePaciente)/i,
      /console\.(log|error|warn).*\bjwt\b/i,
      /console\.(log|error|warn).*\btoken\b/i,
      /console\.(log|error|warn).*\bsecret\b/i,
    ];

    archivosEdge.forEach((archivo) => {
      it(`${archivo} no expone PHI real en logs`, () => {
        const contenido = readFileSync(join(ROOT, archivo), 'utf-8');
        
        // Excluir comentarios
        const lineas = contenido.split('\n').filter(l => !l.trim().startsWith('//'));
        const contenidoSinComentarios = lineas.join('\n');
        
        patronesPHI.forEach((patron) => {
          expect(patron.test(contenidoSinComentarios)).toBe(false);
        });
      });
    });
  });

  describe('Migraciones F7-37 existen y tienen formato correcto', () => {
    const migraciones = [
      'supabase/migrations/20260929000300_f7_37_search_path_hardening.sql',
      'supabase/migrations/20260929000400_f7_37_audit_log_append_only.sql',
    ];

    migraciones.forEach((migracion) => {
      it(`${migracion} existe`, () => {
        const contenido = readFileSync(join(ROOT, migracion), 'utf-8');
        expect(contenido.length).toBeGreaterThan(100);
      });
    });

    it('Migración 000300 tiene 17 funciones CREATE OR REPLACE', () => {
      const contenido = readFileSync(
        join(ROOT, 'supabase/migrations/20260929000300_f7_37_search_path_hardening.sql'),
        'utf-8'
      );
      const matches = contenido.match(/CREATE OR REPLACE FUNCTION/g);
      expect(matches?.length).toBe(17);
    });

    it('Migración 000300 tiene 17 SET search_path vacíos (excluyendo comentarios)', () => {
      const contenido = readFileSync(
        join(ROOT, 'supabase/migrations/20260929000300_f7_37_search_path_hardening.sql'),
        'utf-8'
      );
      const count = contarEnCodigo(contenido, /SET search_path = ''/g);
      expect(count).toBe(17);
    });

    it('Migración 000300 NO tiene SET search_path = public en código', () => {
      const contenido = readFileSync(
        join(ROOT, 'supabase/migrations/20260929000300_f7_37_search_path_hardening.sql'),
        'utf-8'
      );
      const count = contarEnCodigo(contenido, /SET search_path = public/g);
      expect(count).toBe(0);
    });

    it('Migración 000400 tiene DROP POLICY audit_log_insert_clinica', () => {
      const contenido = readFileSync(
        join(ROOT, 'supabase/migrations/20260929000400_f7_37_audit_log_append_only.sql'),
        'utf-8'
      );
      expect(contenido).toContain('DROP POLICY IF EXISTS audit_log_insert_clinica');
    });

    it('Migración 000500 existe y tiene DROP POLICY audit_log_insert_rol', () => {
      const contenido = readFileSync(
        join(ROOT, 'supabase/migrations/20260929000500_f7_37_drop_audit_log_insert_rol.sql'),
        'utf-8'
      );
      expect(contenido).toContain('DROP POLICY IF EXISTS audit_log_insert_rol');
      expect(contenido.length).toBeGreaterThan(50);
    });

  });
});
