import { baseURL } from "@/baseUrl";

// OAuth 2.0 Authorization Server Metadata (RFC 8414).
// Aplikace je zároveň authorization serverem i resource serverem na stejném
// originu, takže issuer = baseURL.
export function GET() {
  return Response.json(
    {
      issuer: baseURL,
      authorization_endpoint: `${baseURL}/oauth/authorize`,
      token_endpoint: `${baseURL}/oauth/token`,
      registration_endpoint: `${baseURL}/oauth/register`,
      scopes_supported: ["mcp"],
      response_types_supported: ["code"],
      response_modes_supported: ["query"],
      grant_types_supported: ["authorization_code"],
      token_endpoint_auth_methods_supported: ["none"],
      code_challenge_methods_supported: ["S256"],
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=3600",
      },
    },
  );
}
