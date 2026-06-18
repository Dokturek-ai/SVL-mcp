import { sign } from "@/app/lib/auth";

// ---------------------------------------------------------------------------
// Dynamic Client Registration (RFC 7591).
//
// Bezstavově: vydaný `client_id` je sám o sobě podepsaný JWT nesoucí povolené
// redirect_uris. Při /authorize a /token se z něj redirect_uris ověří, takže
// není potřeba žádné úložiště registrovaných klientů.
// ---------------------------------------------------------------------------

function isAllowedRedirect(uri: string): boolean {
  try {
    const u = new URL(uri);
    if (u.protocol === "https:") return true;
    // Lokální vývoj klientů (Cursor, lokální nástroje).
    return (
      u.protocol === "http:" &&
      (u.hostname === "localhost" || u.hostname === "127.0.0.1")
    );
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    /* prázdné tělo ošetříme níže */
  }

  const redirectUris = Array.isArray(body.redirect_uris)
    ? (body.redirect_uris as unknown[]).filter((u): u is string => typeof u === "string")
    : [];

  if (redirectUris.length === 0 || !redirectUris.every(isAllowedRedirect)) {
    return Response.json(
      {
        error: "invalid_redirect_uri",
        error_description:
          "redirect_uris je povinné a musí obsahovat platné https URI (nebo http localhost).",
      },
      { status: 400, headers: { "Access-Control-Allow-Origin": "*" } },
    );
  }

  const clientName = typeof body.client_name === "string" ? body.client_name : null;
  const clientId = sign({ redirect_uris: redirectUris, client_name: clientName }, "client");

  return Response.json(
    {
      client_id: clientId,
      client_id_issued_at: Math.floor(Date.now() / 1000),
      redirect_uris: redirectUris,
      token_endpoint_auth_method: "none",
      grant_types: ["authorization_code"],
      response_types: ["code"],
      ...(clientName ? { client_name: clientName } : {}),
    },
    { status: 201, headers: { "Access-Control-Allow-Origin": "*" } },
  );
}
