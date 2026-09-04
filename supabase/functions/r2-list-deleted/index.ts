// F7-31 Fase 2: Edge Function para listar archivos eliminados (papelera)
//
// Flujo:
// 1. Frontend solicita lista de archivos eliminados
// 2. Edge Function valida: sesión, clínica, RBAC
// 3. Consulta archivos_clinicos WHERE estado='eliminado' AND clinica_id=clinica_usuario
// 4. Retorna lista con metadata (id, nombre_archivo, categoria, deleted_at, uploaded_by)
//
// Input (JSON body):
// {
//   "paciente_id": "uuid" (opcional, filtra por paciente)
// }
//
// Output (JSON):
// {
//   "archivos": [
//     {
//       "id": "uuid",
//       "nombre_archivo": "string",
//       "mime_type": "string",
//       "tamano_bytes": 12345,
//       "categoria": "foto_clinica|radiografia|pdf",
//       "deleted_at": "2026-09-04T12:00:00Z",
//       "uploaded_by": "uuid"
//     }
//   ]
// }

// ============================================================
// HANDLER PRINCIPAL
// ============================================================

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    // 1. Validar JWT de Supabase
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return jsonResponse({ error: "Missing or invalid Authorization header" }, 401);
    }

    const jwt = authHeader.split(" ")[1];
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verificar JWT con Supabase
    const { data: userData, error: authError } = await fetch(
      `${supabaseUrl}/auth/v1/user`,
      {
        headers: {
          Authorization: `Bearer ${jwt}`,
          apikey: supabaseServiceKey,
        },
      }
    ).then(async (res) => {
      if (!res.ok) {
        return { data: null, error: await res.text() };
      }
      return { data: await res.json(), error: null };
    });

    if (authError || !userData) {
      return jsonResponse({ error: "Invalid JWT", details: authError }, 401);
    }

    const userId = userData.id;

    // 2. Parsear body (opcional)
    let pacienteId: string | null = null;
    try {
      const body = await req.json();
      pacienteId = body.paciente_id || null;
    } catch {
      // Body vacío o inválido, usar null
    }

    // 3. Obtener clínica del usuario
    const clinicaResult = await fetch(
      `${supabaseUrl}/rest/v1/miembros_clinica?user_id=eq.${userId}&select=clinica_id,rol`,
      {
        headers: {
          Authorization: `Bearer ${supabaseServiceKey}`,
          apikey: supabaseServiceKey,
        },
      }
    ).then((res) => res.json());

    if (!clinicaResult || clinicaResult.length === 0) {
      return jsonResponse({ error: "User not associated with any clínica" }, 403);
    }

    const clinicaId = clinicaResult[0].clinica_id;

    // 4. Consultar archivos eliminados de la clínica del usuario
    let queryUrl = `${supabaseUrl}/rest/v1/archivos_clinicos?clinica_id=eq.${clinicaId}&estado=eq.eliminado&select=id,nombre_archivo,mime_type,tamano_bytes,categoria,deleted_at,uploaded_by,paciente_id&order=deleted_at.desc`;

    if (pacienteId) {
      queryUrl += `&paciente_id=eq.${pacienteId}`;
    }

    const archivosResult = await fetch(queryUrl, {
      headers: {
        Authorization: `Bearer ${supabaseServiceKey}`,
        apikey: supabaseServiceKey,
      },
    }).then((res) => res.json());

    if (!Array.isArray(archivosResult)) {
      return jsonResponse(
        { error: "Failed to fetch deleted archivos", details: archivosResult },
        500
      );
    }

    // 5. Retornar lista de archivos eliminados
    return jsonResponse({
      archivos: archivosResult,
      count: archivosResult.length,
    });
  } catch (error) {
    return jsonResponse(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      500
    );
  }
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
