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


// ============================================================
// TESTS DE REGRESIÓN F7-35 POST-AUDIT
// ============================================================

Deno.test("safeInternalError: retorna HTTP 500 real (no 200 con body 500)", async () => {
  const logs: string[] = [];
  const original = console.error;
  console.error = (msg: string) => logs.push(msg);

  try {
    const res = safeInternalError(undefined, new Error("test error"), "[test]");
    const body = await res.json();

    // CRÍTICO: status debe ser 500, no 200
    if (res.status !== 500) {
      throw new Error(`FATAL: status es ${res.status}, debería ser 500`);
    }
    assertEquals(body.error, "INTERNAL_SERVER_ERROR");
    // El log debe contener el detalle técnico
    assertEquals(logs.length, 1);
    if (!logs[0].includes("test error")) {
      throw new Error("Log interno no contiene el detalle del error");
    }
  } finally {
    console.error = original;
  }
});

Deno.test("safeInternalError: nunca expone error.message al cliente", async () => {
  const logs: string[] = [];
  const original = console.error;
  console.error = (msg: string) => logs.push(msg);

  try {
    const sensitiveError = new Error("SELECT * FROM auth.users WHERE password='leaked'");
    const res = safeInternalError(undefined, sensitiveError, "[test]");
    const body = await res.json();

    assertEquals(res.status, 500);
    assertEquals(body.error, "INTERNAL_SERVER_ERROR");
    // CRÍTICO: el body NO debe contener el mensaje sensible
    const bodyStr = JSON.stringify(body);
    if (bodyStr.includes("SELECT") || bodyStr.includes("leaked")) {
      throw new Error("FUGA CRÍTICA: mensaje de error expuesto al cliente");
    }
    // Pero el log interno SÍ debe tenerlo
    if (!logs[0].includes("SELECT")) {
      throw new Error("Log interno no contiene el detalle (debería estar ahí)");
    }
  } finally {
    console.error = original;
  }
});

Deno.test("safeInternalError: no expone stack trace al cliente", async () => {
  const logs: string[] = [];
  const original = console.error;
  console.error = (msg: string) => logs.push(msg);

  try {
    const error = new Error("test");
    const res = safeInternalError(undefined, error, "[test]");
    const body = await res.json();

    assertEquals(res.status, 500);
    // CRÍTICO: el body NO debe contener stack trace
    const bodyStr = JSON.stringify(body);
    if (bodyStr.includes("at ") || bodyStr.includes("stack")) {
      throw new Error("FUGA CRÍTICA: stack trace expuesto al cliente");
    }
    // El log puede contener stack, pero no el body
  } finally {
    console.error = original;
  }
});


// ============================================================
// TESTS DE REGRESIÓN F7-35 POST-AUDIT FINAL
// Garantizan que jsonResponse(500) nunca se use sin body
// ============================================================

Deno.test("safeError con status 500 produce HTTP 500 real (no 200 con body 500)", async () => {
  const logs: string[] = [];
  const original = console.error;
  console.error = (msg: string) => logs.push(msg);

  try {
    const res = safeError(
      undefined,
      "METADATA_INSERT_FAILED",
      "error de prueba desde PostgREST",
      500,
      "[test]"
    );
    const body = await res.json();

    // CRÍTICO: status debe ser 500, NO 200
    if (res.status !== 500) {
      throw new Error(
        `REGRESIÓN DETECTADA: status es ${res.status} pero debería ser 500. ` +
        `Esto es exactamente el bug de jsonResponse(500) donde 500 se interpreta como body.`
      );
    }
    assertEquals(body.error, "METADATA_INSERT_FAILED");
    // El log debe contener el detalle
    assertEquals(logs.length, 1);
    if (!logs[0].includes("error de prueba desde PostgREST")) {
      throw new Error("Log interno no contiene el detalle");
    }
  } finally {
    console.error = original;
  }
});

Deno.test("safeError con status 403 produce HTTP 403 real", async () => {
  const logs: string[] = [];
  const original = console.error;
  console.error = (msg: string) => logs.push(msg);

  try {
    const res = safeError(undefined, "FORBIDDEN", "SQL error interno", 403, "[test]");
    const body = await res.json();

    if (res.status !== 403) {
      throw new Error(`REGRESIÓN: status es ${res.status}, debería ser 403`);
    }
    assertEquals(body.error, "FORBIDDEN");
    // Cliente NO debe ver el SQL
    const bodyStr = JSON.stringify(body);
    if (bodyStr.includes("SQL")) {
      throw new Error("FUGA: SQL interno expuesto al cliente");
    }
  } finally {
    console.error = original;
  }
});

Deno.test("safeError con status 400 produce HTTP 400 real", async () => {
  const logs: string[] = [];
  const original = console.error;
  console.error = (msg: string) => logs.push(msg);

  try {
    const res = safeError(undefined, "BAD_REQUEST", "detalle interno", 400, "[test]");
    const body = await res.json();

    if (res.status !== 400) {
      throw new Error(`REGRESIÓN: status es ${res.status}, debería ser 400`);
    }
    assertEquals(body.error, "BAD_REQUEST");
  } finally {
    console.error = original;
  }
});

Deno.test("safeError con status 401 produce HTTP 401 real", async () => {
  const logs: string[] = [];
  const original = console.error;
  console.error = (msg: string) => logs.push(msg);

  try {
    const res = safeError(undefined, "INVALID_JWT", "detalle interno", 401, "[test]");
    const body = await res.json();

    if (res.status !== 401) {
      throw new Error(`REGRESIÓN: status es ${res.status}, debería ser 401`);
    }
    assertEquals(body.error, "INVALID_JWT");
  } finally {
    console.error = original;
  }
});

Deno.test("safeError con status 404 produce HTTP 404 real", async () => {
  const logs: string[] = [];
  const original = console.error;
  console.error = (msg: string) => logs.push(msg);

  try {
    const res = safeError(undefined, "NOT_FOUND", "detalle interno", 404, "[test]");
    const body = await res.json();

    if (res.status !== 404) {
      throw new Error(`REGRESIÓN: status es ${res.status}, debería ser 404`);
    }
    assertEquals(body.error, "NOT_FOUND");
  } finally {
    console.error = original;
  }
});

Deno.test("REGRESIÓN: llamar jsonResponse(500) directamente produciría HTTP 200 (demostración)", () => {
  // Este test demuestra POR QUÉ jsonResponse(500) es incorrecto.
  // La firma es jsonResponse(body, status = 200), así que:
  //   jsonResponse(500) → body=500, status=200 (default)
  // Este test verifica que el helper safeError SÍ produce el status correcto.
  const res = jsonResponse(500);
  // ADVERTENCIA: este es el bug que corregimos en F7-35
  // status=200 (default), body=500 → HTTP 200 con body "500"
  if (res.status === 500) {
    throw new Error("Test inválido: jsonResponse(500) NO debería producir HTTP 500");
  }
  // Confirmamos que jsonResponse(500) produce HTTP 200 (el bug)
  assertEquals(res.status, 200);
  // Por eso SIEMPRE debe usarse safeError() para errores HTTP
});
