# DIAGNÓSTICO TÉCNICO: ARQUITECTURA DE SINCRONIZACIÓN OFFLINE-FIRST
**Proyecto**: Studio Dental (DentikOS)  
**Fecha**: Octubre 2026  
**Autor**: Ingeniero de Software Senior / Antigravity Agent  
**Estado**: Documento de Diagnóstico y Auditoría de Integridad  

---

## 1. RESUMEN EJECUTIVO

Studio Dental se define conceptualmente como un sistema operativo clínico de arquitectura híbrida (**offline-first con Supabase como fuente de verdad**). La promesa del sistema es permitir que los odontólogos y el personal de recepción continúen agendando citas, registrando diagnósticos, cobrando prestaciones y actualizando odontogramas incluso ante pérdidas intermitentes o prolongadas de conectividad a internet.

Sin embargo, tras una inspección estricta del código fuente activo en `src/services/`, `src/modules/` y `src/hooks/`, se identificó una **discrepancia crítica entre los servicios diseñados formalmente y la implementación real que ejecutan los módulos de negocio**:

1. **Anti-patrón de Reemplazo de Arreglo y Borrado Remoto Destructivo**: Los servicios de persistencia principales (`agendaStorageService`, `presupuestosStorageService`, `pagosStorageService`, `finanzasStorageService`) guardan listas completas y aplican una lógica de borrado (`DELETE ... in(idsAEliminar)`) eliminando en Supabase todo registro que no se encuentre en la memoria del cliente local. En entornos concurrentes (dos sillones o recepción y doctor), **un usuario borra silenciosamente las entidades creadas por otro usuario**.
2. **Cola Offline (`operationQueue`) Huérfana**: El servicio `operationQueue.js` y su hook `useOfflineQueue.js` están implementados y cuentan con tests unitarios propios, pero **ningún módulo ni servicio de almacenamiento del sistema invoca `enqueue()`**. En modo offline, los cambios se quedan únicamente en `localStorage`/`IndexedDB` sin que exista un mecanismo de drenaje ni reintento garantizado al reconectar.
3. **Detección de Conflictos (`conflictDetectionService`) Desconectada**: El servicio de detección de colisiones basado en timestamps (`updated_at`) y auditoría existe como código aislado; ninguna mutación en la UI ni en los servicios de almacenamiento lo consulta antes de sobreescribir datos en Supabase.
4. **Eventos Realtime sin Consumo en el Frontend**: `useRealtimeSync.js` escucha eventos de Postgres vía Supabase Realtime y despacha eventos personalizados en `window`, pero **ningún hook de módulo (salvo el catálogo administrativo de vademécum) escucha estos eventos**, dejando la UI desactualizada ante cambios de otros sillones.
5. **Riesgo Severo en Adjuntos Binarios (IndexedDB)**: Las imágenes clínicas y radiografías guardadas offline se persisten con `sincronizado: false` en IndexedDB. No existe ningún proceso en segundo plano que las suba al volver internet, y al cambiar de clínica o cerrar sesión, la base de datos local es purgada por completo, provocando **pérdida irrecuperable de material clínico sensible**.

---

## 2. MAPA DEL FLUJO ACTUAL DE SINCRONIZACIÓN

