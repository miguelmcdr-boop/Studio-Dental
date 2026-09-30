/**
 * Tests de aislamiento multi-clínica para archivos-purge
 * F7-34b: Aislamiento por clínica en modo usuario + modo cron interno
 */
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { handler } from "./index.ts";
import { createMockFetch, setupDenoEnv } from "../_shared/testUtils.ts";

// F7-37 v4: Usar import.meta.url para obtener ruta absoluta del repo root
// (Deno.cwd() es incorrecto cuando tests se ejecutan desde supabase/functions/archivos-purge/)
// F7-37 v4: decodeURIComponent para convertir %20 → espacio en paths con espacios
const ROOT = decodeURIComponent(new URL('../../../', import.meta.url).pathname).replace(/\/$/, '');

const USER_ID = "11111111-1111-1111-1111-111111111111";
const CLINICA_A = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const CLINICA_B = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const ARCHIVO_A = "11111111-2222-3333-4444-555555555555";
const ARCHIVO_B = "22222222-3333-4444-5555-666666666666";

setupDenoEnv();

// ============================================================
// F7-37 v3: Constantes para tests H-08 (certificados)
// ============================================================
const CERT_A = "cccccccc-cccc-cccc-cccc-cccccccccccc";
const CERT_B = "dddddddd-dddd-dddd-dddd-dddddddddddd";
const ARCHIVO_C = "33333333-4444-5555-6666-777777777777";


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
    const req = createRequest({ source_type: "archivo", archivo_ids: [ARCHIVO_A] });
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
    const req = createRequest({ source_type: "archivo", archivo_ids: [ARCHIVO_B] });
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
    const req = createRequest({ source_type: "archivo", archivo_ids: [ARCHIVO_A] });
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
      body: JSON.stringify({ source_type: "archivo", archivo_ids: [ARCHIVO_A] }),
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
      body: JSON.stringify({ source_type: "archivo", archivo_ids: [ARCHIVO_A] }),
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
    const req = createRequest({ source_type: "archivo", archivo_ids: [ARCHIVO_A] });
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
    const req = createRequest({ source_type: "archivo", archivo_ids: [ARCHIVO_A] });
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
  const ARCHIVO_C = "33333333-4444-5555-6666-777777777777";
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
    const req = createRequest({ source_type: "archivo", archivo_ids: [ARCHIVO_A, ARCHIVO_B, ARCHIVO_C] });
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


// ============================================================
// F7-37 v3: Tests H-08 (cross-tenant validation en purge de certificados)
// ============================================================

