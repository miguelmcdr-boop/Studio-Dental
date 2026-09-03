// F7-22 Fase 7c: Edge Function para eliminar archivo de R2 + soft delete en metadata
//
// Flujo:
// 1. Frontend solicita eliminación de archivo
// 2. Edge Function valida: sesión, clínica, RBAC
// 3. Elimina archivo de R2 (DELETE con firma AWS v4)
// 4. Soft delete en archivos_clinicos (estado='eliminado', deleted_at=NOW())
// 5. Registra en audit_log: "delete"
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
//   "message": "Archivo eliminado correctamente"
// }

// ============================================================
// HELPERS: AWS v4 Signature (Web Crypto API)
// ============================================================

const encoder = new TextEncoder();

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256Hex(data: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", encoder.encode(data));
  return toHex(hash);
}

async function hmacSha256(
  key: ArrayBuffer | Uint8Array,
  data: string
): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key instanceof Uint8Array ? key : key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(data));
}

async function getSignatureKey(
  secret: string,
  dateStamp: string,
  region: string,
  service: string
): Promise<ArrayBuffer> {
  let k = await hmacSha256(encoder.encode("AWS4" + secret), dateStamp);
  k = await hmacSha256(k, region);
  k = await hmacSha256(k, service);
  k = await hmacSha256(k, "aws4_request");
  return k;
}

function getAmzDate(): { amzDate: string; dateStamp: string } {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  return { amzDate, dateStamp };
}

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

    // 2. Parsear body
    const body = await req.json();
    const { archivo_id } = body;

    // 3. Validar inputs
    if (!archivo_id) {
      return jsonResponse({ error: "Missing required field: archivo_id" }, 400);
    }

    // 4. Obtener clínica del usuario
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

    // 5. Validar rol del usuario (admin/dentista pueden eliminar)
    const allowedRoles = ["admin", "dentista"];
    if (!allowedRoles.includes(userRol)) {
      return jsonResponse(
        { error: `Insufficient permissions. Required: ${allowedRoles.join(" or ")}. Current: ${userRol}` },
        403
      );
    }

    // 6. Obtener archivo de archivos_clinicos y validar que pertenece a la clínica
    const archivoResult = await fetch(
      `${supabaseUrl}/rest/v1/archivos_clinicos?id=eq.${archivo_id}&clinica_id=eq.${clinicaId}&select=id,r2_object_key,nombre_archivo`,
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
    const r2ObjectKey = archivo.r2_object_key;

    // 7. Eliminar archivo de R2 (DELETE con firma AWS v4)
    const accessKeyId = Deno.env.get("R2_ACCESS_KEY_ID")!;
    const secretAccessKey = Deno.env.get("R2_SECRET_ACCESS_KEY")!;
    const bucketName = Deno.env.get("R2_BUCKET_NAME")!;
    const accountId = Deno.env.get("R2_ACCOUNT_ID")!;

    const host = `${accountId}.r2.cloudflarestorage.com`;
    const method = "DELETE";
    const region = "auto";
    const service = "s3";
    const path = `/${bucketName}/${r2ObjectKey}`;
    const queryString = "";
    const payload = "";
    const payloadHash = await sha256Hex(payload);
    const { amzDate, dateStamp } = getAmzDate();

    const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
    const signedHeaders = "host;x-amz-content-sha256;x-amz-date";
    const canonicalRequest = [
      method,
      path,
      queryString,
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join("\n");

    const algorithm = "AWS4-HMAC-SHA256";
    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    const canonicalRequestHash = await sha256Hex(canonicalRequest);
    const stringToSign = [
      algorithm,
      amzDate,
      credentialScope,
      canonicalRequestHash,
    ].join("\n");

    const signingKey = await getSignatureKey(secretAccessKey, dateStamp, region, service);
    const signatureBuffer = await hmacSha256(signingKey, stringToSign);
    const signature = toHex(signatureBuffer);

    const authorization = `${algorithm} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const deleteUrl = `https://${host}${path}`;
    const deleteResponse = await fetch(deleteUrl, {
      method,
      headers: {
        Host: host,
        "x-amz-date": amzDate,
        "x-amz-content-sha256": payloadHash,
        Authorization: authorization,
      },
    });

    if (!deleteResponse.ok) {
      const errorBody = await deleteResponse.text();
      return jsonResponse(
        {
          error: "Failed to delete file from R2",
          r2_status: deleteResponse.status,
          r2_body: errorBody.slice(0, 500),
        },
        500
      );
    }

    // 8. Soft delete en archivos_clinicos
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
          estado: "eliminado",
          deleted_at: new Date().toISOString(),
        }),
      }
    );

    if (!updateResult.ok) {
      const errorText = await updateResult.text();
      return jsonResponse(
        {
          error: "File deleted from R2 but failed to update metadata",
          details: errorText,
        },
        500
      );
    }

    // 9. Registrar en audit_log via RPC
    await fetch(`${supabaseUrl}/rest/v1/rpc/registrar_evento_archivo`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${supabaseServiceKey}`,
        apikey: supabaseServiceKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        p_archivo_id: archivo_id,
        p_evento: "delete",
        p_detalle: {
          nombre_archivo: archivo.nombre_archivo,
          r2_object_key: r2ObjectKey,
        },
      }),
    });

    // 10. Retornar respuesta
    return jsonResponse({
      success: true,
      archivo_id: archivo_id,
      message: "Archivo eliminado correctamente",
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