```mermaid
flowchart TD
    subgraph UI_Layer ["Capa de Interfaz y Hooks"]
        Component[Componente / Hook de Módulo]
    end

    subgraph Memory_Layer ["Capa de Caché Síncrona"]
        MemCache[Caché en Memoria de Módulo]
        ZustandStore[Store Zustand - Pacientes/Sesion]
    end

    subgraph Local_Storage ["Almacenamiento Local (Offline)"]
        LocalStorage["localStorage (sd_clinicaId_*)"]
        IndexedDB["IndexedDB (studio_dental_adjuntos)"]
        OpQueue["operationQueue (DESCONECTADO)"]
    end

    subgraph Remote_Supabase ["Supabase Backend (Fuente de Verdad)"]
        Postgres[("PostgreSQL Tables")]
        SupaStorage[("Supabase Storage")]
        Realtime["Supabase Realtime"]
    end

    %% Flujos de escritura
    Component -->|1. Invoca guardarX()| MemCache
    MemCache -->|2. Escribe síncrono| LocalStorage
    Component -.->|Archivos binarios| IndexedDB
    
    %% Flujo a Supabase
    MemCache -->|3. Intenta async en background| Postgres
    IndexedDB -->|Intenta subir| SupaStorage
    
    %% Flujo Realtime
    Postgres -->|postgres_changes| Realtime
    Realtime -->|Eventos WS| RealtimeHook["useRealtimeSync"]
    RealtimeHook -->|window.dispatchEvent| DOMWindow["window (Eventos sin listeners)"]
    
    %% Cola huérfana
    OpQueue -.->|Sin llamadas a enqueue| OpQueue
```

### 2.1 Escritura Local cuando la App está Offline
- **Datos Estructurados (Pacientes, Citas, Presupuestos, Pagos, Finanzas)**:
  - Los componentes llaman a métodos como `guardarPacientes()`, `guardarCitas()`, `guardarPresupuestos()`.
  - El servicio actualiza primero la **caché en memoria** (variable a nivel de módulo JS).
  - De inmediato, persiste la colección completa en `localStorage` mediante `tenantRepository` (claves aisladas con prefijo `sd_<clinicaId>_`).
  - Posteriormente, inicia una promesa asíncrona de fondo para sincronizar con Supabase.
  - Al no haber conexión, `supabase.auth.getUser()` o el llamado REST falla o lanza excepción.
  - La excepción es capturada en un bloque `catch (error)`, se registra un warning en logger (`log.error`), y la función **retorna `true` silenciosamente**.
  - **Consecuencia**: El usuario ve sus cambios reflejados localmente gracias a la caché en memoria y localStorage, creyendo que la operación está asegurada.

- **Datos Clínicos Específicos (Odontograma, Periodontograma, Evoluciones, Recetas)**:
  - Manejados a través de `odontogramaStorageService` y `datosClinicosSupabase`.
  - Guardan de forma síncrona en `localStorage` con claves planas tipo `odonto_inicial_${pacienteId}` (sin aislamiento estricto de tenant en la clave local).
  - Intentan escribir en Supabase (`guardarOdontogramaSupabase`). Si falla por falta de red, la excepción se atrapa y el dato queda solo en el navegador local.

- **Archivos Binarios (Fotos, Radiografías, Consentimientos)**:
  - Manejados por `adjuntosStorageService.js` en IndexedDB (`studio_dental_adjuntos`, objectStore `adjuntos`).
  - Se genera un registro con UUID local, `blob`, metadata, `storagePath: null` y `sincronizado: false`.
  - Si no hay red, la llamada a `subirAdjunto()` falla y el registro permanece únicamente en IndexedDB.

### 2.2 Mecanismo de Cola de Operaciones (`operationQueue.js`)
El servicio `src/services/operationQueue.js` fue concebido para almacenar mutaciones pendientes y reintentarlas:
- **Estructura teórica**: Persiste un array de objetos `{ id, timestamp, service, method, args, retries }` en `sd_<clinicaId>_studio_dental_operation_queue`.
- **Estrategia de reintento**: Backoff exponencial de 5 intentos (`[0s, 1s, 2s, 4s, 8s]`). Tras 5 fallos, mueve la operación a `failed_operations`.
- **Gatillo de ejecución**: `src/hooks/useOfflineQueue.js` escucha el evento del navegador `window.addEventListener('online', ...)` y ejecuta `operationQueue.processQueue()`.
- **LA REALIDAD DEL CÓDIGO**:
  - `operationQueue.enqueue()` **NO es llamado por ningún servicio ni componente** del sistema (solo se ejecuta en su propio test unitario `operationQueue.test.js`).
  - Cuando los servicios de almacenamiento (`pacientesStorageService`, etc.) fallan por falta de red, **no encolan la operación**. Simplemente ignoran el fallo.
  - Por tanto, la cola siempre tiene 0 elementos (`getPendingCount() === 0`). Al volver internet, `processQueue()` no procesa nada.

