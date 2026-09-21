// F7-34: Tests de escenario multi-clínica para Edge Functions R2
//
// Escenario obligatorio:
// Usuario X con membresías en Clínica A y Clínica B
// - Selecciona Clínica A -> operación afecta solo Clínica A
// - Selecciona Clínica B -> operación afecta solo Clínica B
// - Intenta acceder a recurso de Clínica B con Clínica A activa -> DENEGADO

import { assertEquals, assertExists } from "https://deno.land/std@0.208.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "http://localhost:54321";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// ============================================================
// HELPERS
// ============================================================

async function invokeEdgeFunction(
  functionName: string,
  body: Record<string, unknown>,
  jwt: string
): Promise<{ status: number; data: Record<string, unknown> }> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${jwt}`,
      "Content-Type": "application/json",
      "apikey": SUPABASE_SERVICE_KEY,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  return { status: response.status, data };
}

async function setupMultiClinicUser(): Promise<{
  userId: string;
  clinicaAId: string;
  clinicaBId: string;
  jwtClinicaA: string;
  jwtClinicaB: string;
  archivoClinicaAId: string;
  archivoClinicaBId: string;
}> {
  // Setup: Crear usuario con membresías en Clínica A y Clínica B
  // Esto requiere acceso a Supabase Admin API o fixtures de test
  
  // Placeholder: En implementación real, usar Supabase Admin API
  // o fixtures de test con usuarios pre-creados
  
  throw new Error("Setup multi-clínica requiere fixtures de test o Supabase Admin API");
}

// ============================================================
// TEST 1: Usuario selecciona Clínica A, opera solo sobre Clínica A
// ============================================================

Deno.test("F7-34: Usuario con Clínica A activa opera solo sobre Clínica A", async () => {
  // Setup
  const { userId, clinicaAId, jwtClinicaA, archivoClinicaAId } = await setupMultiClinicUser();

  // Test: r2-list-deleted con Clínica A activa
  const listResult = await invokeEdgeFunction(
    "r2-list-deleted",
    {},
    jwtClinicaA
  );

  assertEquals(listResult.status, 200, "r2-list-deleted debe retornar 200");
  
  // Verificar que solo lista archivos de Clínica A
  const archivos = listResult.data.archivos as Array<{ clinica_id: string }>;
  for (const archivo of archivos) {
    assertEquals(
      archivo.clinica_id,
      clinicaAId,
      "Todos los archivos listados deben pertenecer a Clínica A"
    );
  }
});

// ============================================================
// TEST 2: Usuario selecciona Clínica B, opera solo sobre Clínica B
// ============================================================

Deno.test("F7-34: Usuario con Clínica B activa opera solo sobre Clínica B", async () => {
  // Setup
  const { userId, clinicaBId, jwtClinicaB, archivoClinicaBId } = await setupMultiClinicUser();

  // Test: r2-list-deleted con Clínica B activa
  const listResult = await invokeEdgeFunction(
    "r2-list-deleted",
    {},
    jwtClinicaB
  );

  assertEquals(listResult.status, 200, "r2-list-deleted debe retornar 200");
  
  // Verificar que solo lista archivos de Clínica B
  const archivos = listResult.data.archivos as Array<{ clinica_id: string }>;
  for (const archivo of archivos) {
    assertEquals(
      archivo.clinica_id,
      clinicaBId,
      "Todos los archivos listados deben pertenecer a Clínica B"
    );
  }
});

// ============================================================
// TEST 3: Usuario con Clínica A activa intenta acceder a recurso de Clínica B -> DENEGADO
// ============================================================

Deno.test("F7-34: Usuario con Clínica A activa NO puede acceder a recurso de Clínica B", async () => {
  // Setup
  const { userId, clinicaAId, clinicaBId, jwtClinicaA, archivoClinicaBId } = await setupMultiClinicUser();

  // Test: r2-download-url con archivo de Clínica B pero JWT de Clínica A
  const downloadResult = await invokeEdgeFunction(
    "r2-download-url",
    { archivo_id: archivoClinicaBId },
    jwtClinicaA
  );

  assertEquals(downloadResult.status, 403, "Debe retornar 403 al intentar acceder a recurso de otra clínica");
  assertEquals(
    downloadResult.data.error,
    "Archivo not found, does not belong to your clínica, or is not active",
    "Mensaje de error debe indicar que el archivo no pertenece a la clínica activa"
  );
});

// ============================================================
// TEST 4: Usuario con Clínica B activa intenta acceder a recurso de Clínica A -> DENEGADO
// ============================================================

Deno.test("F7-34: Usuario con Clínica B activa NO puede acceder a recurso de Clínica A", async () => {
  // Setup
  const { userId, clinicaAId, clinicaBId, jwtClinicaB, archivoClinicaAId } = await setupMultiClinicUser();

  // Test: r2-download-url con archivo de Clínica A pero JWT de Clínica B
  const downloadResult = await invokeEdgeFunction(
    "r2-download-url",
    { archivo_id: archivoClinicaAId },
    jwtClinicaB
  );

  assertEquals(downloadResult.status, 403, "Debe retornar 403 al intentar acceder a recurso de otra clínica");
});

// ============================================================
// TEST 5: Usuario sin clínica activa -> DENEGADO
// ============================================================

Deno.test("F7-34: Usuario sin clínica activa recibe 403", async () => {
  // Setup: Crear JWT sin user_metadata.clinica_id
  // Placeholder: Requiere fixture de test
  
  throw new Error("Requiere fixture de usuario sin clínica activa");
});

// ============================================================
// TEST 6: Usuario con membresía inactiva -> DENEGADO
// ============================================================

Deno.test("F7-34: Usuario con membresía inactiva recibe 403", async () => {
  // Setup: Crear usuario con membresía activo=false
  // Placeholder: Requiere fixture de test
  
  throw new Error("Requiere fixture de usuario con membresía inactiva");
});

// ============================================================
// TEST 7: r2-upload-url respeta clínica activa
// ============================================================

Deno.test("F7-34: r2-upload-url guarda archivo en clínica activa", async () => {
  // Setup
  const { userId, clinicaAId, jwtClinicaA } = await setupMultiClinicUser();

  // Test: r2-upload-url con Clínica A activa
  const uploadResult = await invokeEdgeFunction(
    "r2-upload-url",
    {
      paciente_id: "test-paciente-id",
      categoria: "radiografia",
      nombre_archivo: "test-radiografia.jpg",
      mime_type: "image/jpeg",
      tamano_bytes: 1024,
    },
    jwtClinicaA
  );

  assertEquals(uploadResult.status, 200, "r2-upload-url debe retornar 200");
  
  // Verificar que el r2_object_key contiene la clínica activa
  const r2ObjectKey = uploadResult.data.r2_object_key as string;
  if (!r2ObjectKey.startsWith(clinicaAId)) {
    throw new Error(`r2_object_key debe empezar con clinica_id activo. Esperado: ${clinicaAId}, Obtenido: ${r2ObjectKey}`);
  }
});

// ============================================================
// TEST 8: r2-delete respeta clínica activa
// ============================================================

Deno.test("F7-34: r2-delete solo elimina archivos de clínica activa", async () => {
  // Setup
  const { userId, clinicaAId, clinicaBId, jwtClinicaA, archivoClinicaAId, archivoClinicaBId } = await setupMultiClinicUser();

  // Test: r2-delete con archivo de Clínica A (debe funcionar)
  const deleteResultA = await invokeEdgeFunction(
    "r2-delete",
    { archivo_id: archivoClinicaAId },
    jwtClinicaA
  );
  assertEquals(deleteResultA.status, 200, "r2-delete debe funcionar con archivo de clínica activa");

  // Test: r2-delete con archivo de Clínica B (debe fallar con 404)
  const deleteResultB = await invokeEdgeFunction(
    "r2-delete",
    { archivo_id: archivoClinicaBId },
    jwtClinicaA
  );
  assertEquals(deleteResultB.status, 404, "r2-delete debe retornar 404 con archivo de otra clínica");
});

// ============================================================
// TEST 9: r2-restore respeta clínica activa
// ============================================================

Deno.test("F7-34: r2-restore solo restaura archivos de clínica activa", async () => {
  // Setup
  const { userId, clinicaAId, clinicaBId, jwtClinicaA, archivoClinicaAId, archivoClinicaBId } = await setupMultiClinicUser();

  // Test: r2-restore con archivo de Clínica B pero JWT de Clínica A (debe fallar)
  const restoreResult = await invokeEdgeFunction(
    "r2-restore",
    { archivo_id: archivoClinicaBId },
    jwtClinicaA
  );
  assertEquals(restoreResult.status, 404, "r2-restore debe retornar 404 con archivo de otra clínica");
});

// ============================================================
// TEST 10: archivos-purge respeta clínica activa
// ============================================================

Deno.test("F7-34: archivos-purge solo purga archivos de clínica activa", async () => {
  // Setup
  const { userId, clinicaAId, clinicaBId, jwtClinicaA, archivoClinicaAId, archivoClinicaBId } = await setupMultiClinicUser();

  // Test: archivos-purge con array de archivos de ambas clínicas
  const purgeResult = await invokeEdgeFunction(
    "archivos-purge",
    { archivo_ids: [archivoClinicaAId, archivoClinicaBId] },
    jwtClinicaA
  );

  assertEquals(purgeResult.status, 200, "archivos-purge debe retornar 200");
  
  // Verificar que solo se purgó el archivo de Clínica A
  const purgados = purgeResult.data.purgados as string[];
  const rechazados = purgeResult.data.rechazados as Array<{ id: string; razon: string }>;
  
  if (!purgados.includes(archivoClinicaAId)) {
    throw new Error("Archivo de Clínica A debe ser purgado");
  }
  
  if (!rechazados.some(r => r.id === archivoClinicaBId)) {
    throw new Error("Archivo de Clínica B debe ser rechazado");
  }
});

