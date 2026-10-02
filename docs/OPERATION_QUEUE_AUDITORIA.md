# AUDITORÍA TÉCNICA: COLA OFFLINE Y OPERACIONES CRÍTICAS (P1-3)
**Proyecto**: Studio Dental (DentikOS)  
**Fecha**: Octubre 2026  
**Documento**: `docs/OPERATION_QUEUE_AUDITORIA.md`  
**Autor**: Ingeniero de Software Senior / Antigravity Agent  
**Estado**: Auditoría Técnica de Arquitectura (Solo Diagnóstico — Sin Modificación de Código)

---

## 1. RESUMEN EJECUTIVO

La Constitución de Arquitectura de Studio Dental establece como principio fundacional el modelo **Offline-First**: la aplicación debe permitir al odontólogo y al equipo clínico operar sin interrupciones en box ante caídas de internet, registrando atenciones, citas, presupuestos, pagos, evoluciones y fichas, persistiendo localmente y sincronizando automáticamente al recuperar conectividad.

Sin embargo, la auditoría profunda del subsistema de sincronización offline revela una realidad crítica:
1. **`operationQueue.js` es código huérfano en producción:** Cuenta con 240 líneas de código y suite de tests unitarios propia, pero **ningún módulo de negocio ni servicio de almacenamiento del sistema invoca `enqueue()`**. La cola de operaciones siempre está vacía en producción.
2. **Defecto de diseño destructivo en `processQueue()`:** La función de procesamiento contiene un patrón ciego `writeQueue([])` al finalizar su bucle. Si durante la ejecución de los reintentos entra una nueva operación encolada, esta es eliminada de inmediato sin haber sido procesada.
3. **Pérdida silenciosa de datos clínicos:** Al guardar un paciente, evolución, presupuesto o pago sin conexión, el sistema escribe en `localStorage`, pero el fallo remoto de Supabase se atrapa con un simple `log.warn`/`log.error` sin encolar la sincronización diferida. Cuando vuelve internet y se ejecuta `sincronizarDesdeSupabase()`, la caché remota sobreescribe el `localStorage`, **eliminando los registros creados offline**.
4. **Validación de la solución arquitectónica:** Tras el éxito contundente de las soluciones implementadas en **P0-1** (`pendingDeletes` en agenda) y **P0-2** (`pendingUploads` en adjuntos clínicos), existe un patrón arquitectónico probado, seguro e idempotente listo para ser replicado en el resto de los módulos críticos.

---

## 2. MATRIZ DE OPERACIONES CRÍTICAS OFFLINE

A continuación se audita cada operación de negocio del sistema, verificando si está encolada, dónde se pierde y cuál es su impacto clínico y legal:

