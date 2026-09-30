# Verificación Manual de F7-36 FASE 1

**Propósito:** Checklist de verificación manual para QA, release managers y auditores de seguridad.

**Última actualización:** 2026-09-28  
**Commits cubiertos:** 1.1 a 1.9

---

## Prerequisitos

### Entorno
- [ ] Aplicación corriendo en modo desarrollo (npm run dev)
- [ ] Supabase configurado (VITE_USE_SUPABASE=true)
- [ ] DevTools del navegador abierto (Application, Console, Network)
- [ ] Dos clínicas disponibles (Clínica A y Clínica B) con:
  - Usuario con membresía activa en ambas
  - Datos clínicos preexistentes (pacientes, citas, pagos, adjuntos)

### Herramientas
- Chrome/Edge/Firefox con DevTools
- npm test para validación automática

---

## Verificación Automática (OBLIGATORIA)

    # 1. Suite completa de tests
    npm test -- --run
    # Esperado: 1601/1601 tests passed

    # 2. 5 tests obligatorios F7-36
    npm test -- --run src/test/security/f7-36-fase1-mandatory.test.js
    # Esperado: 5 passed (5)

    # 3. Validación de arquitectura
    npm run validate:architecture
    # Esperado: "Todas las reglas arquitectónicas se cumplen"

    # 4. Build
    npm run build
    # Esperado: files generated (dist/)

**Si alguno de estos 4 pasos falla, NO proceder con release.**

---

## Escenario 1: Aislamiento localStorage (CAPA 2)

### Objetivo
Validar que datos de Clínica A no son visibles en Clínica B.

### Pasos

1. **Login como Clínica A**
2. Crear paciente "Juan Pérez F7-36" con RUT ficticio 99.999.999-9
3. Abrir DevTools → **Application → Local Storage → http://localhost:5173**
4. Verificar que existe la clave:

       sd_<clinicaA-id>_studio_dental_pacientes_v3

   - ✅ Debe contener el paciente "Juan Pérez F7-36"
   - ❌ NO debe existir la clave legacy studio_dental_pacientes_v3 con datos
5. **Cambiar a Clínica B** (usar ClinicaSelector)
6. Verificar en Console:

       [invalidarCacheCambioClinica] Invalidadas X claves de clínica <clinicaA-id>

7. Verificar que "Juan Pérez F7-36" **NO aparece** en el listado de pacientes de Clínica B
8. DevTools → Local Storage:
   - ✅ Claves sd_<clinicaA-id>_* deben haber desaparecido
   - ✅ Claves sd_<clinicaB-id>_* deben existir
9. **Volver a Clínica A**
10. "Juan Pérez F7-36" debe seguir presente (Supabase lo sirve, caché reconstruida)

### Criterios de aceptación
- [ ] Claves tenant-aware tienen formato correcto (sd_<clinicaId>_*)
- [ ] Cambio de clínica dispara invalidación visible en Console
- [ ] Clínica B no ve datos de Clínica A
- [ ] Clínica A recupera sus datos al volver

---

## Escenario 2: Aislamiento IndexedDB (CAPA 2)

### Objetivo
Validar que adjuntos clínicos (radiografías, fotos) están aislados por clínica.

### Pasos

1. **Login como Clínica A**
2. Abrir ficha de un paciente
3. Subir una radiografía (cualquier imagen PNG)
4. DevTools → **Application → IndexedDB → studio_dental_adjuntos → adjuntos**
5. Verificar registro:
   - ✅ Campo clinicaId = ID de Clínica A
   - ✅ Campo pacienteId = ID del paciente
   - ✅ Campo storagePath = ruta en Supabase Storage (si sincrónico)
   - ✅ Campo blob = archivo binario
6. **Cambiar a Clínica B**
7. Abrir ficha del MISMO paciente (si existe en ambas clínicas) o cualquier otro
8. Verificar que la radiografía de Clínica A **NO aparece**
9. DevTools → IndexedDB:
   - ✅ BD studio_dental_adjuntos fue eliminada (o vacía)
