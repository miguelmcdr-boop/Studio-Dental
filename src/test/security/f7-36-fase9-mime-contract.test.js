/**
 * F7-36 FASE 9: Regresión de contratos MIME frontend/backend
 * 
 * Regla del brief: "Si GIF no está soportado → frontend rechaza GIF,
 * backend rechaza GIF. Si GIF sí debe soportarse → frontend acepta,
 * backend acepta, tests aceptan. NO mantener contratos contradictorios."
 * 
 * Este test valida que el frontend (useArchivosClinicos.helpers)
 * está alineado con el backend (validarFormatoArchivo.ts).
 */

import { describe, it, expect } from 'vitest';
import {
  MIME_TYPES_POR_CATEGORIA,
  validarArchivo,
  MAX_TAMANO_BYTES,
} from '../../domains/clinical/patient/hooks/useArchivosClinicos.mimeValidation';

const PERMISOS_ADMIN = {
  puedeSubir: true,
  puedeEliminar: true,
  puedeVer: true,
  puedeDescargar: true,
  rol: 'admin',
};

const PERMISOS_RECEPCION = {
  puedeSubir: false,
  puedeEliminar: false,
  puedeVer: true,
  puedeDescargar: true,
  rol: 'recepcion',
};

const crearArchivo = (nombre, tipo, tamano = 1024) => ({
  name: nombre,
  type: tipo,
  size: tamano,
});

