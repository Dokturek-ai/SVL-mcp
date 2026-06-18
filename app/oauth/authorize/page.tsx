import { sign, verify, TTL, type AuthRequest } from "@/app/lib/auth";
import { AuthShell } from "../ui";

// ---------------------------------------------------------------------------
// /oauth/authorize — vstupní bod OAuth toku.
//
// Hostitel sem přesměruje uživatele s OAuth parametry (PKCE). Zde se ověří,
// vykreslí lead-formulář a parametry se podepíšou do skrytého `areq` tokenu,
// který se nese přes odeslání formuláře. Při návratu z /oauth/submit s chybou
// přicházíme zpět už jen s `areq` + `error`.
// ---------------------------------------------------------------------------

function one(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

interface ClientPayload {
  redirect_uris: string[];
}

export default async function Authorize({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const errorMsg = one(sp.error);

  // --- Návrat z /oauth/submit (validační chyba): máme hotový areq ---------
  const existingAreq = one(sp.areq);
  if (existingAreq) {
    let valid = true;
    try {
      verify<AuthRequest>(existingAreq, "areq");
    } catch {
      valid = false;
    }
    return valid ? (
      <Form areqToken={existingAreq} error={errorMsg} />
    ) : (
      <ErrorCard message="Platnost požadavku vypršela. Spusťte připojení znovu ze svého AI asistenta." />
    );
  }

  // --- Iniciální požadavek od hostitele -----------------------------------
  const clientId = one(sp.client_id);
  const redirectUri = one(sp.redirect_uri);
  const responseType = one(sp.response_type);
  const codeChallenge = one(sp.code_challenge);
  const codeChallengeMethod = one(sp.code_challenge_method) || "S256";
  const state = one(sp.state);
  const scope = one(sp.scope);
  const resource = one(sp.resource);

  if (responseType !== "code") {
    return <ErrorCard message="Nepodporovaný response_type (očekáváno: code)." />;
  }
  if (!codeChallenge || codeChallengeMethod !== "S256") {
    return <ErrorCard message="Vyžadováno PKCE s metodou S256." />;
  }

  let client: ClientPayload | null = null;
  try {
    client = verify<ClientPayload>(clientId, "client");
  } catch {
    client = null;
  }
  if (!client) {
    return <ErrorCard message="Neplatný nebo neznámý klient (client_id)." />;
  }
  if (!redirectUri || !client.redirect_uris.includes(redirectUri)) {
    return <ErrorCard message="redirect_uri neodpovídá registraci klienta." />;
  }

  const areq: AuthRequest = {
    client_id: clientId,
    redirect_uri: redirectUri,
    state: state || undefined,
    code_challenge: codeChallenge,
    code_challenge_method: codeChallengeMethod,
    scope: scope || undefined,
    resource: resource || undefined,
  };
  const areqToken = sign({ ...areq }, "areq", TTL.areq);

  return <Form areqToken={areqToken} error={errorMsg} />;
}

function Form({ areqToken, error }: { areqToken: string; error: string }) {
  return (
    <AuthShell
      title="Aktivace přístupu"
      subtitle="Vyplňte údaje a potvrďte e-mail. Tím získáte přístup ke znalostní bázi Doktůrek.ai ve svém AI asistentovi."
    >
      {error ? (
        <p className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <form method="post" action="/oauth/submit" className="flex flex-col gap-4">
        <input type="hidden" name="areq" value={areqToken} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Jméno" name="first_name" autoComplete="given-name" />
          <Field label="Příjmení" name="last_name" autoComplete="family-name" />
        </div>
        <Field
          label="Pracovní e-mail"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="jmeno@nemocnice.cz"
        />
        <Field
          label="Pracovní pozice"
          name="position"
          autoComplete="organization-title"
          placeholder="např. lékař, IT, management"
        />

        <button
          type="submit"
          className="mt-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-primary-hover"
        >
          Poslat ověřovací odkaz
        </button>
      </form>

      <p className="mt-5 text-xs leading-relaxed text-ink/60">
        Odesláním souhlasíte se zpracováním uvedených údajů pro účely poskytnutí
        přístupu. Žádné heslo ani účet se nezakládá.
      </p>
    </AuthShell>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  autoComplete,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-ink">{label}</span>
      <input
        name={name}
        type={type}
        required
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="rounded-xl border border-stroke bg-white px-4 py-3 text-base text-ink outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <AuthShell title="Něco se pokazilo" subtitle={message}>
      <a
        href="https://dokturek.ai"
        className="inline-block rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
      >
        Zpět na dokturek.ai
      </a>
    </AuthShell>
  );
}
