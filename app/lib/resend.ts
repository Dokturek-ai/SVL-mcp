import "server-only";

// ---------------------------------------------------------------------------
// Odeslání e-mailu přes Resend REST API: magic-link pro ověření přístupu
// a záložní notifikace leadu (když selže zápis do Notion).
//
// Konfigurace (env):
//   RESEND_API_KEY      – API klíč Resend
//   EMAIL_FROM          – adresa odesílatele na ověřené doméně
//                         (např. "Doktůrek.ai <noreply@dokturek.ai>")
//   LEAD_FALLBACK_EMAIL – kam poslat lead, když selže Notion (obchodní adresa)
// ---------------------------------------------------------------------------

import type { Lead } from "./auth";

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
const EMAIL_FROM = process.env.EMAIL_FROM ?? "";
const LEAD_FALLBACK_EMAIL = process.env.LEAD_FALLBACK_EMAIL ?? "";

export function isEmailConfigured(): boolean {
  return Boolean(RESEND_API_KEY && EMAIL_FROM);
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!isEmailConfigured()) {
    throw new Error("Resend není nakonfigurován (RESEND_API_KEY / EMAIL_FROM).");
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    signal: AbortSignal.timeout(10_000),
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: EMAIL_FROM, to, subject, html }),
  });
  if (!res.ok) {
    // Tělo odpovědi nezahrnujeme — může nést adresy/detaily požadavku, které
    // by se přes logování chyby dostaly do produkčních logů.
    throw new Error(`Resend: odeslání selhalo (HTTP ${res.status}).`);
  }
}

function emailHtml(name: string, link: string): string {
  const greeting = name ? `Dobrý den, ${escapeHtml(name)},` : "Dobrý den,";
  return `<!doctype html>
<html lang="cs">
  <body style="margin:0;background:#f4f5f7;font-family:Arial,Helvetica,sans-serif;color:#18181b;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0;">
      <tr><td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e4e4e7;">
          <tr><td style="padding:28px 32px 8px;">
            <div style="font-size:18px;font-weight:700;letter-spacing:-0.01em;">Doktůrek<span style="color:#0d9488;">.ai</span></div>
          </td></tr>
          <tr><td style="padding:8px 32px 0;">
            <h1 style="font-size:20px;margin:12px 0 4px;">Potvrďte přístup ke znalostní bázi</h1>
            <p style="font-size:14px;line-height:1.6;color:#3f3f46;">${greeting}<br/>
              kliknutím níže potvrdíte svůj e-mail a aktivujete přístup ke znalostní bázi Doktůrek.ai ve vašem AI asistentovi.</p>
          </td></tr>
          <tr><td style="padding:20px 32px;">
            <a href="${link}" style="display:inline-block;background:#0d9488;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:12px 22px;border-radius:10px;">Potvrdit a aktivovat přístup</a>
          </td></tr>
          <tr><td style="padding:0 32px 28px;">
            <p style="font-size:12px;line-height:1.6;color:#71717a;">Odkaz platí 15 minut. Pokud jste o přístup nežádali, tento e-mail ignorujte.<br/>
              Nefunguje tlačítko? Vložte do prohlížeče:<br/>
              <span style="color:#0d9488;word-break:break-all;">${link}</span></p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendMagicLink(to: string, name: string, link: string): Promise<void> {
  await sendEmail(
    to,
    "Potvrďte přístup ke znalostní bázi Doktůrek.ai",
    emailHtml(name, link),
  );
}

export function isLeadFallbackConfigured(): boolean {
  return isEmailConfigured() && Boolean(LEAD_FALLBACK_EMAIL);
}

/**
 * Záložní doručení leadu e-mailem, když selže zápis do Notion — aby se lead
 * neztratil. Nevyhazuje, pokud fallback není nakonfigurován (jen vrátí false).
 */
export async function sendLeadNotification(lead: Lead): Promise<boolean> {
  if (!isLeadFallbackConfigured()) return false;
  const rows = [
    ["Jméno", `${lead.firstName} ${lead.lastName}`.trim()],
    ["E-mail", lead.email],
    ["Pozice", lead.position],
  ]
    .map(
      ([k, v]) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#71717a;">${escapeHtml(k)}</td><td style="padding:4px 0;font-weight:600;">${escapeHtml(v)}</td></tr>`,
    )
    .join("");
  const html = `<!doctype html><html lang="cs"><body style="font-family:Arial,Helvetica,sans-serif;color:#130f3e;">
    <h2 style="margin:0 0 4px;">Nový lead (záloha — Notion selhal)</h2>
    <p style="color:#71717a;margin:0 0 12px;">Zápis do Notion se nezdařil, lead zachycen e-mailem. Doplňte ho ručně.</p>
    <table>${rows}</table></body></html>`;
  await sendEmail(LEAD_FALLBACK_EMAIL, "Doktůrek RAG — nový lead (záloha)", html);
  return true;
}
