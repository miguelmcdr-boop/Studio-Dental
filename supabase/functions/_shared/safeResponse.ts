/**
 * F7-35: Helper para respuestas HTTP seguras en Edge Functions.
 *
 * Garantiza que:
 * - El cliente nunca recibe stack traces, SQL, PostgREST internals,
 *   errores de Supabase Auth ni detalles de infraestructura.
 * - Los detalles técnicos quedan registrados solo en console.error
 *   (logs de Supabase Edge Functions, observables en Dashboard).
 */

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

/**
 * Responde error genérico al cliente y loggea el detalle técnico.
 *
 * @param _req - Request original (reservado para futura extracción de request-id)
 * @param publicCode - Código legible para el cliente (ej: "INVALID_JWT")
 * @param internalError - Error técnico real. NO se envía al cliente.
 * @param status - HTTP status (401, 403, 500, etc.)
 * @param context - Etiqueta para logs (ej: "[r2-upload-url]")
 */
export function safeError(
  _req: Request | undefined,
  publicCode: string,
  internalError: unknown,
  status: number,
  context = "[edge-function]"
): Response {
  let detail: string;
  if (internalError instanceof Error) {
    detail = `${internalError.name}: ${internalError.message}`;
  } else if (typeof internalError === "string") {
    detail = internalError;
  } else {
    try {
      detail = JSON.stringify(internalError);
    } catch {
      detail = "[unserializable]";
    }
  }

  // Detalle técnico solo en logs internos (Supabase Function Logs)
  console.error(`${context} ${publicCode} (status=${status}): ${detail}`);

  // Cliente recibe solo código genérico, sin detalles
  return jsonResponse({ error: publicCode }, status);
}

/**
 * Wrapper para el catch genérico. Loggea el error y devuelve 500 genérico.
 */
export function safeInternalError(
  req: Request | undefined,
  error: unknown,
  context = "[edge-function]"
): Response {
  return safeError(req, "INTERNAL_SERVER_ERROR", error, 500, context);
}