10. **Volver a Clínica A**
11. La radiografía debe ser accesible de nuevo (Supabase Storage la sirve)

### Criterios de aceptación
- [ ] Adjuntos tienen campo clinicaId poblado
- [ ] Cambio de clínica borra IndexedDB completa
- [ ] Clínica B no ve adjuntos de Clínica A
- [ ] Adjuntos de Clínica A se recuperan desde Supabase al volver

---

## Escenario 3: Invalidación de caché (CAPA 3)

### Objetivo
Validar que invalidarCacheCambioClinica ejecuta los 5 pasos fail-safe.

### Pasos

1. **Login como Clínica A**
2. Crear múltiples datos:
   - 3 pacientes
   - 5 citas
   - 2 pagos
   - 1 adjunto
3. DevTools → Console, ejecutar:

       Object.keys(localStorage).filter(k => k.includes('<clinicaA-id>')).length

   - Debe retornar >0 (hay claves tenant-aware)
4. **Cambiar a Clínica B** (dispara invalidación)
5. Verificar en Console que el log muestra los 5 pasos:

       [invalidarCacheCambioClinica] Iniciando invalidación (clínica anterior: <A-id>)
       [tenantCache] Invalidadas X claves de clínica <A-id>
       [invalidarCacheCambioClinica] Storage services reseteados: 4
       [invalidarCacheCambioClinica] Stores Zustand reseteados: 2
       [invalidarCacheCambioClinica] Claves legacy eliminadas: X
       [invalidarCacheCambioClinica] IndexedDB eliminada: true

6. DevTools → Console, ejecutar nuevamente:

       Object.keys(localStorage).filter(k => k.includes('<clinicaA-id>')).length

   - Debe retornar 0

### Criterios de aceptación
- [ ] Los 5 pasos se ejecutan sin errores
- [ ] Claves tenant-aware de clínica anterior son eliminadas
- [ ] IndexedDB es invalidada
- [ ] Stores Zustand son reseteados

---

## Escenario 4: Defensa en profundidad (CAPA 2 cuando CAPA 3 falla)

### Objetivo
Validar que si la invalidación falla, el aislamiento sigue funcionando (CAPA 2 protege).

### Pasos

1. **Login como Clínica A**
2. Crear paciente "Test Defensa" con datos sensibles
3. DevTools → Console, **deshabilitar invalidación** inyectando este código:

       const originalInvalidar = window.invalidarCacheCambioClinica
       window.invalidarCacheCambioClinica = async () => {
         console.log('[FAKE] Invalidación deshabilitada para test')
         return { tenantKeys: 0, errores: 1 }
       }

4. **Cambiar a Clínica B** (invalidación fakeada)
5. Verificar que Clínica B **NO ve** "Test Defensa" (CAPA 2 protege)
   - Clínica B consulta su propia clave sd_<clinicaB-id>_* que está vacía
6. **Volver a Clínica A**
7. "Test Defensa" debe seguir visible

### Criterios de aceptación
- [ ] Aunque invalidación falle, aislamiento se mantiene
- [ ] Clínica B nunca ve datos de Clínica A
- [ ] Clínica A conserva sus datos intactos

---

## Escenario 5: Claves legacy coexisten sin interferir

### Objetivo
Validar que claves legacy preexistentes son ignoradas por el sistema tenant-aware.

### Pasos

1. **Login como Clínica A**
2. DevTools → Console, inyectar clave legacy manualmente:

       localStorage.setItem(
         'studio_dental_pacientes_v3',
         JSON.stringify([{ id: 'legacy-1', nombre: 'Paciente Legacy Antiguo' }])
       )

3. Verificar que "Paciente Legacy Antiguo" **NO aparece** en el listado
   - El servicio ignora la clave legacy y usa solo la tenant-aware
