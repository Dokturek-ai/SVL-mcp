import { after } from "next/server";
import { baseURL } from "@/baseUrl";
import { sign, verify, opaqueId, TTL, type AuthRequest, type Lead } from "@/app/lib/auth";
import { createLead, isNotionConfigured } from "@/app/lib/notion";
import { sendLeadNotification } from "@/app/lib/resend";
import { log } from "@/app/lib/log";

// Uloží lead — primárně Notion, při selhání záložní e-mail. Cílem je lead
// NEZTRATIT. Nikdy nevyhazuje (přístup se kvůli CRM neblokuje). Do logů jde
// jen neidentifikující hash e-mailu (PII se neukládá).
async function captureLead(lead: Lead): Promise<void> {
  const id = opaqueId(lead.email);
  if (isNotionConfigured()) {
    try {
      await createLead(lead);
      log("info", "lead_saved", { sink: "notion", lead: id });
      return;
    } catch (err) {
      log("error", "lead_notion_failed", { lead: id, error: String(err) });
    }
  } else {
    log("warn", "lead_notion_unconfigured", { lead: id });
  }

  // Notion selhal nebo není nastaven → záložní e-mail, ať lead nezmizí.
  try {
    const sent = await sendLeadNotification(lead);
    log(sent ? "warn" : "error", sent ? "lead_fallback" : "lead_lost", {
      lead: id,
      ...(sent ? {} : { reason: "fallback e-mail není nakonfigurován (LEAD_FALLBACK_EMAIL)" }),
    });
  } catch (err) {
    log("error", "lead_lost", { lead: id, error: String(err) });
  }
}

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

  // Zachycení leadu běží AŽ PO odeslání redirectu (next/after), aby výpadek
  // Notion/e-mailu nezdržoval návrat uživatele do asistenta.
  after(() => captureLead(lead));

  // Authorization code je jednorázový a krátce platný. `sub` je neidentifikující
  // hash e-mailu — code se posílá v redirect URL, takže do něj nedáváme PII.
  const code = sign(
    {
      sub: opaqueId(lead.email),
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
