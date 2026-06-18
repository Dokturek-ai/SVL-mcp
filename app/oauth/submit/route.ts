import { baseURL } from "@/baseUrl";
import { sign, verify, TTL, type AuthRequest } from "@/app/lib/auth";
import { sendMagicLink } from "@/app/lib/resend";

// ---------------------------------------------------------------------------
// Zpracování odeslaného lead-formuláře.
//
// Ověří autorizační požadavek (areq) nesený formulářem, zvaliduje údaje,
// vytvoří podepsaný magic-link token a pošle ho e-mailem přes Resend.
// Žádný lead se zde do Notion nezapisuje — to až po potvrzení e-mailu
// (viz /oauth/verify), aby se neukládaly neověřené adresy.
// ---------------------------------------------------------------------------

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function backToForm(areqToken: string, error: string): Response {
  const url = new URL(`${baseURL}/oauth/authorize`);
  url.searchParams.set("areq", areqToken);
  url.searchParams.set("error", error);
  return Response.redirect(url.toString(), 303);
}

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.redirect(
      `${baseURL}/oauth/error?reason=${encodeURIComponent("Neplatné odeslání formuláře. Spusťte připojení znovu z vašeho AI asistenta.")}`,
      303,
    );
  }
  const areqToken = String(form.get("areq") ?? "");

  let areq: AuthRequest;
  try {
    areq = verify<AuthRequest>(areqToken, "areq");
  } catch {
    return Response.redirect(
      `${baseURL}/oauth/error?reason=${encodeURIComponent("Platnost požadavku vypršela. Spusťte připojení znovu z vašeho AI asistenta.")}`,
      303,
    );
  }

  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const firstName = String(form.get("first_name") ?? "").trim();
  const lastName = String(form.get("last_name") ?? "").trim();
  const position = String(form.get("position") ?? "").trim();

  if (!EMAIL_RE.test(email)) return backToForm(areqToken, "Zadejte platnou e-mailovou adresu.");
  if (!firstName) return backToForm(areqToken, "Vyplňte jméno.");
  if (!lastName) return backToForm(areqToken, "Vyplňte příjmení.");
  if (!position) return backToForm(areqToken, "Vyplňte pracovní pozici.");

  const magic = sign(
    { lead: { email, firstName, lastName, position }, areq },
    "magic",
    TTL.magic,
  );
  const link = `${baseURL}/oauth/verify?token=${encodeURIComponent(magic)}`;

  try {
    await sendMagicLink(email, firstName, link);
  } catch (err) {
    console.error("[oauth/submit] odeslání e-mailu selhalo:", err);
    return backToForm(areqToken, "E-mail se nepodařilo odeslat. Zkuste to prosím znovu.");
  }

  const sent = new URL(`${baseURL}/oauth/sent`);
  sent.searchParams.set("email", email);
  return Response.redirect(sent.toString(), 303);
}