describe('F7-36 FASE 9: Contratos MIME alineados frontend/backend', () => {
  describe('Caso CRÍTICO: GIF debe ser rechazado', () => {
    it('Frontend rechaza image/gif en categoría foto_clinica', () => {
      const file = crearArchivo('animacion.gif', 'image/gif', 1024);
      const resultado = validarArchivo(file, PERMISOS_ADMIN, 'foto_clinica');
      
      expect(resultado.valido).toBe(false);
      expect(resultado.mensaje).toContain('image/gif');
      expect(resultado.mensaje).toContain('no permitido');
    });

    it('Frontend rechaza image/gif en categoría radiografia', () => {
      const file = crearArchivo('animacion.gif', 'image/gif', 1024);
      const resultado = validarArchivo(file, PERMISOS_ADMIN, 'radiografia');
      
      expect(resultado.valido).toBe(false);
    });
  });

  describe('Caso ALTO: DICOM debe ser aceptado en radiografías', () => {
    it('Frontend acepta application/dicom en categoría radiografia', () => {
      const file = crearArchivo('panoramica.dcm', 'application/dicom', 5 * 1024 * 1024);
      const resultado = validarArchivo(file, PERMISOS_ADMIN, 'radiografia');
      
      expect(resultado.valido).toBe(true);
      expect(resultado.mensaje).toBe('');
    });

    it('Frontend rechaza application/dicom en categoría foto_clinica', () => {
      const file = crearArchivo('panoramica.dcm', 'application/dicom', 5 * 1024 * 1024);
      const resultado = validarArchivo(file, PERMISOS_ADMIN, 'foto_clinica');
      
      expect(resultado.valido).toBe(false);
    });
  });

  describe('Caso ALTO: Word (.doc/.docx) debe ser aceptado en documento', () => {
    it('Frontend acepta application/msword en categoría documento', () => {
      const file = crearArchivo('historia.doc', 'application/msword', 100 * 1024);
      const resultado = validarArchivo(file, PERMISOS_ADMIN, 'documento');
      
      expect(resultado.valido).toBe(true);
    });

    it('Frontend acepta application/vnd.openxmlformats-officedocument.wordprocessingml.document en categoría documento', () => {
      const file = crearArchivo(
        'consentimiento.docx',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        100 * 1024
      );
      const resultado = validarArchivo(file, PERMISOS_ADMIN, 'documento');
      
      expect(resultado.valido).toBe(true);
    });
  });

  describe('Caso MEDIO: text/plain debe ser aceptado en otro', () => {
    it('Frontend acepta text/plain en categoría otro', () => {
      const file = crearArchivo('notas.txt', 'text/plain', 1024);
      const resultado = validarArchivo(file, PERMISOS_ADMIN, 'otro');
      
      expect(resultado.valido).toBe(true);
    });
  });

  describe('Validación de límites de tamaño (consistente frontend/backend)', () => {
    it('MAX_TAMANO_BYTES es 50MB (igual que backend)', () => {
      expect(MAX_TAMANO_BYTES).toBe(50 * 1024 * 1024);
    });

    it('Frontend rechaza archivo mayor a 50MB', () => {
      const file = crearArchivo('grande.jpg', 'image/jpeg', 60 * 1024 * 1024);
      const resultado = validarArchivo(file, PERMISOS_ADMIN, 'foto_clinica');
      
      expect(resultado.valido).toBe(false);
      expect(resultado.mensaje).toContain('demasiado grande');
      expect(resultado.mensaje).toContain('50MB');
    });

    it('Frontend acepta archivo de exactamente 50MB', () => {
      const file = crearArchivo('exacto.jpg', 'image/jpeg', 50 * 1024 * 1024);
      const resultado = validarArchivo(file, PERMISOS_ADMIN, 'foto_clinica');
      
      expect(resultado.valido).toBe(true);
    });
  });

  describe('Validación RBAC (consistente con backend)', () => {
    it('Frontend rechaza upload si usuario no tiene permisos', () => {
      const file = crearArchivo('foto.jpg', 'image/jpeg', 1024);
      const resultado = validarArchivo(file, PERMISOS_RECEPCION, 'foto_clinica');
      
      expect(resultado.valido).toBe(false);
      expect(resultado.mensaje).toContain('permisos');
    });
  });

  describe('Alineación completa frontend/backend', () => {
    it('MIME_TYPES_POR_CATEGORIA contiene las 6 categorías del backend', () => {
      const categoriasEsperadas = [
        'radiografia',
        'foto_intraoral',
        'foto_clinica',
        'pdf',
        'documento',
        'otro',
      ];

      categoriasEsperadas.forEach((categoria) => {
        expect(MIME_TYPES_POR_CATEGORIA).toHaveProperty(categoria);
        expect(Array.isArray(MIME_TYPES_POR_CATEGORIA[categoria])).toBe(true);
        expect(MIME_TYPES_POR_CATEGORIA[categoria].length).toBeGreaterThan(0);
      });
    });

    it('Cada categoría tiene los mismos MIME types que el backend', () => {
      expect(MIME_TYPES_POR_CATEGORIA.radiografia).toContain('application/dicom');
      expect(MIME_TYPES_POR_CATEGORIA.radiografia).toContain('image/jpeg');

      expect(MIME_TYPES_POR_CATEGORIA.foto_clinica).not.toContain('application/dicom');

      expect(MIME_TYPES_POR_CATEGORIA.documento).toContain('application/msword');

      expect(MIME_TYPES_POR_CATEGORIA.otro).toContain('text/plain');
    });
  });

  describe('Categoría desconocida (defensa en profundidad)', () => {
    it('Frontend rechaza categoría desconocida', () => {
      const file = crearArchivo('archivo.jpg', 'image/jpeg', 1024);
      const resultado = validarArchivo(file, PERMISOS_ADMIN, 'categoria_invalida');
      
      expect(resultado.valido).toBe(false);
      expect(resultado.mensaje).toContain('Categoría desconocida');
    });
  });

  describe('MIME type vacío o inválido', () => {
    it('Frontend rechaza archivo sin MIME type', () => {
      const file = crearArchivo('archivo', '', 1024);
      const resultado = validarArchivo(file, PERMISOS_ADMIN, 'otro');
      
      expect(resultado.valido).toBe(false);
      expect(resultado.mensaje).toContain('no permitido');
    });
  });
});
