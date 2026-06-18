import "server-only";
import crypto from "node:crypto";

// ---------------------------------------------------------------------------
// Stateless autentizační vrstva.
//
// Celá OAuth brána je bezstavová — neukládá se žádná databáze ani Redis.
// Každý artefakt (registrace klienta, autorizační požadavek, magic-link,
// authorization code i access token) je podepsaný JWT (HS256) s tajemstvím
// `AUTH_SECRET`. Platnost se řídí claimem `exp`, integrita podpisem.
//
// `import "server-only"` je pojistka, aby se tajemství nikdy nedostalo do
// klientského bundle.
// ---------------------------------------------------------------------------

function secret(): crypto.BinaryLike {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) {
    throw new Error(
      "AUTH_SECRET není nastaveno (nebo je příliš krátké). " +
        "Vygenerujte např.: openssl rand -base64 48",
    );
  }
  return s;
}

export type Purpose = "client" | "areq" | "magic" | "code" | "access";

// Doby platnosti jednotlivých tokenů (v sekundách).
export const TTL = {
  areq: 15 * 60, // autorizační požadavek nesený formulářem
  magic: 15 * 60, // magic-link v e-mailu
  code: 2 * 60, // authorization code (jednorázová výměna)
  access: 30 * 24 * 60 * 60, // access token (30 dní)
} as const;

export interface Lead {
  email: string;
  firstName: string;
  lastName: string;
  position: string;
}

export interface AuthRequest {
  client_id: string;
  redirect_uri: string;
  state?: string;
  code_challenge: string;
  code_challenge_method: string;
  scope?: string;
  resource?: string;
}

interface JwtBase {
  purpose: Purpose;
  iat: number;
  exp?: number;
}

function b64urlJson(obj: unknown): string {
  return Buffer.from(JSON.stringify(obj)).toString("base64url");
}

function hmac(data: string): string {
  return crypto.createHmac("sha256", secret()).update(data).digest("base64url");
}

export function sign(
  payload: Record<string, unknown>,
  purpose: Purpose,
  ttlSeconds?: number,
): string {
  const now = Math.floor(Date.now() / 1000);
  const body: JwtBase & Record<string, unknown> = { ...payload, purpose, iat: now };
  if (ttlSeconds) body.exp = now + ttlSeconds;
  const header = { alg: "HS256", typ: "JWT" };
  const data = `${b64urlJson(header)}.${b64urlJson(body)}`;
  return `${data}.${hmac(data)}`;
}

export class TokenError extends Error {}

export function verify<T = Record<string, unknown>>(
  token: string,
  purpose: Purpose,
): T & JwtBase {
  const parts = token.split(".");
  if (parts.length !== 3) throw new TokenError("Neplatný formát tokenu.");
  const [h, p, s] = parts;

  const expected = hmac(`${h}.${p}`);
  const sigBuf = Buffer.from(s);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    throw new TokenError("Neplatný podpis tokenu.");
  }

  let payload: JwtBase & Record<string, unknown>;
  try {
    payload = JSON.parse(Buffer.from(p, "base64url").toString("utf8"));
  } catch {
    throw new TokenError("Tělo tokenu nelze přečíst.");
  }

  if (payload.purpose !== purpose) {
    throw new TokenError("Neočekávaný typ tokenu.");
  }
  if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
    throw new TokenError("Token vypršel.");
  }
  return payload as T & JwtBase;
}

// PKCE (RFC 7636) — podporujeme pouze metodu S256.
export function verifyPkce(verifier: string, challenge: string): boolean {
  const hash = crypto.createHash("sha256").update(verifier).digest("base64url");
  const a = Buffer.from(hash);
  const b = Buffer.from(challenge);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
