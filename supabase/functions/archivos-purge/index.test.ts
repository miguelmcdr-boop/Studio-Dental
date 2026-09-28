/**
 * Tests de aislamiento multi-clínica para archivos-purge
 * F7-34b: Aislamiento por clínica en modo usuario + modo cron interno
 */
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { handler } from "./index.ts";
import { createMockFetch, setupDenoEnv } from "../_shared/testUtils.ts";

const USER_ID = "user-123";
const CLINICA_A = "clinica-A-uuid";
const CLINICA_B = "clinica-B-uuid";
const ARCHIVO_A = "archivo-A-uuid";
const ARCHIVO_B = "archivo-B-uuid";

setupDenoEnv();

const baseMemberships = [
  { user_id: USER_ID, clinica_id: CLINICA_A, rol: "admin", activo: true },
  { user_id: USER_ID, clinica_id: CLINICA_B, rol: "admin", activo: true },
];

const baseArchivos = [
  { id: ARCHIVO_A, clinica_id: CLINICA_A, r2_object_key: `${CLINICA_A}/pac/r2key`, estado: "eliminado", nombre_archivo: "a.pdf" },
  { id: ARCHIVO_B, clinica_id: CLINICA_B, r2_object_key: `${CLINICA_B}/pac/r2key`, estado: "eliminado", nombre_archivo: "b.pdf" },
];