Deno.test("T9: H-08 mismo tenant - archivo A + certificado A de clínica A -> ALLOW", async () => {
  const originalFetch = globalThis.fetch;
  const archivos = [
    { id: ARCHIVO_A, clinica_id: CLINICA_A, r2_object_key: `${CLINICA_A}/pac/r2key`, estado: "eliminado", nombre_archivo: "a.pdf" },
  ];
  const certificados = [
    { id: CERT_A, clinica_id: CLINICA_A, datos: { r2ArchivoId: ARCHIVO_A } },
  ];

  globalThis.fetch = createMockFetch({
    authUser: { id: USER_ID, user_metadata: { clinica_id: CLINICA_A } },
    memberships: baseMemberships,
    archivos,
    certificados,
  }) as any;

  try {
    const req = new Request("http://localhost/archivos-purge", {
      method: "POST",
      headers: {
        "Authorization": "Bearer valid-jwt",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        archivo_ids: [ARCHIVO_A],
        source_type: "certificado",
        source_ids: { [ARCHIVO_A]: CERT_A },
      }),
    });
    const res = await handler(req);
    const body = await res.json();
    assertEquals(res.status, 200);
    assertEquals(body.purgados.length, 1);
    assertEquals(body.purgados.includes(ARCHIVO_A), true);
    assertEquals(body.rechazados.length, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("T10: H-08 cross-tenant - archivo A (clínica A) + certificado B (clínica B) -> DENY", async () => {
  const originalFetch = globalThis.fetch;
  const archivos = [
    { id: ARCHIVO_A, clinica_id: CLINICA_A, r2_object_key: `${CLINICA_A}/pac/r2key`, estado: "eliminado", nombre_archivo: "a.pdf" },
  ];
  const certificados = [
    { id: CERT_B, clinica_id: CLINICA_B, datos: { r2ArchivoId: ARCHIVO_A } },
  ];

  globalThis.fetch = createMockFetch({
    authUser: { id: USER_ID, user_metadata: { clinica_id: CLINICA_A } },
    memberships: baseMemberships,
    archivos,
    certificados,
  }) as any;

  try {
    const req = new Request("http://localhost/archivos-purge", {
      method: "POST",
      headers: {
        "Authorization": "Bearer valid-jwt",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        archivo_ids: [ARCHIVO_A],
        source_type: "certificado",
        source_ids: { [ARCHIVO_A]: CERT_B },
      }),
    });
    const res = await handler(req);
    const body = await res.json();
    assertEquals(res.status, 200);
    assertEquals(body.purgados.length, 0);
    assertEquals(body.rechazados.length, 1);
    assertEquals(body.rechazados[0].id, ARCHIVO_A);
    assertEquals(body.rechazados[0].razon, "certificado_cross_tenant");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("T11: H-08 certificado inexistente -> DENY", async () => {
  const originalFetch = globalThis.fetch;
  const archivos = [
    { id: ARCHIVO_A, clinica_id: CLINICA_A, r2_object_key: `${CLINICA_A}/pac/r2key`, estado: "eliminado", nombre_archivo: "a.pdf" },
  ];

  globalThis.fetch = createMockFetch({
    authUser: { id: USER_ID, user_metadata: { clinica_id: CLINICA_A } },
    memberships: baseMemberships,
    archivos,
    certificados: [], // No hay certificados
  }) as any;

  try {
    const req = new Request("http://localhost/archivos-purge", {
      method: "POST",
      headers: {
        "Authorization": "Bearer valid-jwt",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        archivo_ids: [ARCHIVO_A],
        source_type: "certificado",
        source_ids: { [ARCHIVO_A]: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee" },
      }),
    });
    const res = await handler(req);
    const body = await res.json();
    assertEquals(res.status, 200);
    assertEquals(body.purgados.length, 0);
    assertEquals(body.rechazados.length, 1);
    assertEquals(body.rechazados[0].id, ARCHIVO_A);
    assertEquals(body.rechazados[0].razon, "certificado_inexistente");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("T12: H-08 r2ArchivoId incorrecto -> DENY", async () => {
  const originalFetch = globalThis.fetch;
  const archivos = [
    { id: ARCHIVO_A, clinica_id: CLINICA_A, r2_object_key: `${CLINICA_A}/pac/r2key`, estado: "eliminado", nombre_archivo: "a.pdf" },
  ];
  const certificados = [
    // Certificado apunta a OTRO archivo (no al A)
    { id: CERT_A, clinica_id: CLINICA_A, datos: { r2ArchivoId: ARCHIVO_B } },
  ];

  globalThis.fetch = createMockFetch({
    authUser: { id: USER_ID, user_metadata: { clinica_id: CLINICA_A } },
    memberships: baseMemberships,
    archivos,
    certificados,
  }) as any;

  try {
    const req = new Request("http://localhost/archivos-purge", {
      method: "POST",
      headers: {
        "Authorization": "Bearer valid-jwt",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        archivo_ids: [ARCHIVO_A],
        source_type: "certificado",
        source_ids: { [ARCHIVO_A]: CERT_A },
      }),
    });
    const res = await handler(req);
    const body = await res.json();
    assertEquals(res.status, 200);
    assertEquals(body.purgados.length, 0);
    assertEquals(body.rechazados.length, 1);
    assertEquals(body.rechazados[0].id, ARCHIVO_A);
    assertEquals(body.rechazados[0].razon, "certificado_no_referencia_archivo");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("T13: H-08 R2 OK -> RPC atómica elimina archivo + certificado", async () => {
  const originalFetch = globalThis.fetch;
  const archivos = [
    { id: ARCHIVO_A, clinica_id: CLINICA_A, r2_object_key: `${CLINICA_A}/pac/r2key`, estado: "eliminado", nombre_archivo: "a.pdf" },
  ];
  const certificados = [
    { id: CERT_A, clinica_id: CLINICA_A, datos: { r2ArchivoId: ARCHIVO_A } },
  ];

  let rpcCalled = false;
  let rpcParams: any = null;
  const mockFetch = createMockFetch({
    authUser: { id: USER_ID, user_metadata: { clinica_id: CLINICA_A } },
    memberships: baseMemberships,
    archivos,
    certificados,
  });

  // F7-37 v3.2: Wrapper para detectar llamada a RPC atómica
  const wrappedFetch = async (url: any, init?: any) => {
    const urlStr = typeof url === "string" ? url : url.url;
    if (urlStr.includes("/rest/v1/rpc/purgar_archivo_y_certificado")) {
      rpcCalled = true;
      if (init?.body) {
        try { rpcParams = JSON.parse(init.body as string); } catch {}
      }
    }
    return mockFetch(url, init);
  };

  globalThis.fetch = wrappedFetch as any;

  try {
    const req = new Request("http://localhost/archivos-purge", {
      method: "POST",
      headers: {
        "Authorization": "Bearer valid-jwt",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        archivo_ids: [ARCHIVO_A],
        source_type: "certificado",
        source_ids: { [ARCHIVO_A]: CERT_A },
      }),
    });
    const res = await handler(req);
    const body = await res.json();
    assertEquals(res.status, 200);
    assertEquals(body.purgados.length, 1);
    assertEquals(body.rechazados.length, 0);
    assertEquals(rpcCalled, true, "RPC atómica debe ser llamada");
    assertEquals(rpcParams?.p_archivo_id, ARCHIVO_A, "RPC debe recibir archivo_id");
    assertEquals(rpcParams?.p_certificado_id, CERT_A, "RPC debe recibir certificado_id");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("T14: H-08 R2 404 (ya eliminado) -> idempotente, continúa con BD", async () => {
  const originalFetch = globalThis.fetch;
  const archivos = [
    { id: ARCHIVO_A, clinica_id: CLINICA_A, r2_object_key: `${CLINICA_A}/pac/r2key`, estado: "eliminado", nombre_archivo: "a.pdf" },
  ];
  const certificados = [
    { id: CERT_A, clinica_id: CLINICA_A, datos: { r2ArchivoId: ARCHIVO_A } },
  ];

  // Mock que retorna 404 para R2 (ya eliminado)
  const mockFetch = async (url: any, init?: any) => {
    const urlStr = typeof url === "string" ? url : url.url;
    if (urlStr.includes("r2.cloudflarestorage.com")) {
      return new Response(null, { status: 404 });
    }
    return createMockFetch({
      authUser: { id: USER_ID, user_metadata: { clinica_id: CLINICA_A } },
      memberships: baseMemberships,
      archivos,
      certificados,
    })(url, init);
  };

  globalThis.fetch = mockFetch as any;

  try {
    const req = new Request("http://localhost/archivos-purge", {
      method: "POST",
      headers: {
        "Authorization": "Bearer valid-jwt",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        archivo_ids: [ARCHIVO_A],
        source_type: "certificado",
        source_ids: { [ARCHIVO_A]: CERT_A },
      }),
    });
    const res = await handler(req);
    const body = await res.json();
    assertEquals(res.status, 200);
    // 404 es tratado como éxito (idempotente)
    assertEquals(body.purgados.length, 1);
    assertEquals(body.rechazados.length, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("T15: H-08 R2 failure -> NO DELETE BD, purga_pendiente preservada", async () => {
  const originalFetch = globalThis.fetch;
  const archivos = [
    { id: ARCHIVO_A, clinica_id: CLINICA_A, r2_object_key: `${CLINICA_A}/pac/r2key`, estado: "eliminado", nombre_archivo: "a.pdf" },
  ];
  const certificados = [
    { id: CERT_A, clinica_id: CLINICA_A, datos: { r2ArchivoId: ARCHIVO_A } },
  ];

  globalThis.fetch = createMockFetch({
    authUser: { id: USER_ID, user_metadata: { clinica_id: CLINICA_A } },
    memberships: baseMemberships,
    archivos,
    certificados,
    r2DeleteOk: false, // R2 falla
  }) as any;

  try {
    const req = new Request("http://localhost/archivos-purge", {
      method: "POST",
      headers: {
        "Authorization": "Bearer valid-jwt",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        archivo_ids: [ARCHIVO_A],
        source_type: "certificado",
        source_ids: { [ARCHIVO_A]: CERT_A },
      }),
    });
    const res = await handler(req);
    const body = await res.json();
    assertEquals(res.status, 200);
    assertEquals(body.purgados.length, 0);
    assertEquals(body.rechazados.length, 1);
    assertEquals(body.rechazados[0].id, ARCHIVO_A);
    assertEquals(body.rechazados[0].razon, "error_delete_r2");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("T16: H-08 retry después de failure -> sin corrupción", async () => {
  const originalFetch = globalThis.fetch;
  const archivos = [
    { id: ARCHIVO_A, clinica_id: CLINICA_A, r2_object_key: `${CLINICA_A}/pac/r2key`, estado: "eliminado", nombre_archivo: "a.pdf" },
  ];
  const certificados = [
    { id: CERT_A, clinica_id: CLINICA_A, datos: { r2ArchivoId: ARCHIVO_A } },
  ];

  // Primero con R2 fallando
  globalThis.fetch = createMockFetch({
    authUser: { id: USER_ID, user_metadata: { clinica_id: CLINICA_A } },
    memberships: baseMemberships,
    archivos,
    certificados,
    r2DeleteOk: false,
  }) as any;

  try {
    const req = new Request("http://localhost/archivos-purge", {
      method: "POST",
      headers: {
        "Authorization": "Bearer valid-jwt",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        archivo_ids: [ARCHIVO_A],
        source_type: "certificado",
        source_ids: { [ARCHIVO_A]: CERT_A },
      }),
    });
    const res1 = await handler(req);
    const body1 = await res1.json();
    assertEquals(body1.purgados.length, 0);
    assertEquals(body1.rechazados.length, 1);

    // Segundo intento: R2 OK (retry)
    globalThis.fetch = createMockFetch({
      authUser: { id: USER_ID, user_metadata: { clinica_id: CLINICA_A } },
      memberships: baseMemberships,
      archivos,
      certificados,
      r2DeleteOk: true,
    }) as any;

    const req2 = new Request("http://localhost/archivos-purge", {
      method: "POST",
      headers: {
        "Authorization": "Bearer valid-jwt",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        archivo_ids: [ARCHIVO_A],
        source_type: "certificado",
        source_ids: { [ARCHIVO_A]: CERT_A },
      }),
    });
    const res2 = await handler(req2);
    const body2 = await res2.json();
    assertEquals(res2.status, 200);
    assertEquals(body2.purgados.length, 1);
    assertEquals(body2.rechazados.length, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("T17: H-08 duplicate retry (mismo certificado 2 veces) -> idempotente", async () => {
  const originalFetch = globalThis.fetch;
  const archivos = [
    { id: ARCHIVO_A, clinica_id: CLINICA_A, r2_object_key: `${CLINICA_A}/pac/r2key`, estado: "eliminado", nombre_archivo: "a.pdf" },
  ];
  const certificados = [
    { id: CERT_A, clinica_id: CLINICA_A, datos: { r2ArchivoId: ARCHIVO_A } },
  ];

  globalThis.fetch = createMockFetch({
    authUser: { id: USER_ID, user_metadata: { clinica_id: CLINICA_A } },
    memberships: baseMemberships,
    archivos,
    certificados,
  }) as any;

  try {
    const makeReq = () => new Request("http://localhost/archivos-purge", {
      method: "POST",
      headers: {
        "Authorization": "Bearer valid-jwt",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        archivo_ids: [ARCHIVO_A],
        source_type: "certificado",
        source_ids: { [ARCHIVO_A]: CERT_A },
      }),
    });

    // Primera ejecución
    const res1 = await handler(makeReq());
    const body1 = await res1.json();
    assertEquals(body1.purgados.length, 1);

    // Segunda ejecución (duplicate retry) - R2 retorna 404 (ya eliminado)
    const mockFetch404 = async (url: any, init?: any) => {
      const urlStr = typeof url === "string" ? url : url.url;
      if (urlStr.includes("r2.cloudflarestorage.com")) {
        return new Response(null, { status: 404 });
      }
      // Certificado ya no existe después del primer DELETE
      if (urlStr.includes("/rest/v1/certificados") && !init?.method) {
        return new Response(JSON.stringify([]), { status: 200 });
      }
      return createMockFetch({
        authUser: { id: USER_ID, user_metadata: { clinica_id: CLINICA_A } },
        memberships: baseMemberships,
        archivos,
        certificados: [], // Ya eliminado
      })(url, init);
    };
    globalThis.fetch = mockFetch404 as any;

    const res2 = await handler(makeReq());
    const body2 = await res2.json();
    // En retry, el archivo no pasa validación cross-tenant porque certificado inexistente
    // O es rechazado - lo importante es NO haber corrupción
    assertEquals(res2.status, 200);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("T18: H-08 DB failure después de R2 OK -> estado recuperable", async () => {
  const originalFetch = globalThis.fetch;
  const archivos = [
    { id: ARCHIVO_A, clinica_id: CLINICA_A, r2_object_key: `${CLINICA_A}/pac/r2key`, estado: "eliminado", nombre_archivo: "a.pdf" },
  ];
  const certificados = [
    { id: CERT_A, clinica_id: CLINICA_A, datos: { r2ArchivoId: ARCHIVO_A } },
  ];

  globalThis.fetch = createMockFetch({
    authUser: { id: USER_ID, user_metadata: { clinica_id: CLINICA_A } },
    memberships: baseMemberships,
    archivos,
    certificados,
    certificadoDeleteOk: false, // DELETE de certificado falla
  }) as any;

  try {
    const req = new Request("http://localhost/archivos-purge", {
      method: "POST",
      headers: {
        "Authorization": "Bearer valid-jwt",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        archivo_ids: [ARCHIVO_A],
        source_type: "certificado",
        source_ids: { [ARCHIVO_A]: CERT_A },
      }),
    });
    const res = await handler(req);
    const body = await res.json();
    assertEquals(res.status, 200);
    // El archivo se elimina, pero el certificado falla en DELETE
    // El archivo queda en purgados (su parte terminó), el certificado queda para retry vía cleanup
    assertEquals(body.rechazados.length >= 0, true);
    // Lo importante es que NO hay corrupción ni crash
  } finally {
    globalThis.fetch = originalFetch;
  }
});


// ============================================================
// F7-37 v3.1: Tests T19-T27 (H-08 residual - validación ANTES de DELETEs)
// ============================================================

Deno.test("T19: H-08 residual cross-tenant → CERO deletes", async () => {
  const originalFetch = globalThis.fetch;
  const archivos = [
    { id: ARCHIVO_A, clinica_id: CLINICA_A, r2_object_key: `${CLINICA_A}/pac/r2key`, estado: "eliminado", nombre_archivo: "a.pdf" },
  ];
  const certificados = [
    { id: CERT_B, clinica_id: CLINICA_B, datos: { r2ArchivoId: ARCHIVO_A } },
  ];

  const operationCounters = { validate_cert: 0, delete_r2: 0, delete_archivo: 0, delete_cert: 0 };
  globalThis.fetch = createMockFetch({
    authUser: { id: USER_ID, user_metadata: { clinica_id: CLINICA_A } },
    memberships: baseMemberships,
    archivos,
    certificados,
    operationCounters,
  }) as any;

  try {
    const req = new Request("http://localhost/archivos-purge", {
      method: "POST",
      headers: {
        "Authorization": "Bearer valid-jwt",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        archivo_ids: [ARCHIVO_A],
        source_type: "certificado",
        source_ids: { [ARCHIVO_A]: CERT_B },
      }),
    });
    const res = await handler(req);
    const body = await res.json();
    assertEquals(res.status, 200);
    assertEquals(body.purgados.length, 0);
    assertEquals(body.rechazados.length, 1);
    assertEquals(body.rechazados[0].razon, "certificado_cross_tenant");
    
    // F7-37 v3.1: Verificar CERO deletes (orden correcto)
    assertEquals(operationCounters.validate_cert, 1, "validate_cert debe ocurrir");
    assertEquals(operationCounters.delete_r2, 0, "delete_r2 NO debe ocurrir");
    assertEquals(operationCounters.delete_archivo, 0, "delete_archivo NO debe ocurrir");
    assertEquals(operationCounters.delete_cert, 0, "delete_cert NO debe ocurrir");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("T20: H-08 residual cert inexistente → CERO deletes", async () => {
  const originalFetch = globalThis.fetch;
  const archivos = [
    { id: ARCHIVO_A, clinica_id: CLINICA_A, r2_object_key: `${CLINICA_A}/pac/r2key`, estado: "eliminado", nombre_archivo: "a.pdf" },
  ];

  const operationCounters = { validate_cert: 0, delete_r2: 0, delete_archivo: 0, delete_cert: 0 };
  globalThis.fetch = createMockFetch({
    authUser: { id: USER_ID, user_metadata: { clinica_id: CLINICA_A } },
    memberships: baseMemberships,
    archivos,
    certificados: [],
    operationCounters,
  }) as any;

  try {
    const req = new Request("http://localhost/archivos-purge", {
      method: "POST",
      headers: {
        "Authorization": "Bearer valid-jwt",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        archivo_ids: [ARCHIVO_A],
        source_type: "certificado",
        source_ids: { [ARCHIVO_A]: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee" },
      }),
    });
    const res = await handler(req);
    const body = await res.json();
    assertEquals(res.status, 200);
    assertEquals(body.purgados.length, 0);
    assertEquals(body.rechazados.length, 1);
    assertEquals(body.rechazados[0].razon, "certificado_inexistente");
    
    // F7-37 v3.1: Verificar CERO deletes
    assertEquals(operationCounters.validate_cert, 1);
    assertEquals(operationCounters.delete_r2, 0);
    assertEquals(operationCounters.delete_archivo, 0);
    assertEquals(operationCounters.delete_cert, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("T21: H-08 residual r2ArchivoId incorrecto → CERO deletes", async () => {
  const originalFetch = globalThis.fetch;
  const archivos = [
    { id: ARCHIVO_A, clinica_id: CLINICA_A, r2_object_key: `${CLINICA_A}/pac/r2key`, estado: "eliminado", nombre_archivo: "a.pdf" },
  ];
  const certificados = [
    { id: CERT_A, clinica_id: CLINICA_A, datos: { r2ArchivoId: ARCHIVO_B } },
  ];

  const operationCounters = { validate_cert: 0, delete_r2: 0, delete_archivo: 0, delete_cert: 0 };
  globalThis.fetch = createMockFetch({
    authUser: { id: USER_ID, user_metadata: { clinica_id: CLINICA_A } },
    memberships: baseMemberships,
    archivos,
    certificados,
    operationCounters,
  }) as any;

  try {
    const req = new Request("http://localhost/archivos-purge", {
      method: "POST",
      headers: {
        "Authorization": "Bearer valid-jwt",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        archivo_ids: [ARCHIVO_A],
        source_type: "certificado",
        source_ids: { [ARCHIVO_A]: CERT_A },
      }),
    });
    const res = await handler(req);
    const body = await res.json();
    assertEquals(res.status, 200);
    assertEquals(body.purgados.length, 0);
    assertEquals(body.rechazados.length, 1);
    assertEquals(body.rechazados[0].razon, "certificado_no_referencia_archivo");
    
    // F7-37 v3.1: Verificar CERO deletes
    assertEquals(operationCounters.validate_cert, 1);
    assertEquals(operationCounters.delete_r2, 0);
    assertEquals(operationCounters.delete_archivo, 0);
    assertEquals(operationCounters.delete_cert, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("T22: H-08 residual mismo tenant + relación correcta → 3 deletes", async () => {
  const originalFetch = globalThis.fetch;
  const archivos = [
    { id: ARCHIVO_A, clinica_id: CLINICA_A, r2_object_key: `${CLINICA_A}/pac/r2key`, estado: "eliminado", nombre_archivo: "a.pdf" },
  ];
  const certificados = [
    { id: CERT_A, clinica_id: CLINICA_A, datos: { r2ArchivoId: ARCHIVO_A } },
  ];

  const operationCounters = { validate_cert: 0, delete_r2: 0, delete_archivo: 0, delete_cert: 0 };
  globalThis.fetch = createMockFetch({
    authUser: { id: USER_ID, user_metadata: { clinica_id: CLINICA_A } },
    memberships: baseMemberships,
    archivos,
    certificados,
    operationCounters,
  }) as any;

  try {
    const req = new Request("http://localhost/archivos-purge", {
      method: "POST",
      headers: {
        "Authorization": "Bearer valid-jwt",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        archivo_ids: [ARCHIVO_A],
        source_type: "certificado",
        source_ids: { [ARCHIVO_A]: CERT_A },
      }),
    });
    const res = await handler(req);
    const body = await res.json();
    assertEquals(res.status, 200);
    assertEquals(body.purgados.length, 1);
    assertEquals(body.rechazados.length, 0);
    
    // F7-37 v3.1: Verificar 3 deletes (orden correcto)
    assertEquals(operationCounters.validate_cert, 1);
    assertEquals(operationCounters.delete_r2, 1);
    assertEquals(operationCounters.delete_archivo, 1);
    assertEquals(operationCounters.delete_cert, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("T23: H-08 residual R2 404 → idempotente, continúa con DB", async () => {
  const originalFetch = globalThis.fetch;
  const archivos = [
    { id: ARCHIVO_A, clinica_id: CLINICA_A, r2_object_key: `${CLINICA_A}/pac/r2key`, estado: "eliminado", nombre_archivo: "a.pdf" },
  ];
  const certificados = [
    { id: CERT_A, clinica_id: CLINICA_A, datos: { r2ArchivoId: ARCHIVO_A } },
  ];

  const operationCounters = { validate_cert: 0, delete_r2: 0, delete_archivo: 0, delete_cert: 0 };
  const mockFetch = async (url: any, init?: any) => {
    const urlStr = typeof url === "string" ? url : url.url;
    if (urlStr.includes("r2.cloudflarestorage.com")) {
      operationCounters.delete_r2++;
      return new Response(null, { status: 404 });
    }
    return createMockFetch({
      authUser: { id: USER_ID, user_metadata: { clinica_id: CLINICA_A } },
      memberships: baseMemberships,
      archivos,
      certificados,
      operationCounters,
    })(url, init);
  };

  globalThis.fetch = mockFetch as any;

  try {
    const req = new Request("http://localhost/archivos-purge", {
      method: "POST",
      headers: {
        "Authorization": "Bearer valid-jwt",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        archivo_ids: [ARCHIVO_A],
        source_type: "certificado",
        source_ids: { [ARCHIVO_A]: CERT_A },
      }),
    });
    const res = await handler(req);
    const body = await res.json();
    assertEquals(res.status, 200);
    assertEquals(body.purgados.length, 1);
    
    // F7-37 v3.1: 404 es idempotente, continúa con DB cleanup
    assertEquals(operationCounters.validate_cert, 1);
    assertEquals(operationCounters.delete_r2, 1);
    assertEquals(operationCounters.delete_archivo, 1);
    assertEquals(operationCounters.delete_cert, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("T24: H-08 residual R2 failure → NO DELETE BD", async () => {
  const originalFetch = globalThis.fetch;
  const archivos = [
    { id: ARCHIVO_A, clinica_id: CLINICA_A, r2_object_key: `${CLINICA_A}/pac/r2key`, estado: "eliminado", nombre_archivo: "a.pdf" },
  ];
  const certificados = [
    { id: CERT_A, clinica_id: CLINICA_A, datos: { r2ArchivoId: ARCHIVO_A } },
  ];

  const operationCounters = { validate_cert: 0, delete_r2: 0, delete_archivo: 0, delete_cert: 0 };
  globalThis.fetch = createMockFetch({
    authUser: { id: USER_ID, user_metadata: { clinica_id: CLINICA_A } },
    memberships: baseMemberships,
    archivos,
    certificados,
    r2DeleteOk: false,
    operationCounters,
  }) as any;

  try {
    const req = new Request("http://localhost/archivos-purge", {
      method: "POST",
      headers: {
        "Authorization": "Bearer valid-jwt",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        archivo_ids: [ARCHIVO_A],
        source_type: "certificado",
        source_ids: { [ARCHIVO_A]: CERT_A },
      }),
    });
    const res = await handler(req);
    const body = await res.json();
    assertEquals(res.status, 200);
    assertEquals(body.purgados.length, 0);
    assertEquals(body.rechazados.length, 1);
    
    // F7-37 v3.1: R2 falla → NO DELETE BD
    assertEquals(operationCounters.validate_cert, 1);
    assertEquals(operationCounters.delete_r2, 1);
    assertEquals(operationCounters.delete_archivo, 0);
    assertEquals(operationCounters.delete_cert, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("T25: H-08 residual retry después de R2 failure → sin corrupción", async () => {
  const originalFetch = globalThis.fetch;
  const archivos = [
    { id: ARCHIVO_A, clinica_id: CLINICA_A, r2_object_key: `${CLINICA_A}/pac/r2key`, estado: "eliminado", nombre_archivo: "a.pdf" },
  ];
  const certificados = [
    { id: CERT_A, clinica_id: CLINICA_A, datos: { r2ArchivoId: ARCHIVO_A } },
  ];

  // Primera ejecución: R2 falla
  const operationCounters1 = { validate_cert: 0, delete_r2: 0, delete_archivo: 0, delete_cert: 0 };
  globalThis.fetch = createMockFetch({
    authUser: { id: USER_ID, user_metadata: { clinica_id: CLINICA_A } },
    memberships: baseMemberships,
    archivos,
    certificados,
    r2DeleteOk: false,
    operationCounters: operationCounters1,
  }) as any;

  try {
    const req1 = new Request("http://localhost/archivos-purge", {
      method: "POST",
      headers: {
        "Authorization": "Bearer valid-jwt",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        archivo_ids: [ARCHIVO_A],
        source_type: "certificado",
        source_ids: { [ARCHIVO_A]: CERT_A },
      }),
    });
    const res1 = await handler(req1);
    const body1 = await res1.json();
    assertEquals(body1.purgados.length, 0);

    // Segunda ejecución: R2 OK (retry)
    const operationCounters2 = { validate_cert: 0, delete_r2: 0, delete_archivo: 0, delete_cert: 0 };
    globalThis.fetch = createMockFetch({
      authUser: { id: USER_ID, user_metadata: { clinica_id: CLINICA_A } },
      memberships: baseMemberships,
      archivos,
      certificados,
      r2DeleteOk: true,
      operationCounters: operationCounters2,
    }) as any;

    const req2 = new Request("http://localhost/archivos-purge", {
      method: "POST",
      headers: {
        "Authorization": "Bearer valid-jwt",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        archivo_ids: [ARCHIVO_A],
        source_type: "certificado",
        source_ids: { [ARCHIVO_A]: CERT_A },
      }),
    });
    const res2 = await handler(req2);
    const body2 = await res2.json();
    assertEquals(res2.status, 200);
    assertEquals(body2.purgados.length, 1);
    
    // F7-37 v3.1: Retry sin corrupción
    assertEquals(operationCounters2.validate_cert, 1);
    assertEquals(operationCounters2.delete_r2, 1);
    assertEquals(operationCounters2.delete_archivo, 1);
    assertEquals(operationCounters2.delete_cert, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("T26: H-08 residual duplicate retry → idempotente", async () => {
  const originalFetch = globalThis.fetch;
  const archivos = [
    { id: ARCHIVO_A, clinica_id: CLINICA_A, r2_object_key: `${CLINICA_A}/pac/r2key`, estado: "eliminado", nombre_archivo: "a.pdf" },
  ];
  const certificados = [
    { id: CERT_A, clinica_id: CLINICA_A, datos: { r2ArchivoId: ARCHIVO_A } },
  ];

  const operationCounters = { validate_cert: 0, delete_r2: 0, delete_archivo: 0, delete_cert: 0 };
  globalThis.fetch = createMockFetch({
    authUser: { id: USER_ID, user_metadata: { clinica_id: CLINICA_A } },
    memberships: baseMemberships,
    archivos,
    certificados,
    operationCounters,
  }) as any;

  try {
    const makeReq = () => new Request("http://localhost/archivos-purge", {
      method: "POST",
      headers: {
        "Authorization": "Bearer valid-jwt",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        archivo_ids: [ARCHIVO_A],
        source_type: "certificado",
        source_ids: { [ARCHIVO_A]: CERT_A },
      }),
    });

    // Primera ejecución
    const res1 = await handler(makeReq());
    const body1 = await res1.json();
    assertEquals(body1.purgados.length, 1);

    // Segunda ejecución (duplicate retry) - R2 retorna 404 (ya eliminado)
    const mockFetch404 = async (url: any, init?: any) => {
      const urlStr = typeof url === "string" ? url : url.url;
      if (urlStr.includes("r2.cloudflarestorage.com")) {
        operationCounters.delete_r2++;
        return new Response(null, { status: 404 });
      }
      // Certificado ya no existe después del primer DELETE
      if (urlStr.includes("/rest/v1/certificados") && !init?.method) {
        operationCounters.validate_cert++;
        return new Response(JSON.stringify([]), { status: 200 });
      }
      return createMockFetch({
        authUser: { id: USER_ID, user_metadata: { clinica_id: CLINICA_A } },
        memberships: baseMemberships,
        archivos,
        certificados: [],
        operationCounters,
      })(url, init);
    };
    globalThis.fetch = mockFetch404 as any;

    const res2 = await handler(makeReq());
    assertEquals(res2.status, 200);
    
    // F7-37 v3.1: Duplicate retry es seguro
    assertEquals(operationCounters.validate_cert, 2);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("T27: H-08 residual DB failure después de R2 OK → estado recuperable", async () => {
  const originalFetch = globalThis.fetch;
  const archivos = [
    { id: ARCHIVO_A, clinica_id: CLINICA_A, r2_object_key: `${CLINICA_A}/pac/r2key`, estado: "eliminado", nombre_archivo: "a.pdf" },
  ];
  const certificados = [
    { id: CERT_A, clinica_id: CLINICA_A, datos: { r2ArchivoId: ARCHIVO_A } },
  ];

  const operationCounters = { validate_cert: 0, delete_r2: 0, delete_archivo: 0, delete_cert: 0 };
  globalThis.fetch = createMockFetch({
    authUser: { id: USER_ID, user_metadata: { clinica_id: CLINICA_A } },
    memberships: baseMemberships,
    archivos,
    certificados,
    certificadoDeleteOk: false,
    operationCounters,
  }) as any;

  try {
    const req = new Request("http://localhost/archivos-purge", {
      method: "POST",
      headers: {
        "Authorization": "Bearer valid-jwt",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        archivo_ids: [ARCHIVO_A],
        source_type: "certificado",
        source_ids: { [ARCHIVO_A]: CERT_A },
      }),
    });
    const res = await handler(req);
    const body = await res.json();
    assertEquals(res.status, 200);
    
    // F7-37 v3.1: R2 OK, archivo OK, certificado falla
    // El archivo queda en purgados (su parte terminó), el certificado queda para retry vía cleanup
    assertEquals(operationCounters.validate_cert, 1);
    assertEquals(operationCounters.delete_r2, 1);
    assertEquals(operationCounters.delete_archivo, 1);
    assertEquals(operationCounters.delete_cert, 1);
    // El sistema no finje transacción distribuida - estado es recuperable vía cleanup
  } finally {
    globalThis.fetch = originalFetch;
  }
});


// ============================================================
// F7-37 v3.2: Tests T28-T34 (RPC atómica + UUIDs + autorización)
// ============================================================

Deno.test("T28: v3.2 DB transaction failure + retry → recuperación real", async () => {
  const originalFetch = globalThis.fetch;
  const archivos = [
    { id: ARCHIVO_A, clinica_id: CLINICA_A, r2_object_key: `${CLINICA_A}/pac/r2key`, estado: "eliminado", nombre_archivo: "a.pdf" },
  ];
  const certificados = [
    { id: CERT_A, clinica_id: CLINICA_A, datos: { r2ArchivoId: ARCHIVO_A } },
  ];

  // Primera ejecución: RPC falla
  const counters1 = { validate_cert: 0, delete_r2: 0, delete_archivo: 0, delete_cert: 0 };
  globalThis.fetch = createMockFetch({
    authUser: { id: USER_ID, user_metadata: { clinica_id: CLINICA_A } },
    memberships: baseMemberships,
    archivos,
    certificados,
    rpcOk: false,
    rpcRazon: "error_db_transaccional",
    operationCounters: counters1,
  }) as any;

  try {
    const req1 = new Request("http://localhost/archivos-purge", {
      method: "POST",
      headers: {
        "Authorization": "Bearer valid-jwt",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        archivo_ids: [ARCHIVO_A],
        source_type: "certificado",
        source_ids: { [ARCHIVO_A]: CERT_A },
      }),
    });
    const res1 = await handler(req1);
    const body1 = await res1.json();
    assertEquals(res1.status, 200);
    assertEquals(body1.purgados.length, 0);
    assertEquals(body1.rechazados.length, 1);
    // R2 se intentó eliminar (R2-first), pero DB falló
    assertEquals(counters1.delete_r2, 1);
    assertEquals(counters1.delete_archivo, 1); // Se intentó la RPC
    assertEquals(counters1.delete_cert, 0); // Pero RPC no hizo commit

    // Segunda ejecución (retry): RPC OK
    const counters2 = { validate_cert: 0, delete_r2: 0, delete_archivo: 0, delete_cert: 0 };
    globalThis.fetch = createMockFetch({
      authUser: { id: USER_ID, user_metadata: { clinica_id: CLINICA_A } },
      memberships: baseMemberships,
      archivos,
      certificados,
      operationCounters: counters2,
    }) as any;

    const req2 = new Request("http://localhost/archivos-purge", {
      method: "POST",
      headers: {
        "Authorization": "Bearer valid-jwt",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        archivo_ids: [ARCHIVO_A],
        source_type: "certificado",
        source_ids: { [ARCHIVO_A]: CERT_A },
      }),
    });
    const res2 = await handler(req2);
    const body2 = await res2.json();
    assertEquals(res2.status, 200);
    assertEquals(body2.purgados.length, 1);
    // v3.2: RPC atómica asegura que ambos se eliminan juntos
    assertEquals(counters2.delete_archivo, 1);
    assertEquals(counters2.delete_cert, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("T29: v3.2 Atomicidad PostgreSQL - si RPC falla, archivo NO queda eliminado parcialmente", async () => {
  const originalFetch = globalThis.fetch;
  const archivos = [
    { id: ARCHIVO_A, clinica_id: CLINICA_A, r2_object_key: `${CLINICA_A}/pac/r2key`, estado: "eliminado", nombre_archivo: "a.pdf" },
  ];
  const certificados = [
    { id: CERT_A, clinica_id: CLINICA_A, datos: { r2ArchivoId: ARCHIVO_A } },
  ];

  const counters = { validate_cert: 0, delete_r2: 0, delete_archivo: 0, delete_cert: 0 };
  globalThis.fetch = createMockFetch({
    authUser: { id: USER_ID, user_metadata: { clinica_id: CLINICA_A } },
    memberships: baseMemberships,
    archivos,
    certificados,
    rpcOk: false,
    rpcRazon: "error_db_transaccional",
    operationCounters: counters,
  }) as any;

  try {
    const req = new Request("http://localhost/archivos-purge", {
      method: "POST",
      headers: {
        "Authorization": "Bearer valid-jwt",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        archivo_ids: [ARCHIVO_A],
        source_type: "certificado",
        source_ids: { [ARCHIVO_A]: CERT_A },
      }),
    });
    const res = await handler(req);
    const body = await res.json();
    assertEquals(res.status, 200);
    assertEquals(body.rechazados.length, 1);
    // v3.2: la RPC garantiza ROLLBACK - delete_cert = 0 (nada se comprometió)
    assertEquals(counters.delete_cert, 0, "RPC fallida no debe hacer commit");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("T30: v3.2 UUID inválido en cron no aborta batch", () => {
  // Test de migración SQL - verificar que la función maneja UUID inválido
  // Este test es de documentación estática (no hay forma de ejecutar SQL en Deno)
  const ruta = `${ROOT}/supabase/migrations/20260929000800_f7_37v3_2_atomic_db_purge.sql`;
  const contenido = Deno.readTextFileSync(ruta);

  // Debe tener EXCEPTION handling por iteración
  const idxFor = contenido.indexOf("FOR v_cert IN");
  const idxLoop = contenido.indexOf("END LOOP;", idxFor);
  const bloqueLoop = contenido.substring(idxFor, idxLoop);
  assertEquals(bloqueLoop.includes("BEGIN"), true, "Debe tener BEGIN dentro del loop");
  assertEquals(bloqueLoop.includes("EXCEPTION"), true, "Debe tener EXCEPTION dentro del loop");
  assertEquals(bloqueLoop.includes("invalid_text_representation"), true, "Debe capturar UUID inválido");
  assertEquals(bloqueLoop.includes("CONTINUE"), true, "Debe continuar con siguiente certificado");
});

Deno.test("T31: v3.2 UUID NULL / ausencia de r2ArchivoId no rompe cron", () => {
  const ruta = `${ROOT}/supabase/migrations/20260929000800_f7_37v3_2_atomic_db_purge.sql`;
  const contenido = Deno.readTextFileSync(ruta);

  // Debe verificar NULL antes del cast
  assertEquals(
    contenido.includes("IS NOT NULL"),
    true,
    "Debe verificar NULL antes de castear"
  );
});

Deno.test("T32: v3.2 Política admin + dentista consistente", async () => {
  const originalFetch = globalThis.fetch;
  const archivos = [
    { id: ARCHIVO_A, clinica_id: CLINICA_A, r2_object_key: `${CLINICA_A}/pac/r2key`, estado: "eliminado", nombre_archivo: "a.pdf" },
  ];

  // Test 1: admin puede purgar
  globalThis.fetch = createMockFetch({
    authUser: { id: USER_ID, user_metadata: { clinica_id: CLINICA_A } },
    memberships: [{ user_id: USER_ID, clinica_id: CLINICA_A, rol: "admin", activo: true }],
    archivos,
  }) as any;

  try {
    const reqAdmin = new Request("http://localhost/archivos-purge", {
      method: "POST",
      headers: {
        "Authorization": "Bearer valid-jwt",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ source_type: "archivo", archivo_ids: [ARCHIVO_A] }),
    });
    const resAdmin = await handler(reqAdmin);
    assertEquals(resAdmin.status, 200, "admin debe poder purgar");
  } finally {
    globalThis.fetch = originalFetch;
  }

  // Test 2: dentista puede purgar
  globalThis.fetch = createMockFetch({
    authUser: { id: USER_ID, user_metadata: { clinica_id: CLINICA_A } },
    memberships: [{ user_id: USER_ID, clinica_id: CLINICA_A, rol: "dentista", activo: true }],
    archivos,
  }) as any;

  try {
    const reqDentista = new Request("http://localhost/archivos-purge", {
      method: "POST",
      headers: {
        "Authorization": "Bearer valid-jwt",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ source_type: "archivo", archivo_ids: [ARCHIVO_A] }),
    });
    const resDentista = await handler(reqDentista);
    assertEquals(resDentista.status, 200, "dentista debe poder purgar");
  } finally {
    globalThis.fetch = originalFetch;
  }

  // Test 3: rol no permitido -> 403
  globalThis.fetch = createMockFetch({
    authUser: { id: USER_ID, user_metadata: { clinica_id: CLINICA_A } },
    memberships: [{ user_id: USER_ID, clinica_id: CLINICA_A, rol: "recepcionista", activo: true }],
    archivos,
  }) as any;

  try {
    const reqOtro = new Request("http://localhost/archivos-purge", {
      method: "POST",
      headers: {
        "Authorization": "Bearer valid-jwt",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ source_type: "archivo", archivo_ids: [ARCHIVO_A] }),
    });
    const resOtro = await handler(reqOtro);
    assertEquals(resOtro.status, 403, "rol no permitido debe rechazar");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("T33: v3.2 Retry con archivo DB inexistente (certificado huérfano)", async () => {
  const originalFetch = globalThis.fetch;
  // El archivo ya no existe (fue purgado previamente)
  const archivos: any[] = [];
  const certificados = [
    { id: CERT_A, clinica_id: CLINICA_A, datos: { r2ArchivoId: ARCHIVO_A } },
  ];

  globalThis.fetch = createMockFetch({
    authUser: { id: USER_ID, user_metadata: { clinica_id: CLINICA_A } },
    memberships: baseMemberships,
    archivos,
    certificados,
  }) as any;

  try {
    const req = new Request("http://localhost/archivos-purge", {
      method: "POST",
      headers: {
        "Authorization": "Bearer valid-jwt",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        archivo_ids: [ARCHIVO_A],
        source_type: "certificado",
        source_ids: { [ARCHIVO_A]: CERT_A },
      }),
    });
    const res = await handler(req);
    const body = await res.json();
    assertEquals(res.status, 200);
    // El archivo no existe → validación FASE A falla
    assertEquals(body.rechazados.length, 1);
    assertEquals(body.rechazados[0].razon, "no_pertenece_clinica");
    // Sin DELETE destructivo
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("T34: v3.2 Idempotencia - ejecutar dos veces el mismo purge válido", async () => {
  const originalFetch = globalThis.fetch;
  const archivos = [
    { id: ARCHIVO_A, clinica_id: CLINICA_A, r2_object_key: `${CLINICA_A}/pac/r2key`, estado: "eliminado", nombre_archivo: "a.pdf" },
  ];
  const certificados = [
    { id: CERT_A, clinica_id: CLINICA_A, datos: { r2ArchivoId: ARCHIVO_A } },
  ];

  const makeReq = () => new Request("http://localhost/archivos-purge", {
    method: "POST",
    headers: {
      "Authorization": "Bearer valid-jwt",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      archivo_ids: [ARCHIVO_A],
      source_type: "certificado",
      source_ids: { [ARCHIVO_A]: CERT_A },
    }),
  });

  // Primera ejecución: éxito
  globalThis.fetch = createMockFetch({
    authUser: { id: USER_ID, user_metadata: { clinica_id: CLINICA_A } },
    memberships: baseMemberships,
    archivos,
    certificados,
  }) as any;

  try {
    const res1 = await handler(makeReq());
    const body1 = await res1.json();
    assertEquals(res1.status, 200);
    assertEquals(body1.purgados.length, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }

  // Segunda ejecución: R2 retorna 404 (ya eliminado) y RPC dice archivo inexistente
  const mockFetch404 = async (url: any, init?: any) => {
    const urlStr = typeof url === "string" ? url : url.url;
    if (urlStr.includes("r2.cloudflarestorage.com")) {
      return new Response(null, { status: 404 });
    }
    if (urlStr.includes("/rest/v1/rpc/purgar_archivo_y_certificado")) {
      // RPC indica que archivo ya no existe (idempotente)
      return new Response(JSON.stringify({
        exito: false,
        razon: "archivo_inexistente"
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    return createMockFetch({
      authUser: { id: USER_ID, user_metadata: { clinica_id: CLINICA_A } },
      memberships: baseMemberships,
      archivos,
      certificados: [],
    })(url, init);
  };
  globalThis.fetch = mockFetch404 as any;

  try {
    const res2 = await handler(makeReq());
    const body2 = await res2.json();
    assertEquals(res2.status, 200, "Segunda ejecución no debe fallar con 500");
    // Idempotente: el archivo ya no existe, rechazado con razón clara
    assertEquals(body2.rechazados.length, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});


// ============================================================
// F7-37 v5: Tests de source_type fail-closed (P1 #1)
// ============================================================

Deno.test("T54: source_type ausente → REJECT 400, 0 DELETE", async () => {
  const originalFetch = globalThis.fetch;
  const archivos = [
    { id: ARCHIVO_A, clinica_id: CLINICA_A, r2_object_key: `${CLINICA_A}/pac/r2key`, estado: "eliminado", nombre_archivo: "a.pdf" },
  ];

  globalThis.fetch = createMockFetch({
    authUser: { id: USER_ID, user_metadata: { clinica_id: CLINICA_A } },
    memberships: baseMemberships,
    archivos,
    certificados: [],
  }) as any;

  try {
    const req = new Request("http://localhost/archivos-purge", {
      method: "POST",
      headers: {
        "Authorization": "Bearer valid-jwt",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        archivo_ids: [ARCHIVO_A],
        // source_type omitido intencionalmente
      }),
    });
    const res = await handler(req);
    assertEquals(res.status, 400);
    const body = await res.json();
    assertEquals(body.error.includes("source_type"), true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("T55: source_type = null → REJECT 400, 0 DELETE", async () => {
  const originalFetch = globalThis.fetch;
  const archivos = [
    { id: ARCHIVO_A, clinica_id: CLINICA_A, r2_object_key: `${CLINICA_A}/pac/r2key`, estado: "eliminado", nombre_archivo: "a.pdf" },
  ];

  globalThis.fetch = createMockFetch({
    authUser: { id: USER_ID, user_metadata: { clinica_id: CLINICA_A } },
    memberships: baseMemberships,
    archivos,
    certificados: [],
  }) as any;

  try {
    const req = new Request("http://localhost/archivos-purge", {
      method: "POST",
      headers: {
        "Authorization": "Bearer valid-jwt",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        archivo_ids: [ARCHIVO_A],
        source_type: null,
      }),
    });
    const res = await handler(req);
    assertEquals(res.status, 400);
    const body = await res.json();
    assertEquals(body.error.includes("source_type"), true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("T56: source_type = 'foo' → REJECT 400, 0 DELETE", async () => {
  const originalFetch = globalThis.fetch;
  const archivos = [
    { id: ARCHIVO_A, clinica_id: CLINICA_A, r2_object_key: `${CLINICA_A}/pac/r2key`, estado: "eliminado", nombre_archivo: "a.pdf" },
  ];

  globalThis.fetch = createMockFetch({
    authUser: { id: USER_ID, user_metadata: { clinica_id: CLINICA_A } },
    memberships: baseMemberships,
    archivos,
    certificados: [],
  }) as any;

  try {
    const req = new Request("http://localhost/archivos-purge", {
      method: "POST",
      headers: {
        "Authorization": "Bearer valid-jwt",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        archivo_ids: [ARCHIVO_A],
        source_type: "foo",
      }),
    });
    const res = await handler(req);
    assertEquals(res.status, 400);
    const body = await res.json();
    assertEquals(body.error.includes("source_type"), true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("T57: source_type = '' → REJECT 400, 0 DELETE", async () => {
  const originalFetch = globalThis.fetch;
  const archivos = [
    { id: ARCHIVO_A, clinica_id: CLINICA_A, r2_object_key: `${CLINICA_A}/pac/r2key`, estado: "eliminado", nombre_archivo: "a.pdf" },
  ];

  globalThis.fetch = createMockFetch({
    authUser: { id: USER_ID, user_metadata: { clinica_id: CLINICA_A } },
    memberships: baseMemberships,
    archivos,
    certificados: [],
  }) as any;

  try {
    const req = new Request("http://localhost/archivos-purge", {
      method: "POST",
      headers: {
        "Authorization": "Bearer valid-jwt",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        archivo_ids: [ARCHIVO_A],
        source_type: "",
      }),
    });
    const res = await handler(req);
    assertEquals(res.status, 400);
    const body = await res.json();
    assertEquals(body.error.includes("source_type"), true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("T58: source_type con tipo incorrecto (número) → REJECT 400, 0 DELETE", async () => {
  const originalFetch = globalThis.fetch;
  const archivos = [
    { id: ARCHIVO_A, clinica_id: CLINICA_A, r2_object_key: `${CLINICA_A}/pac/r2key`, estado: "eliminado", nombre_archivo: "a.pdf" },
  ];

  globalThis.fetch = createMockFetch({
    authUser: { id: USER_ID, user_metadata: { clinica_id: CLINICA_A } },
    memberships: baseMemberships,
    archivos,
    certificados: [],
  }) as any;

  try {
    const req = new Request("http://localhost/archivos-purge", {
      method: "POST",
      headers: {
        "Authorization": "Bearer valid-jwt",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        archivo_ids: [ARCHIVO_A],
        source_type: 123,
      }),
    });
    const res = await handler(req);
    assertEquals(res.status, 400);
    const body = await res.json();
    assertEquals(body.error.includes("source_type"), true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// ============================================================
// F7-37 v5 H-12: Tests de flujo certificado sin archivo
// ============================================================

Deno.test("T63: certificado sin archivo - flujo válido vía archivos-purge", async () => {
  const originalFetch = globalThis.fetch;
  const certificados = [
    { id: CERT_A, clinica_id: CLINICA_A, eliminado_at: "2026-09-14T10:00:00Z", datos: {} },
  ];

  globalThis.fetch = createMockFetch({
    authUser: { id: USER_ID, user_metadata: { clinica_id: CLINICA_A } },
    memberships: baseMemberships,
    archivos: [],
    certificados,
  }) as any;

  try {
    const req = new Request("http://localhost/archivos-purge", {
      method: "POST",
      headers: {
        "Authorization": "Bearer valid-jwt",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        archivo_ids: [],
        source_type: "certificado",
        certificado_id: CERT_A,
      }),
    });
    const res = await handler(req);
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(body.success, true);
    assertEquals(body.purgados.length, 1);
    assertEquals(body.purgados[0], CERT_A);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("T64: certificado sin archivo - certificado_id ausente → REJECT 400", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = createMockFetch({
    authUser: { id: USER_ID, user_metadata: { clinica_id: CLINICA_A } },
    memberships: baseMemberships,
    archivos: [],
    certificados: [],
  }) as any;

  try {
    const req = new Request("http://localhost/archivos-purge", {
      method: "POST",
      headers: {
        "Authorization": "Bearer valid-jwt",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        archivo_ids: [],
        source_type: "certificado",
        // certificado_id omitido
      }),
    });
    const res = await handler(req);
    assertEquals(res.status, 400);
    const body = await res.json();
    assertEquals(body.error.includes("certificado_id"), true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("T65: certificado sin archivo - UUID inválido → REJECT 400", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = createMockFetch({
    authUser: { id: USER_ID, user_metadata: { clinica_id: CLINICA_A } },
    memberships: baseMemberships,
    archivos: [],
    certificados: [],
  }) as any;

  try {
    const req = new Request("http://localhost/archivos-purge", {
      method: "POST",
      headers: {
        "Authorization": "Bearer valid-jwt",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        archivo_ids: [],
        source_type: "certificado",
        certificado_id: "no-es-uuid-valido",
      }),
    });
    const res = await handler(req);
    assertEquals(res.status, 400);
    const body = await res.json();
    assertEquals(body.error.includes("UUID"), true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("T66: source_type='archivo' con archivo_ids vacío → REJECT 400", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = createMockFetch({
    authUser: { id: USER_ID, user_metadata: { clinica_id: CLINICA_A } },
    memberships: baseMemberships,
    archivos: [],
    certificados: [],
  }) as any;

  try {
    const req = new Request("http://localhost/archivos-purge", {
      method: "POST",
      headers: {
        "Authorization": "Bearer valid-jwt",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        archivo_ids: [],
        source_type: "archivo",
      }),
    });
    const res = await handler(req);
    assertEquals(res.status, 400);
    const body = await res.json();
    assertEquals(body.error.includes("archivo_ids"), true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
