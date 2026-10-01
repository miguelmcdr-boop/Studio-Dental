/**
 * Tests de aislamiento multi-clínica para pacientes-purge
 * F7-34b: Garantiza que usuario con membresías en A+B solo pueda purgar en la clínica activa
 */
import { assertEquals, assertNotEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { handler } from "./index.ts";
import { createMockFetch, createAuthRequest, setupDenoEnv } from "../_shared/testUtils.ts";

const USER_ID = "user-123";
const CLINICA_A = "clinica-A-uuid";
const CLINICA_B = "clinica-B-uuid";
const PACIENTE_A = "paciente-A-uuid";
const PACIENTE_B = "paciente-B-uuid";

setupDenoEnv();

// Helper: crea mocks donde user tiene membresías en A (activa) y B (activa)
const baseMemberships = [
  { user_id: USER_ID, clinica_id: CLINICA_A, rol: "admin", activo: true },
  { user_id: USER_ID, clinica_id: CLINICA_B, rol: "admin", activo: true },
];

const basePacientes = [
  { id: PACIENTE_A, clinica_id: CLINICA_A, nombre: "Paciente A", rut: "11.111.111-1", deleted_at: "2010-01-01T00:00:00Z" },
  { id: PACIENTE_B, clinica_id: CLINICA_B, nombre: "Paciente B", rut: "22.222.222-2", deleted_at: "2010-01-01T00:00:00Z" },
];

Deno.test("T1: Usuario con clinica A activa puede purgar paciente A", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = createMockFetch({
    authUser: { id: USER_ID, user_metadata: { clinica_id: CLINICA_A } },
    memberships: baseMemberships,
    pacientes: basePacientes,
  }) as any;

  try {
    const req = createAuthRequest({ paciente_ids: [PACIENTE_A] });
    const res = await handler(req);
    const body = await res.json();
    assertEquals(res.status, 200);
    assertEquals(body.purgados, [PACIENTE_A]);
    assertEquals(body.rechazados, []);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("T2: Usuario con clinica A activa NO puede purgar paciente B (cross-clinic)", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = createMockFetch({
    authUser: { id: USER_ID, user_metadata: { clinica_id: CLINICA_A } },
    memberships: baseMemberships,
    pacientes: basePacientes,
  }) as any;

  try {
    const req = createAuthRequest({ paciente_ids: [PACIENTE_B] });
    const res = await handler(req);
    const body = await res.json();
    assertEquals(res.status, 200);
    assertEquals(body.purgados, []);
    assertEquals(body.rechazados.length, 1);
    assertEquals(body.rechazados[0].id, PACIENTE_B);
    assertEquals(body.rechazados[0].razon, "no_pertenece_clinica");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("T3: Usuario con clinica B activa puede purgar paciente B", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = createMockFetch({
    authUser: { id: USER_ID, user_metadata: { clinica_id: CLINICA_B } },
    memberships: baseMemberships,
    pacientes: basePacientes,
  }) as any;

  try {
    const req = createAuthRequest({ paciente_ids: [PACIENTE_B] });
    const res = await handler(req);
    const body = await res.json();
    assertEquals(res.status, 200);
    assertEquals(body.purgados, [PACIENTE_B]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("T4: Usuario con clinica B activa NO puede purgar paciente A (cross-clinic)", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = createMockFetch({
    authUser: { id: USER_ID, user_metadata: { clinica_id: CLINICA_B } },
    memberships: baseMemberships,
    pacientes: basePacientes,
  }) as any;

  try {
    const req = createAuthRequest({ paciente_ids: [PACIENTE_A] });
    const res = await handler(req);
    const body = await res.json();
    assertEquals(res.status, 200);
    assertEquals(body.purgados, []);
    assertEquals(body.rechazados[0].razon, "no_pertenece_clinica");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("T5: Sin clinica activa en JWT -> 403", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = createMockFetch({
    authUser: { id: USER_ID, user_metadata: {} },
    memberships: baseMemberships,
    pacientes: basePacientes,
  }) as any;

  try {
    const req = createAuthRequest({ paciente_ids: [PACIENTE_A] });
    const res = await handler(req);
    assertEquals(res.status, 403);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("T6: Miembro de clinica A pero membresia revocada (activo=false) -> 403", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = createMockFetch({
    authUser: { id: USER_ID, user_metadata: { clinica_id: CLINICA_A } },
    memberships: [
      { user_id: USER_ID, clinica_id: CLINICA_A, rol: "admin", activo: false },
      { user_id: USER_ID, clinica_id: CLINICA_B, rol: "admin", activo: true },
    ],
    pacientes: basePacientes,
  }) as any;

  try {
    const req = createAuthRequest({ paciente_ids: [PACIENTE_A] });
    const res = await handler(req);
    assertEquals(res.status, 403);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("T7: Rol no-admin no puede purgar", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = createMockFetch({
    authUser: { id: USER_ID, user_metadata: { clinica_id: CLINICA_A } },
    memberships: [
      { user_id: USER_ID, clinica_id: CLINICA_A, rol: "dentista", activo: true },
    ],
    pacientes: basePacientes,
  }) as any;

  try {
    const req = createAuthRequest({ paciente_ids: [PACIENTE_A] });
    const res = await handler(req);
    assertEquals(res.status, 403);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("T8: Sin JWT -> 401", async () => {
  const req = new Request("http://localhost/pacientes-purge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paciente_ids: [PACIENTE_A] }),
  });
  const res = await handler(req);
  assertEquals(res.status, 401);
});

Deno.test("T9: Error 500 NO expone error.message al cliente", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => {
    throw new Error("SENSITIVE SQL SYNTAX ERROR DETAILS");
  }) as any;

  try {
    const req = createAuthRequest({ paciente_ids: [PACIENTE_A] });
    const res = await handler(req);
    const body = await res.json();
    assertEquals(res.status, 500);
    assertNotEquals(body.message, "SENSITIVE SQL SYNTAX ERROR DETAILS");
    assertEquals(body.message, "Ocurrió un error procesando la solicitud");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("T10: Retención legal - paciente eliminado hace menos de 10 años es rechazado", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = createMockFetch({
    authUser: { id: USER_ID, user_metadata: { clinica_id: CLINICA_A } },
    memberships: baseMemberships,
    pacientes: [
      { id: PACIENTE_A, clinica_id: CLINICA_A, deleted_at: new Date().toISOString() }, // eliminado hoy
    ],
  }) as any;

  try {
    const req = createAuthRequest({ paciente_ids: [PACIENTE_A] });
    const res = await handler(req);
    const body = await res.json();
    assertEquals(body.rechazados[0].razon, "retencion_legal_10_anios");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// ============================================================
// F7-36 FASE 6: Tests de fail-safe (casos D y E del brief)
// ============================================================

Deno.test("T11: Archivo R2 falla -> paciente NO eliminado (caso D)", async () => {
  const originalFetch = globalThis.fetch;
  // Paciente con 1 archivo en R2. Mock hace que R2 falle.
  const mockFetch = createMockFetch({
    authUser: { id: USER_ID, user_metadata: { clinica_id: CLINICA_A } },
    memberships: baseMemberships,
    pacientes: [
      { id: PACIENTE_A, clinica_id: CLINICA_A, deleted_at: "2010-01-01T00:00:00Z" },
    ],
    archivos: [
      { id: "arch-1", clinica_id: CLINICA_A, paciente_id: PACIENTE_A, r2_object_key: "key-falla", estado: "eliminado" },
    ],
    r2DeleteOk: false, // R2 falla
  }) as any;

  // Spy de DELETE a pacientes (captura mockFetch en variable para evitar recursión)
  const deleteCalls: string[] = [];
  const wrappedFetch = async (url: any, init?: any) => {
    const urlStr = typeof url === "string" ? url : url.url;
    if (init?.method === "DELETE" && urlStr.includes("/rest/v1/pacientes")) {
      deleteCalls.push(urlStr);
    }
    return mockFetch(url, init);
  };
  globalThis.fetch = wrappedFetch as any;

  try {
    const req = createAuthRequest({ paciente_ids: [PACIENTE_A] });
    const res = await handler(req);
    const body = await res.json();
    assertEquals(res.status, 200);
    assertEquals(body.purgados, []);
    assertEquals(body.rechazados.length, 1);
    assertEquals(body.rechazados[0].id, PACIENTE_A);
    assertEquals(body.rechazados[0].razon, "r2_parcial_1_de_1_fallidos");
    // CRITICO: DELETE a pacientes NO debe haberse ejecutado
    assertEquals(deleteCalls.length, 0, "DELETE a pacientes NO debe ejecutarse si R2 falla");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("T12: Multiples archivos, uno falla -> paciente rechazado (caso E)", async () => {
  const originalFetch = globalThis.fetch;
  // Paciente con 3 archivos. Solo 1 falla en R2.
  const ARCHIVO_FALLA = "key-que-falla";
  const mockFetch = createMockFetch({
    authUser: { id: USER_ID, user_metadata: { clinica_id: CLINICA_A } },
    memberships: baseMemberships,
    pacientes: [
      { id: PACIENTE_A, clinica_id: CLINICA_A, deleted_at: "2010-01-01T00:00:00Z" },
    ],
    archivos: [
      { id: "arch-1", clinica_id: CLINICA_A, paciente_id: PACIENTE_A, r2_object_key: "key-ok-1", estado: "eliminado" },
      { id: "arch-2", clinica_id: CLINICA_A, paciente_id: PACIENTE_A, r2_object_key: ARCHIVO_FALLA, estado: "eliminado" },
      { id: "arch-3", clinica_id: CLINICA_A, paciente_id: PACIENTE_A, r2_object_key: "key-ok-2", estado: "eliminado" },
    ],
    r2DeleteOk: [ARCHIVO_FALLA], // Solo falla uno
  }) as any;

  const deleteCalls: string[] = [];
  const wrappedFetch = async (url: any, init?: any) => {
    const urlStr = typeof url === "string" ? url : url.url;
    if (init?.method === "DELETE" && urlStr.includes("/rest/v1/pacientes")) {
      deleteCalls.push(urlStr);
    }
    return mockFetch(url, init);
  };
  globalThis.fetch = wrappedFetch as any;

  try {
    const req = createAuthRequest({ paciente_ids: [PACIENTE_A] });
    const res = await handler(req);
    const body = await res.json();
    assertEquals(res.status, 200);
    assertEquals(body.purgados, []);
    assertEquals(body.rechazados.length, 1);
    assertEquals(body.rechazados[0].id, PACIENTE_A);
    assertEquals(body.rechazados[0].razon, "r2_parcial_1_de_3_fallidos");
    // CRITICO: DELETE a pacientes NO debe haberse ejecutado
    assertEquals(deleteCalls.length, 0, "DELETE a pacientes NO debe ejecutarse si algun R2 falla");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
