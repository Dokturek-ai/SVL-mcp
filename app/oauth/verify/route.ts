import { baseURL } from "@/baseUrl";
import { sign, verify, TTL, type AuthRequest, type Lead } from "@/app/lib/auth";
import { createLead, isNotionConfigured } from "@/app/lib/notion";

// ---------------------------------------------------------------------------
// Ověření magic-linku.
//
// Po kliknutí v e-mailu: ověří token, zapíše lead do Notion (best-effort —
// výpadek CRM neblokuje přístup), vydá authorization code a přesměruje zpět
// k OAuth klientovi (hostiteli) na jeho redirect_uri.
// ---------------------------------------------------------------------------

interface MagicPayload {
  lead: Lead;
  areq: AuthRequest;
}

function errorRedirect(reason: string): Response {
  return Response.redirect(
    `${baseURL}/oauth/error?reason=${encodeURIComponent(reason)}`,
    303,
  );
}

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token") ?? "";

  let payload: MagicPayload;
  try {
    payload = verify<MagicPayload>(token, "magic");
  } catch {
    return errorRedirect(
      "Odkaz je neplatný nebo vypršel. Spusťte připojení znovu z vašeho AI asistenta.",
    );
  }

  const { lead, areq } = payload;

  // Zápis leadu do Notion — neblokující. Výpadek CRM nesmí zabránit přístupu.
  if (isNotionConfigured()) {
    try {
      await createLead(lead);
    } catch (err) {
      console.error("[oauth/verify] zápis leadu do Notion selhal:", err);
    }
  } else {
    console.warn("[oauth/verify] Notion není nakonfigurován — lead se neukládá.");
  }

  // Authorization code je jednorázový, krátce platný a váže e-mail, klienta,
  // redirect_uri a PKCE challenge pro pozdější ověření na /oauth/token.
  const code = sign(
    {
      sub: lead.email,
      client_id: areq.client_id,
      redirect_uri: areq.redirect_uri,
      code_challenge: areq.code_challenge,
      code_challenge_method: areq.code_challenge_method,
    },
    "code",
    TTL.code,
  );

  const redirect = new URL(areq.redirect_uri);
  redirect.searchParams.set("code", code);
  if (areq.state) redirect.searchParams.set("state", areq.state);

  return Response.redirect(redirect.toString(), 302);
}
