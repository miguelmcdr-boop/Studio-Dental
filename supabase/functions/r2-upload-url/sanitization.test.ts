/**
 * F7-35: Tests de sanitización de errores en r2-upload-url.
 * Verifica que errores internos de Supabase/PostgREST no se filtren al cliente.
 */
import { assertEquals, assertNotEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { handler } from "./index.ts";
import { createMockFetch, createAuthRequest, setupDenoEnv } from "../_shared/testUtils.ts";

const USER_ID = "user-123";
const CLINICA_A = "clinica-A-uuid";

setupDenoEnv();

Deno.test("S1: Error de autenticación NO expone authError al cliente", async () => {
  const originalFetch = globalThis.fetch;
  // Mock que falla en /auth/v1/user
  globalThis.fetch = (async (url: string | URL | Request) => {
    const urlStr = typeof url === "string" ? url : url instanceof URL ? url.toString() : url.url;
    if (urlStr.includes("/auth/v1/user")) {
      return new Response(JSON.stringify({
        error: "invalid_grant",
        error_description: "Token has expired or been revoked"
      }), { status: 401, headers: { "Content-Type": "application/json" } });
    }
    return new Response("Not found", { status: 404 });
  }) as any;

  try {
    const req = createAuthRequest({
      paciente_id: "pac-uuid",
      categoria: "pdf",
      nombre_archivo: "test.pdf",
      mime_type: "application/pdf",
      tamano_bytes: 1024
    });
    const res = await handler(req);
    const body = await res.json();

    assertEquals(res.status, 401);
    assertEquals(body.error, "INVALID_JWT");
    // CRÍTICO: ningún detalle del error de Supabase Auth debe aparecer
    const bodyStr = JSON.stringify(body);
    if (bodyStr.includes("invalid_grant") || bodyStr.includes("revoked")) {
      throw new Error("FUGA: detalles de Supabase Auth expuestos al cliente");
    }
    if ("details" in body) {
      throw new Error("FUGA: campo 'details' todavía presente en response");
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("S2: Error de inserción en archivos_clinicos NO expone PostgREST error", async () => {
  const originalFetch = globalThis.fetch;
  let callCount = 0;
  
  // Guardar referencia del mock base ANTES de asignar wrappedFetch
  const baseMockFetch = createMockFetch({
    authUser: { id: USER_ID, user_metadata: { clinica_id: CLINICA_A } },
    memberships: [{ user_id: USER_ID, clinica_id: CLINICA_A, rol: "admin", activo: true }],
    pacientes: [{ id: "pac-uuid", clinica_id: CLINICA_A, deleted_at: undefined }],
  }) as any;

  // Wrap para forzar error en POST a archivos_clinicos
  // Usa baseMockFetch (no globalThis.fetch) para evitar recursión infinita
  const wrappedFetch = (async (url: string | URL | Request, init?: RequestInit) => {
    const urlStr = typeof url === "string" ? url : url instanceof URL ? url.toString() : url.url;
    if (urlStr.includes("/rest/v1/archivos_clinicos") && init?.method === "POST") {
      return new Response(JSON.stringify({
        code: "23505",
        message: "duplicate key value violates unique constraint",
        details: "Key (r2_object_key)=(...) already exists",
        hint: "Check r2_object_key uniqueness"
      }), { status: 409, headers: { "Content-Type": "application/json" } });
    }
    return baseMockFetch(url, init);
  }) as any;

  try {
    globalThis.fetch = wrappedFetch;
    const req = createAuthRequest({
      paciente_id: "pac-uuid",
      categoria: "pdf",
      nombre_archivo: "test.pdf",
      mime_type: "application/pdf",
      tamano_bytes: 1024
    });
    const res = await handler(req);
    const body = await res.json();

    // Debe fallar (409 o 500) pero NO exponer detalles
    assertNotEquals(res.status, 200);
    const bodyStr = JSON.stringify(body);
    if (bodyStr.includes("23505") || bodyStr.includes("duplicate key")) {
      throw new Error("FUGA: código/mensaje PostgREST expuesto al cliente");
    }
    if (bodyStr.includes("r2_object_key")) {
      throw new Error("FUGA: detalle de constraint expuesto al cliente");
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});
