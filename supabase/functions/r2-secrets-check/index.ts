// F7-22: Edge Function de diagnóstico de secrets R2
// NUNCA expone los valores completos de los secrets
// Solo muestra información parcial para validar que estén bien copiados

Deno.serve(async (req) => {
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
    const secrets = {
      R2_ACCESS_KEY_ID: Deno.env.get("R2_ACCESS_KEY_ID") || "",
      R2_SECRET_ACCESS_KEY: Deno.env.get("R2_SECRET_ACCESS_KEY") || "",
      R2_BUCKET_NAME: Deno.env.get("R2_BUCKET_NAME") || "",
      R2_ACCOUNT_ID: Deno.env.get("R2_ACCOUNT_ID") || "",
      R2_ENDPOINT: Deno.env.get("R2_ENDPOINT") || "",
    };

    // Calcular info parcial de cada secret (sin exponer valores completos)
    const diagnostics = Object.fromEntries(
      Object.entries(secrets).map(([key, value]) => {
        const trimmed = value.trim();
        const hasLeadingSpace = value !== value.trimStart();
        const hasTrailingSpace = value !== value.trimEnd();
        const hasNewline = value.includes("\n") || value.includes("\r");

        return [
          key,
          {
            present: value !== "",
            length: value.length,
            trimmed_length: trimmed.length,
            first_4_chars: value.slice(0, 4),
            last_4_chars: value.slice(-4),
            has_leading_space: hasLeadingSpace,
            has_trailing_space: hasTrailingSpace,
            has_newline: hasNewline,
            has_unexpected_whitespace:
              hasLeadingSpace || hasTrailingSpace || hasNewline,
          },
        ];
      })
    );

    // Calcular hash del secret key (no reversible, pero comparable si tienes el hash)
    const encoder = new TextEncoder();
    const secretKeyData = encoder.encode(secrets.R2_SECRET_ACCESS_KEY);
    const secretKeyHash = await crypto.subtle.digest("SHA-256", secretKeyData);
    const secretKeyHashHex = Array.from(new Uint8Array(secretKeyHash))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return new Response(
      JSON.stringify(
        {
          status: "ok",
          diagnostics,
          secret_key_hash: secretKeyHashHex.slice(0, 16) + "...",
          hint: "Compara first_4_chars y last_4_chars con los valores de tu password manager. Si no coinciden, el secret fue copiado incorrectamente.",
        },
        null,
        2
      ),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify(
        {
          status: "error",
          error: error instanceof Error ? error.message : String(error),
        },
        null,
        2
      ),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