| Entidad / Operación | Servicio Responsable | ¿Usa `operationQueue.enqueue()`? | Comportamiento Actual al Estar Offline | Impacto Clínico / Legal / Financiero |
| :--- | :--- | :--- | :--- | :--- |
| **Pacientes: Creación / Edición** | `pacientesStorageService.js` | ❌ **NO** (0 llamadas) | Guarda en `localStorage` con ID temporal de cliente. Atrapa la excepción de Supabase. Al reconectar, `sincronizarDesdeSupabase()` sobreescribe `pacientesCache` con la lista de Supabase, **borrando el paciente nuevo del almacenamiento local**. | **ALTO**. Ficha clínica desaparece. Paciente presente en clínica queda indocumentado; historial médico no persistido. |
| **Pacientes: Soft-Delete** | `pacientesStorageService.js` | ❌ **NO** (0 llamadas) | Aplica diff destructivo sobre Supabase (`idsASoftDelete`). Offline falla silenciosamente. | **MEDIO**. Registros reactivados erróneamente en otros dispositivos. |
| **Agenda: Creación / Edición de Citas** | `agendaStorageService.js` | ❌ **NO** (0 llamadas) | Guarda en `localStorage`. Supabase falla silenciosamente. Si otro sillón sincroniza, la cita offline no existe en la nube y puede ocurrir doble asignación de sillón/hora. | **CRÍTICO**. Doble reserva de pacientes sobre el mismo profesional o sillón dental (conflicto de agenda). |
| **Agenda: Eliminación de Citas** | `agendaStorageService.js` | ✅ **PROTEGIDO (P0-1)** | Utiliza `pendingDeletes` aislado por tenant. Si falla la red, el ID se conserva y se reintenta en el próximo ciclo de guardado. | **RESUELTO**. No destructivo, idempotente. |
| **Presupuestos: Creación / Modificación** | `presupuestosStorageService.js` | ❌ **NO** (0 llamadas) | Guarda en `presupuestosRepo` (`localStorage`). La promesa a Supabase falla en el `catch`. Al reconectar, `sincronizarDesdeSupabase()` sobreescribe la caché con los datos remotos. | **CRÍTICO**. Presupuestos aceptados por el paciente se pierden. Discrepancias arancelarias con recepción. |
| **Pagos y Abonos** | `pagosStorageService.js` | ❌ **NO** (0 llamadas) | Escribe en `localStorage`. Si Supabase está caído, no se registra en la base central. Al sincronizar remotamente, el pago desaparece de la vista global. | **CRÍTICO**. Pérdida de trazabilidad de recaudación, boletas y conciliación de caja al cierre del día. |
| **Movimientos Financieros** | `finanzasStorageService.js` | ❌ **NO** (0 llamadas) | Guarda en `finanzasRepo` local. Supabase falla y no encola. Al recargar la página conectado, no figura en balance. | **ALTO**. Descuadres en flujo de caja, gastos clínicos e insumos no registrados. |
| **Evoluciones Clínicas (Ficha Médica)** | `evolucionesStorageService.js` / `datosClinicosSupabase.js` | ❌ **NO** (0 llamadas) | Escribe en `localStorage` bajo `evoluciones_notas_${pacienteId}`. `guardarEvolucionClinica()` retorna `null`. Al reconectar, `sincronizarPaciente()` puebla la memoria desde Supabase y oculta la evolución offline. | **MÁXIMO (MÉDICO-LEGAL)**. Incumplimiento de la Ley 20.584 de Derechos y Deberes del Paciente: diagnósticos, anestesias o notas quirúrgicas no quedan en la ficha oficial. |
| **Recetas Médicas y Consentimientos** | `datosClinicosSupabase.js` | ❌ **NO** (0 llamadas) | Si no hay conexión, `guardarReceta()` y `guardarCertificado()` retornan `null`. Solo persisten en la memoria local si el componente lo hace manualmente. | **ALTO**. Paciente se retira con receta impresa pero sin respaldo auditable en la base de datos de la clínica. |
| **Odontogramas y Periodontogramas** | `datosClinicosSupabase.js` | ❌ **NO** (0 llamadas) | Guarda hallazgos en `localStorage`. Al reconectar, si se abre la ficha antes de sincronizar, puede sobreescribirse el estado dental. | **ALTO**. Diagnóstico de caries o periodontitis desactualizado entre boxes de atención. |
| **Adjuntos Clínicos (Fotos / RX / PDF)** | `adjuntosStorageService.js` | ✅ **PROTEGIDO (P0-2)** | Guarda en IndexedDB con `sincronizado: false` y encola en `pendingUploads`. Se sube automáticamente al volver internet. | **RESUELTO**. Cero pérdida de material binario. |

---

## 3. ANÁLISIS DEL CÓDIGO ACTUAL DE `operationQueue.js`

