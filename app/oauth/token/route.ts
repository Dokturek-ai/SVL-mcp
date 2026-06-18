import { sign, verify, verifyPkce, TTL } from "@/app/lib/auth";

// ---------------------------------------------------------------------------
// Token endpoint (RFC 6749 §4.1.3 + PKCE RFC 7636).
//
// Vymění authorization code za access token. Ověří shodu klienta, redirect_uri
// a PKCE (S256). Access token je podepsaný JWT, který následně ověřuje /mcp.
// ---------------------------------------------------------------------------

interface CodePayload {
  sub: string;
  client_id: string;
  redirect_uri: string;
  code_challenge: string;
  code_challenge_method: string;
}

const CORS = { "Access-Control-Allow-Origin": "*" } as const;

function oauthError(error: string, description: string, status = 400): Response {
  return Response.json(
    { error, error_description: description },
    { status, headers: CORS },
  );
}

export async function POST(req: Request) {
  // Podporujeme form-encoded (standard) i JSON tělo.
  let params: Record<string, string> = {};
  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      params = (await req.json()) as Record<string, string>;
    } catch {
      return oauthError("invalid_request", "Tělo požadavku nelze přečíst.");
    }
  } else {
    const form = await req.formData();
    for (const [k, v] of form.entries()) params[k] = String(v);
  }

  if (params.grant_type !== "authorization_code") {
    return oauthError("unsupported_grant_type", "Podporován je pouze authorization_code.");
  }

  const { code, redirect_uri, client_id, code_verifier } = params;
  if (!code || !code_verifier) {
    return oauthError("invalid_request", "Chybí code nebo code_verifier.");
  }

  let payload: CodePayload;
  try {
    payload = verify<CodePayload>(code, "code");
  } catch {
    return oauthError("invalid_grant", "Authorization code je neplatný nebo vypršel.");
  }

  if (client_id && client_id !== payload.client_id) {
    return oauthError("invalid_grant", "client_id neodpovídá vydanému kódu.");
  }
  if (redirect_uri && redirect_uri !== payload.redirect_uri) {
    return oauthError("invalid_grant", "redirect_uri neodpovídá vydanému kódu.");
  }
  if (payload.code_challenge_method !== "S256" || !verifyPkce(code_verifier, payload.code_challenge)) {
    return oauthError("invalid_grant", "Ověření PKCE selhalo.");
  }

  const accessToken = sign({ sub: payload.sub }, "access", TTL.access);

  return Response.json(
    {
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: TTL.access,
      scope: "mcp",
    },
    { headers: { ...CORS, "Cache-Control": "no-store" } },
  );
}