### 2.3 Sincronización con Supabase al Recuperar Conexión
Al recuperar conectividad (o recargar la página online):
1. `useSincronizacionInicial(enabled)`:
   - Al montar `App.jsx` con usuario autenticado, ejecuta en serie:
     - `agendaStorageService.sincronizarDesdeSupabase()`
     - `presupuestosStorageService.sincronizarDesdeSupabase()`
     - `pagosStorageService.sincronizarDesdeSupabase()`
     - `finanzasStorageService.sincronizarDesdeSupabase()`
     - `vademecumService.sincronizarDesdeSupabase()`
   - `pacientesStorageService` se sincroniza mediante `useDataMigration`.
2. **Efecto de `sincronizarDesdeSupabase()`**:
   - Descarga todas las filas de la base de datos correspondientes al tenant autenticado (filtradas por RLS).
   - **Sobrescribe incondicionalmente la caché en memoria y el `localStorage`**.
   - **Si el usuario había realizado cambios offline que no subieron a Supabase, `sincronizarDesdeSupabase()` SOBREESCRIBE Y DESTRUYE TODOS LOS CAMBIOS OFFLINE NO SINCRONIZADOS**.

### 2.4 Dónde Interviene Supabase Realtime
- `src/services/realtimeService.js`: Encapsula suscripciones `postgres_changes` de Supabase sobre el schema `public`.
- `src/hooks/useRealtimeSync.js`: Se monta en `App.jsx` y crea 11 suscripciones en tiempo real:
  - `pacientes`, `citas`, `presupuestos`, `presupuesto_items`, `pagos`, `movimientos_financieros`, `evoluciones_clinicas`, `recetas`, `odontogramas`, `periodontogramas`, `inventario`.
- **Flujo de eventos**:
  - Para `pacientes`: Invoca `usePacientesStore.getState().refrescarDesdeSupabase()`.
  - Para las demás 10 tablas: Despacha un CustomEvent en el objeto global `window` con identificadores como `realtime:citas_changed`, `realtime:odontograma_changed`, etc.
- **Ruptura de la cadena**:
  - Salvo `useVademecumAdmin.js` (que escucha `realtime:vademecum_changed`), **ningún hook clínico ni de gestión** (`useAgenda`, `usePresupuestos`, `usePagos`, `useFinanzas`, `useOdontograma`) posee un `window.addEventListener` para reaccionar a estos eventos.
  - El mecanismo Realtime consume conexiones WebSockets y despacha eventos en el DOM, pero la interfaz permanece completamente ciega e inerte.

---

## 3. PUNTOS CRÍTICOS DE CONFLICTO Y VULNERABILIDADES DE INTEGRIDAD

### 3.1 Dos Escrituras Simultáneas al Mismo Registro (Concurrencia Multi-Dispositivo)
*Escenario*: El Doctor A (Sillón 1) y el Doctor B (Sillón 2) abren simultáneamente la ficha del Paciente X o el registro de un Odontograma / Cita.
- **Odontogramas**:
  - En `datosClinicosSupabase.js`, `guardarOdontograma` hace un `select('id').eq('paciente_id', id).eq('tipo', tipo)`. Si existe, hace `update(odontogramaSupabase)`.
  - No existe control de versión optimista (ni campo `version`, ni comprobación de `updated_at`, ni ETag).
  - La última petición HTTP que impacta PostgreSQL sobreescribe ciegamente a la anterior (**Last-Write-Wins ciego sin trazabilidad**). Las piezas dentales marcadas por el Doctor A desaparecen si el Doctor B guardó un segundo después.