### A. ¿Qué hace `enqueue()` exactamente?
En [operationQueue.js](file:///Users/miguelito/Desktop/Studio%20Dental/src/services/operationQueue.js#L160-L176):
```javascript
export const enqueue = (operation) => {
  const id = generateId()
  const queue = readQueue()

  queue.push({
    id,
    timestamp: Date.now(),
    service: operation.service,
    method: operation.method,
    args: operation.args || [],
    retries: 0
  })

  writeQueue(queue)
  log.info(`Operación encolada: ${operation.service}.${operation.method} (ID: ${id})`)
  return id
}
```
1. Genera un ID pseudoaleatorio basado en timestamp.
2. Lee la cola actual de `localStorage` mediante `queueRepo.obtener([])`.
3. Empuja un objeto descriptivo con el nombre del servicio, el método y un arreglo de argumentos arbitrarios (`args`).
4. Serializa con `JSON.stringify` y escribe de vuelta en `localStorage`.

### B. Defectos Intrínsecos y Destrucción en `writeQueue([])`
En [operationQueue.js](file:///Users/miguelito/Desktop/Studio%20Dental/src/services/operationQueue.js#L182-L214):
```javascript
export const processQueue = async () => {
  // ... validaciones de lock y online ...
  const queue = readQueue()
  if (queue.length === 0) return

  processing = true
  log.info(`Procesando ${queue.length} operaciones pendientes...`)

  for (const operation of queue) {
    const success = await processOperation(operation)
    if (!success) {
      // (ya fue movida a failed_operations)
    }
  }

  // ❌ DESTRUCTOR CIEGO: Limpiar cola asumiendo que nada nuevo entró
  writeQueue([])
  processing = false
}
```
**Fallas estructurales graves:**
1. **Race Condition de Destrucción Masiva:** `processOperation` ejecuta hasta 5 reintentos con retardos exponenciales (hasta 8 segundos por intento). El bucle `for` puede tardar 20 o 30 segundos en completarse. Si mientras `processQueue` está iterando, el usuario realiza una nueva acción offline que invoca `enqueue()`, esa nueva operación se agrega a `localStorage`. Al terminar el bucle, la línea 211 ejecuta ciegamente `writeQueue([])`, **destruyendo la nueva operación sin haberla ejecutado**.
2. **Fragilidad de Invocación RPC:** `operationQueue` intenta resolver métodos dinámicamente:
   `STORAGE_SERVICES[operation.service][operation.method](...operation.args)`
   Esto asume que los métodos de los servicios son puros e idempotentes, cuando en realidad la mayoría de los métodos `guardar*` esperan listas completas, dependen del estado en memoria (`pacientesCache`), o realizan transformaciones que no son seguras de invocar horas después con argumentos congelados en el tiempo.
3. **Incompatibilidad con Binarios:** Al usar `localStorage`, no puede serializar `Blob` ni `File`, por lo que nunca pudo manejar adjuntos clínicos ni firmas digitales.
4. **Cero Cobertura Real:** Ningún módulo productivo del proyecto utiliza `enqueue`. Es código "zombi".

---

## 4. COMPARACIÓN CON PATRONES EXITOSOS (`pendingDeletes` y `pendingUploads`)

Durante las fases P0-1 y P0-2 se implementaron dos soluciones robustas que hoy cuentan con 100% de tests pasando en suites de seguridad y arquitectura. Comparémoslas contra `operationQueue`:

| Dimensión | `operationQueue.js` (Fallido) | `pendingDeletes` (P0-1) / `pendingUploads` (P0-2) |
| :--- | :--- | :--- |
| **Abstracción** | Comando genérico RPC (`service.method(args)`). | **Basado en Estado y Entidad de Dominio** (`citaId`, `adjuntoId`). |
| **Drenaje de Cola** | Destructivo global: `writeQueue([])` al terminar. | **Drenaje Atómico y Selectivo:** Solo se retiran de la cola los IDs cuyo ACK remoto fue confirmado exitosamente. |
| **Resiliencia ante Fallos** | Mueve a `failed_operations` y descarta la operación. | **Retención Fail-Closed:** Si la red falla, el item permanece en la cola local para el próximo intento. |
| **Idempotencia** | Baja. Re-ejecutar `method(...args)` puede duplicar registros o sobrescribir datos nuevos. | **Alta.** Enviar un soft-delete de `id` o un upload de archivo por su ID es intrínsecamente idempotente. |
| **Aislamiento Multi-Tenant** | Agregado a posteriori sobre `localStorage`. | **Nativo y Garantizado** vía repositorios tenant y llaves con prefijo de clínica. |
| **Almacenamiento de Binarios** | Imposible (falla en `localStorage`). | **Híbrido óptimo:** Metadatos livianos en tenant-storage, binarios reales en IndexedDB. |

---

## 5. RECOMENDACIÓN ARQUITECTÓNICA

Se evalúan las tres opciones posibles planteadas:

### Opción A: Reparar `operationQueue.js`
- **Enfoque:** Modificar `processQueue` para no usar `writeQueue([])`, agregar mecanismos transaccionales y forzar a todos los servicios a llamar `operationQueue.enqueue()`.
- **Evaluación:** **DESACONSEJADA**. El patrón de cola de comandos RPC genéricos serializados en JSON es un anti-patrón conocido en aplicaciones frontend. Los métodos de almacenamiento en Studio Dental no son comandos atómicos CQRS; son servicios con caché local optimista. Intentar meter argumentos complejos en un string JSON produce serializaciones rotas, problemas con tipos de datos (como fechas y blobs) y vulnerabilidades de estado obsoleto.

### Opción B: Unificar en el Patrón `pending-*` (RECOMENDADA)
- **Enfoque:** Extender el patrón probado y homologado en P0-1 y P0-2 al resto de las operaciones críticas mediante colas declarativas especializadas:
  1. **`pendingUpserts` en Pacientes:** Un registro de `{ id, fecha, datos }` para pacientes creados o editados offline. Al reconectar, se sincronizan contra Supabase antes de refrescar la caché, garantizando que el backend asigne UUID y nunca sobreescriba datos locales.
  2. **`pendingEvoluciones` en Ficha:** Las notas clínicas offline quedan en cola local con UUID temporal. Al recuperar conexión, se envían a Supabase y se actualiza el ID local.
  3. **`pendingPresupuestos` y `pendingPagos`:** Mismo mecanismo de intención diferida.
  4. **Retiro y Deprecación de `operationQueue.js`:** Eliminar el archivo huérfano para limpiar la deuda técnica y evitar confusiones en futuros desarrolladores.
- **Justificación:** Mantiene coherencia arquitectónica total con la Constitución y con las fases F7 de aislamiento multi-tenant. Cada módulo es dueño de su ciclo de vida y garantiza consistencia de sus datos sin depender de un ejecutor RPC frágil.

### Opción C: Abandonar Offline-First para Escrituras Complejas
- **Enfoque:** Bloquear la creación de pacientes y presupuestos si no hay conexión a internet; permitir únicamente lectura local.
- **Evaluación:** **INACEPTABLE**. Destruye la propuesta de valor de Studio Dental. En muchas clínicas odontológicas, los boxes o pabellones tienen mala cobertura de wifi. Un dentista no puede estar bloqueado de ingresar una evolución clínica o anestesia porque se cayó la conexión durante una cirugía.

---

## 6. BATERÍA DE TESTS PROPUESTA PARA LA IMPLEMENTACIÓN (PLAN DE PREVENCIÓN)

Para la futura implementación de la Opción B, se propone la siguiente matriz de pruebas automatizadas:

```javascript
describe('Offline Sync: Patrón pending-* en operaciones clínicas', () => {
  // 1. Pacientes Offline
  it('debe retener paciente creado offline y sincronizarlo al reconectar sin ser sobreescrito', async () => {
    // Simular offline -> crearPaciente -> verificar en pendingUpserts
    // Simular online -> sincronizar -> verificar inserción en Supabase y retiro de cola
  })

  // 2. Evoluciones Clínicas
  it('debe preservar notas de evolución creadas offline y sincronizarlas con su paciente_id', async () => {
    // Crear evolución sin red -> verificar persistencia en localStorage
    // Reconectar -> verificar que la evolución no desaparece al ejecutar sincronizarPaciente()
  })

  // 3. Drenaje Selectivo (Anti-Race Condition)
  it('no debe borrar operaciones nuevas añadidas mientras se procesa la cola', async () => {
    // Encolar op1 -> iniciar proceso -> encolar op2 concurrentemente
    // Verificar que al terminar op1, op2 sigue encolada intacta
  })

  // 4. Aislamiento Multi-Clínica
  it('la cola de operaciones pendientes de Clínica A nunca se ejecuta en sesión de Clínica B', async () => {
    // Encolar en clínica A -> cambiar sesión a clínica B -> ejecutar drenaje -> op de A no se ejecuta
  })
})
```

---

## 7. CONCLUSIÓN Y PRÓXIMOS PASOS

1. `operationQueue.js` debe considerarse **obsoleto y desconectado**. No debe invertirse esfuerzo en conectarlo a la fuerza.
2. La arquitectura debe adoptar de forma estándar el patrón **`pending-*`** inaugurado con `pendingDeletes` (P0-1) y `pendingUploads` (P0-2).
3. Se recomienda programar la implementación secuencial de este patrón iniciando por **Evoluciones Clínicas** (máximo riesgo médico-legal) y **Pacientes** (raíz relacional de toda la información).
