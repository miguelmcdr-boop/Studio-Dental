/**
 * Helpers para tests de Edge Functions con mocks de Supabase Auth y REST API
 */

export interface MockFetchConfig {
  authUser?: {
    id: string;
    user_metadata?: { clinica_id?: string };
  };
  memberships?: Array<{ user_id: string; clinica_id: string; rol: string; activo: boolean }>;
  pacientes?: Array<{ id: string; clinica_id: string; nombre?: string; rut?: string; deleted_at?: string }>;
  archivos?: Array<{ id: string; clinica_id: string; paciente_id?: string; r2_object_key?: string; estado?: string; nombre_archivo?: string; deleted_at?: string }>;
  certificados?: Array<{ id: string; clinica_id: string; paciente_id?: string; datos?: Record<string, any> }>;
  r2DeleteOk?: boolean | string[]; // string[] = r2_object_keys que deben fallar
  auditLogOk?: boolean;
  deleteOk?: boolean;
  certificadoDeleteOk?: boolean; // F7-37 v3: controlar fallos de DELETE de certificados
  operationCounters?: {
    validate_cert?: number;
    delete_r2?: number;
    delete_archivo?: number;
    delete_cert?: number;
  }; // F7-37 v3.1: contadores de operaciones para tests conductuales
}

export function createMockFetch(config: MockFetchConfig) {
  return async (url: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const urlStr = typeof url === "string" ? url : url instanceof URL ? url.toString() : url.url;
    const method = init?.method || "GET";

    // Auth endpoint
    if (urlStr.includes("/auth/v1/user")) {
      if (!config.authUser) {
        return new Response("Unauthorized", { status: 401 });
      }
      return new Response(JSON.stringify(config.authUser), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // REST endpoint: miembros_clinica
    if (urlStr.includes("/rest/v1/miembros_clinica")) {
      const urlObj = new URL(urlStr);
      const userIdFilter = urlObj.searchParams.get("user_id")?.replace("eq.", "");
      const clinicaIdFilter = urlObj.searchParams.get("clinica_id")?.replace("eq.", "");
      const activoFilter = urlObj.searchParams.get("activo")?.replace("eq.", "");

      let results = (config.memberships || []).filter(m => m.user_id === userIdFilter);
      if (clinicaIdFilter) results = results.filter(m => m.clinica_id === clinicaIdFilter);
      if (activoFilter) results = results.filter(m => String(m.activo) === activoFilter);

      return new Response(JSON.stringify(results), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // REST endpoint: pacientes
    if (urlStr.includes("/rest/v1/pacientes")) {
      if (method === "DELETE") {
        if (config.deleteOk === false) {
          return new Response("DB error", { status: 500 });
        }
        return new Response(null, { status: 204 });
      }
      const urlObj = new URL(urlStr);
      const clinicaIdFilter = urlObj.searchParams.get("clinica_id")?.replace("eq.", "");
      const idsFilter = urlObj.searchParams.get("id")?.replace("in.(", "").replace(")", "");
      const ids = idsFilter ? idsFilter.split(",") : [];

      let results = (config.pacientes || []).filter(p => ids.includes(p.id));
      if (clinicaIdFilter) results = results.filter(p => p.clinica_id === clinicaIdFilter);

      return new Response(JSON.stringify(results), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // REST endpoint: archivos_clinicos
    if (urlStr.includes("/rest/v1/archivos_clinicos")) {
      if (method === "DELETE") {
        if (config.operationCounters) config.operationCounters.delete_archivo = (config.operationCounters.delete_archivo || 0) + 1;
        return new Response(null, { status: 204 });
      }
      const urlObj = new URL(urlStr);
      const clinicaIdFilter = urlObj.searchParams.get("clinica_id")?.replace("eq.", "");
      const pacienteIdFilter = urlObj.searchParams.get("paciente_id")?.replace("eq.", "");
      const idsFilter = urlObj.searchParams.get("id")?.replace("in.(", "").replace(")", "");

      let results = config.archivos || [];
      if (clinicaIdFilter) results = results.filter(a => a.clinica_id === clinicaIdFilter);
      if (pacienteIdFilter) results = results.filter(a => a.paciente_id === pacienteIdFilter);
      if (idsFilter) {
        const ids = idsFilter.split(",");
        results = results.filter(a => ids.includes(a.id));
      }

      return new Response(JSON.stringify(results), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // REST endpoint: certificados (F7-37 v3: soporte para tests H-08)
    if (urlStr.includes("/rest/v1/certificados")) {
      if (method === "DELETE") {
        if (config.operationCounters) config.operationCounters.delete_cert = (config.operationCounters.delete_cert || 0) + 1;
        if (config.certificadoDeleteOk === false) {
          return new Response("DB error", { status: 500 });
        }
        return new Response(null, { status: 204 });
      }
      const urlObj = new URL(urlStr);
      const idsFilter = urlObj.searchParams.get("id")?.replace("eq.", "");

      let results = config.certificados || [];
      if (idsFilter) {
        if (config.operationCounters) config.operationCounters.validate_cert = (config.operationCounters.validate_cert || 0) + 1;
        results = results.filter(c => c.id === idsFilter);
      }

      return new Response(JSON.stringify(results), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // REST endpoint: rpc/registrar_evento_purge
    if (urlStr.includes("/rest/v1/rpc/registrar_evento_purge")) {
      if (config.auditLogOk === false) {
        return new Response("Audit error", { status: 500 });
      }
      return new Response("{}", { status: 200 });
    }

    // R2 DELETE (Cloudflare) - F7-36 FASE 6: soporta fallo por r2_object_key
    if (urlStr.includes("r2.cloudflarestorage.com")) {
      if (config.operationCounters) config.operationCounters.delete_r2 = (config.operationCounters.delete_r2 || 0) + 1;
      if (config.r2DeleteOk === false) {
        return new Response("R2 error", { status: 500 });
      }
      // Nuevo: si es array, fallar solo los r2_object_keys listados
      if (Array.isArray(config.r2DeleteOk)) {
        const r2Key = decodeURIComponent(urlStr.split("/").pop() || "");
        if (config.r2DeleteOk.some(k => urlStr.includes(k))) {
          return new Response("R2 error", { status: 500 });
        }
      }
      return new Response(null, { status: 204 });
    }

    console.error(`[mockFetch] Unmatched URL: ${urlStr}`);
    return new Response("Not found", { status: 404 });
  };
}

export function createAuthRequest(body: object, token = "valid-jwt"): Request {
  return new Request("http://localhost/pacientes-purge", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

export function setupDenoEnv() {
  Deno.env.set("SUPABASE_URL", "https://test.supabase.co");
  Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "test-service-key");
  Deno.env.set("R2_ACCESS_KEY_ID", "test-r2-key");
  Deno.env.set("R2_SECRET_ACCESS_KEY", "test-r2-secret");
  Deno.env.set("R2_BUCKET_NAME", "test-bucket");
  Deno.env.set("R2_ACCOUNT_ID", "test-account");
}
