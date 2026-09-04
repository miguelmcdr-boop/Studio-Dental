// F7-31 Fase 3: Edge Function para restaurar archivo eliminado
//
// Flujo:
// 1. Frontend solicita restauración de archivo
// 2. Edge Function valida: sesión, clínica, RBAC (admin/dentista)
// 3. Valida que archivo existe, pertenece a la clínica, y tiene estado='eliminado'
// 4. Actualiza archivos_clinicos SET estado='activo', deleted_at=NULL
// 5. Registra en audit_log: "FILE_RESTORE"
//
// IMPORTANTE (F7-31): El archivo físico nunca se eliminó de R2 (gracias a Fase 1),
// por lo que restaurar solo requiere cambiar metadata.
//
// Input (JSON body):
// {
//   "archivo_id": "uuid"
// }
//
// Output (JSON):
// {
//   "success": true,
//   "archivo_id": "uuid",
//   "message": "Archivo restaurado correctamente"
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

    // 2. Parsear body
    const body = await req.json();
    const { archivo_id } = body;

    // 3. Validar inputs
    if (!archivo_id) {
      return jsonResponse({ error: "Missing required field: archivo_id" }, 400);
    }

    // 4. Obtener clínica y rol del usuario
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
    const userRol = clinicaResult[0].rol;

    // 5. Validar rol (solo admin/dentista pueden restaurar)
    const allowedRoles = ["admin", "dentista"];
    if (!allowedRoles.includes(userRol)) {
      return jsonResponse(
        { error: `Insufficient permissions. Required: ${allowedRoles.join(" or ")}. Current: ${userRol}` },
        403
      );
    }

    // 6. Obtener archivo y validar
    const archivoResult = await fetch(
      `${supabaseUrl}/rest/v1/archivos_clinicos?id=eq.${archivo_id}&clinica_id=eq.${clinicaId}&select=id,estado,nombre_archivo,r2_object_key,deleted_at`,
      {
        headers: {
          Authorization: `Bearer ${supabaseServiceKey}`,
          apikey: supabaseServiceKey,
        },
      }
    ).then((res) => res.json());

    if (!archivoResult || archivoResult.length === 0) {
      return jsonResponse(
        { error: "Archivo not found or does not belong to your clínica" },
        404
      );
    }

    const archivo = archivoResult[0];

    // Validar que el archivo esté en estado 'eliminado'
    if (archivo.estado !== "eliminado") {
      return jsonResponse(
        { error: `Cannot restore archivo: current estado is '${archivo.estado}', expected 'eliminado'` },
        400
      );
    }

    // 7. Restaurar archivo (estado='activo', deleted_at=NULL)
    const updateResult = await fetch(
      `${supabaseUrl}/rest/v1/archivos_clinicos?id=eq.${archivo_id}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${supabaseServiceKey}`,
          apikey: supabaseServiceKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          estado: "activo",
          deleted_at: null,
        }),
      }
    );

    if (!updateResult.ok) {
      const errorText = await updateResult.text();
      return jsonResponse(
        {
          error: "Failed to restore archivo metadata",
          details: errorText,
        },
        500
      );
    }

    // 8. Registrar en audit_log via RPC
    await fetch(`${supabaseUrl}/rest/v1/rpc/registrar_evento_archivo`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${supabaseServiceKey}`,
        apikey: supabaseServiceKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        p_archivo_id: archivo_id,
        p_evento: "FILE_RESTORE",
        p_detalle: {
          nombre_archivo: archivo.nombre_archivo,
          r2_object_key: archivo.r2_object_key,
          restored_at: new Date().toISOString(),
        },
      }),
    });

    // 9. Retornar respuesta
    return jsonResponse({
      success: true,
      archivo_id: archivo_id,
      message: "Archivo restaurado correctamente",
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