4. Crear paciente "Paciente Moderno F7-36"
5. Verificar que solo "Paciente Moderno F7-36" aparece
6. DevTools → Local Storage:
   - ✅ Clave legacy studio_dental_pacientes_v3 sigue ahí (inofensiva)
   - ✅ Clave tenant sd_<clinicaA-id>_studio_dental_pacientes_v3 contiene "Paciente Moderno"

### Criterios de aceptación
- [ ] Claves legacy son ignoradas (no contaminan)
- [ ] Sistema tenant-aware funciona independientemente
- [ ] Claves legacy serán limpiadas en próximo cambio de clínica

---

## Escenario 6: Logout completo

### Objetivo
Validar que logout limpia TODO el estado multi-tenant.

### Pasos

1. **Login como Clínica A**
2. Crear datos en todas las capas (pacientes, citas, adjuntos)
3. DevTools → verificar existencia de:
   - Claves sd_<clinicaA-id>_* en localStorage
   - Datos en IndexedDB studio_dental_adjuntos
   - Stores Zustand con datos
4. **Hacer logout** (botón de cierre de sesión)
5. Verificar en Console que se ejecutó tenantCache.invalidarTodas()
6. DevTools → Local Storage:
   - ✅ NO deben quedar claves sd_*
   - ✅ Deben quedar solo preferencias UI (darkMode, activeSection)
7. DevTools → IndexedDB:
   - ✅ studio_dental_adjuntos debe estar eliminada o vacía

### Criterios de aceptación
- [ ] Logout limpia todas las claves tenant
- [ ] Preferencias UI se preservan
- [ ] IndexedDB es invalidada

---

## Escenario 7: Operaciones offline en cola

### Objetivo
Validar que operationQueue aísla operaciones por clínica.

### Pasos

1. **Login como Clínica A**
2. **Deshabilitar red** (DevTools → Network → Offline)
3. Crear un paciente (se encola en sd_<clinicaA-id>_studio_dental_operation_queue)
4. DevTools → Local Storage:

       JSON.parse(localStorage.getItem('sd_<clinicaA-id>_studio_dental_operation_queue'))

   - Debe mostrar la operación encolada
5. **Re-habilitar red**
6. **Cambiar a Clínica B** (dispara invalidación de operaciónQueue de A)
7. Verificar que Clínica B:
   - ✅ No procesa operaciones de Clínica A
   - ✅ Su propia cola está vacía
8. **Volver a Clínica A**
9. Verificar que las operaciones de A fueron procesadas (o re-encoladas)

### Criterios de aceptación
- [ ] Cola de operaciones está aislada por clínica
- [ ] Cambio de clínica no procesa operaciones de clínica anterior
- [ ] Operaciones pendientes se preservan en su clínica original

---

## Checklist Final de Release

### Pre-release
- [ ] 1601/1601 tests pasando
- [ ] validate:architecture PASS
- [ ] build OK
- [ ] Los 7 escenarios manuales pasan
- [ ] PR #167 aprobado por al menos 1 reviewer
- [ ] CHANGELOG actualizado (si aplica)

### Post-release
- [ ] Monitoreo de errores en producción (Sentry/logs)
- [ ] Verificar que no hay reports de contaminación cross-clinic
- [ ] Usuarios de múltiples clínicas confirman aislamiento
- [ ] Reportes BI muestran datos correctos (bug de 1.5f corregido)

### Rollback plan
Si se detectan problemas críticos post-release:

    git revert <commit-hash>
    # O revertir PR #167 completo si el problema es sistémico

**Nota:** Los cambios son 100% backwards-compatible (claves legacy coexisten sin interferir), por lo que el riesgo de rollback es bajo.

---

## Contacto

- **Owner técnico:** @miguelmcdr-boop
- **Revisores:** (agregar tras primer review)
- **Issues relacionados:** etiquetas F7-36, security, multi-tenant
