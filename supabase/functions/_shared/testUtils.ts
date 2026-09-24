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
  r2DeleteOk?: boolean;
  auditLogOk?: boolean;
  deleteOk?: boolean;
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

    // REST endpoint: rpc/registrar_evento_purge
    if (urlStr.includes("/rest/v1/rpc/registrar_evento_purge")) {
      if (config.auditLogOk === false) {
        return new Response("Audit error", { status: 500 });
      }
      return new Response("{}", { status: 200 });
    }

    // R2 DELETE (Cloudflare)
    if (urlStr.includes("r2.cloudflarestorage.com")) {
      if (config.r2DeleteOk === false) {
        return new Response("R2 error", { status: 500 });
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
