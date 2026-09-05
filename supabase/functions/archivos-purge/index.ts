// Feature 1: Edge Function para purgar archivos de la papelera (eliminación permanente)
//
// Flujo:
// 1. Frontend solicita purga de archivos en papelera
// 2. Edge Function valida: sesión, clínica, RBAC (solo admin)
// 3. Para cada archivo valida:
//    - Pertenece a la clínica del admin (multi-tenant)
//    - Está en papelera (estado='eliminado')
// 4. Elimina blob de R2 (sin restricción de tiempo, libera espacio)
// 5. DELETE de la fila de archivos_clinicos
// 6. Registra en audit_log: ADMIN_PURGE_ARCHIVOS
//
// Input (JSON body):
// { "archivo_ids": ["uuid1", "uuid2"] }
//
// Output (JSON):
// {
//   "success": true,
//   "purgados": ["uuid1"],
//   "rechazados": [{ "id": "uuid2", "razon": "..." }],
//   "message": "..."
// }

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

async function hmacSha256(key: ArrayBuffer, data: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  return await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(data));
}

async function getSignatureKey(secret: string, dateStamp: string, region: string, service: string): Promise<ArrayBuffer> {
  let k = await hmacSha256(encoder.encode("AWS4" + secret), dateStamp);
  k = await hmacSha256(k, region);
  k = await hmacSha256(k, service);
  k = await hmacSha256(k, "aws4_request");
  return k;
}

function getAmzDate(): { amzDate: string; dateStamp: string } {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  return { amzDate, dateStamp: amzDate.slice(0, 8) };
}

async function eliminarDeR2(r2ObjectKey: string): Promise<boolean> {
  try {
    const accessKeyId = Deno.env.get("R2_ACCESS_KEY_ID")!;
    const secretAccessKey = Deno.env.get("R2_SECRET_ACCESS_KEY")!;
    const bucketName = Deno.env.get("R2_BUCKET_NAME")!;
    const accountId = Deno.env.get("R2_ACCOUNT_ID")!;

    const host = `${accountId}.r2.cloudflarestorage.com`;
    const method = "DELETE";
    const region = "auto";
    const service = "s3";
    const path = `/${bucketName}/${r2ObjectKey}`;
    const payloadHash = await sha256Hex("");
    const { amzDate, dateStamp } = getAmzDate();

    const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
    const signedHeaders = "host;x-amz-content-sha256;x-amz-date";
    const canonicalRequest = [method, path, "", canonicalHeaders, signedHeaders, payloadHash].join("\n");

    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    const canonicalRequestHash = await sha256Hex(canonicalRequest);
    const stringToSign = ["AWS4-HMAC-SHA256", amzDate, credentialScope, canonicalRequestHash].join("\n");

    const signingKey = await getSignatureKey(secretAccessKey, dateStamp, region, service);
    const signature = toHex(await hmacSha256(signingKey, stringToSign));
    const authorization = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const res = await fetch(`https://${host}${path}`, {
      method,
      headers: { Host: host, "x-amz-date": amzDate, "x-amz-content-sha256": payloadHash, Authorization: authorization },
    });
    return res.ok || res.status === 404;
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    // 1. Validar JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return jsonResponse({ error: "Missing or invalid Authorization header" }, 401);
    }
    const jwt = authHeader.split(" ")[1];
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const { data: userData, error: authError } = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${jwt}`, apikey: supabaseServiceKey },
    }).then(async (res) => {
      if (!res.ok) return { data: null, error: await res.text() };
      return { data: await res.json(), error: null };
    });

    if (authError || !userData) {
      return jsonResponse({ error: "Invalid JWT" }, 401);
    }
    const userId = userData.id;

    // 2. Parsear body
    const body = await req.json();
    const archivoIds: string[] = Array.isArray(body.archivo_ids) ? body.archivo_ids : [];
    if (archivoIds.length === 0) {
      return jsonResponse({ error: "Missing required field: archivo_ids" }, 400);
    }

    // 3. Obtener clínica y rol
    const clinicaResult = await fetch(
      `${supabaseUrl}/rest/v1/miembros_clinica?user_id=eq.${userId}&select=clinica_id,rol`,
      { headers: { Authorization: `Bearer ${supabaseServiceKey}`, apikey: supabaseServiceKey } }
    ).then((res) => res.json());

    if (!clinicaResult || clinicaResult.length === 0) {
      return jsonResponse({ error: "User not associated with any clínica" }, 403);
    }
    const clinicaId = clinicaResult[0].clinica_id;
    const userRol = clinicaResult[0].rol;

    // 4. Solo admin puede purgar
    if (userRol !== "admin") {
      return jsonResponse({ error: `Insufficient permissions. Required: admin. Current: ${userRol}` }, 403);
    }

    // 5. Obtener archivos de la papelera de esta clínica
    const idsParam = archivoIds.join(",");
    const archivosResult = await fetch(
      `${supabaseUrl}/rest/v1/archivos_clinicos?id=in.(${idsParam})&clinica_id=eq.${clinicaId}&select=id,nombre_archivo,r2_object_key,estado`,
      { headers: { Authorization: `Bearer ${supabaseServiceKey}`, apikey: supabaseServiceKey } }
    ).then((res) => res.json());

    if (!Array.isArray(archivosResult)) {
      return jsonResponse({ error: "Failed to fetch archivos" }, 500);
    }

    const purgados: string[] = [];
    const rechazados: Array<{ id: string; razon: string }> = [];

    for (const archivoId of archivoIds) {
      const archivo = archivosResult.find((a: any) => a.id === archivoId);

      // No existe o no pertenece a la clínica
      if (!archivo) {
        rechazados.push({ id: archivoId, razon: "no_pertenece_clinica" });
        continue;
      }
      // No está en papelera
      if (archivo.estado !== "eliminado") {
        rechazados.push({ id: archivoId, razon: "no_esta_en_papelera" });
        continue;
      }

      // 6. Eliminar blob de R2 (sin restricción de tiempo)
      const okR2 = await eliminarDeR2(archivo.r2_object_key);
      if (!okR2) {
        rechazados.push({ id: archivoId, razon: "error_delete_r2" });
        continue;
      }

      // 7. DELETE de la fila de archivos_clinicos
      const deleteRes = await fetch(
        `${supabaseUrl}/rest/v1/archivos_clinicos?id=eq.${archivoId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${supabaseServiceKey}`, apikey: supabaseServiceKey },
        }
      );

      if (!deleteRes.ok) {
        rechazados.push({ id: archivoId, razon: "error_delete_bd" });
        continue;
      }

      // 8. Registrar auditoría
      await fetch(`${supabaseUrl}/rest/v1/rpc/registrar_evento_purge`, {
        method: "POST",
        headers: { Authorization: `Bearer ${supabaseServiceKey}`, apikey: supabaseServiceKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          p_clinica_id: clinicaId,
          p_evento: "ADMIN_PURGE_ARCHIVOS",
          p_detalle: {
            archivo_id: archivoId,
            nombre_archivo: archivo.nombre_archivo,
          },
          p_user_id: userId,
        }),
      });

      purgados.push(archivoId);
    }

    return jsonResponse({
      success: true,
      purgados,
      rechazados,
      message: `${purgados.length} archivo(s) purgados, ${rechazados.length} rechazados`,
    });
  } catch (error) {
    return jsonResponse({
      error: "Internal server error",
      message: error instanceof Error ? error.message : String(error),
    }, 500);
  }
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}