function createRequest(body: object, token = "valid-jwt"): Request {
  return new Request("http://localhost/archivos-purge", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

Deno.test("T1: Usuario con clinica A activa puede purgar archivo A", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = createMockFetch({
    authUser: { id: USER_ID, user_metadata: { clinica_id: CLINICA_A } },
    memberships: baseMemberships,
    archivos: baseArchivos,
  }) as any;

  try {
    const req = createRequest({ archivo_ids: [ARCHIVO_A] });
    const res = await handler(req);
    const body = await res.json();
    assertEquals(res.status, 200);
    assertEquals(body.purgados, [ARCHIVO_A]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("T2: Usuario con clinica A activa NO puede purgar archivo B (cross-clinic)", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = createMockFetch({
    authUser: { id: USER_ID, user_metadata: { clinica_id: CLINICA_A } },
    memberships: baseMemberships,
    archivos: baseArchivos,
  }) as any;

  try {
    const req = createRequest({ archivo_ids: [ARCHIVO_B] });
    const res = await handler(req);
    const body = await res.json();
    assertEquals(res.status, 200);
    assertEquals(body.purgados, []);
    assertEquals(body.rechazados[0].razon, "no_pertenece_clinica");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("T3: Miembro con membresía revocada en A -> 403", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = createMockFetch({
    authUser: { id: USER_ID, user_metadata: { clinica_id: CLINICA_A } },
    memberships: [
      { user_id: USER_ID, clinica_id: CLINICA_A, rol: "admin", activo: false },
    ],
    archivos: baseArchivos,
  }) as any;

  try {
    const req = createRequest({ archivo_ids: [ARCHIVO_A] });
    const res = await handler(req);
    assertEquals(res.status, 403);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("T4: Modo cron interno con X-Internal-Secret puede purgar sin JWT", async () => {
  Deno.env.set("INTERNAL_PURGE_SECRET", "cron-secret-123");
  const originalFetch = globalThis.fetch;
  globalThis.fetch = createMockFetch({
    archivos: baseArchivos,
  }) as any;

  try {
    const req = new Request("http://localhost/archivos-purge", {
      method: "POST",
      headers: {
        "X-Internal-Secret": "cron-secret-123",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ archivo_ids: [ARCHIVO_A] }),
    });
    const res = await handler(req);
    const body = await res.json();
    assertEquals(res.status, 200);
    assertEquals(body.purgados, [ARCHIVO_A]);
  } finally {
    globalThis.fetch = originalFetch;
    Deno.env.delete("INTERNAL_PURGE_SECRET");
  }
});

Deno.test("T5: X-Internal-Secret incorrecto -> 401", async () => {
  Deno.env.set("INTERNAL_PURGE_SECRET", "cron-secret-123");
  try {
    const req = new Request("http://localhost/archivos-purge", {
      method: "POST",
      headers: {
        "X-Internal-Secret": "wrong-secret",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ archivo_ids: [ARCHIVO_A] }),
    });
    const res = await handler(req);
    assertEquals(res.status, 401);
  } finally {
    Deno.env.delete("INTERNAL_PURGE_SECRET");
  }
});

Deno.test("T6: Error 500 NO expone error.message al cliente", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => {
    throw new Error("SENSITIVE SQL ERROR");
  }) as any;

  try {
    const req = createRequest({ archivo_ids: [ARCHIVO_A] });
    const res = await handler(req);
    const body = await res.json();
    assertEquals(res.status, 500);
    assertEquals(body.message, "Ocurrió un error procesando la solicitud");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// ============================================================
// F7-36 FASE 6: Tests de fail-safe (casos D y E del brief)
// ============================================================

Deno.test("T7: R2 falla -> archivo NO eliminado (caso D)", async () => {
  const originalFetch = globalThis.fetch;
  const mockFetch = createMockFetch({
    authUser: { id: USER_ID, user_metadata: { clinica_id: CLINICA_A } },
    memberships: baseMemberships,
    archivos: baseArchivos,
    r2DeleteOk: false, // R2 falla
  }) as any;

  // Spy de DELETE a archivos_clinicos (captura mockFetch para evitar recursión)
  const deleteCalls: string[] = [];
  const wrappedFetch = async (url: any, init?: any) => {
    const urlStr = typeof url === "string" ? url : url.url;
    if (init?.method === "DELETE" && urlStr.includes("/rest/v1/archivos_clinicos")) {
      deleteCalls.push(urlStr);
    }
    return mockFetch(url, init);
  };
  globalThis.fetch = wrappedFetch as any;

  try {
    const req = createRequest({ archivo_ids: [ARCHIVO_A] });
    const res = await handler(req);
    const body = await res.json();
    assertEquals(res.status, 200);
    assertEquals(body.purgados, []);
    assertEquals(body.rechazados.length, 1);
    assertEquals(body.rechazados[0].id, ARCHIVO_A);
    assertEquals(body.rechazados[0].razon, "error_delete_r2");
    // CRITICO: DELETE a archivos_clinicos NO debe ejecutarse si R2 falla
    assertEquals(deleteCalls.length, 0, "DELETE a archivos_clinicos NO debe ejecutarse si R2 falla");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("T8: Multiples archivos, mixto -> solo exitos purgados (caso E)", async () => {
  const originalFetch = globalThis.fetch;
  const ARCHIVO_C = "archivo-C-uuid";
  const ARCHIVO_FALLA = `${CLINICA_A}/pac/r2key-falla`;

  const archivosMix = [
    { id: ARCHIVO_A, clinica_id: CLINICA_A, r2_object_key: `${CLINICA_A}/pac/r2key`, estado: "eliminado", nombre_archivo: "a.pdf" },
    { id: ARCHIVO_B, clinica_id: CLINICA_A, r2_object_key: ARCHIVO_FALLA, estado: "eliminado", nombre_archivo: "b.pdf" },
    { id: ARCHIVO_C, clinica_id: CLINICA_A, r2_object_key: `${CLINICA_A}/pac/r2key-c`, estado: "eliminado", nombre_archivo: "c.pdf" },
  ];

  const mockFetch = createMockFetch({
    authUser: { id: USER_ID, user_metadata: { clinica_id: CLINICA_A } },
    memberships: baseMemberships,
    archivos: archivosMix,
    r2DeleteOk: [ARCHIVO_FALLA], // Solo falla uno
  }) as any;
  globalThis.fetch = mockFetch as any;

  try {
    const req = createRequest({ archivo_ids: [ARCHIVO_A, ARCHIVO_B, ARCHIVO_C] });
    const res = await handler(req);
    const body = await res.json();
    assertEquals(res.status, 200);
    // A y C purgados, B rechazado
    assertEquals(body.purgados.length, 2);
    assertEquals(body.purgados.includes(ARCHIVO_A), true);
    assertEquals(body.purgados.includes(ARCHIVO_C), true);
    assertEquals(body.purgados.includes(ARCHIVO_B), false);
    assertEquals(body.rechazados.length, 1);
    assertEquals(body.rechazados[0].id, ARCHIVO_B);
    assertEquals(body.rechazados[0].razon, "error_delete_r2");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
