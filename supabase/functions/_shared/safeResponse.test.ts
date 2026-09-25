/**
 * F7-35: Tests unitarios del helper safeResponse.ts
 * Verifica que:
 * - jsonResponse retorna status + body correcto
 * - safeError loggea el detalle pero NO lo expone al cliente
 * - safeInternalError envuelve errores desconocidos
 */
import { assertEquals, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { jsonResponse, safeError, safeInternalError } from "./safeResponse.ts";

Deno.test("jsonResponse: retorna status por defecto 200", () => {
  const res = jsonResponse({ ok: true });
  assertEquals(res.status, 200);
  assertEquals(res.headers.get("Content-Type"), "application/json");
});

Deno.test("jsonResponse: respeta status custom", () => {
  const res = jsonResponse({ error: "not_found" }, 404);
  assertEquals(res.status, 404);
});

Deno.test("safeError: expone solo publicCode al cliente, NO detalles técnicos", async () => {
  // Capturar console.error para verificar el log interno
  const logs: string[] = [];
  const original = console.error;
  console.error = (msg: string) => logs.push(msg);

  try {
    const internalError = new Error("SENSITIVE: SELECT * FROM auth.users WHERE password='leaked'");
    const res = safeError(undefined, "INVALID_JWT", internalError, 401, "[test]");
    const body = await res.json();

    assertEquals(res.status, 401);
    assertEquals(body.error, "INVALID_JWT");
    // CRÍTICO: el cliente NO debe ver el detalle
    const bodyStr = JSON.stringify(body);
    if (bodyStr.includes("SENSITIVE")) {
      throw new Error("FUGA: detalle interno expuesto al cliente");
    }
    if (bodyStr.includes("leaked")) {
      throw new Error("FUGA: información sensible expuesta al cliente");
    }
    // El log interno SÍ debe tener el detalle
    assertEquals(logs.length, 1);
    assertStringIncludes(logs[0], "SENSITIVE");
  } finally {
    console.error = original;
  }
});

Deno.test("safeError: maneja strings directamente", async () => {
  const logs: string[] = [];
  const original = console.error;
  console.error = (msg: string) => logs.push(msg);

  try {
    const res = safeError(undefined, "FORBIDDEN", "SQL syntax error near SELECT", 403, "[test]");
    const body = await res.json();

    assertEquals(res.status, 403);
    assertEquals(body.error, "FORBIDDEN");
    if (JSON.stringify(body).includes("SQL syntax")) {
      throw new Error("FUGA: detalle SQL expuesto al cliente");
    }
    assertStringIncludes(logs[0], "SQL syntax");
  } finally {
    console.error = original;
  }
});

Deno.test("safeError: maneja objetos no-Error", async () => {
  const logs: string[] = [];
  const original = console.error;
  console.error = (msg: string) => logs.push(msg);

  try {
    const res = safeError(undefined, "BAD_REQUEST", { code: "P0001", hint: "check constraint" }, 400, "[test]");
    const body = await res.json();

    assertEquals(res.status, 400);
    assertEquals(body.error, "BAD_REQUEST");
    if (JSON.stringify(body).includes("P0001")) {
      throw new Error("FUGA: código PostgREST expuesto al cliente");
    }
    assertStringIncludes(logs[0], "P0001");
  } finally {
    console.error = original;
  }
});

Deno.test("safeInternalError: envuelve errores desconocidos como 500 genérico", async () => {
  const logs: string[] = [];
  const original = console.error;
  console.error = (msg: string) => logs.push(msg);

  try {
    const res = safeInternalError(undefined, new Error("unhandled exception"), "[test]");
    const body = await res.json();

    assertEquals(res.status, 500);
    assertEquals(body.error, "INTERNAL_SERVER_ERROR");
    if (JSON.stringify(body).includes("unhandled exception")) {
      throw new Error("FUGA: error interno expuesto al cliente");
    }
  } finally {
    console.error = original;
  }
});

Deno.test("safeError: no rompe con objetos no serializables", async () => {
  const logs: string[] = [];
  const original = console.error;
  console.error = (msg: string) => logs.push(msg);

  try {
    // Crear objeto circular
    const circular: any = {};
    circular.self = circular;

    const res = safeError(undefined, "INTERNAL_SERVER_ERROR", circular, 500, "[test]");
    const body = await res.json();

    assertEquals(res.status, 500);
    assertEquals(body.error, "INTERNAL_SERVER_ERROR");
    // El log debe tener el placeholder [unserializable], no romperse
    assertStringIncludes(logs[0], "[unserializable]");
  } finally {
    console.error = original;
  }
});
