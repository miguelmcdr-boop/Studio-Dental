# F7-36 FASE 9: MIME Contract

**Fecha:** 2026-09-29
**Estado:** Completada
**PR:** #186 (pendiente)

## Problema

Contratos MIME desalineados entre frontend y backend.

**Regla del brief:** "Si GIF no está soportado → frontend rechaza GIF, backend rechaza GIF."

## Inconsistencias críticas

| MIME Type | Frontend (antes) | Backend | Impacto |
|---|---|---|---|
| image/gif | Acepta | Rechaza | CRÍTICO |
| application/dicom | No acepta | Acepta | ALTO |
| application/msword | No acepta | Acepta | ALTO |
| application/vnd.openxmlformats-officedocument.wordprocessingml.document | No acepta | Acepta | ALTO |
| text/plain | No acepta | Acepta | MEDIO |

## Root cause

Frontend: lista plana de MIME types
Backend: validación por categoría + extensión

## Lista canónica propuesta

Alinear frontend con backend (validarFormatoArchivo.ts ya es correcta).

## Plan

1. Actualizar useArchivosClinicos.helpers.js (eliminar GIF, agregar validación por categoría)
2. Actualizar ArchivoUploader.jsx (accept específico por categoría)
3. Tests de regresión
4. Documentación

## Criterios de aceptación

- Frontend rechaza image/gif
- Frontend acepta application/dicom en rx
- Frontend acepta Word (.doc/.docx) en documento
- Frontend acepta text/plain en otro
- ArchivoUploader usa accept específico
- Tests validan alineación

## Principio conservador

NO modifica backend. Solo actualiza validación client-side.
