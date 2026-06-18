import { baseURL } from "@/baseUrl";
import { sign, verify, TTL, type AuthRequest } from "@/app/lib/auth";
import { sendMagicLink } from "@/app/lib/resend";
import { rateLimit, clientIp } from "@/app/lib/ratelimit";
import { log } from "@/app/lib/log";

// ---------------------------------------------------------------------------
// Zpracování odeslaného lead-formuláře.
//
// Ověří autorizační požadavek (areq) nesený formulářem, zvaliduje údaje,
// vytvoří podepsaný magic-link token a pošle ho e-mailem přes Resend.
// Žádný lead se zde do Notion nezapisuje — to až po potvrzení e-mailu
// (viz /oauth/verify), aby se neukládaly neověřené adresy.
//
// Ochrana proti zneužití: honeypot pole + rate-limit per IP i per e-mail
// (proti e-mail bombingu a pálení Resend kvóty).
// ---------------------------------------------------------------------------

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Limity v okně 15 minut.
const WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_IP = 5;
const MAX_PER_EMAIL = 3;

function backToForm(areqToken: string, error: string): Response {
  const url = new URL(`${baseURL}/oauth/authorize`);
  url.searchParams.set("areq", areqToken);
  url.searchParams.set("error", error);
  return Response.redirect(url.toString(), 303);
}

function toError(reason: string): Response {
  return Response.redirect(
    `${baseURL}/oauth/error?reason=${encodeURIComponent(reason)}`,
    303,
  );
}

function toSent(email: string): Response {
  const sent = new URL(`${baseURL}/oauth/sent`);
  sent.searchParams.set("email", email);
  return Response.redirect(sent.toString(), 303);
}

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return toError("Neplatné odeslání formuláře. Spusťte připojení znovu z vašeho AI asistenta.");
  }
  const areqToken = String(form.get("areq") ?? "");

  let areq: AuthRequest;
  try {
    areq = verify<AuthRequest>(areqToken, "areq");
  } catch {
    return toError("Platnost požadavku vypršela. Spusťte připojení znovu z vašeho AI asistenta.");
  }

  // Honeypot: skryté pole, které vyplní jen boti. Tváříme se úspěšně, ale
  // neposíláme nic.
  if (String(form.get("website") ?? "").trim() !== "") {
    log("warn", "submit_honeypot", { ip: clientIp(req) });
    return toSent(String(form.get("email") ?? ""));
  }

  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const firstName = String(form.get("first_name") ?? "").trim();
  const lastName = String(form.get("last_name") ?? "").trim();
  const position = String(form.get("position") ?? "").trim();
  const consent = String(form.get("consent") ?? "").trim();

  if (!EMAIL_RE.test(email)) return backToForm(areqToken, "Zadejte platnou e-mailovou adresu.");
  if (!firstName) return backToForm(areqToken, "Vyplňte jméno.");
  if (!lastName) return backToForm(areqToken, "Vyplňte příjmení.");
  if (!position) return backToForm(areqToken, "Vyplňte pracovní pozici.");
  if (consent !== "on") {
    return backToForm(areqToken, "Pro pokračování je potřeba souhlas se zpracováním údajů.");
  }

  // Rate-limit (proti zneužití odesílání e-mailů).
  const ip = clientIp(req);
  if (!rateLimit(`ip:${ip}`, MAX_PER_IP, WINDOW_MS)) {
    log("warn", "submit_ratelimited", { scope: "ip", ip });
    return backToForm(areqToken, "Příliš mnoho pokusů. Zkuste to prosím za chvíli.");
  }
  if (!rateLimit(`email:${email}`, MAX_PER_EMAIL, WINDOW_MS)) {
    log("warn", "submit_ratelimited", { scope: "email", email });
    return backToForm(areqToken, "Na tuto adresu jsme už odkaz poslali. Zkontrolujte schránku, případně to zkuste později.");
  }

  const magic = sign(
    { lead: { email, firstName, lastName, position }, areq },
    "magic",
    TTL.magic,
  );
  const link = `${baseURL}/oauth/verify?token=${encodeURIComponent(magic)}`;

  try {
    await sendMagicLink(email, firstName, link);
  } catch (err) {
    log("error", "magiclink_send_failed", { email, error: String(err) });
    return backToForm(areqToken, "E-mail se nepodařilo odeslat. Zkuste to prosím znovu.");
  }

  log("info", "magiclink_sent", { email });
  return toSent(email);
}
