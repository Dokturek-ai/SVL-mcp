import { describe, it, expect, beforeAll } from "vitest";
import crypto from "node:crypto";

beforeAll(() => {
  process.env.AUTH_SECRET = "test-secret-at-least-16-chars-long";
});

const { sign } = await import("@/app/lib/auth");
const { POST } = await import("./route");

const VERIFIER = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
const CHALLENGE = crypto.createHash("sha256").update(VERIFIER).digest("base64url");

function codeFor(overrides: Record<string, unknown> = {}): string {
  return sign(
    {
      sub: "a@b.cz",
      client_id: "client-123",
      redirect_uri: "https://host.example/cb",
      code_challenge: CHALLENGE,
      code_challenge_method: "S256",
      ...overrides,
    },
    "code",
    60,
  );
}

function tokenReq(params: Record<string, string>): Request {
  return new Request("https://svl.example/oauth/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params),
  });
}

describe("POST /oauth/token", () => {
  it("vymění platný code + verifier za access token", async () => {
    const res = await POST(
      tokenReq({
        grant_type: "authorization_code",
        code: codeFor(),
        redirect_uri: "https://host.example/cb",
        client_id: "client-123",
        code_verifier: VERIFIER,
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.token_type).toBe("Bearer");
    expect(typeof body.access_token).toBe("string");
    expect(body.scope).toBe("mcp");
  });

  it("odmítne špatný PKCE verifier", async () => {
    const res = await POST(
      tokenReq({
        grant_type: "authorization_code",
        code: codeFor(),
        redirect_uri: "https://host.example/cb",
        client_id: "client-123",
        code_verifier: "wrong",
      }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("invalid_grant");
  });

  it("vynutí client_id (chybějící = invalid_grant)", async () => {
    const res = await POST(
      tokenReq({
        grant_type: "authorization_code",
        code: codeFor(),
        redirect_uri: "https://host.example/cb",
        code_verifier: VERIFIER,
      }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("invalid_grant");
  });

  it("vynutí shodu redirect_uri", async () => {
    const res = await POST(
      tokenReq({
        grant_type: "authorization_code",
        code: codeFor(),
        redirect_uri: "https://attacker.example/cb",
        client_id: "client-123",
        code_verifier: VERIFIER,
      }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("invalid_grant");
  });

  it("nespadne na nesprávném typu v JSON těle", async () => {
    const res = await POST(
      new Request("https://svl.example/oauth/token", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ grant_type: "authorization_code", code: ["x"], code_verifier: { a: 1 } }),
      }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("invalid_request");
  });

  it("odmítne nepodporovaný grant_type", async () => {
    const res = await POST(tokenReq({ grant_type: "password" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("unsupported_grant_type");
  });
});