- **Servicio `conflictDetectionService.js` inoperante**:
  - Aunque existe una función `detectarConflicto(tabla, recordId, updatedAtLocal)` con tolerancia de 1000 ms, **ningún módulo de la aplicación la llama antes de hacer un update**.

### 3.2 Anti-patrón de "Reemplazo de Arreglo Completo" y Borrado Remoto Destructivo
*Escenario*: Este es el hallazgo más grave de la auditoría. Los métodos de guardado no operan a nivel de fila individual, sino a nivel de **colección completa**:
```javascript
// Extracto de agendaStorageService.js, presupuestosStorageService.js, pagosStorageService.js:
const { data: citasSupabase } = await supabase.from('citas').select('id')
if (Array.isArray(citasSupabase)) {
  const idsAEliminar = citasSupabase
    .map(c => c.id)
    .filter(id => !idsEnMemoria.has(id))

  if (idsAEliminar.length > 0) {
    await supabase.from('citas').delete().in('id', idsAEliminar)
  }
}
```
**Impacto Catastrófico**:
1. El Doctor A abre la agenda por la mañana (carga 10 citas en memoria).
2. La recepcionista en otro computador crea 2 citas nuevas para la tarde (Citas #11 y #12) directamente en Supabase.
3. El Doctor A modifica la hora de la Cita #1 y presiona guardar.
4. El cliente del Doctor A envía sus 10 citas, consulta Supabase (donde hay 12 citas), calcula que los IDs de las Citas #11 y #12 no están en su memoria local (`!idsEnMemoria.has(id)`), y **EJECUTA UN `DELETE` EN SUPABASE BORRANDO LAS CITAS RECIÉN CREADAS POR LA RECEPCIONISTA**.
5. Lo mismo ocurre en **Presupuestos**, **Pagos**, **Movimientos Financieros** y mediante soft-delete en **Pacientes**.

### 3.3 Operaciones Duplicadas al Reintentar la Cola
Si `operationQueue` fuera activado en el futuro con su código actual:
1. **Doble ejecución por fallo a mitad de cola**:
   - `processQueue()` itera sobre la lista con `for (const operation of queue)`.
   - Si la operación 1 se completa con éxito en Supabase, pero la operación 2 falla por corte de red, el bucle finaliza sin llamar a `writeQueue([])` (línea 211).
   - Al reconectar, `processQueue()` se ejecuta nuevamente desde el inicio, **volviendo a enviar la operación 1**.
2. **Inserts no idempotentes**:
   - En `agendaStorageService.js` (línea 307):
     ```javascript
     // INSERT directo sin verificación de duplicados
     const { data: insertado } = await supabase.from('citas').insert(paraInsert)...
     ```
   - Si una cita creada offline se reintenta, se crearán múltiples citas idénticas en la base de datos con distintos UUIDs.

### 3.4 Carrera Crítica de Borrado en `operationQueue.processQueue()`
En `operationQueue.js`:
```javascript
export const processQueue = async () => {
  // ...
  processing = true
  for (const operation of queue) {
    await processOperation(operation)
  }
  writeQueue([]) // <--- BORRA LA COLA COMPLETA
  processing = false
}
```
- Mientras `processOperation()` está esperando respuestas de red durante varios segundos, si el usuario realiza una nueva acción offline, `enqueue()` leerá la cola, agregará el nuevo elemento y lo guardará en `localStorage`.
- Cuando `processQueue()` termina su bucle anterior, ejecuta ciegamente `writeQueue([])`, **ELIMINANDO DE LOCALSTORAGE LAS NUEVAS OPERACIONES QUE SE ENCOLARON MIENTRAS PROCESABA**, resultando en **pérdida irrecuperable de datos**.

### 3.5 Estados Parciales por Caída de Conexión en Transacciones Compuestas
- En entidades con relaciones maestro-detalle (ej. `presupuestos` y `presupuesto_items`):
  - No se utiliza una transacción SQL (RPC atómica / `BEGIN...COMMIT`).
  - Si el presupuesto se crea en Supabase, pero la red cae antes de insertar los ítems del presupuesto, queda un **presupuesto huérfano con monto total pero sin prestaciones asociadas**.

### 3.6 Inversión del Orden de Operaciones (UPDATE antes de CREATE)
- Si un usuario offline crea un registro (ej. una cita) con un ID local temporal (ej. `temp-1234`), y luego en la misma sesión offline la edita o le cambia el estado:
  - Si la cola ejecutara las operaciones en orden asíncrono o si fallara la primera, el `UPDATE` intentará ejecutarse en Supabase sobre un registro que aún no existe o cuyo UUID real aún no ha sido mapeado, provocando fallos en cascada.

### 3.7 Pérdida Total de Adjuntos Clínicos en IndexedDB
En `adjuntosStorageService.js`:
- Un adjunto guardado offline queda con `sincronizado: false`.
- Nunca hay un barrido para subirlo después.
- Si el usuario cambia de clínica en el selector, `invalidarCacheCambioClinica.js` ejecuta en el Paso 5:
  ```javascript
  indexedDB.deleteDatabase('studio_dental_adjuntos')
  ```
- **La base de datos completa de adjuntos es destruida**, perdiéndose de manera irreversible las radiografías o fotos clínicas que no alcanzaron a subirse.

---

## 4. COBERTURA DE TESTS EXISTENTE

### 4.1 Tests que Cubren Sincronización Hoy
Actualmente el proyecto cuenta con 167 archivos de test y 1863 pruebas que pasan al 100%. Sin embargo, en el ámbito offline/sincronización, las pruebas cubren únicamente contratos aislados y mocks:

| Archivo de Test | Alcance Real de la Prueba |
| :--- | :--- |
| `src/services/operationQueue.test.js` | Prueba unitaria aislada de métodos `enqueue`, `processQueue`, `clear` con servicios mockeados en memoria. |
| `src/services/conflictDetectionService.test.js` | Compara strings ISO de fechas y simula respuestas de Supabase para `detectarConflicto`. |
| `src/services/realtimeService.test.js` | Verifica que `supabase.channel()` reciba la configuración y callback adecuados. |
| `src/hooks/useRealtimeSync.test.js` | Comprueba que el hook cree 11 suscripciones y evalúa la función anti-loop `registrarEscrituraLocal`. |
| `src/hooks/useRealtimeSubscription.test.js` | Prueba el ciclo de vida del hook y la desuscripción. |
| `src/test/security/no-fallback-cross-clinic.test.js` | **F7-36**: Verifica que ante error de red (`Network error`), los storage services retornen la caché local existente sin vaciarla. |
| `src/services/adjuntosStorageService.test.js` | Prueba que los registros se guarden en IndexedDB con `clinicaId` y flags `sincronizado: false`. |

### 4.2 Matriz de Vacíos Críticos (Escenarios NO Testeados)

| Escenario Crítico | Estado de Prueba | Riesgo Asociado |
| :--- | :---: | :--- |
| **Escritura concurrente multi-usuario** (2 clientes editando la misma ficha/odontograma). | ❌ Cero tests | Pérdida silenciosa de datos clínicos. |
| **Borrado remoto masivo involuntario** (Client A guarda lista parcial eliminando ítems de Client B). | ❌ Cero tests | Destrucción de citas, pagos y presupuestos ajenos. |
| **Encolamiento real desde storage services** en fallo de red. | ❌ Cero tests | No se detectó que `enqueue` jamás es llamado. |
| **Encolado concurrente durante drenaje de cola** (`writeQueue([])` pisando nuevos ítems). | ❌ Cero tests | Pérdida de mutaciones en vuelo. |
| **Reintento offline de transacciones compuestas** (Presupuesto + Items). | ❌ Cero tests | Corrupción relacional (cabeceras sin detalle). |
| **Sincronización diferida de adjuntos en IndexedDB**. | ❌ Cero tests | Archivos binarios offline quedan abandonados. |
| **Consumo de eventos Realtime en la UI** (verificar que un cambio en Supabase actualice el DOM de Agenda o Pacientes). | ❌ Cero tests | Pantallas desincronizadas en la clínica. |

---

## 5. RANKING DE RIESGO Y RECOMENDACIONES DE MITIGACIÓN

| # | Riesgo Crítico | Severidad | Impacto Primario | Recomendación Breve de Mitigación |
| :-: | :--- | :---: | :---: | :--- |
| **1** | **Borrado Remoto Destructivo por Guardado en Lote** | 🔴 **P0 (Catastrófico)** | **Pérdida Masiva de Datos** | **Erradicar el anti-patrón de array replacement**. Reemplazar `guardarCitas(citas)` por operaciones atómicas granulares (`crearCita`, `actualizarCita`, `eliminarCita(id)`). Eliminar de raíz el bloque `supabase.delete().in(idsAEliminar)`. |
| **2** | **Pérdida Total de Adjuntos Binarios en IndexedDB** | 🔴 **P0 (Catastrófico)** | **Pérdida de Información Clínica** | Crear un proceso de sincronización diferida (`syncPendingAttachments`). **Prohibir el borrado ciego de IndexedDB en `invalidarCacheCambioClinica`** si existen registros con `sincronizado: false` (o archivarlos por clínica de forma segura). |
| **3** | **Sobreescritura Destructiva de Cambios Offline al Reconectar** | 🔴 **P0 (Catastrófico)** | **Pérdida de Trabajo Clínico** | Modificar `sincronizarDesdeSupabase()` para que no pise ciegamente `localStorage` si existen mutaciones locales pendientes. Implementar merge de 3 vías o bandera de "dirty record". |
| **4** | **Sobreescritura Ciega Concurrente (Last-Write-Wins sin Detección)** | 🟠 **P1 (Grave)** | **Corrupción / Pérdida de Datos** | Conectar efectivamente `conflictDetectionService` en los storage services. Implementar control de concurrencia optimista (`UPDATE ... WHERE updated_at = local_updated_at`) y solicitar resolución al usuario si hay discrepancia. |
| **5** | **Carrera Crítica en `operationQueue.processQueue()`** | 🟠 **P1 (Grave)** | **Pérdida de Operaciones en Cola** | Modificar `processQueue()` para que no limpie con `writeQueue([])`. Debe eliminar de la cola **únicamente los IDs específicos de las operaciones que se completaron con éxito** (`queue.filter(op => !completedIds.has(op.id))`). |
| **6** | **Cola Offline (`operationQueue`) Desconectada de la App** | 🟠 **P1 (Grave)** | **Inoperancia Offline** | Conectar los métodos de guardado a `operationQueue.enqueue()` cuando `estaOnline()` sea falso o cuando la promesa de Supabase falle por red. |
| **7** | **Eventos Realtime Desenganchados de la UI** | 🟡 **P2 (Moderado)** | **Desincronización Visual** | Suscribir los hooks de módulo (`useAgenda`, `usePresupuestos`, `usePagos`, etc.) a los eventos canónicos de `REALTIME_EVENTS` en `window` para invalidar y re-consultar sus estados locales automáticamente. |

---

## 6. HALLAZGOS Y BUGS DETECTADOS DURANTE LA AUDITORÍA

Conforme a las reglas del proyecto, los siguientes problemas fueron detectados durante la lectura analítica y **NO fueron modificados en código**. Se reportan aquí para su planificación:

### Hallazgo 1: Anti-patrón de Borrado Remoto Involuntario (P0)
- **Archivos**:
  - `src/modules/agenda/services/agendaStorageService.js` (Líneas 328-340)
  - `src/modules/presupuestos/services/presupuestosStorageService.js` (Líneas 277-290)
  - `src/modules/pagos/services/pagosStorageService.js` (Líneas 182-198)
  - `src/modules/finanzas/services/finanzasStorageService.js` (Líneas 235-250)
  - `src/modules/pacientes/services/pacientesStorageService.js` (Líneas 321-339)
- **Descripción**: Al llamar a `guardar[Entidad](lista)`, el servicio consulta todos los IDs existentes en Supabase y ejecuta un `DELETE` sobre cualquier ID remoto que no esté presente en la lista del cliente local.
- **Riesgo**: Si un usuario tiene datos desactualizados, una lista filtrada o hay múltiples usuarios en la clínica, este código elimina los datos creados por otros profesionales.

### Hallazgo 2: `operationQueue.js` y `useOfflineQueue.js` son Código Muerto (P1)
- **Archivos**:
  - `src/services/operationQueue.js`
  - `src/hooks/useOfflineQueue.js`
- **Descripción**: La función `enqueue()` solo se invoca en `operationQueue.test.js`. Ningún flujo clínico o administrativo de la aplicación encola operaciones en modo offline.
- **Riesgo**: La infraestructura de sincronización diferida no tiene efecto alguno en la ejecución real.

### Hallazgo 3: Race Condition con Pérdida de Datos en `processQueue()` (P1)
- **Archivo**: `src/services/operationQueue.js` (Línea 211)
- **Descripción**: Al finalizar el bucle de procesamiento, se llama incondicionalmente a `writeQueue([])`.
- **Riesgo**: Si durante los segundos que dura el procesamiento de red se encola una nueva operación mediante `enqueue()`, `writeQueue([])` la borra silenciosamente de `localStorage`.

### Hallazgo 4: `conflictDetectionService.js` Desconectado (P1)
- **Archivo**: `src/services/conflictDetectionService.js`
- **Descripción**: Servicio completamente probado en unit tests pero sin ninguna referencia o importación activa en los módulos que mutan datos en Supabase.
- **Riesgo**: Cero protección contra colisiones en ambientes multi-sillón.

### Hallazgo 5: Destrucción Insegura de Base de Datos IndexedDB en Cambio de Clínica (P0)
- **Archivo**: `src/services/invalidarCacheCambioClinica.js` (Líneas 186-205)
- **Descripción**: Ejecuta `indexedDB.deleteDatabase('studio_dental_adjuntos')` de forma indiscriminada.
- **Riesgo**: Si un odontólogo tomó fotos o guardó consentimientos en modo offline (que quedan con `sincronizado: false`) y luego cambia de clínica, los archivos locales se eliminan permanentemente sin haber sido respaldados en Supabase Storage.

### Hallazgo 6: Eventos Realtime sin Escucha en Hooks de Módulo (P2)
- **Archivos**:
  - `src/hooks/useRealtimeSync.js`
  - `src/services/realtimeEvents.js`
  - Hooks: `useAgenda.js`, `usePresupuestos.js`, `usePagos.js`, `useFinanzas.js`, `useOdontograma.js`
- **Descripción**: `useRealtimeSync` dispara `window.dispatchEvent` con constantes como `realtime:citas_changed`, pero ningún hook de negocio tiene un `addEventListener` para actualizarse.
- **Riesgo**: Desincronización de pantalla entre profesionales que trabajan en simultáneo en la clínica.

### Hallazgo 7: `registrarEscrituraLocal` no se Invoca en Ningún Servicio (P2)
- **Archivo**: `src/hooks/useRealtimeSync.js` (Línea 25)
- **Descripción**: La función para prevenir bucles de eventos (`esEventoLocal`) depende de que los storage services llamen a `registrarEscrituraLocal(tabla)`. Ningún servicio la llama, por lo que el mecanismo de prevención de loops está inactivo.
