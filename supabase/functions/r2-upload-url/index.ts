// F7-22 Fase 7a: Edge Function para generar URL firmada de upload
//
// Flujo:
// 1. Frontend solicita URL firmada para subir archivo
// 2. Edge Function valida: sesión, clínica, RBAC, paciente
// 3. Genera r2_object_key único
// 4. Guarda metadata en archivos_clinicos (estado: activo)
// 5. Genera URL firmada S3 (PUT, expiración 15 min)
// 6. Registra en audit_log: "upload_initiated"
//
// Input (JSON body):
// {
//   "paciente_id": "uuid",
//   "categoria": "radiografia" | "foto_intraoral" | "foto_clinica" | "pdf" | "documento" | "otro",
//   "nombre_archivo": "radiografia_panoramica.jpg",
//   "mime_type": "image/jpeg",
//   "tamano_bytes": 5242880
// }
//
// Output (JSON):
// {
//   "archivo_id": "uuid",
//   "r2_object_key": "clinica_id/paciente_id/categoria/uuid-nombre.ext",
//   "upload_url": "https://bucket.r2.cloudflarestorage.com/...",
//   "expires_in": 900
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
    const { paciente_id, categoria, nombre_archivo, mime_type, tamano_bytes } = body;

    // 3. Validar inputs
    if (!paciente_id || !categoria || !nombre_archivo || !mime_type || !tamano_bytes) {
      return jsonResponse(
        { error: "Missing required fields: paciente_id, categoria, nombre_archivo, mime_type, tamano_bytes" },
        400
      );
    }

    const validCategorias = ["radiografia", "foto_intraoral", "foto_clinica", "pdf", "documento", "otro"];
    if (!validCategorias.includes(categoria)) {
      return jsonResponse({ error: `Invalid categoria. Must be one of: ${validCategorias.join(", ")}` }, 400);
    }

    if (tamano_bytes < 0 || tamano_bytes > 50 * 1024 * 1024) {
      return jsonResponse({ error: "Invalid tamano_bytes. Must be between 0 and 50MB" }, 400);
    }

    // 4. Obtener clínica del usuario (miembros_clinica)
    const clinicaResult = await fetch(
      `${supabaseUrl}/rest/v1/miembros_clinica?user_id=eq.${userId}&select=clinica_id`,
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

    // 5. Validar que paciente pertenece a la clínica
    const pacienteResult = await fetch(
      `${supabaseUrl}/rest/v1/pacientes?id=eq.${paciente_id}&clinica_id=eq.${clinicaId}&select=id`,
      {
        headers: {
          Authorization: `Bearer ${supabaseServiceKey}`,
          apikey: supabaseServiceKey,
        },
      }
    ).then((res) => res.json());

    if (!pacienteResult || pacienteResult.length === 0) {
      return jsonResponse({ error: "Paciente not found or does not belong to your clínica" }, 403);
    }

    // 6. Validar rol del usuario (admin/dentista pueden subir)
    const rolResult = await fetch(
      `${supabaseUrl}/rest/v1/miembros_clinica?user_id=eq.${userId}&clinica_id=eq.${clinicaId}&select=rol`,
      {
        headers: {
          Authorization: `Bearer ${supabaseServiceKey}`,
          apikey: supabaseServiceKey,
        },
      }
    ).then((res) => res.json());

    if (!rolResult || rolResult.length === 0) {
      return jsonResponse({ error: "User role not found" }, 403);
    }

    const userRol = rolResult[0].rol;
    const allowedRoles = ["admin", "dentista"];
    if (!allowedRoles.includes(userRol)) {
      return jsonResponse(
        { error: `Insufficient permissions. Required: ${allowedRoles.join(" or ")}. Current: ${userRol}` },
        403
      );
    }

    // 7. Generar r2_object_key único
    const archivoId = crypto.randomUUID();
    const timestamp = Date.now();
    const safeName = nombre_archivo.replace(/[^a-zA-Z0-9._-]/g, "_").toLowerCase();
    const r2ObjectKey = `${clinicaId}/${paciente_id}/${categoria}/${archivoId}-${safeName}`;

    // 8. Guardar metadata en archivos_clinicos (estado: activo)
    const metadataResult = await fetch(`${supabaseUrl}/rest/v1/archivos_clinicos`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${supabaseServiceKey}`,
        apikey: supabaseServiceKey,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        id: archivoId,
        clinica_id: clinicaId,
        paciente_id,
        r2_object_key: r2ObjectKey,
        nombre_archivo,
        mime_type,
        tamano_bytes,
        categoria,
        uploaded_by: userId,
        estado: "activo",
        metadata: {},
      }),
    });

    if (!metadataResult.ok) {
      const errorText = await metadataResult.text();
      return jsonResponse(
        { error: "Failed to create metadata in archivos_clinicos", details: errorText },
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
        p_archivo_id: archivoId,
        p_evento: "FILE_UPLOAD",
        p_detalle: {
          paciente_id,
          categoria,
          nombre_archivo,
          tamano_bytes,
          r2_object_key: r2ObjectKey,
        },
      }),
    });

    // 10. Generar URL firmada S3 para upload (PUT, 15 min)
    const accessKeyId = Deno.env.get("R2_ACCESS_KEY_ID")!;
    const secretAccessKey = Deno.env.get("R2_SECRET_ACCESS_KEY")!;
    const bucketName = Deno.env.get("R2_BUCKET_NAME")!;
    const accountId = Deno.env.get("R2_ACCOUNT_ID")!;

    const host = `${accountId}.r2.cloudflarestorage.com`;
    const method = "PUT";
    const region = "auto";
    const service = "s3";
    const path = `/${bucketName}/${r2ObjectKey}`;
    const queryString = "";
    const payload = "UNSIGNED-PAYLOAD"; // Para upload, no firmamos el payload
    const payloadHash = payload;
    const { amzDate, dateStamp } = getAmzDate();

    const canonicalHeaders = `content-type:${mime_type}\nhost:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
    const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";
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

    const uploadUrl = `https://${host}${path}`;
    const expiresIn = 900; // 15 minutos

    // 11. Retornar respuesta
    return jsonResponse({
      archivo_id: archivoId,
      r2_object_key: r2ObjectKey,
      upload_url: uploadUrl,
      upload_headers: {
        "Content-Type": mime_type,
        "x-amz-date": amzDate,
        "x-amz-content-sha256": payloadHash,
        Authorization: authorization,
      },
      expires_in: expiresIn,
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
