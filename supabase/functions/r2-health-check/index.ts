// F7-22: Edge Function de Health Check para Cloudflare R2
// Verifica conexión al bucket sin exponer credenciales
//
// Respuesta:
//   Success: { status: "ok", bucket: "...", objects_count: N }
//   Error:   { status: "error", error: "...", hint: "..." }
//
// SIN DEPENDENCIAS EXTERNAS - usa solo Web Crypto API (nativa en Deno).
// Evita problemas de red al importar desde deno.land.

// ============================================================
// HELPERS: AWS v4 Signature usando Web Crypto API
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
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    // 1. Leer secrets de Supabase
    const accessKeyId = Deno.env.get("R2_ACCESS_KEY_ID");
    const secretAccessKey = Deno.env.get("R2_SECRET_ACCESS_KEY");
    const bucketName = Deno.env.get("R2_BUCKET_NAME");
    const accountId = Deno.env.get("R2_ACCOUNT_ID");
    const endpoint = Deno.env.get("R2_ENDPOINT");

    // Validar que todos los secrets existan
    const missing: string[] = [];
    if (!accessKeyId) missing.push("R2_ACCESS_KEY_ID");
    if (!secretAccessKey) missing.push("R2_SECRET_ACCESS_KEY");
    if (!bucketName) missing.push("R2_BUCKET_NAME");
    if (!accountId) missing.push("R2_ACCOUNT_ID");
    if (!endpoint) missing.push("R2_ENDPOINT");

    if (missing.length > 0) {
      return jsonResponse(
        {
          status: "error",
          error: "Secrets faltantes en Supabase",
          missing,
          hint: "Ve a Supabase Dashboard → Edge Functions → Secrets y agrega los que faltan",
        },
        500
      );
    }

    // 2. Preparar request para listar objetos (ListObjectsV2)
    const host = `${accountId}.r2.cloudflarestorage.com`;
    const method = "GET";
    const region = "auto";
    const service = "s3";
    const path = `/${bucketName}/`;
    const queryString = "list-type=2&max-keys=1";
    const payload = "";
    const payloadHash = await sha256Hex(payload);
    const { amzDate, dateStamp } = getAmzDate();

    // 3. Crear canonical request (AWS v4)
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

    // 4. Crear string to sign
    const algorithm = "AWS4-HMAC-SHA256";
    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    const canonicalRequestHash = await sha256Hex(canonicalRequest);
    const stringToSign = [
      algorithm,
      amzDate,
      credentialScope,
      canonicalRequestHash,
    ].join("\n");

    // 5. Calcular firma
    const signingKey = await getSignatureKey(
      secretAccessKey!,
      dateStamp,
      region,
      service
    );
    const signatureBuffer = await hmacSha256(signingKey, stringToSign);
    const signature = toHex(signatureBuffer);

    // 6. Crear Authorization header
    const authorization = `${algorithm} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    // 7. Hacer el request a R2
    const url = `https://${host}${path}?${queryString}`;
    const response = await fetch(url, {
      method,
      headers: {
        Host: host,
        "x-amz-date": amzDate,
        "x-amz-content-sha256": payloadHash,
        Authorization: authorization,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      let hint = "Revisa las credenciales en Supabase Secrets";
      if (response.status === 403) {
        if (errorBody.includes("InvalidAccessKeyId")) {
          hint =
            "Access Key ID incorrecto. Verifica R2_ACCESS_KEY_ID en Supabase Secrets.";
        } else if (errorBody.includes("SignatureDoesNotMatch")) {
          hint =
            "Secret Access Key incorrecto o mal copiado. Verifica R2_SECRET_ACCESS_KEY.";
        } else if (errorBody.includes("AccessDenied")) {
          hint =
            "El token de R2 no tiene permisos suficientes. Verifica que tenga 'Object Read & Write'.";
        }
      } else if (response.status === 404) {
        hint =
          "Bucket no encontrado. Verifica R2_BUCKET_NAME y que el bucket exista en Cloudflare.";
      }

      return jsonResponse(
        {
          status: "error",
          error: `R2 respondió ${response.status}`,
          r2_status: response.status,
          r2_body: errorBody.slice(0, 500),
          hint,
        },
        500
      );
    }

    // 8. Parsear respuesta XML
    const xml = await response.text();
    const keyMatches = xml.match(/<Key>/g);
    const objectsCount = keyMatches ? keyMatches.length : 0;
    const isTruncated = xml.includes("<IsTruncated>true</IsTruncated>");

    return jsonResponse({
      status: "ok",
      bucket: bucketName,
      endpoint: `https://${host}`,
      objects_count: objectsCount,
      has_more: isTruncated,
      message: "Conexión R2 exitosa",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return jsonResponse(
      {
        status: "error",
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        hint: "Error interno de la Edge Function",
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
